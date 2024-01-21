import { asserts } from './deps.ts'
import { SafeUnknown, SafeUnknownArray, SafeUnknownObject } from './safe_unknown.ts'
import { concatenate } from './string.ts'

Deno.test("SafeUnknown gets the correct type, and throws if it's the wrong type", () => {
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

const ARRAY_TEST = ['foo', 'bar', 'bin', 'baz']
const OBJECT_TEST = { foo: 'whatever, man', bar: 'sleep tight', bin: 'never rest', baz: 'be happy' }

Deno.test('SafeUnknownArray.map maps', () => {
	asserts.assertEquals(new SafeUnknownArray(ARRAY_TEST).map((v) => v.asString()), ARRAY_TEST)
})

Deno.test('SafeUnknownArray.forEach loops over each in order', () => {
	let trueIndex = 0
	new SafeUnknownArray(ARRAY_TEST).forEach((item, index) => {
		asserts.assertEquals(index, trueIndex)
		asserts.assertEquals(item.asString(), ARRAY_TEST[trueIndex])

		trueIndex++
	})

	asserts.assertEquals(trueIndex, ARRAY_TEST.length)
})

Deno.test('SafeUnknownArray.values just gets some values', () => {
	asserts.assertEquals(new SafeUnknownArray(ARRAY_TEST).values().map((v) => v.asString()), ARRAY_TEST)
})

Deno.test('SafeUnknownObject.keys just gets the object keys', () => {
	asserts.assertEquals(new SafeUnknownObject(OBJECT_TEST).keys(), Object.keys(OBJECT_TEST))
})

Deno.test('SafeUnknownObject.values just gets the object values', () => {
	asserts.assertEquals(new SafeUnknownObject(OBJECT_TEST).values().map((v) => v.asString()), Object.values(OBJECT_TEST))
})

Deno.test('SafeUnknownObject.forEach loops through object', () => {
	const trueKeys = Object.keys(OBJECT_TEST)
	const loopedKeys: string[] = []

	new SafeUnknownObject(OBJECT_TEST).forEach((value, key) => {
		// @ts-ignore an undefined is ok in this case
		const trueValue = OBJECT_TEST[key]
		asserts.assertEquals(value.asString(), trueValue)

		loopedKeys.push(key)
	})

	asserts.assertEquals(loopedKeys, trueKeys)
})

Deno.test('SafeUnknownObject.map maps', () => {
	asserts.assertEquals(
		Object.values(new SafeUnknownObject(OBJECT_TEST).map((value, key) => concatenate([key, value.asString()]))),
		Object.entries(OBJECT_TEST).map(([key, value]) => concatenate([key, value])),
	)
})

Deno.test('SafeUnknown.asBytes gets bytes', () => {
	const bytes = new Uint8Array([12, 13, 5, 8, 14])

	asserts.assertEquals(new SafeUnknown(bytes).asBytes(), bytes)
})
