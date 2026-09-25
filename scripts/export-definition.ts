// npm run wf:export
// Writes the workflow definition as JSON for the Case Board (stage diagram) and the public site.
import {mkdirSync, writeFileSync} from 'node:fs'
import {resolve} from 'node:path'
import {caseLifecycle} from '../workflow/case-lifecycle'

const targets = ['caseboard/src/generated', 'web/src/generated']
for (const dir of targets) {
  const abs = resolve(process.cwd(), dir)
  mkdirSync(abs, {recursive: true})
  writeFileSync(resolve(abs, 'case-lifecycle.json'), JSON.stringify(caseLifecycle, null, 2) + '\n', 'utf8')
  console.log('wrote', dir + '/case-lifecycle.json')
}
