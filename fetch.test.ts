import { FsCache } from './cache.ts'
import { asserts, porter } from './deps.ts'
import { cachingFetch, decodeResponse, encodeResponse, SimplifiedFetchParams, simplifyFetchParams } from './fetch.ts'
import { Md5 } from './mod.ts'
import { concatenate } from './string.ts'

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

Deno.test('Response encoding/decoding basically works', async () => {
	const response = decodeResponse(
		await encodeResponse(
			new Response('Hello there!', {
				status: 202,
				statusText: 'Custom Ok',
				headers: { 'x-cool': 'true' },
			}),
		),
	)

	asserts.assertEquals(await response.text(), 'Hello there!')
	asserts.assertEquals(response.status, 202)
	asserts.assertEquals(response.statusText, 'Custom Ok')
	asserts.assertEquals(response.headers.get('x-cool'), 'true')
})

Deno.test('cachingFetch caches fetches', async () => {
	const cache = new FsCache(concatenate([Md5.hash(import.meta.url), 'responses']))
	const trueBody = 'This is the real deal here'
	const port = await porter.getAvailablePort()
	const abortController = new AbortController()

	const server = Deno.serve({ port, onListen() {}, signal: abortController.signal }, () => {
		return new Response(trueBody)
	})

	const networkBody = await cachingFetch(cache, `http://localhost:${port}`).then((res) => res.text())
	asserts.assertEquals(networkBody, trueBody)

	abortController.abort()
	await server.finished

	const cacheBody = await cachingFetch(cache, `http://localhost:${port}/`).then((res) => res.text())
	asserts.assertEquals(cacheBody, trueBody)
})
