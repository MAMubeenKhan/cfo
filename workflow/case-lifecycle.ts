import {
  defineAction,
  defineActivity,
  defineField,
  defineStage,
  defineTransition,
  defineWorkflow,
} from '@sanity/workflow-engine/define'

/**
 * The life of a case at the Cryptid Field Office.
 *
 *   intake ──(agent triage)──► investigation | review | filing
 *   review ──(Director)──────► investigation | filing
 *   investigation ──(Investigator)──► filing
 *   filing ──► closed
 *
 * The Field Investigator (an AI agent) and a person move a case through the SAME
 * actions and transitions. Where a case goes after triage is decided by code
 * (workflow/lib/routing.ts), never by the model.
 */

const subject = '$fields.subject._id'

/** A human verdict action: records the outcome, the note and who signed it. */
const verdictAction = (name: string, title: string, verdict: string) =>
  defineAction({
    name,
    title,
    status: 'done',
    params: [{type: 'string', name: 'note', title: 'Note for the file', required: true}],
    ops: [
      {type: 'field.set', target: {field: 'verdict'}, value: {type: 'literal', value: verdict}},
      {type: 'field.set', target: {field: 'verdictNote'}, value: {type: 'param', param: 'note'}},
      {type: 'field.set', target: {field: 'investigator'}, value: {type: 'actor'}},
    ],
  })

export const caseLifecycle = defineWorkflow({
  name: 'case-lifecycle',
  title: 'Case lifecycle',
  description:
    'Takes a sighting report from intake, through AI triage and a human decision, to a filed verdict.',
  initialStage: 'intake',
  fields: [
    defineField({
      type: 'subject',
      name: 'subject',
      title: 'Case',
      required: true,
      description: 'The case file this instance moves through the stages.',
      initialValue: {type: 'input'},
    }),
    defineField({type: 'actor', name: 'director', title: 'Director'}),
    defineField({type: 'actor', name: 'investigator', title: 'Investigator'}),
    defineField({type: 'string', name: 'decision', title: 'Director decision'}),
    defineField({type: 'string', name: 'verdict', title: 'Verdict'}),
    defineField({type: 'string', name: 'verdictNote', title: 'Verdict note'}),
  ],
  stages: [
    // ---------------------------------------------------------------- intake
    defineStage({
      name: 'intake',
      title: 'Intake and triage',
      description: 'The Field Investigator reads the report and scores its plausibility.',
      activities: [
        defineActivity({
          name: 'triage',
          title: 'Triage the report',
          actions: [
            defineAction({
              name: 'analyze',
              title: 'Field Investigator reviews the report',
              when: 'true',
              effects: [
                {
                  name: 'agent-triage',
                  bindings: {subject},
                  outputs: [
                    {type: 'boolean', name: 'needsHuman'},
                    {type: 'boolean', name: 'likelyHoax'},
                  ],
                },
              ],
            }),
            defineAction({
              name: 'triaged',
              title: 'Triage complete',
              when: "$effectStatus['agent-triage'] == 'done'",
              status: 'done',
            }),
          ],
        }),
      ],
      transitions: [
        defineTransition({
          name: 'triage-failed',
          title: 'Triage failed: send to the Director',
          to: 'review',
          when: "$effectStatus['agent-triage'] == 'failed'",
        }),
        defineTransition({
          name: 'auto-close',
          title: 'Close at triage',
          to: 'filing',
          when: "$allActivitiesDone && $effects['agent-triage'].likelyHoax && !$effects['agent-triage'].needsHuman",
        }),
        defineTransition({
          name: 'to-review',
          title: "Send to the Director's review",
          to: 'review',
          when: "$allActivitiesDone && $effects['agent-triage'].needsHuman",
        }),
        defineTransition({
          name: 'to-investigation',
          title: 'Open an investigation',
          to: 'investigation',
          when: '$allActivitiesDone',
        }),
      ],
    }),

    // ---------------------------------------------------------------- review
    defineStage({
      name: 'review',
      title: "Director's review",
      description: 'A person decides whether the case is worth investigating.',
      activities: [
        defineActivity({
          name: 'decide',
          title: "Decide the case",
          actions: [
            defineAction({
              name: 'mirror',
              title: 'Record the stage on the case file',
              when: 'true',
              effects: [{name: 'mirror-review', bindings: {subject}}],
            }),
            defineAction({
              name: 'open-investigation',
              title: 'Open an investigation',
              status: 'done',
              ops: [
                {type: 'field.set', target: {field: 'decision'}, value: {type: 'literal', value: 'investigate'}},
                {type: 'field.set', target: {field: 'director'}, value: {type: 'actor'}},
              ],
            }),
            defineAction({
              name: 'debunk',
              title: 'Debunk and close',
              status: 'done',
              params: [{type: 'string', name: 'note', title: 'Grounds for closing', required: true}],
              ops: [
                {type: 'field.set', target: {field: 'decision'}, value: {type: 'literal', value: 'close'}},
                {type: 'field.set', target: {field: 'verdict'}, value: {type: 'literal', value: 'debunked'}},
                {type: 'field.set', target: {field: 'verdictNote'}, value: {type: 'param', param: 'note'}},
                {type: 'field.set', target: {field: 'director'}, value: {type: 'actor'}},
              ],
            }),
          ],
        }),
      ],
      transitions: [
        defineTransition({
          name: 'to-investigation',
          title: 'Open an investigation',
          to: 'investigation',
          when: "$allActivitiesDone && $fields.decision == 'investigate'",
        }),
        defineTransition({
          name: 'to-filing',
          title: 'Close the case',
          to: 'filing',
          when: "$allActivitiesDone && $fields.decision == 'close'",
        }),
      ],
    }),

    // ---------------------------------------------------------- investigation
    defineStage({
      name: 'investigation',
      title: 'Field investigation',
      description: 'The Cross-Referencer looks for related files while an investigator works the case.',
      activities: [
        defineActivity({
          name: 'cross-reference',
          title: 'Cross-reference related files',
          actions: [
            defineAction({
              name: 'run',
              title: 'Cross-Referencer searches the files',
              when: 'true',
              effects: [
                {name: 'mirror-investigation', bindings: {subject}},
                {name: 'agent-crossref', bindings: {subject}},
              ],
            }),
            defineAction({
              name: 'done',
              title: 'Cross-reference complete',
              when: "$effectStatus['agent-crossref'] == 'done'",
              status: 'done',
            }),
            // A failed cross-reference must never block a case.
            defineAction({
              name: 'skip-on-failure',
              title: 'Cross-reference unavailable: continue without it',
              when: "$effectStatus['agent-crossref'] == 'failed'",
              status: 'done',
            }),
          ],
        }),
        defineActivity({
          name: 'field-report',
          title: 'File the field report',
          actions: [
            verdictAction('classify', 'Classify: on record as unexplained', 'classified'),
            verdictAction('debunk', 'Debunk: explained', 'debunked'),
            verdictAction('inconclusive', 'Inconclusive', 'inconclusive'),
          ],
        }),
      ],
      transitions: [
        defineTransition({name: 'to-filing', title: 'File the verdict', to: 'filing', when: '$allActivitiesDone'}),
      ],
    }),

    // ---------------------------------------------------------------- filing
    defineStage({
      name: 'filing',
      title: 'Filing',
      description: 'The Bureau stamps the verdict and updates the witness record.',
      activities: [
        defineActivity({
          name: 'file',
          title: 'Stamp and file',
          actions: [
            defineAction({
              name: 'stamp',
              title: 'Stamp the case',
              when: 'true',
              effects: [
                {
                  name: 'file-verdict',
                  bindings: {
                    subject,
                    verdict: '$fields.verdict',
                    note: '$fields.verdictNote',
                    directorId: '$fields.director.id',
                    investigatorId: '$fields.investigator.id',
                  },
                },
              ],
            }),
            defineAction({
              name: 'filed',
              title: 'Filed',
              when: "$effectStatus['file-verdict'] == 'done'",
              status: 'done',
            }),
          ],
        }),
      ],
      transitions: [defineTransition({name: 'to-closed', title: 'Close the file', to: 'closed', when: '$allActivitiesDone'})],
    }),

    // ---------------------------------------------------------------- closed
    defineStage({name: 'closed', title: 'Closed', description: 'The case is filed. Nothing more to do.'}),
  ],
})
