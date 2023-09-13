/** Read 1stream` into `fn`, calling `fn` for every chunk. If `fn` returns a promise, it will be awaited */
export async function readStreamToFn<T>(stream: ReadableStream<T>, fn: (data: T) => unknown): Promise<void> {
	const reader = stream.getReader()

	while (true) {
		const res = await reader.read()
		if (res.done) break

		await fn(res.value)
	}
}

/** Collect the chunks of `stream` into an array */
export async function collectStream<T>(stream: ReadableStream<T>): Promise<T[]> {
	const chunks: T[] = []

	await readStreamToFn(stream, (chunk) => chunks.push(chunk))

	return chunks
}
