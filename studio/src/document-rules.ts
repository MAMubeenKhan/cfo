import type {DocumentActionsResolver, DocumentBadgeComponent, NewDocumentOptionsResolver} from 'sanity'
import {STATUS_LABEL} from '../schemaTypes/constants'

/** Cases are hidden, never deleted: a delete would orphan the workflow instance that drives them. */
const SINGLETONS = new Set(['bureauSettings', 'counter'])

export const resolveActions: DocumentActionsResolver = (prev, {schemaType}) => {
  if (schemaType === 'case') {
    return prev.filter((a) => a.action !== 'delete' && a.action !== 'duplicate')
  }
  if (SINGLETONS.has(schemaType)) {
    const keep = new Set(['publish', 'discardChanges', 'restore'])
    return prev.filter((a) => a.action && keep.has(a.action))
  }
  return prev
}

/** Machine-written documents are never created by hand in the "New document" menu. */
const NOT_CREATABLE = new Set(['bureauSettings', 'counter', 'boardPin', 'connection'])

export const resolveNewDocumentOptions: NewDocumentOptionsResolver = (prev) =>
  prev.filter((option) => !NOT_CREATABLE.has(option.templateId))

const STATUS_TONE: Record<string, 'primary' | 'success' | 'warning' | 'danger' | undefined> = {
  intake: undefined,
  review: 'primary',
  investigation: 'warning',
  filing: 'warning',
  classified: 'success',
  debunked: 'danger',
  inconclusive: undefined,
}

type CaseLike = {status?: string; triage?: {plausibility?: number | null}; hidden?: boolean} | null

export const StatusBadge: DocumentBadgeComponent = (props) => {
  if (props.type !== 'case') return null
  const doc = (props.draft ?? props.published) as CaseLike
  if (!doc?.status) return null
  return {label: STATUS_LABEL[doc.status] ?? doc.status, color: STATUS_TONE[doc.status]}
}

export const PlausibilityBadge: DocumentBadgeComponent = (props) => {
  if (props.type !== 'case') return null
  const p = ((props.draft ?? props.published) as CaseLike)?.triage?.plausibility
  if (typeof p !== 'number') return null
  return {label: `P${p}`, title: `Field Investigator plausibility ${p}/100`, color: p >= 70 ? 'success' : p >= 20 ? 'warning' : 'danger'}
}

export const HiddenBadge: DocumentBadgeComponent = (props) => {
  if (props.type !== 'case') return null
  return ((props.draft ?? props.published) as CaseLike)?.hidden
    ? {label: 'Hidden', color: 'danger', title: 'Hidden from the public site'}
    : null
}
