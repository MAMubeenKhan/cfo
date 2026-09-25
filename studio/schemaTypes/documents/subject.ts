import {defineArrayMember, defineField, defineType} from 'sanity'
import {BulbOutlineIcon} from '@sanity/icons/BulbOutline'
import {CATEGORIES} from '../constants'

export const subjectType = defineType({
  name: 'subject',
  title: 'Subject',
  type: 'document',
  icon: BulbOutlineIcon,
  fields: [
    defineField({name: 'name', type: 'string', validation: (Rule) => Rule.required()}),
    defineField({
      name: 'slug',
      type: 'slug',
      options: {source: 'name', maxLength: 60},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'codename',
      type: 'string',
      description: 'Bureau file designation, e.g. SUBJECT-BF.',
      validation: (Rule) => Rule.required().regex(/^SUBJECT-[A-Z0-9]{2,4}$/),
    }),
    defineField({
      name: 'category',
      type: 'string',
      description: 'What kind of phenomenon this subject is.',
      options: {list: [...CATEGORIES], layout: 'radio'},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'summary',
      type: 'text',
      rows: 3,
      validation: (Rule) => Rule.required().max(280),
    }),
    defineField({
      name: 'description',
      type: 'array',
      of: [defineArrayMember({type: 'block'})],
    }),
    defineField({
      name: 'signatureTraits',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
    }),
    defineField({name: 'habitat', type: 'array', of: [defineArrayMember({type: 'string'})]}),
    defineField({
      name: 'sizeRangeCm',
      title: 'Reported size range (cm)',
      description: 'Height of a creature, or span of a craft.',
      type: 'object',
      options: {columns: 2},
      fields: [
        defineField({name: 'min', type: 'number', validation: (Rule) => Rule.min(1)}),
        defineField({name: 'max', type: 'number', validation: (Rule) => Rule.min(1)}),
      ],
      validation: (Rule) =>
        Rule.custom((v) => {
          const s = v as {min?: number; max?: number} | undefined
          return s?.min != null && s?.max != null && s.min > s.max
            ? 'Minimum exceeds maximum'
            : true
        }),
    }),
    defineField({
      name: 'firstRecorded',
      title: 'First recorded (year)',
      type: 'number',
      validation: (Rule) => Rule.integer().min(1000).max(2100),
    }),
    defineField({
      name: 'threatLevel',
      type: 'number',
      options: {list: [1, 2, 3, 4, 5]},
      validation: (Rule) => Rule.required().min(1).max(5).integer(),
    }),
    defineField({name: 'plate', type: 'image', options: {hotspot: true}}),
    defineField({
      name: 'plateCredit',
      type: 'string',
      description: 'Required when a plate image is set.',
      validation: (Rule) =>
        Rule.custom((value, ctx) => {
          const doc = ctx.document as {plate?: unknown} | undefined
          return doc?.plate && !value ? 'Credit the source of the image' : true
        }),
    }),
  ],
  orderings: [{title: 'Name', name: 'nameAsc', by: [{field: 'name', direction: 'asc'}]}],
  preview: {select: {title: 'name', subtitle: 'codename', media: 'plate'}},
})
