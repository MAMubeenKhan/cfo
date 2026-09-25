import {defineArrayMember, defineField, defineType} from 'sanity'
import {DocumentIcon} from '@sanity/icons/Document'
import {GeoPinInput} from '../../src/components/geo-pin-input'
import {CATEGORIES, OUTCOMES, STATUSES, TRIAGE_FLAGS, STATUS_LABEL} from '../constants'

export const caseType = defineType({
  name: 'case',
  title: 'Case',
  type: 'document',
  icon: DocumentIcon,
  initialValue: () => ({status: 'intake', source: 'studio', hidden: false, category: 'cryptid'}),
  groups: [
    {name: 'file', title: 'Case file', default: true},
    {name: 'evidence', title: 'Evidence'},
    {name: 'bureau', title: 'Bureau record'},
  ],
  fields: [
    defineField({
      name: 'caseNumber',
      type: 'string',
      group: 'file',
      readOnly: true,
      description: 'Allocated by the Bureau, e.g. CFO-2026-0147.',
      validation: (Rule) => Rule.required().regex(/^CFO-\d{4}-\d{4}$/, {name: 'case number'}),
    }),
    defineField({
      name: 'title',
      type: 'string',
      group: 'file',
      validation: (Rule) => Rule.required().max(90),
    }),
    defineField({
      name: 'category',
      type: 'string',
      group: 'file',
      description: 'The kind of report: what the witness believes they saw.',
      options: {list: [...CATEGORIES]},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'status',
      type: 'string',
      group: 'bureau',
      readOnly: true,
      description: 'Mirror of the workflow stage. Written by the workflow, not by hand.',
      options: {list: [...STATUSES]},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'sighting',
      type: 'object',
      group: 'file',
      fields: [
        defineField({
          name: 'observedAt',
          title: 'Observed at',
          type: 'datetime',
          validation: (Rule) =>
            Rule.required().custom((value) => {
              if (!value) return true
              const t = Date.parse(value)
              if (Number.isNaN(t)) return 'Not a valid date'
              if (t > Date.now() + 60_000) return 'A sighting cannot be in the future'
              if (t < Date.parse('1950-01-01')) return 'The Bureau only holds records from 1950'
              return true
            }),
        }),
        defineField({
          name: 'location',
          type: 'object',
          fields: [
            defineField({
              name: 'geo',
              title: 'Location',
              type: 'geopoint',
              components: {input: GeoPinInput},
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'placeName',
              title: 'Place name',
              type: 'string',
              validation: (Rule) => Rule.max(120),
            }),
            defineField({name: 'region', type: 'reference', to: [{type: 'region'}]}),
          ],
        }),
        defineField({
          name: 'conditions',
          type: 'object',
          fields: [
            defineField({
              name: 'light',
              type: 'string',
              options: {list: ['daylight', 'dusk', 'night', 'artificial']},
            }),
            defineField({
              name: 'weather',
              type: 'string',
              options: {list: ['clear', 'rain', 'fog', 'snow', 'wind']},
            }),
            defineField({
              name: 'distanceMeters',
              title: 'Distance (m)',
              type: 'number',
              validation: (Rule) => Rule.min(0).max(5000),
            }),
            defineField({
              name: 'durationSeconds',
              title: 'Duration (s)',
              type: 'number',
              validation: (Rule) => Rule.min(0).max(7200),
            }),
          ],
        }),
        defineField({
          name: 'objectShape',
          title: 'Object shape',
          type: 'string',
          description: 'UFO / UAP reports only.',
          options: {
            list: ['triangle', 'disc', 'sphere', 'cigar', 'tic-tac', 'light-only', 'other'],
          },
          hidden: ({document}) => document?.category !== 'ufo',
        }),
        defineField({
          name: 'description',
          type: 'text',
          rows: 6,
          validation: (Rule) => Rule.required().min(40).max(2000),
        }),
        defineField({
          name: 'subjectClaimed',
          title: 'Subject claimed by witness',
          type: 'reference',
          to: [{type: 'subject'}],
        }),
      ],
    }),
    defineField({
      name: 'witness',
      type: 'reference',
      group: 'file',
      to: [{type: 'witness'}],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'evidence',
      type: 'array',
      group: 'evidence',
      of: [
        defineArrayMember({type: 'photoEvidence'}),
        defineArrayMember({type: 'footprintEvidence'}),
        defineArrayMember({type: 'soundEvidence'}),
        defineArrayMember({type: 'testimonyEvidence'}),
      ],
      validation: (Rule) => Rule.max(6),
    }),
    defineField({
      name: 'triage',
      title: 'Field Investigator triage',
      type: 'object',
      group: 'bureau',
      readOnly: true,
      fields: [
        defineField({
          name: 'plausibility',
          type: 'number',
          validation: (Rule) => Rule.min(0).max(100).integer(),
        }),
        defineField({name: 'summary', type: 'string'}),
        defineField({name: 'memo', type: 'text', rows: 6}),
        defineField({name: 'subjectMatch', type: 'reference', to: [{type: 'subject'}]}),
        defineField({
          name: 'flags',
          type: 'array',
          of: [defineArrayMember({type: 'string'})],
          options: {list: [...TRIAGE_FLAGS]},
        }),
        defineField({
          name: 'route',
          type: 'string',
          options: {list: ['auto-debunk', 'review', 'investigation']},
        }),
        defineField({name: 'triagedAt', type: 'datetime'}),
        defineField({name: 'model', type: 'string'}),
        defineField({name: 'effectKey', type: 'string'}),
      ],
    }),
    defineField({
      name: 'verdict',
      type: 'object',
      group: 'bureau',
      readOnly: true,
      fields: [
        defineField({name: 'outcome', type: 'string', options: {list: [...OUTCOMES]}}),
        defineField({name: 'note', type: 'text', rows: 3}),
        defineField({name: 'filedAt', type: 'datetime'}),
        defineField({
          name: 'filedBy',
          type: 'string',
          options: {list: ['agent', 'director', 'investigator', 'visitor']},
        }),
      ],
    }),
    defineField({
      name: 'log',
      title: 'Case log',
      type: 'array',
      group: 'bureau',
      readOnly: true,
      of: [defineArrayMember({type: 'logEntry'})],
    }),
    defineField({
      name: 'hidden',
      type: 'boolean',
      group: 'bureau',
      description: 'Moderation switch. Hidden cases never appear on the public site.',
      initialValue: false,
    }),
    defineField({
      name: 'source',
      type: 'string',
      group: 'bureau',
      readOnly: true,
      options: {list: ['web', 'seed', 'studio']},
    }),
    defineField({name: 'workflowInstanceId', type: 'string', readOnly: true, hidden: true}),
    defineField({name: 'submissionKey', type: 'string', readOnly: true, hidden: true}),
    defineField({
      name: 'visitorDecision',
      type: 'object',
      readOnly: true,
      hidden: true,
      fields: [defineField({name: 'at', type: 'datetime'})],
    }),
  ],
  orderings: [
    {
      title: 'Newest sighting first',
      name: 'observedDesc',
      by: [{field: 'sighting.observedAt', direction: 'desc'}],
    },
    {title: 'Case number', name: 'caseNumberAsc', by: [{field: 'caseNumber', direction: 'asc'}]},
  ],
  preview: {
    select: {
      title: 'title',
      number: 'caseNumber',
      status: 'status',
      hidden: 'hidden',
      img0: 'evidence.0.image',
      img1: 'evidence.1.image',
      img2: 'evidence.2.image',
      img3: 'evidence.3.image',
    },
    prepare: ({title, number, status, hidden, img0, img1, img2, img3}) => ({
      title,
      subtitle: `${number ?? 'unnumbered'} · ${STATUS_LABEL[status] ?? status ?? 'no status'}${hidden ? ' · HIDDEN' : ''}`,
      // thumbnail: the first photo among the first four evidence items
      media: img0 ?? img1 ?? img2 ?? img3,
    }),
  },
})
