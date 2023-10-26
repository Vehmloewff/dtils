import { asserts } from './deps.ts'
import { bindErrorRecovery, prependErrorMessageWith, retryFailures, withAsyncErrorRecovery, withErrorRecovery } from './errors.ts'

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

Deno.test('retryFailures retries correct number of times', async () => {
	let didRun = 0

	await retryFailures(
		() => {
			didRun++

			if (didRun < 10) throw new Error('Test error')
		},
		5,
		10,
	)

	asserts.assertEquals(didRun, 10)
})

Deno.test('retryFailures stops retrying on success', async () => {
	let didRun = 0

	const result = await retryFailures(
		() => {
			didRun++

			if (didRun < 5) throw new Error('Test error')

			return 45
		},
		5,
		10,
	)

	asserts.assertEquals(result, 45)
	asserts.assertEquals(didRun, 5)
})

Deno.test('prependErrorMessageWith prepends error messages with', () => {
	asserts.assertThrows(
		() => {
			const error = new Error('Test error')
			prependErrorMessageWith(error, 'prepend stuff')

			throw error
		},
		Error,
		'prepend stuff Test error',
	)
})
