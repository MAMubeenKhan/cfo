import {defineField, defineType} from 'sanity'

export const logEntry = defineType({
  name: 'logEntry',
  title: 'Log entry',
  type: 'object',
  fields: [
    defineField({name: 'at', title: 'At', type: 'datetime', validation: (Rule) => Rule.required()}),
    defineField({
      name: 'actor',
      type: 'string',
      options: {list: ['agent', 'human', 'visitor', 'system'], layout: 'radio'},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'kind',
      type: 'string',
      options: {list: ['received', 'triaged', 'routed', 'connected', 'decision', 'filed', 'error']},
      validation: (Rule) => Rule.required(),
    }),
    defineField({name: 'message', type: 'string', validation: (Rule) => Rule.required().max(400)}),
  ],
  preview: {
    select: {title: 'message', actor: 'actor', kind: 'kind'},
    prepare: ({title, actor, kind}) => ({title, subtitle: `${actor} · ${kind}`}),
  },
})
