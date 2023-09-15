
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
