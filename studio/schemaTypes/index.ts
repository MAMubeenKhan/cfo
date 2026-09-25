import {
  photoEvidence,
  footprintEvidence,
  soundEvidence,
  testimonyEvidence,
} from './objects/evidence'
import {logEntry} from './objects/log-entry'
import {caseType} from './documents/case'
import {subjectType} from './documents/subject'
import {regionType} from './documents/region'
import {witnessType} from './documents/witness'
import {connectionType} from './documents/connection'
import {boardPinType} from './documents/board-pin'
import {bureauSettingsType} from './documents/bureau-settings'
import {counterType} from './documents/counter'

export const schemaTypes = [
  // documents
  caseType,
  subjectType,
  regionType,
  witnessType,
  connectionType,
  boardPinType,
  bureauSettingsType,
  counterType,
  // objects
  photoEvidence,
  footprintEvidence,
  soundEvidence,
  testimonyEvidence,
  logEntry,
]
