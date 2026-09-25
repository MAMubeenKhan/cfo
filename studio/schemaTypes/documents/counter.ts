import {defineField, defineType} from 'sanity'
import {RetrieveIcon} from '@sanity/icons/Retrieve'

export const counterType = defineType({
  name: 'counter',
  title: 'Counter',
  type: 'document',
  icon: RetrieveIcon,
  description: 'Allocates case numbers atomically. Document ID is counter-case-number.',
  fields: [
    defineField({name: 'year', type: 'number', readOnly: true}),
    defineField({name: 'value', type: 'number', readOnly: true}),
  ],
  preview: {
    select: {year: 'year', value: 'value'},
    prepare: ({year, value}) => ({
      title: `Case counter ${year ?? ''}`,
      subtitle: `Last issued: ${value ?? 0}`,
    }),
  },
})
