import { summarize, exitWithProperCode } from '../lib/tester.ts'

import stringTest from './string.ts'

await stringTest()

summarize()
exitWithProperCode()
