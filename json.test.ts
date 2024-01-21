import { asserts } from './deps.ts'
import { jsonDecode, jsonEncode } from './json.ts'

Deno.test('jsonDecode decodes what jsonEncode encodes', () => {
	const value = {
		foo: {
			bar: true,
			bin: 'baz',
			fatty: 8123,
			acid: .3,
		},
		data: null,
	}

	asserts.assertEquals(jsonDecode(jsonEncode(value)), value)

	// Can also encode/decode primitives
	asserts.assertEquals(jsonDecode(jsonEncode(true)), true)
	asserts.assertEquals(jsonDecode(jsonEncode('asd')), 'asd')
	asserts.assertEquals(jsonDecode(jsonEncode(123)), 123)
	asserts.assertEquals(jsonDecode(jsonEncode(.123)), .123)
	asserts.assertEquals(jsonDecode(jsonEncode(null)), null)
})

Deno.test("jsonDecode throws if it can't decode", () => {
	asserts.assertThrows(() => jsonDecode('duh'))
	asserts.assertThrows(() => jsonDecode(''))
	asserts.assertThrows(() => jsonDecode('{ new: }'))
})
