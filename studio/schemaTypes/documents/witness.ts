import {defineField, defineType} from 'sanity'
import {UserIcon} from '@sanity/icons/User'

export const witnessType = defineType({
  name: 'witness',
  title: 'Witness',
  type: 'document',
  icon: UserIcon,
  description:
    'Deliberately anonymous: a codename and a track record. No names, emails or IP addresses are ever stored.',
  fields: [
    defineField({
      name: 'codename',
      type: 'string',
      readOnly: true,
      validation: (Rule) => Rule.required().regex(/^WITNESS-[0-9A-F]{4}$/),
    }),
    defineField({
      name: 'credibility',
      type: 'number',
      readOnly: true,
      description: 'Computed from closed cases. New witnesses start at 50.',
      validation: (Rule) => Rule.min(0).max(100).integer(),
    }),
    defineField({name: 'reportsCount', type: 'number', readOnly: true, initialValue: 0}),
    defineField({
      name: 'closedCounts',
      type: 'object',
      readOnly: true,
      options: {columns: 3},
      fields: [
        defineField({name: 'classified', type: 'number', initialValue: 0}),
        defineField({name: 'debunked', type: 'number', initialValue: 0}),
        defineField({name: 'inconclusive', type: 'number', initialValue: 0}),
      ],
    }),
  ],
  preview: {
    select: {title: 'codename', cred: 'credibility', n: 'reportsCount'},
    prepare: ({title, cred, n}) => ({
      title,
      subtitle: `Credibility ${cred ?? 50} · ${n ?? 0} reports`,
    }),
  },
})
