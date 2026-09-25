import {defineField, defineType} from 'sanity'
import {CogIcon} from '@sanity/icons/Cog'

export const bureauSettingsType = defineType({
  name: 'bureauSettings',
  title: 'Bureau settings',
  type: 'document',
  icon: CogIcon,
  fields: [
    defineField({
      name: 'agentEnabled',
      title: 'Field Investigator enabled',
      type: 'boolean',
      description: 'Kill switch. When off, new cases skip the AI and go straight to the Director.',
      initialValue: true,
    }),
    defineField({
      name: 'dailyAgentBudget',
      title: 'Daily AI triage budget',
      type: 'number',
      description:
        'Maximum AI triages in any rolling 24 hours. Beyond this, cases go to the Director.',
      initialValue: 60,
      validation: (Rule) => Rule.required().integer().min(0).max(1000),
    }),
    defineField({
      name: 'publicDeskEnabled',
      title: "Public Director's Desk enabled",
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'publicDeskHourlyLimit',
      title: 'Public desk decisions per hour',
      type: 'number',
      initialValue: 10,
      validation: (Rule) => Rule.required().integer().min(1).max(200),
    }),
  ],
  preview: {prepare: () => ({title: 'Bureau settings'})},
})
