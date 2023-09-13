import { cborDecode, cborEncode } from './cbor.ts'
import { asserts } from './deps.ts'

Deno.test('cborDecode decodes what cborEncode encoded', () => {
	const value = {
		foo: {
			bar: true,
			bin: 'baz',
			fatty: 8123,
			acid: .3,
		},
		data: null,
	}

	asserts.assertEquals(cborDecode(cborEncode(value)), value)

	// Can also encode/decode primitives
	asserts.assertEquals(cborDecode(cborEncode(true)), true)
	asserts.assertEquals(cborDecode(cborEncode('asd')), 'asd')
	asserts.assertEquals(cborDecode(cborEncode(123)), 123)
	asserts.assertEquals(cborDecode(cborEncode(.123)), .123)
	asserts.assertEquals(cborDecode(cborEncode(null)), null)
})

Deno.test('cborDecode throws if it can\'t decode', () => {
	asserts.assertThrows(() => cborDecode(new Uint8Array([12, 2, 55, 90, 123])))
})
