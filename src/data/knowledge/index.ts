import type { ModuleKnowledge } from '../types'
import { coKnowledge } from './co'
import { osKnowledge } from './os'
import { dbKnowledge } from './db'
import { nwKnowledge } from './nw'
import { secKnowledge } from './sec'
import { seKnowledge } from './se'
import { ooKnowledge } from './oo'
import { dsKnowledge } from './ds'
import { plKnowledge } from './pl'
import { mathKnowledge } from './math'
import { lawKnowledge } from './law'
import { enKnowledge } from './en'
import { mmKnowledge } from './mm'
import { archKnowledge } from './arch'

export const KNOWLEDGE: Record<string, ModuleKnowledge> = {
  co: coKnowledge,
  os: osKnowledge,
  db: dbKnowledge,
  nw: nwKnowledge,
  sec: secKnowledge,
  se: seKnowledge,
  oo: ooKnowledge,
  ds: dsKnowledge,
  pl: plKnowledge,
  math: mathKnowledge,
  law: lawKnowledge,
  en: enKnowledge,
  mm: mmKnowledge,
  arch: archKnowledge,
}
