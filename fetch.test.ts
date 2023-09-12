import { asserts } from './deps.ts'
import { SimplifiedFetchParams, simplifyFetchParams } from './fetch.ts'

const furtherSimplify = (simplified: SimplifiedFetchParams) => ({
	method: simplified.method,
	headers: [...simplified.headers.entries()],
	body: simplified.body,
	url: simplified.url,
})

Deno.test(`simplifyFetchParams does just that`, async () => {
	const selfSimplified = await simplifyFetchParams('https://example.com', {
		method: 'POST',
		body: 'Hello there!',
		headers: { 'x-whatever': 'be happy' },
	})

	asserts.assertEquals(
		furtherSimplify(selfSimplified),
		furtherSimplify({
			body: new TextEncoder().encode('Hello there!'),
			headers: new Headers({ 'x-whatever': 'be happy', 'content-type': 'text/plain;charset=UTF-8' }),
			method: 'POST',
			url: 'https://example.com/',
		}),
	)
})

Deno.test(`simplifyFetchParams simplifies even when the details are in the first argument`, async () => {
	const selfSimplified = await simplifyFetchParams(
		new Request('https://example.com', {
			method: 'POST',
			body: 'Hello there!',
			headers: { 'x-whatever': 'be happy' },
		}),
	)

	asserts.assertEquals(
		furtherSimplify(selfSimplified),
		furtherSimplify({
			body: new TextEncoder().encode('Hello there!'),
			headers: new Headers({ 'x-whatever': 'be happy', 'content-type': 'text/plain;charset=UTF-8' }),
			method: 'POST',
			url: 'https://example.com/',
		}),
	)
})
