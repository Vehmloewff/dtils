import { regexReplace } from './string.ts'
import { asserts } from './deps.ts'

Deno.test('regexReplace replaces strings', () => {
	const string = `Hey duce, I appreciate you bro!  Can you duce the job?  Can you create a real duce?`
	const regex = /duce/

	const replaced = regexReplace(string, regex, () => 'bruce')

	asserts.assertEquals(`Hey bruce, I appreciate you bro!  Can you bruce the job?  Can you create a real bruce?`, replaced)
})
