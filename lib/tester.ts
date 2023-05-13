import { asserts, colors } from '../deps.ts'

let failed = 0
let passed = 0

export interface Expect {
	failure(reason: string): void
	equal(v1: unknown, v2: unknown): void
	error(func: () => unknown, type?: unknown): Promise<void> | void
}

type It = (description: string, cb: (expect: Expect) => void | Promise<void>) => Promise<void>

/**
 * Will be removed in the next major release
 *
 * @deprecated Use the BBD testing module in the Deno STD: https://deno.land/std@0.187.0/testing/bdd.ts */
export function describe(module: string, cb: (it: It) => Promise<void> | void) {
	console.warn(
		colors.bold(colors.yellow('Warn')),
		'Testing with this module has been deprecated in favor of https://deno.land/std@0.187.0/testing/bdd.ts',
	)

	const func = async () => {
		console.log(colors.cyan(colors.bold(module)))

		const it: It = async (description, cb) => {
			const expect = createExpect()
			const startTime = Date.now()

			try {
				await cb(expect)
				console.log(`${description} ... ${colors.green('ok')} ${colors.gray(`(${Date.now() - startTime}ms)`)}`)
				passed++
			} catch (e) {
				console.log(`${description} ... ${colors.red('failed')} ${colors.gray(`(${Date.now() - startTime}ms)`)}`)
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
		console.log(`test result: ${colors.bold(colors.red('failed'))}.  ${passed} passed; ${failed} failed;`)
	} else {
		console.log(`test result: ${colors.green('ok')}.  ${passed} passed; ${failed} failed;`)
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
		throw new asserts.AssertionError(reason)
	}

	function equal(v1: unknown, v2: unknown) {
		asserts.assertEquals(v1, v2)
	}

	async function error(errorProne: () => unknown, type?: unknown) {
		try {
			await errorProne()

			throw new asserts.AssertionError('Function did not error!')
		} catch (e) {
			if (e instanceof asserts.AssertionError) throw e

			if (type) {
				asserts.assertEquals(
					e,
					type,
					`Actual error did not match the expected one\n\nActual:\n${JSON.stringify(e)}\n\nExpected:\n${JSON.stringify(type)}`,
				)
			}
		}
	}

	return {
		failure,
		equal,
		error,
	}
}
