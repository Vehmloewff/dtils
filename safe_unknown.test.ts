import { asserts } from './deps.ts'
import { SafeUnknown, SafeUnknownObject } from './safe_unknown.ts'

Deno.test('SafeUnknown gets the correct type, and throws if it\'s the wrong type', () => {
	interface TypeTest {
		value: unknown
		fn(safe: SafeUnknown): void
	}

	const inputs: TypeTest[] = [
		{
			value: 'hello',
			fn(safe) {
				safe.asString()
			},
		},
		{
			value: true,
			fn(safe) {
				safe.asBoolean()
			},
		},
		{
			value: 12341,
			fn(safe) {
				safe.asNumber()
			},
		},
		{
			value: null,
			fn(safe) {
				safe.asNull()
			},
		},
		{
			value: { foo: 'bar' },
			fn(safe) {
				safe.asObject()
			},
		},
		{
			value: [20, 1],
			fn(safe) {
				safe.asArray()
			},
		},
	]

	for (const targetInput of inputs) {
		targetInput.fn(new SafeUnknown(targetInput.value))

		for (const comparativeInput of inputs) {
			if (comparativeInput === targetInput) continue

			asserts.assertThrows(() => targetInput.fn(new SafeUnknown(comparativeInput.value)))
		}
	}
})

Deno.test('SafeUnknownObject.get can get a single value', () => {
	asserts.assertEquals(new SafeUnknownObject({ foo: 12 }).get('foo').asNumber(), 12)
	asserts.assertEquals(new SafeUnknownObject({ foo: { bar: 12 } }).get('foo').isNumber(), false)
})

Deno.test('SafeUnknownObject.get recursively gets values', () => {
	// Check the valid cases
	asserts.assertEquals(
		new SafeUnknownObject({ foo: null }).get('foo', 'bar', 'bin', 'baz').isNull(),
		true,
	)
	asserts.assertEquals(
		new SafeUnknownObject({}).get('foo').isNull(),
		true,
	)
	asserts.assertEquals(
		new SafeUnknownObject({}).get('foo', 'bar', 'bin', 'baz').isNull(),
		true,
	)
	asserts.assertEquals(
		new SafeUnknownObject({
			foo: {
				bar: {
					bin: {
						baz: 'Hello',
					},
				},
			},
		}).get('foo', 'bar', 'bin', 'baz').asString(),
		'Hello',
	)

	// Check the invalid cases
	asserts.assertThrows(() => new SafeUnknownObject({ foo: 'hello' }).get('foo', 'bar', 'bin', 'baz'))
})

Deno.test('SafeUnknownObject.sureGet properly gets', () => {
	// Tests invalid cases
	asserts.assertThrows(() => new SafeUnknownObject({ foo: null }).sureGet('foo', 'bar', 'bin', 'baz'))
	asserts.assertThrows(() => new SafeUnknownObject({}).sureGet('foo'))
	asserts.assertThrows(() => new SafeUnknownObject({}).sureGet('foo', 'bar', 'bin', 'baz').isNull())
	asserts.assertThrows(() => new SafeUnknownObject({ foo: 'hello' }).sureGet('foo', 'bar', 'bin', 'baz'))

	// Test valid cases
	asserts.assertEquals(
		new SafeUnknownObject({ foo: { bar: { bin: { baz: 'Hello' } } } }).sureGet('foo', 'bar', 'bin', 'baz').asString(),
		'Hello',
	)
})

Deno.test('SafeUnknownObject.sureGet can get single values', () => {
	asserts.assertEquals(new SafeUnknownObject({ foo: 12 }).sureGet('foo').asNumber(), 12)
	asserts.assertEquals(new SafeUnknownObject({ foo: { bar: 12 } }).sureGet('foo').isNumber(), false)
})
