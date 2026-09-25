'use client'

import dynamic from 'next/dynamic'
import {useActionState, useEffect, useMemo, useRef, useState} from 'react'
import {useFormStatus} from 'react-dom'
import clsx from 'clsx'
import {ArrowLeft, ArrowRight, Camera, LoaderCircle, Send, X} from 'lucide-react'
import {fileReport} from '@/app/actions'
import {CategoryGlyph} from './category-glyph'
import {PlaceSearch, type PlaceResult} from './place-search'
import {compressImage} from '@/lib/compress-image'
import {CATEGORIES, CATEGORY_PROMPT, isFaithSensitive, type Category} from '@/lib/categories'
import {LIGHTS, MAX_PHOTOS, SHAPES, WEATHERS, type FormState} from '@/lib/report-schema'

const PinPicker = dynamic(() => import('./pin-picker'), {
  ssr: false,
  loading: () => <div className="grid h-72 place-items-center rounded-paper border border-rule bg-paper-3 font-mono text-xs uppercase tracking-[0.12em] text-ink-muted sm:h-96">Loading map…</div>,
})

interface SubjectOption {
  slug: string
  name: string
  category: Category
}

interface Draft {
  category: Category | ''
  title: string
  description: string
  subjectSlug: string
  objectShape: string
  placeName: string
  lat: string
  lng: string
  observedLocal: string
  light: string
  weather: string
  distanceMeters: string
  durationSeconds: string
  footprintCm: string
  soundNote: string
  testimony: string
}

const EMPTY: Draft = {
  category: '', title: '', description: '', subjectSlug: '', objectShape: '', placeName: '', lat: '', lng: '',
  observedLocal: '', light: '', weather: '', distanceMeters: '', durationSeconds: '', footprintCm: '', soundNote: '', testimony: '',
}

const DRAFT_KEY = 'cfo-report-draft-v1'
const WITNESS_KEY = 'cfo-witness-code'
const STEPS = ['What you saw', 'Where and when', 'Evidence', 'Review'] as const

/** Which step owns which field, so an error can send the visitor back to the right place. */
const FIELD_STEP: Record<string, number> = {
  category: 0, title: 0, description: 0, subjectSlug: 0, objectShape: 0,
  lat: 1, lng: 1, placeName: 1, observedAt: 1, light: 1, weather: 1, distanceMeters: 1, durationSeconds: 1,
  photos: 2, footprintCm: 2, soundNote: 2, testimony: 2,
}

const lsGet = (k: string): string | null => {
  try {
    return localStorage.getItem(k)
  } catch {
    return null
  }
}
const lsSet = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v)
  } catch {
    /* private mode or blocked storage: the form still works, it just cannot remember */
  }
}

const localNow = () => {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

function SubmitButton({ready}: {ready: boolean}) {
  const {pending} = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending || !ready}
      className="inline-flex h-12 items-center gap-2 rounded-paper bg-debunked px-6 text-base font-semibold text-on-solid transition hover:opacity-90 disabled:opacity-60"
    >
      {pending ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
      {pending ? 'Filing…' : 'File this report'}
    </button>
  )
}

function Field({id, label, hint, error, optional, children}: {id: string; label: string; hint?: string; error?: string; optional?: boolean; children: React.ReactNode}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="flex items-baseline justify-between gap-3 text-sm font-semibold">
        <span>{label}</span>
        {optional && <span className="font-mono text-[0.68rem] font-normal uppercase tracking-[0.1em] text-ink-muted">Optional</span>}
      </label>
      {children}
      {hint && !error && <p id={`${id}-hint`} className="text-xs text-ink-muted">{hint}</p>}
      {error && (
        <p id={`${id}-error`} className="flex items-start gap-1.5 text-sm font-medium text-debunked" role="alert">
          <span aria-hidden="true">▲</span> {error}
        </p>
      )}
    </div>
  )
}

const inputClass = (bad?: boolean) =>
  clsx(
    'w-full rounded-paper border bg-paper px-3 text-base outline-none transition placeholder:text-ink-muted/70 focus:border-accent',
    bad ? 'border-debunked' : 'border-rule',
  )

function Chips<T extends string>({name, legend, options, value, onChange, labels}: {name: string; legend: string; options: readonly T[]; value: string; onChange: (v: T | '') => void; labels?: Partial<Record<T, string>>}) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-semibold">{legend} <span className="font-mono text-[0.68rem] font-normal uppercase tracking-[0.1em] text-ink-muted">Optional</span></legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <label key={o} className={clsx('cursor-pointer rounded-full border px-3.5 py-2 text-sm font-medium transition has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--accent)]', value === o ? 'border-ink bg-ink text-paper' : 'border-rule bg-paper hover:border-ink')}>
            <input type="radio" name={name} value={o} checked={value === o} onChange={() => onChange(o)} onClick={() => value === o && onChange('')} className="sr-only" />
            {labels?.[o] ?? o.replace('-', ' ').replace(/^\w/, (c) => c.toUpperCase())}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export function ReportForm({subjects}: {subjects: SubjectOption[]}) {
  const [state, formAction] = useActionState<FormState, FormData>(fileReport, {status: 'idle'})
  const [step, setStep] = useState(0)
  const [d, setD] = useState<Draft>(EMPTY)
  const [ready, setReady] = useState(false)
  const [submissionKey, setSubmissionKey] = useState('')
  const [startedAt, setStartedAt] = useState(0)
  const [witnessCode, setWitnessCode] = useState('')
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({})
  const [photos, setPhotos] = useState<{name: string; url: string}[]>([])
  const [photoBusy, setPhotoBusy] = useState(false)
  const [photoError, setPhotoError] = useState('')
  const [geoMessage, setGeoMessage] = useState('')
  const [focusOn, setFocusOn] = useState<{lat: number; lng: number} | null>(null)
  const hiddenFiles = useRef<HTMLInputElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const files = useRef<File[]>([])

  // Client-only setup: draft restore, a fresh submission key, the returning witness code.
  useEffect(() => {
    setSubmissionKey(crypto.randomUUID())
    setStartedAt(Date.now())
    const code = lsGet(WITNESS_KEY)
    if (code && /^[0-9A-F]{4}$/.test(code)) setWitnessCode(code)
    try {
      const saved = lsGet(DRAFT_KEY)
      if (saved) setD({...EMPTY, ...(JSON.parse(saved) as Partial<Draft>)})
    } catch {
      /* corrupt draft: ignore */
    }
    setD((prev) => (prev.observedLocal ? prev : {...prev, observedLocal: localNow()}))
    setReady(true)
  }, [])

  useEffect(() => {
    if (ready) lsSet(DRAFT_KEY, JSON.stringify(d))
  }, [d, ready])

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((prev) => ({...prev, [k]: v}))
  const errors = {...(state.status === 'error' ? state.fieldErrors : {}), ...localErrors}
  const err = (k: string) => errors[k]

  // After a failed submit, jump to the step that owns the first error.
  useEffect(() => {
    if (state.status !== 'error') return
    const first = Object.keys(state.fieldErrors)[0]
    setStep(first ? (FIELD_STEP[first] ?? 0) : 3)
  }, [state])

  const firstStep = useRef(true)
  useEffect(() => {
    if (firstStep.current) {
      firstStep.current = false // do not steal focus (and draw a ring) when the page first loads
      return
    }
    heading.current?.focus()
  }, [step])

  const subjectOptions = useMemo(() => subjects.filter((s) => !d.category || s.category === d.category), [subjects, d.category])
  const observedISO = d.observedLocal ? new Date(d.observedLocal).toISOString() : ''
  const pin = d.lat !== '' && d.lng !== '' ? {lat: Number(d.lat), lng: Number(d.lng)} : null

  function validate(s: number): Record<string, string> {
    const e: Record<string, string> = {}
    if (s === 0) {
      if (!d.category) e.category = 'Choose what kind of sighting this was.'
      if (d.title.trim().length < 5) e.title = 'Give the report a short title (at least 5 characters).'
      if (d.description.trim().length < 40) e.description = `Please describe what you saw in at least 40 characters (${d.description.trim().length} so far).`
    }
    if (s === 1) {
      if (!pin || Number.isNaN(pin.lat)) e.lat = 'Search for a place or drop a pin on the map.'
      if (!d.observedLocal) e.observedAt = 'Enter when this happened.'
      else if (new Date(d.observedLocal).getTime() > Date.now() + 60_000) e.observedAt = 'A sighting cannot be in the future.'
      else if (new Date(d.observedLocal).getTime() < Date.parse('1950-01-01')) e.observedAt = 'The Bureau only holds records from 1950.'
    }
    return e
  }

  const go = (next: number) => {
    if (next > step) {
      const e = validate(step)
      setLocalErrors(e)
      if (Object.keys(e).length) return
    } else setLocalErrors({})
    setStep(next)
  }

  async function onPhotos(list: FileList | null) {
    if (!list?.length) return
    setPhotoError('')
    setPhotoBusy(true)
    try {
      const room = MAX_PHOTOS - files.current.length
      if (list.length > room) setPhotoError(`Only ${MAX_PHOTOS} photos can be attached. The first ${room} were kept.`)
      for (const f of Array.from(list).slice(0, Math.max(0, room))) {
        if (f.size > 25_000_000) {
          setPhotoError('One photo was too large to process and was skipped.')
          continue
        }
        try {
          const small = await compressImage(f)
          files.current.push(small)
        } catch (e) {
          setPhotoError(e instanceof Error ? e.message : 'A photo could not be processed.')
        }
      }
      syncFiles()
    } finally {
      setPhotoBusy(false)
    }
  }

  function syncFiles() {
    const dt = new DataTransfer()
    files.current.forEach((f) => dt.items.add(f))
    if (hiddenFiles.current) hiddenFiles.current.files = dt.files
    setPhotos((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p.url))
      return files.current.map((f) => ({name: f.name, url: URL.createObjectURL(f)}))
    })
  }

  const removePhoto = (i: number) => {
    files.current.splice(i, 1)
    syncFiles()
  }

  const pickPlace = (p: PlaceResult) => {
    setD((prev) => ({...prev, lat: String(p.lat), lng: String(p.lng), placeName: p.label.slice(0, 120)}))
    setFocusOn({lat: p.lat, lng: p.lng})
    setLocalErrors((e) => ({...e, lat: ''}))
  }

  async function onPin(p: {lat: number; lng: number}) {
    setD((prev) => ({...prev, lat: p.lat.toFixed(6), lng: p.lng.toFixed(6)}))
    setLocalErrors((e) => ({...e, lat: ''}))
    try {
      const res = await fetch(`/api/geo/reverse?lat=${p.lat}&lng=${p.lng}`)
      const {label} = (await res.json()) as {label: string | null}
      if (label) setD((prev) => (prev.placeName && prev.placeName !== '' ? prev : {...prev, placeName: label.slice(0, 120)}))
    } catch {
      /* the pin is enough */
    }
  }

  const errorList = Object.entries(errors).filter(([, v]) => v)
  const faith = isFaithSensitive(d.category)

  return (
    <form
      action={formAction}
      noValidate
      className="paper-card mx-auto w-full max-w-3xl overflow-hidden"
      onSubmit={(e) => {
        const e0 = {...validate(0), ...validate(1)}
        if (Object.keys(e0).length) {
          e.preventDefault()
          setLocalErrors(e0)
          setStep(FIELD_STEP[Object.keys(e0)[0]] ?? 0)
        }
      }}
    >
      {/* everything the server needs travels in hidden inputs, so every step stays in the form */}
      <input type="hidden" name="submissionKey" value={submissionKey} />
      <input type="hidden" name="startedAt" value={startedAt} />
      <input type="hidden" name="observedAt" value={observedISO} />
      <input type="hidden" name="category" value={d.category} />
      <input type="hidden" name="lat" value={d.lat} />
      <input type="hidden" name="lng" value={d.lng} />
      <input type="hidden" name="placeName" value={d.placeName} />
      {witnessCode && <input type="hidden" name="witnessCode" value={witnessCode} />}
      <input ref={hiddenFiles} type="file" name="photos" multiple className="sr-only" tabIndex={-1} aria-hidden="true" />
      {/* honeypot: people never see or fill this */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <header className="border-b border-rule bg-paper-3/60 px-5 py-4 sm:px-8">
        <p className="mono-label">Form CFO-1 · Sighting report</p>
        <ol className="mt-3 grid grid-cols-4 gap-2" aria-label="Form progress">
          {STEPS.map((s, i) => (
            <li key={s} aria-current={i === step ? 'step' : undefined} className="min-w-0">
              <span className={clsx('block h-1 rounded-full', i <= step ? 'bg-ink' : 'bg-rule')} />
              <span className={clsx('mt-1.5 block truncate text-[0.7rem] font-semibold uppercase tracking-[0.06em]', i === step ? 'text-ink' : 'text-ink-muted')}>
                <span className="sr-only">Step {i + 1}: </span>
                <span className="hidden sm:inline">{s}</span>
                <span className="sm:hidden">{i + 1}</span>
              </span>
            </li>
          ))}
        </ol>
      </header>

      <div className="space-y-8 px-5 py-7 sm:px-8">
        {(state.status === 'error' || errorList.length > 0) && (
          <div role="alert" className="rounded-paper border-2 border-debunked bg-debunked/10 p-4 text-sm">
            <p className="font-semibold text-debunked">{state.status === 'error' && errorList.length === 0 ? state.message : 'Some details need another look.'}</p>
            {errorList.length > 0 && (
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {errorList.map(([k, v]) => (
                  <li key={k}>
                    <button type="button" className="text-left underline underline-offset-2" onClick={() => setStep(FIELD_STEP[k] ?? step)}>
                      {v}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------------ step 1 */}
        <section hidden={step !== 0} aria-labelledby="s0" className="space-y-6">
          <h2 id="s0" ref={step === 0 ? heading : undefined} tabIndex={-1} className="font-serif text-2xl font-semibold outline-none">What did you see?</h2>
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">What kind of sighting was it?</legend>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {CATEGORIES.map((c) => (
                <label
                  key={c}
                  className={clsx(
                    'flex cursor-pointer items-start gap-3 rounded-paper border p-3.5 transition has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--accent)]',
                    d.category === c ? 'border-ink bg-paper-3' : 'border-rule bg-paper hover:border-ink',
                  )}
                >
                  <input type="radio" name="category-choice" value={c} checked={d.category === c} onChange={() => set('category', c)} className="sr-only" />
                  <CategoryGlyph category={c} className="mt-0.5 h-5 w-5" />
                  <span>
                    <span className="block text-sm font-semibold">{CATEGORY_PROMPT[c].title}</span>
                    <span className="block text-xs text-ink-muted">{CATEGORY_PROMPT[c].hint}</span>
                  </span>
                </label>
              ))}
            </div>
            {err('category') && <p className="mt-2 text-sm font-medium text-debunked" role="alert">▲ {err('category')}</p>}
          </fieldset>

          {faith && (
            <p className="rounded-paper border border-rule bg-paper-3/60 p-3.5 text-sm">
              The Bureau records your account in your own words. It takes no position on matters of faith and will never tell you that you were mistaken.
            </p>
          )}

          <Field id="title" label="A short title" hint="For example: Tall figure crossing Route 101 at dusk" error={err('title')}>
            <input id="title" name="title" value={d.title} maxLength={90} onChange={(e) => set('title', e.target.value)} aria-invalid={!!err('title') || undefined} aria-describedby={err('title') ? 'title-error' : 'title-hint'} className={clsx(inputClass(!!err('title')), 'h-12')} autoComplete="off" />
            <p className="text-right font-mono text-xs text-ink-muted">{d.title.length}/90</p>
          </Field>

          <Field id="description" label="What happened, in your own words" hint="What you saw, how long, how far away, what you did. Plain facts are best." error={err('description')}>
            <textarea id="description" name="description" value={d.description} rows={7} maxLength={2000} onChange={(e) => set('description', e.target.value)} aria-invalid={!!err('description') || undefined} aria-describedby={err('description') ? 'description-error' : 'description-hint'} className={clsx(inputClass(!!err('description')), 'py-3 leading-relaxed')} />
            <p className={clsx('text-right font-mono text-xs', d.description.trim().length < 40 ? 'text-ink-muted' : 'text-classified')}>{d.description.length}/2000 · minimum 40</p>
          </Field>

          {d.category === 'ufo' && <Chips name="objectShape" legend="What shape was it?" options={SHAPES} value={d.objectShape} onChange={(v) => set('objectShape', v)} labels={{'light-only': 'Lights only', 'tic-tac': 'Capsule'}} />}

          {d.category && d.category !== 'occult' && subjectOptions.length > 0 && (
            <Field id="subject" label="Do you know what it was?" optional hint="If you have a name for it, choose it. If not, leave this and the Field Investigator will suggest one.">
              <select id="subject" name="subjectSlug" value={d.subjectSlug} onChange={(e) => set('subjectSlug', e.target.value)} className={clsx(inputClass(), 'h-12')}>
                <option value="">I do not know</option>
                {subjectOptions.map((s) => (
                  <option key={s.slug} value={s.slug}>{s.name}</option>
                ))}
              </select>
            </Field>
          )}
        </section>

        {/* ------------------------------------------------------------------ step 2 */}
        <section hidden={step !== 1} aria-labelledby="s1" className="space-y-6">
          <h2 id="s1" ref={step === 1 ? heading : undefined} tabIndex={-1} className="font-serif text-2xl font-semibold outline-none">Where and when?</h2>
          <div className="space-y-3">
            <p className="text-sm font-semibold">Where did it happen?</p>
            <PlaceSearch value={d.placeName} onValueChange={(v) => set('placeName', v)} onPick={pickPlace} invalid={!!err('lat')} describedBy={err('lat') ? 'lat-error' : undefined} />
            <PinPicker pin={pin && !Number.isNaN(pin.lat) ? pin : null} onPin={onPin} focusOn={focusOn} onGeoError={setGeoMessage} />
            {geoMessage && <p className="text-sm text-ink-muted" role="status">{geoMessage}</p>}
            {pin && !Number.isNaN(pin.lat) && <p className="font-mono text-xs text-ink-muted">Pin: {pin.lat.toFixed(4)}, {pin.lng.toFixed(4)}</p>}
            {err('lat') && <p id="lat-error" className="text-sm font-medium text-debunked" role="alert">▲ {err('lat')}</p>}
          </div>

          <Field id="observed" label="When did it happen?" error={err('observedAt')} hint="Your local time. The Bureau will file it in UTC.">
            <input id="observed" type="datetime-local" value={d.observedLocal} max={localNow()} onChange={(e) => set('observedLocal', e.target.value)} aria-invalid={!!err('observedAt') || undefined} aria-describedby={err('observedAt') ? 'observed-error' : 'observed-hint'} className={clsx(inputClass(!!err('observedAt')), 'h-12')} />
          </Field>

          <Chips name="light" legend="What was the light like?" options={LIGHTS} value={d.light} onChange={(v) => set('light', v)} />
          <Chips name="weather" legend="And the weather?" options={WEATHERS} value={d.weather} onChange={(v) => set('weather', v)} />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="distance" label="How far away, in metres?" optional error={err('distanceMeters')} hint="0 to 5,000">
              <input id="distance" name="distanceMeters" type="number" inputMode="numeric" min={0} max={5000} value={d.distanceMeters} onChange={(e) => set('distanceMeters', e.target.value)} className={clsx(inputClass(!!err('distanceMeters')), 'h-12')} />
            </Field>
            <Field id="duration" label="For how long, in seconds?" optional error={err('durationSeconds')} hint="0 to 7,200">
              <input id="duration" name="durationSeconds" type="number" inputMode="numeric" min={0} max={7200} value={d.durationSeconds} onChange={(e) => set('durationSeconds', e.target.value)} className={clsx(inputClass(!!err('durationSeconds')), 'h-12')} />
            </Field>
          </div>
        </section>

        {/* ------------------------------------------------------------------ step 3 */}
        <section hidden={step !== 2} aria-labelledby="s2" className="space-y-6">
          <h2 id="s2" ref={step === 2 ? heading : undefined} tabIndex={-1} className="font-serif text-2xl font-semibold outline-none">Any evidence?</h2>
          <p className="text-sm text-ink-muted">All optional. A blurry photo is still a photo. The Bureau has seen worse.</p>

          <div>
            <p className="mb-2 text-sm font-semibold">Photos <span className="font-mono text-[0.68rem] font-normal uppercase tracking-[0.1em] text-ink-muted">Optional · up to {MAX_PHOTOS}</span></p>
            <div className="flex flex-wrap gap-3">
              {photos.map((p, i) => (
                <div key={p.url} className="relative h-24 w-24 overflow-hidden rounded-paper border border-rule">
                  {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
                  <img src={p.url} alt={`Attached photo ${i + 1}`} className="h-full w-full object-cover" />
                  <button type="button" onClick={() => removePhoto(i)} aria-label={`Remove photo ${i + 1}`} className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-ink text-paper">
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              ))}
              {photos.length < MAX_PHOTOS && (
                <label className="grid h-24 w-24 cursor-pointer place-items-center rounded-paper border-2 border-dashed border-rule text-center text-xs text-ink-muted transition hover:border-ink has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--accent)]">
                  <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(e) => { void onPhotos(e.target.files); e.target.value = '' }} />
                  <span>
                    {photoBusy ? <LoaderCircle className="mx-auto h-5 w-5 animate-spin" aria-hidden="true" /> : <Camera className="mx-auto h-5 w-5" aria-hidden="true" />}
                    <span className="mt-1 block">{photoBusy ? 'Preparing…' : 'Add photo'}</span>
                  </span>
                </label>
              )}
            </div>
            <p className="mt-2 text-xs text-ink-muted">Photos are shrunk on your device before they are sent, and any location data inside them is removed.</p>
            {(photoError || err('photos')) && <p className="mt-2 text-sm font-medium text-debunked" role="alert">▲ {photoError || err('photos')}</p>}
          </div>

          {(d.category === 'cryptid' || d.category === 'extraterrestrial') && (
            <Field id="footprint" label="Footprint length, in centimetres" optional error={err('footprintCm')} hint="If you found or measured one.">
              <input id="footprint" name="footprintCm" type="number" inputMode="decimal" min={1} max={200} value={d.footprintCm} onChange={(e) => set('footprintCm', e.target.value)} className={clsx(inputClass(!!err('footprintCm')), 'h-12 sm:max-w-[12rem]')} />
            </Field>
          )}
          <Field id="sound" label="Any sounds?" optional error={err('soundNote')} hint="Knocking, voices, a scream. Describe it briefly.">
            <textarea id="sound" name="soundNote" rows={2} maxLength={400} value={d.soundNote} onChange={(e) => set('soundNote', e.target.value)} className={clsx(inputClass(!!err('soundNote')), 'py-3')} />
          </Field>
          <Field id="testimony" label="One sentence for the record" optional error={err('testimony')} hint="A line in your own words that the Bureau may quote.">
            <textarea id="testimony" name="testimony" rows={2} maxLength={600} value={d.testimony} onChange={(e) => set('testimony', e.target.value)} className={clsx(inputClass(!!err('testimony')), 'py-3')} />
          </Field>
        </section>

        {/* ------------------------------------------------------------------ step 4 */}
        <section hidden={step !== 3} aria-labelledby="s3" className="space-y-5">
          <h2 id="s3" ref={step === 3 ? heading : undefined} tabIndex={-1} className="font-serif text-2xl font-semibold outline-none">Review and file</h2>
          <dl className="divide-y divide-rule rounded-paper border border-rule bg-paper text-sm">
            {[
              ['Kind', d.category ? CATEGORY_PROMPT[d.category].title : '—'],
              ['Title', d.title || '—'],
              ['Where', d.placeName || (pin ? `${pin.lat.toFixed(3)}, ${pin.lng.toFixed(3)}` : '—')],
              ['When', d.observedLocal ? new Date(d.observedLocal).toLocaleString('en-GB', {dateStyle: 'medium', timeStyle: 'short'}) : '—'],
              ['Photos', photos.length ? `${photos.length} attached` : 'None'],
            ].map(([k, v]) => (
              <div key={k} className="grid grid-cols-[6rem_1fr] gap-3 px-4 py-3">
                <dt className="mono-label pt-0.5">{k}</dt>
                <dd className="min-w-0 break-words">{v}</dd>
              </div>
            ))}
            <div className="px-4 py-3">
              <dt className="mono-label">Account</dt>
              <dd className="mt-1 whitespace-pre-wrap leading-relaxed">{d.description || '—'}</dd>
            </div>
          </dl>
          <p className="text-sm text-ink-muted">
            Your report goes to the Field Investigator, an AI that scores it and decides where it goes next. A person signs off on anything unclear. No name, email or address is collected.
          </p>
          <p className="rounded-paper border border-rule bg-paper-3/60 p-3.5 text-sm">
            If someone is in danger, contact local emergency services. The Bureau cannot help you.
          </p>
        </section>
      </div>

      <footer className="flex items-center justify-between gap-3 border-t border-rule bg-paper-3/40 px-5 py-4 sm:px-8">
        <button type="button" onClick={() => go(step - 1)} disabled={step === 0} className="inline-flex h-12 items-center gap-2 rounded-paper border border-rule px-4 text-sm font-semibold transition hover:border-ink disabled:invisible">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
        </button>
        {step < 3 ? (
          <button type="button" onClick={() => go(step + 1)} className="inline-flex h-12 items-center gap-2 rounded-paper bg-ink px-6 text-base font-semibold text-paper transition hover:opacity-90">
            Continue <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : (
          <SubmitButton ready={ready && !!submissionKey} />
        )}
      </footer>
    </form>
  )
}

/** Remembers the visitor's witness codename so a returning witness builds one track record. */
export function rememberWitness(codename: string | undefined | null) {
  const m = codename?.match(/^WITNESS-([0-9A-F]{4})$/)
  if (m) lsSet(WITNESS_KEY, m[1])
}
