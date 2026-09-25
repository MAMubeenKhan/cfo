import {defineField, defineType} from 'sanity'
import {PinIcon} from '@sanity/icons/Pin'

export const regionType = defineType({
  name: 'region',
  title: 'Region',
  type: 'document',
  icon: PinIcon,
  fields: [
    defineField({name: 'name', type: 'string', validation: (Rule) => Rule.required()}),
    defineField({
      name: 'slug',
      type: 'slug',
      options: {source: 'name', maxLength: 60},
      validation: (Rule) => Rule.required(),
    }),
    defineField({name: 'country', type: 'string', validation: (Rule) => Rule.required()}),
    defineField({
      name: 'restricted',
      title: 'Restricted airspace or facility',
      type: 'boolean',
      description: 'Shows a RESTRICTED banner on cases filed here (e.g. Area 51).',
      initialValue: false,
    }),
    defineField({name: 'centroid', type: 'geopoint', validation: (Rule) => Rule.required()}),
  ],
  preview: {select: {title: 'name', subtitle: 'country'}},
})
