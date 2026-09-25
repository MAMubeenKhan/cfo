import {defineField, defineType} from 'sanity'
import {LinkIcon} from '@sanity/icons/Link'

export const connectionType = defineType({
  name: 'connection',
  title: 'Red string',
  type: 'document',
  icon: LinkIcon,
  description:
    'A link between two cases. Document ID is conn-<lowerId>-<higherId>, so each pair exists once.',
  fields: [
    defineField({
      name: 'from',
      type: 'reference',
      to: [{type: 'case'}],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'to',
      type: 'reference',
      to: [{type: 'case'}],
      validation: (Rule) =>
        Rule.required().custom((value, ctx) => {
          const from = (ctx.document as {from?: {_ref?: string}} | undefined)?.from?._ref
          const to = (value as {_ref?: string} | undefined)?._ref
          if (from && to && from === to) return 'A case cannot be linked to itself'
          return true
        }),
    }),
    defineField({
      name: 'reason',
      type: 'string',
      validation: (Rule) => Rule.required().max(160),
    }),
    defineField({
      name: 'confidence',
      type: 'number',
      validation: (Rule) => Rule.required().min(0).max(1),
    }),
    defineField({
      name: 'proposedBy',
      type: 'string',
      options: {list: ['agent', 'human'], layout: 'radio'},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'status',
      type: 'string',
      options: {list: ['proposed', 'confirmed', 'rejected'], layout: 'radio'},
      initialValue: 'proposed',
      validation: (Rule) => Rule.required(),
    }),
    defineField({name: 'createdAt', type: 'datetime', readOnly: true}),
    defineField({name: 'decidedAt', type: 'datetime', readOnly: true}),
  ],
  preview: {
    select: {
      a: 'from.caseNumber',
      b: 'to.caseNumber',
      status: 'status',
      by: 'proposedBy',
      reason: 'reason',
    },
    prepare: ({a, b, status, by, reason}) => ({
      title: `${a ?? '?'} ↔ ${b ?? '?'}`,
      subtitle: `${status} · by ${by} · ${reason ?? ''}`,
    }),
  },
})
