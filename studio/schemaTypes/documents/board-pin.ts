import {defineField, defineType} from 'sanity'
import {ThLargeIcon} from '@sanity/icons/ThLarge'

export const boardPinType = defineType({
  name: 'boardPin',
  title: 'Board pin',
  type: 'document',
  icon: ThLargeIcon,
  description: 'Where a case card sits on the Case Board. Document ID is pin-<caseId>.',
  fields: [
    defineField({
      name: 'case',
      type: 'reference',
      to: [{type: 'case'}],
      validation: (Rule) => Rule.required(),
    }),
    defineField({name: 'x', type: 'number', validation: (Rule) => Rule.required()}),
    defineField({name: 'y', type: 'number', validation: (Rule) => Rule.required()}),
  ],
  preview: {
    select: {title: 'case.caseNumber', x: 'x', y: 'y'},
    prepare: ({title, x, y}) => ({
      title: title ?? 'Pin',
      subtitle: `x ${Math.round(x ?? 0)}, y ${Math.round(y ?? 0)}`,
    }),
  },
})
