import { asserts } from './deps.ts'
import { bindErrorRecovery, withAsyncErrorRecovery, withErrorRecovery } from './errors.ts'

Deno.test('bindErrorRecovery works', () => {
	function foo(error: boolean) {
		if (error) throw new Error('I throw')

		return 12
	}

	const safeFoo = bindErrorRecovery(foo, 20)

	asserts.assertThrows(() => foo(true))
	asserts.assertEquals(safeFoo(true), 20)
	asserts.assertEquals(safeFoo(false), 12)
})

Deno.test('bindErrorRecovery works on promises', async () => {
	async function foo(error: boolean) {
		await new Promise((resolve) => setTimeout(resolve, 5))

		if (error) throw new Error('I throw')
		return 12
	}

	const safeFoo = bindErrorRecovery(foo, 20)

	asserts.assertRejects(async () => await foo(true))
	asserts.assertEquals(await safeFoo(true), 20)
	asserts.assertEquals(await safeFoo(false), 12)
})

Deno.test('withErrorRecovery works', () => {
	asserts.assertEquals(withErrorRecovery(() => 12, 13), 12)

	asserts.assertEquals(
		withErrorRecovery(() => {
			throw new Error('error')
		}, 13),
		13,
	)
})

Deno.test('withAsyncErrorRecovery works', async () => {
	asserts.assertEquals(
		await withAsyncErrorRecovery(async () => {
			await new Promise((resolve) => setTimeout(resolve, 5))

			return 12
		}, 13),
		12,
	)

	asserts.assertEquals(
		await withAsyncErrorRecovery(async () => {
			await new Promise((resolve) => setTimeout(resolve, 5))

			throw new Error('error')
		}, 13),
		13,
	)
})
