import { base64, pathUtils } from './deps.ts'
import { readBytes, writeBinary } from './fs.ts'
import { Md5 } from './mod.ts'
import { concatenate } from './string.ts'
import { joinByteArrays } from './binary.ts'

export class FsCache {
	#dir: string
	#encoder = new TextEncoder()
	#decoder = new TextDecoder()

	constructor(scope?: string) {
		const subDir = scope ?? getFallbackScope()
		this.#dir = pathUtils.join(getCacheDirectory(), subDir)
	}

	async set(key: string, content: string | Uint8Array): Promise<void> {
		const bytes = typeof content === 'string' ? this.#encoder.encode(content) : content
		await writeBinary(pathUtils.join(this.#dir, key), bytes)
	}

	async getString(key: string): Promise<string | null> {
		const bytes = await readBytes(key)
		if (!bytes) return null

		return this.#decoder.decode(bytes)
	}

	async getBytes(key: string): Promise<Uint8Array | null> {
		return await readBytes(pathUtils.join(this.#dir, key))
	}
}

export type FetchInput = URL | Request | string

export async function cachingFetch(input: FetchInput, init?: RequestInit): Promise<Response> {
	const url = getUrl(input)
	if (url.protocol === 'file:') return fetch(url)

	const key = concatenate([url.toString(), getHeadersString(input, init || {}), await getRequestBodyString(input, init || {})])

	return new Response()
}

function getUrl(input: FetchInput): URL {
	if (typeof input === 'string') return new URL(input)
	if (input instanceof Request) return new URL(input.url)

	return input
}

function getHeadersString(fetchInput: FetchInput, init: RequestInit) {
	const entries: string[][] = []

	if (fetchInput instanceof Request) entries.push(...fetchInput.headers.entries())
	if (init.headers) {
		if (init.headers instanceof Headers) entries.push(...init.headers.entries())
		else for (const key in init.headers) entries.push([key, init.headers[key as keyof RequestInit['headers']]])
	}

	return JSON.stringify(entries)
}

async function getRequestBodyString(fetchInput: FetchInput, init: RequestInit) {
	let stashedBody = ''

	if (fetchInput instanceof Request && fetchInput.body) stashedBody = concatenate([stashedBody, await readBytesIntoString(fetchInput.body)])

	const body = init.body
	if (!body) return stashedBody

	if (typeof body === 'string') stashedBody = concatenate([stashedBody, body])
	else if (body instanceof ReadableStream) stashedBody = concatenate([stashedBody, await readBytesIntoString(body)])
	else if (body instanceof ArrayBuffer) stashedBody = concatenate([stashedBody, base64.encode(body)])
	else if (isBufferView(body)) stashedBody = concatenate([stashedBody, base64.encode(body.buffer)])
	else if (body instanceof Blob) stashedBody = concatenate([stashedBody, base64.encode(await body.arrayBuffer())])
	else stashedBody = concatenate([stashedBody, JSON.stringify(body.entries())])

	return stashedBody
}

function isBufferView(value: unknown): value is ArrayBufferView {
	// @ts-ignore manual checks are below
	const buffer = value.buffer
	if (!buffer) return false

	return buffer instanceof ArrayBuffer
}

async function readBytesIntoString(stream: ReadableStream<Uint8Array>) {
	const reader = stream.getReader()
	if (!reader) throw new Error('Failed to get a reader for stream')

	let bytes = new Uint8Array()

	while (true) {
		const data = await reader.read()
		if (data.done) break

		bytes = joinByteArrays(bytes, data.value)
	}

	reader.releaseLock()

	return base64.encode(bytes.buffer)
}

function getFallbackScope() {
	return Md5.hash(Deno.mainModule)
}

function getCacheDirectory() {
	const home = Deno.env.get('HOME')
	if (!home) throw new Error('Could not detect users HOME directory')

	return pathUtils.join(home, '.cache', 'stash_cache')
}
