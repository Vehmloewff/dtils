export async function readStreamToFn<T>(stream: ReadableStream<T>, fn: (data: T) => void): Promise<void> {
	const reader = stream.getReader()

	while (true) {
		const res = await reader.read()
		if (res.done) break

		fn(res.value)
	}
}

/** Collect the chunks of `stream` into an array */
export async function collectStream<T>(stream: ReadableStream<T>): Promise<T[]> {
	const chunks: T[] = []

	await readStreamToFn(stream, (chunk) => chunks.push(chunk))

	return chunks
}
