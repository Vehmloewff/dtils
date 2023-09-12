/**
 * A module of utilities related to the Web Fetch api
 *
 * @module
 */

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
