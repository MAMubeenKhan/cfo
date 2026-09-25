'use server'

import {randomBytes} from 'node:crypto'
import {redirect} from 'next/navigation'
import {
  MAX_PHOTOS,
  MAX_PHOTO_BYTES,
  MIN_FILL_SECONDS,
  PHOTO_TYPES,
  desksSchema,
  reportSchema,
  type FormState,
} from '@/lib/report-schema'
import {DEFINITION, getEngine, hasWriteToken, instanceIdFor, subjectRef, writeClient} from '@/lib/server/clients'
import {callerId, hit} from '@/lib/server/rate-limit'

const fail = (message: string, fieldErrors: Record<string, string> = {}): FormState => ({status: 'error', message, fieldErrors})
const GENERIC = 'Something went wrong. Please try again in a moment.'
const ref = (id: string) => ({_type: 'reference' as const, _ref: id})

async function resolveWitness(code?: string): Promise<{id: string}> {
  if (code) {
    const id = `witness-${code.toLowerCase()}`
    if (await writeClient.fetch<string | null>(`*[_id == $id][0]._id`, {id})) return {id}
  }
  for (let attempt = 0; attempt < 6; attempt++) {
    const c = randomBytes(2).toString('hex').toUpperCase()
    const id = `witness-${c.toLowerCase()}`
    if (await writeClient.fetch<string | null>(`*[_id == $id][0]._id`, {id})) continue
    await writeClient.createIfNotExists({
      _id: id,
      _type: 'witness',
      codename: `WITNESS-${c}`,
      credibility: 50,
      reportsCount: 0,
      closedCounts: {classified: 0, debunked: 0, inconclusive: 0},
    })
    return {id}
  }
  throw new Error('could not allocate a witness codename')
}

async function nextCaseNumber(): Promise<string> {
  const year = new Date().getUTCFullYear()
  const counter = await writeClient.fetch<{year?: number} | null>(`*[_id == "counter-case-number"][0]{year}`)
  if (!counter || counter.year !== year) {
    await writeClient.createOrReplace({_id: 'counter-case-number', _type: 'counter', year, value: 0})
  }
  const updated = await writeClient.patch('counter-case-number').inc({value: 1}).commit<{value: number}>()
  return `CFO-${year}-${String(updated.value).padStart(4, '0')}`
}

/** Files a sighting report, starts its workflow, and sends the visitor to the live "filed" page. */
export async function fileReport(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!hasWriteToken) return fail('The Bureau is not accepting reports right now.')

  const raw: Record<string, string> = {}
  for (const [k, v] of formData.entries()) if (typeof v === 'string') raw[k] = v
  for (const k of Object.keys(raw)) if (raw[k] === '') delete raw[k]

  const parsed = reportSchema.safeParse(raw)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0] ?? 'form')] ??= issue.message
    return fail('Some details need another look.', fieldErrors)
  }
  const d = parsed.data

  // Bot traps answer with a generic error so bots learn nothing.
  if (d.website) return fail(GENERIC)
  if (Date.now() - d.startedAt < MIN_FILL_SECONDS * 1000) return fail(GENERIC)

  // Idempotency: the same submission key is the same case. A double-click files one report.
  const caseId = `case-${d.submissionKey}`
  const existing = await writeClient.fetch<{caseNumber: string} | null>(`*[_id == $id][0]{caseNumber}`, {id: caseId})
  if (existing?.caseNumber) redirect(`/report/filed/${existing.caseNumber}`)

  const who = await callerId()
  // Per caller (5 an hour) and across all visitors (40 an hour): durable, shared by every server instance.
  const limit = await hit(`report-${who}`, 5)
  const crowd = limit.ok ? await hit('report-all', 40) : limit
  if (!limit.ok || !crowd.ok) {
    const wait = Math.ceil(Math.max(limit.retryAfterSec, crowd.retryAfterSec) / 60)
    return fail(limit.ok ? `The Bureau is very busy right now. Please try again in ${wait} minutes.` : `Several reports have been filed from this connection in the last hour. Please try again in ${wait} minutes.`)
  }

  const files = formData.getAll('photos').filter((f): f is File => f instanceof File && f.size > 0)
  if (files.length > MAX_PHOTOS) return fail('Attach up to three photos.', {photos: 'Attach up to three photos.'})
  for (const f of files) {
    if (!(PHOTO_TYPES as readonly string[]).includes(f.type)) return fail('Photos must be JPEG, PNG or WebP.', {photos: 'Photos must be JPEG, PNG or WebP.'})
    if (f.size > MAX_PHOTO_BYTES) return fail('A photo is too large.', {photos: 'Each photo must be under 2.5 MB.'})
  }

  let caseNumber: string
  try {
    // Nearest known region within 200 km, so a report near Area 51 carries the restricted-site banner.
    const region = await writeClient.fetch<{_id: string; d: number} | null>(
      `*[_type == "region" && defined(centroid)] | order(geo::distance(centroid, geo::latLng($lat, $lng)))[0]{_id, "d": geo::distance(centroid, geo::latLng($lat, $lng))}`,
      {lat: d.lat, lng: d.lng},
    )
    const subject = d.subjectSlug
      ? await writeClient.fetch<string | null>(`*[_type == "subject" && slug.current == $s][0]._id`, {s: d.subjectSlug})
      : null

    const evidence: Record<string, unknown>[] = []
    let n = 0
    for (const f of files) {
      const asset = await writeClient.assets.upload('image', Buffer.from(await f.arrayBuffer()), {filename: f.name || `photo-${n + 1}.jpg`, contentType: f.type})
      evidence.push({
        _key: `ev-photo-${n}`,
        _type: 'photoEvidence',
        caption: `Photo ${n + 1} submitted with the report`.slice(0, 140),
        image: {_type: 'image', asset: ref(asset._id)},
      })
      n++
    }
    if (d.footprintCm) evidence.push({_key: 'ev-footprint', _type: 'footprintEvidence', lengthCm: d.footprintCm})
    if (d.soundNote) evidence.push({_key: 'ev-sound', _type: 'soundEvidence', description: d.soundNote})
    if (d.testimony) evidence.push({_key: 'ev-testimony', _type: 'testimonyEvidence', quote: d.testimony, speaker: 'Witness'})

    const witness = await resolveWitness(d.witnessCode)
    caseNumber = await nextCaseNumber()
    const now = new Date().toISOString()

    await writeClient.createIfNotExists({
      _id: caseId,
      _type: 'case',
      caseNumber,
      title: d.title,
      category: d.category,
      status: 'intake',
      source: 'web',
      hidden: false,
      submissionKey: d.submissionKey,
      sighting: {
        observedAt: new Date(d.observedAt).toISOString(),
        location: {
          geo: {_type: 'geopoint', lat: +d.lat.toFixed(6), lng: +d.lng.toFixed(6)},
          ...(d.placeName ? {placeName: d.placeName} : {}),
          ...(region && region.d < 200_000 ? {region: ref(region._id)} : {}),
        },
        conditions: {
          ...(d.light ? {light: d.light} : {}),
          ...(d.weather ? {weather: d.weather} : {}),
          ...(d.distanceMeters != null ? {distanceMeters: d.distanceMeters} : {}),
          ...(d.durationSeconds != null ? {durationSeconds: d.durationSeconds} : {}),
        },
        description: d.description,
        ...(subject ? {subjectClaimed: ref(subject)} : {}),
        ...(d.objectShape && d.category === 'ufo' ? {objectShape: d.objectShape} : {}),
      },
      witness: ref(witness.id),
      evidence,
      log: [{_key: 'received', _type: 'logEntry', at: now, actor: 'system', kind: 'received', message: 'Report received.'}],
    })
    await writeClient.patch(witness.id).inc({reportsCount: 1}).commit()

    // Start the workflow. If this fails the case is kept and `npm run wf:recover` starts it later.
    try {
      const instanceId = instanceIdFor(caseId)
      await getEngine().startInstance({
        definition: DEFINITION,
        instanceId,
        initialFields: [{type: 'subject', name: 'subject', value: subjectRef(caseId)}],
      })
      await writeClient.patch(caseId).set({workflowInstanceId: instanceId}).commit()
    } catch (error) {
      console.error('startInstance failed', error)
      await writeClient
        .patch(caseId)
        .setIfMissing({log: []})
        .insert('after', 'log[-1]', [
          {_key: 'wf-queued', _type: 'logEntry', at: new Date().toISOString(), actor: 'system', kind: 'error', message: 'Queued for triage.'},
        ])
        .commit()
    }
  } catch (error) {
    console.error('fileReport failed', error)
    return fail('The wire went dead. Your report was not filed. Nothing was lost, so please try again.')
  }

  redirect(`/report/filed/${caseNumber}`)
}

export type DeskResult = {ok: true; message: string} | {ok: false; message: string}

/** Public Director's Desk: a visitor moves a case in "review" forward through the same workflow action a Director would. */
export async function deskDecision(input: {caseId: string; action: string; note?: string; confirmFaith?: boolean}): Promise<DeskResult> {
  if (!hasWriteToken) return {ok: false, message: 'The desk is closed right now.'}
  const parsed = desksSchema.safeParse(input)
  if (!parsed.success) return {ok: false, message: 'That decision could not be read.'}
  const {caseId, action, note, confirmFaith} = parsed.data

  const settings = await writeClient.fetch<{publicDeskEnabled?: boolean; publicDeskHourlyLimit?: number} | null>(
    `*[_id == "bureau-settings"][0]{publicDeskEnabled, publicDeskHourlyLimit}`,
  )
  if (settings?.publicDeskEnabled === false) return {ok: false, message: "The Director's Desk is closed to visitors right now."}

  const who = await callerId()
  const perHour = settings?.publicDeskHourlyLimit ?? 10
  const mine = await hit(`desk-${who}`, perHour)
  if (!mine.ok || !(await hit('desk-all', perHour * 6)).ok) {
    return {ok: false, message: 'The desk has processed a lot of files in the last hour. Please try again later.'}
  }

  if (action === 'debunk' && (!note || note.length < 10)) return {ok: false, message: 'Give your grounds in at least 10 characters.'}

  const c = await writeClient.fetch<{status: string; instance?: string; faith: boolean} | null>(
    `*[_id == $id][0]{status, "instance": workflowInstanceId, "faith": "faith-sensitive" in triage.flags}`,
    {id: caseId},
  )
  if (!c) return {ok: false, message: 'That file could not be found.'}
  if (c.status !== 'review' || !c.instance) return {ok: false, message: 'This file was just decided by someone else.'}
  if (action === 'debunk' && c.faith && !confirmFaith) {
    return {ok: false, message: 'This report may involve religious belief. The Bureau takes no position on matters of faith. Please confirm before closing it.'}
  }

  try {
    // Mark a visitor-signed close so the filing stamp credits the right actor.
    if (action === 'debunk') await writeClient.patch(caseId).set({visitorDecision: {at: new Date().toISOString()}}).commit()
    await getEngine().fireAction({
      instanceId: c.instance,
      activity: 'decide',
      action,
      ...(action === 'debunk' ? {params: {note}} : {}),
      idempotencyKey: `desk-${caseId}-${action}`,
    })
    await writeClient
      .patch(caseId)
      .setIfMissing({log: []})
      .insert('after', 'log[-1]', [
        {
          _key: `desk-${action}-${Date.now().toString(36)}`,
          _type: 'logEntry',
          at: new Date().toISOString(),
          actor: 'visitor',
          kind: 'decision',
          message: action === 'debunk' ? `Visitor Director closed the case. ${note}`.slice(0, 400) : 'Visitor Director opened an investigation.',
        },
      ])
      .commit()
    return {ok: true, message: action === 'debunk' ? 'Case closed and stamped.' : 'Investigation opened.'}
  } catch (error) {
    console.error('deskDecision failed', error)
    return {ok: false, message: 'This file was just decided by someone else, or the desk could not reach the workflow. Refresh and try again.'}
  }
}
