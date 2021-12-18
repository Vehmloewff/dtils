import * as io from 'https://deno.land/std@0.118.0/io/mod.ts'
import * as streams from 'https://deno.land/std@0.118.0/streams/mod.ts'

export async function readBody(request: Request) {
	if (!request.body) throw new Error('no request body')

	const bodyLines: string[] = []

	const reader = streams.readerFromStreamReader(request.body.getReader())

	for await (const line of io.readLines(reader)) bodyLines.push(line)

	return bodyLines.join('\n')
}

export async function readJsonBody(request: Request) {
	return JSON.parse(await readBody(request))
}
