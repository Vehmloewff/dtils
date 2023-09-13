/**
 * A module of utilities related to the Web Fetch api
 *
 * @module
 */

import { FsCache } from './cache.ts'
import { cborDecode, cborEncode } from './cbor.ts'
import { base64 } from './deps.ts'
import { jsonEncode } from './json.ts'
import { SafeUnknown } from './safe_unknown.ts'
import { concatenate } from './string.ts'

export interface SimplifiedFetchParams {
	method: string
	headers: Headers
	body: Uint8Array
	url: string
}

export type FetchInput = URL | Request | string

export async function simplifyFetchParams(input: FetchInput, init: RequestInit = {}): Promise<SimplifiedFetchParams> {
	const request = new Request(input, init)

	return {
		body: new Uint8Array(await request.arrayBuffer()),
		headers: request.headers,
		method: request.method,
		url: request.url,
	}
}

export async function cachingFetch(cache: FsCache, input: FetchInput, init?: RequestInit): Promise<Response> {
	const params = await simplifyFetchParams(input, init)
	const url = new URL(params.url)

	if (url.protocol === 'file:') return fetch(url)

	const headersString = jsonEncode([...params.headers.entries()].sort((a, b) => a[0].localeCompare(b[0])))
	const key = concatenate([params.method, url.toString(), headersString, base64.encode(params.body)])

	const cacheEntry = await cache.getBytes(key)
	if (cacheEntry) return decodeResponse(cacheEntry)

	const encoded = await encodeResponse(await fetch(input, init))
	await cache.set(key, encoded)

	return decodeResponse(encoded)
}

export async function encodeResponse(response: Response): Promise<Uint8Array> {
	const status = response.status
	const statusText = response.statusText
	const redirected = response.redirected
	const url = response.url
	const headers = [...response.headers.entries()]
	const body = new Uint8Array(await response.arrayBuffer())

	return cborEncode({ status, statusText, redirected, url, headers, body })
}

export function decodeResponse(bytes: Uint8Array): Response {
	const unknown = new SafeUnknown(cborDecode(bytes)).asObject()

	const status = unknown.get('status').asNumber()
	const statusText = unknown.get('statusText').asString()
	const redirected = unknown.get('redirected').asBoolean()
	const url = unknown.get('url').asString()
	const headers = unknown.get('headers').asArray().map((header) => [header.asArray().get(0).asString(), header.asArray().get(1).asString()])
	const body = unknown.get('body').asBytes()

	const response = new Response(body, { status, statusText, headers })

	Object.defineProperty(response, 'url', { value: url })
	Object.defineProperty(response, 'redirected', { value: redirected })

	return response
}
