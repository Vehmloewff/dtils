export async function readStreamToFn<T>(stream: ReadableStream<T>, fn: (data: T) => void) {
	const reader = stream.getReader()

	while (true) {
		const res = await reader.read()
		if (res.done) break

		fn(res.value)
	}
}
