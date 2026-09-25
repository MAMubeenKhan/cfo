import {defineField, defineType} from 'sanity'
import {ImageIcon} from '@sanity/icons/Image'
import {ComposeIcon} from '@sanity/icons/Compose'
import {MicrophoneIcon} from '@sanity/icons/Microphone'
import {ThListIcon} from '@sanity/icons/ThList'

export const photoEvidence = defineType({
  name: 'photoEvidence',
  title: 'Photo evidence',
  type: 'object',
  icon: ImageIcon,
  fields: [
    defineField({
      name: 'image',
      type: 'image',
      options: {hotspot: true},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'caption',
      type: 'string',
      description: 'Also used as the alt text on the public site.',
      validation: (Rule) => Rule.required().max(140),
    }),
  ],
  preview: {select: {title: 'caption', media: 'image'}, prepare: ({title, media}) => ({title, subtitle: 'Photo', media})},
})

export const footprintEvidence = defineType({
  name: 'footprintEvidence',
  title: 'Footprint evidence',
  type: 'object',
  icon: ThListIcon,
  fields: [
    defineField({
      name: 'lengthCm',
      title: 'Length (cm)',
      type: 'number',
      validation: (Rule) => Rule.required().min(1).max(200),
    }),
    defineField({name: 'image', type: 'image', options: {hotspot: true}}),
  ],
  preview: {
    select: {len: 'lengthCm', media: 'image'},
    prepare: ({len, media}) => ({title: `Footprint, ${len ?? '?'} cm`, subtitle: 'Footprint', media}),
  },
})

export const soundEvidence = defineType({
  name: 'soundEvidence',
  title: 'Sound evidence',
  type: 'object',
  icon: MicrophoneIcon,
  fields: [
    defineField({
      name: 'description',
      type: 'text',
      rows: 3,
      validation: (Rule) => Rule.required().min(10).max(400),
    }),
    defineField({
      name: 'durationSeconds',
      title: 'Duration (seconds)',
      type: 'number',
      validation: (Rule) => Rule.min(1).max(7200),
    }),
  ],
  preview: {select: {title: 'description'}, prepare: ({title}) => ({title, subtitle: 'Sound'})},
})

export const testimonyEvidence = defineType({
  name: 'testimonyEvidence',
  title: 'Testimony',
  type: 'object',
  icon: ComposeIcon,
  fields: [
    defineField({
      name: 'quote',
      type: 'text',
      rows: 3,
      validation: (Rule) => Rule.required().min(10).max(600),
    }),
    defineField({name: 'speaker', type: 'string', validation: (Rule) => Rule.max(80)}),
  ],
  preview: {
    select: {title: 'quote', speaker: 'speaker'},
    prepare: ({title, speaker}) => ({title, subtitle: speaker ? `Testimony, ${speaker}` : 'Testimony'}),
  },
})
