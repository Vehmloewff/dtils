import { asserts, porter } from './deps.ts'
import { FetchInput, FetchParams, SimplifiedFetchParams, simplifyFetchParams } from './fetch.ts'

async function getNativeSimplification(port: number, input: FetchInput, init: RequestInit) {
	let simplification: SimplifiedFetchParams | null = null

	const abortController = new AbortController()
	const server = Deno.serve({ port, signal: abortController.signal, onListen() {} }, async (request) => {
		simplification = {
			body: new Uint8Array(await request.arrayBuffer()),
			headers: request.headers,
			method: request.method,
			url: request.url,
		}

		return new Response('ok')
	})

	await fetch(input, init).then((res) => res.text())
	if (!simplification) throw new Error('Simplification should\'ve been set')

	abortController.abort()
	await server.finished

	return simplification
}

function buildSomeFormData() {
	const data = new FormData()

	data.append('whatever', new Blob(['hello, there'], { type: 'text/plain' }))
	data.append(
		'purely raw',
		new Blob([
			new Uint8Array([12, 13, 13, 5, 54, 123]),
			new Uint8Array([12, 13, 13, 5, 54, 123]),
		]),
	)

	return data
}

const port = await porter.getAvailablePort()
if (!port) throw new Error('Cannot find a port to use')

const base = `http://localhost:${port}`

const cases: (FetchParams & { message: string })[] = [
	{
		message: 'Simple simplifications work',
		input: `${base}/whatever`,
		init: {},
	},
	{
		message: 'Request urls are respected',
		input: new Request(`${base}/something`),
		init: {},
	},
	{
		message: 'Url URLS are respected',
		input: new URL('/chill', base),
		init: {},
	},
	{
		message: 'Double headers are handled naturally',
		input: new Request(`${base}/test`, { headers: { 'authentication': 'foo' } }),
		init: { headers: { 'authorization': 'fritz' } },
	},
	{
		message: 'Double method are handled naturally',
		input: new Request(`${base}`, { method: 'POST' }),
		init: { method: 'PUT' },
	},
	{
		message: 'String request body is respected',
		input: base,
		init: { method: 'POST', body: 'Whatever, man' },
	},
	{
		message: 'Null request body is respected',
		input: base,
		init: { method: 'POST', body: null },
	},
	{
		message: 'Url encoded request body is respected',
		input: base,
		init: { method: 'POST', body: new URLSearchParams({ whatever: 'man' }) },
	},
	{
		message: 'Empty form data request body is respected',
		input: base,
		init: { method: 'POST', body: new FormData() },
	},
	{
		message: 'Form data request body is respected',
		input: base,
		init: { method: 'POST', body: buildSomeFormData() },
	},
]

for (const testCase of cases) {
	Deno.test(`[simplifyFetch] ${testCase.message}`, async () => {
		const furtherSimplify = (simplified: SimplifiedFetchParams) => ({
			method: simplified.method,
			headers: [...simplified.headers.entries()],
			body: simplified.body,
			url: simplified.url,
		})

		const selfSimplified = await simplifyFetchParams(testCase)
		const httpSimplified = await getNativeSimplification(port, testCase.input, testCase.init)

		asserts.assertEquals(furtherSimplify(selfSimplified), furtherSimplify(httpSimplified))
	})
}
