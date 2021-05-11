import { assertEquals, AssertionError } from 'https://deno.land/std@0.95.0/testing/asserts.ts'
import { cyan, gray, green, red } from 'https://deno.land/std@0.55.0/fmt/colors.ts'
import { bold } from 'https://deno.land/std@0.95.0/fmt/colors.ts'

let failed = 0
let passed = 0

export interface Expect {
	failure(reason: string): void
	equal(v1: unknown, v2: unknown): void
	error(func: () => unknown, type?: unknown): Promise<void> | void
}

type It = (description: string, cb: (expect: Expect) => void | Promise<void>) => Promise<void>

export function describe(module: string, cb: (it: It) => Promise<void> | void) {
	const func = async () => {
		console.log(cyan(bold(module)))

		const it: It = async (description, cb) => {
			const expect = createExpect()
			const startTime = Date.now()

			try {
				await cb(expect)
				console.log(`${description} ... ${green('ok')} ${gray(`(${Date.now() - startTime}ms)`)}`)
				passed++
			} catch (e) {
				console.log(`${description} ... ${red('failed')} ${gray(`(${Date.now() - startTime}ms)`)}`)
				console.log(e)
				failed++
			}
		}

		await cb(it)
	}

	return func
}

export function summarize() {
	console.log('')

	if (failed) {
		console.log(`test result: ${bold(red('failed'))}.  ${passed} passed; ${failed} failed;`)
	} else {
		console.log(`test result: ${green('ok')}.  ${passed} passed; ${failed} failed;`)
	}
}

export function testsDidPass() {
	return !!failed
}

export function exitWithProperCode() {
	Deno.exit(failed)
}

function createExpect(): Expect {
	function failure(reason: string) {
		throw new AssertionError(reason)
	}

	function equal(v1: unknown, v2: unknown) {
		assertEquals(v1, v2)
	}

	async function error(errorProne: () => unknown, type?: unknown) {
		try {
			await errorProne()

			throw new AssertionError('Function did not error!')
		} catch (e) {
			if (e instanceof AssertionError) throw e

			if (type)
				assertEquals(
					e,
					type,
					`Actual error did not match the expected one\n\nActual:\n${JSON.stringify(e)}\n\nExpected:\n${JSON.stringify(type)}`
				)
		}
	}

	return {
		failure,
		equal,
		error,
	}
}
