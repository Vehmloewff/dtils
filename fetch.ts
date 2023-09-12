/**
 * A module of utilities related to the Web Fetch api
 *
 * @module
 */

// import { join } from 'https://deno.land/std@0.201.0/path/join.ts'
// import { joinByteArrays } from './binary.ts'
// import { collectStream } from './stream.ts'

export interface SimplifiedFetchParams {
	method: string
	headers: Headers
	body: Uint8Array
	url: string
}

export type FetchInput = URL | Request | string

export interface FetchParams {
	input: FetchInput
	init: RequestInit
}

export async function simplifyFetchParams(params: FetchParams): Promise<SimplifiedFetchParams> {
	const request = new Request(params.input, params.init)

	// const url = getUrl(params)
	// const headers = getHeaders(params, url)
	// const body = await getBody(params, headers)
	// const method = getMethod(params)

	return {
		body: new Uint8Array(await request.arrayBuffer()),
		headers: request.headers,
		method: request.method,
		url: request.url,
	}
}

// export function mergeHeaders(...headerBlocks: Headers[]): Headers {
// 	const joinedHeaders = new Headers()

// 	for (const headerBlock of headerBlocks) {
// 		for (const [key, value] of headerBlock) joinedHeaders.append(key, value)
// 	}

// 	return joinedHeaders
// }

// function getMethod(params: FetchParams) {
// 	if (params.init.method) return params.init.method
// 	if (params.input instanceof Request) return params.input.method

// 	return 'GET'
// }

// function getUrl(params: FetchParams): string {
// 	if (typeof params.input === 'string') return new URL(params.input).toString()
// 	if (params.input instanceof Request) return params.input.url

// 	return params.input.toString()
// }

// function getHeaders(params: FetchParams, url: string) {
// 	const baseHeaders = new Headers()

// 	baseHeaders.append('accept', '*/*')
// 	baseHeaders.append('accept-encoding', 'gzip, br')
// 	baseHeaders.append('accept-language', '*')
// 	baseHeaders.append('host', new URL(url).host)
// 	baseHeaders.append('user-agent', `Deno/${Deno.version.deno}`)

// 	if (params.init.headers) {
// 		if (params.init.headers instanceof Headers) return mergeHeaders(baseHeaders, params.init.headers)

// 		const headers = new Headers()
// 		for (const key in params.init.headers) headers.append(key, params.init.headers[key as keyof RequestInit['headers']])

// 		return mergeHeaders(baseHeaders, headers)
// 	}

// 	if (params.input instanceof Request) return mergeHeaders(baseHeaders, params.input.headers)

// 	return baseHeaders
// }

// async function getBody(params: FetchParams, modifiableHeaders: Headers) {
// 	// const request = await new Request()
// 	const normalizeBody = async (body: BodyInit) => {
// 		if (typeof body === 'string') return new TextEncoder().encode(body)
// 		if (body instanceof Blob) return new Uint8Array(await body.arrayBuffer())
// 		if (body instanceof ArrayBuffer) return new Uint8Array(body)
// 		if (isBufferView(body)) return new Uint8Array(body.buffer)
// 		if (body instanceof FormData) {
// 			const blob = formDataToBlob(body)
// 			modifiableHeaders.append('content-type', blob.type)

// 			return new Uint8Array(await blob.arrayBuffer())
// 		}
// 		if (body instanceof URLSearchParams) return new TextEncoder().encode(body.toString())
// 		if (body instanceof ReadableStream) return joinByteArrays(...await collectStream(body))

// 		throw new Error('Unknown body type in `init` param')
// 	}

// 	if (params.init.body) {
// 		const bytes = await normalizeBody(params.init.body)
// 		modifiableHeaders.append('content-length', bytes.length.toString())

// 		return bytes
// 	}

// 	if (params.input instanceof Request) {
// 		const bytes = new Uint8Array(await params.input.arrayBuffer())
// 		modifiableHeaders.append()
// 	}

// 	return new Uint8Array()
// }

// function isBufferView(value: unknown): value is ArrayBufferView {
// 	// @ts-ignore manual checks are below
// 	const buffer = value.buffer
// 	if (!buffer) return false

// 	return buffer instanceof ArrayBuffer
// }

// /** Convert form data to a blob */
// export function formDataToBlob(formData: FormData): Blob {
// 	// Ported from https://github.com/denoland/deno/blob/08d2a32060a66e47dcccd99428d2ad13d7af29a9/ext/fetch/21_formdata.js#L296-L337

// 	const ESCAPE_FILENAME_PATTERN = new RegExp(/\r?\n|\r/g)
// 	const ESCAPE_PATTERN = new RegExp(/([\n\r"])/g)
// 	const FORM_DATA_SERIALIZE_PATTERN = new RegExp(/\r(?!\n)|(?<!\r)\n/g)
// 	const CRLF = '\r\n'
// 	const ESCAPE_MAP = { '\n': '%0A', '\r': '%0D', '"': '%22' }

// 	const escape = (str: string, isFilename = false) => {
// 		const preEscaped = isFilename ? str : str.replace(ESCAPE_FILENAME_PATTERN, '\r\n')

// 		return preEscaped.replace(
// 			ESCAPE_PATTERN,
// 			// @ts-ignore c will always be a key of ESCAPE_MAP because ESCAPE_PATTERN will only match a key in escape map
// 			(c) => ESCAPE_MAP[c],
// 		)
// 	}

// 	const boundary = `${Math.random()}${Math.random()}`
// 		.replaceAll('.', '')
// 		.slice(-28)
// 		.padStart(32, '-')

// 	const chunks = []
// 	const prefix = `--${boundary}\r\nContent-Disposition: form-data; name="`

// 	for (const { 0: name, 1: value } of formData) {
// 		if (typeof value === 'string') {
// 			chunks.push(
// 				prefix + escape(name) + '"' + CRLF + CRLF +
// 					value.replace(
// 						FORM_DATA_SERIALIZE_PATTERN,
// 						CRLF,
// 					) + CRLF,
// 			)
// 		} else {
// 			chunks.push(
// 				prefix + escape(name) + `"; filename="${escape(value.name, true)}"` +
// 					CRLF +
// 					`Content-Type: ${value.type || 'application/octet-stream'}\r\n\r\n`,
// 				value,
// 				CRLF,
// 			)
// 		}
// 	}

// 	chunks.push(`--${boundary}--`)

// 	return new Blob(chunks, {
// 		type: 'multipart/form-data; boundary=' + boundary,
// 	})
// }
