import {z} from 'zod'
import {CATEGORIES} from './categories'

// Shared by the form (client-side hints) and the server action (the real check).
// Limits mirror studio/schemaTypes/documents/case.ts.

export const LIGHTS = ['daylight', 'dusk', 'night', 'artificial'] as const
export const WEATHERS = ['clear', 'rain', 'fog', 'snow', 'wind'] as const
export const SHAPES = ['triangle', 'disc', 'sphere', 'cigar', 'tic-tac', 'light-only', 'other'] as const

export const MAX_PHOTOS = 3
export const MAX_PHOTO_BYTES = 2_500_000 // after client-side compression
export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
export const MIN_FILL_SECONDS = 4

const num = (min: number, max: number) =>
  z.preprocess(
    (v) => (v === '' || v == null ? undefined : Number(v)),
    z.number().min(min).max(max).optional(),
  )

export const reportSchema = z.object({
  submissionKey: z.string().uuid('Reload the page and try again.'),
  category: z.enum(CATEGORIES, 'Choose what kind of sighting this was.'),
  title: z.string().trim().min(5, 'Give the report a short title (at least 5 characters).').max(90, 'Keep the title under 90 characters.'),
  description: z
    .string()
    .trim()
    .min(40, 'Please describe what you saw in at least 40 characters.')
    .max(2000, 'Keep the description under 2000 characters.'),
  observedAt: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), 'Enter when this happened.')
    .refine((v) => Date.parse(v) <= Date.now() + 60_000, 'A sighting cannot be in the future.')
    .refine((v) => Date.parse(v) >= Date.parse('1950-01-01'), 'The Bureau only holds records from 1950.'),
  lat: z.coerce.number('Drop a pin on the map.').min(-90).max(90),
  lng: z.coerce.number('Drop a pin on the map.').min(-180).max(180),
  placeName: z.string().trim().max(120, 'Keep the place name under 120 characters.').optional(),
  light: z.enum(LIGHTS).optional(),
  weather: z.enum(WEATHERS).optional(),
  distanceMeters: num(0, 5000),
  durationSeconds: num(0, 7200),
  objectShape: z.enum(SHAPES).optional(),
  subjectSlug: z.string().max(80).optional(),
  footprintCm: num(1, 200),
  soundNote: z.string().trim().max(400).optional(),
  testimony: z.string().trim().max(600).optional(),
  witnessCode: z
    .string()
    .regex(/^[0-9A-Fa-f]{4}$/)
    .optional(),
  // bot traps
  website: z.string().max(0).optional(), // honeypot, must stay empty
  startedAt: z.coerce.number(),
})

export type ReportInput = z.infer<typeof reportSchema>

export type FormState =
  | {status: 'idle'}
  | {status: 'error'; message: string; fieldErrors: Record<string, string>}

export const desksSchema = z.object({
  caseId: z.string().regex(/^case-[A-Za-z0-9-]+$/),
  action: z.enum(['open-investigation', 'debunk']),
  note: z.string().trim().max(280).optional(),
  confirmFaith: z.coerce.boolean().optional(),
})
