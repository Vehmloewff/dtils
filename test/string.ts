import { describe } from '../lib/tester.ts'
import { regexReplace } from '../lib/string.ts'

export default describe('string.ts', it => {
	it('[regexReplace] replace strings', expect => {
		const string = `Hey duce, I appreciate you bro!  Can you duce the job?  Can you create a real duce?`
		const regex = /duce/

		const replaced = regexReplace(string, regex, () => 'bruce')

		expect.equal(`Hey bruce, I appreciate you bro!  Can you bruce the job?  Can you create a real bruce?`, replaced)
	})
})
