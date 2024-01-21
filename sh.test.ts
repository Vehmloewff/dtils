import { asserts } from './deps.ts'
import { execCaptureIncremental } from './sh.ts'

Deno.test("execCaptureIncremental doesn't fail or log anything extraneous", async () => {
	await execCaptureIncremental(['deno', 'run', 'sh.ts'], {
		onErrorLine() {
			throw new Error('There should never be any error lines')
		},
		onLogLine(line) {
			// the only reason this should be called is if deno is checking first
			asserts.assert(line.startsWith('Check'))
		},
	})
})

Deno.test('execCaptureIncremental throws and error if child fails', async () => {
	try {
		await execCaptureIncremental(['deno', 'run', 'something-that-not-exists'])
		throw new Error('Expected execCaptureIncremental to throw')
	} catch (_) {
		// it threw!
	}
})
