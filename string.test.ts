import { concatenate, regexReplace, sliceConcatenated } from './string.ts'
import { asserts } from './deps.ts'

Deno.test('regexReplace replaces strings', () => {
	const string = `Hey duce, I appreciate you bro!  Can you duce the job?  Can you create a real duce?`
	const regex = /duce/

	const replaced = regexReplace(string, regex, () => 'bruce')

	asserts.assertEquals(`Hey bruce, I appreciate you bro!  Can you bruce the job?  Can you create a real bruce?`, replaced)
})

Deno.test('concat and sliceConcatenated do just that: concat and slice', () => {
	const sections = ['foo', 'bar', 'bin', 'baz']

	asserts.assertEquals(sliceConcatenated(concatenate(sections)), sections)
})

Deno.test('concat and sliceConcatenated prevent delimiter attacks', () => {
	const sections = ['foo', 'bar', 'bin', 'baz']
	const attackSections = ['foo', 'bar/bin', 'baz']

	const string = concatenate(sections)
	const attackString = concatenate(attackSections)

	asserts.assertNotEquals(string, attackString)

	asserts.assertEquals(sliceConcatenated(string), sections)
	asserts.assertEquals(sliceConcatenated(attackString), attackSections)
})

Deno.test('escaping and doing other funny stuff doesn\'t mess things up', () => {
	const sections = ['http:://', 'meeker 😂', 'bee\\/keeper']

	asserts.assertEquals(sliceConcatenated(concatenate(sections)), sections)
})
