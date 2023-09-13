import { asserts } from './deps.ts'
import { collectStream } from './stream.ts'

const items = ['This', 'is', 'the', 'day', 'that the', 'Lord', 'has', 'made']

Deno.test('readStreamToFn reads a stream to the fn', async () => {
	const stream = new ReadableStream<string>({
		start(controller) {
			for (const item of items) controller.enqueue(item)

			controller.close()
		},
	})

	let index = 0
	await readStreamToFn(stream, (item) => {
		asserts.assertEquals(item, items[index])

		index++
	})

	// The reason why we don't do `items.length - 1` here is because index is incremented after the last item assertion
	asserts.assertEquals(index, items.length)
})

Deno.test('collectStream collects a stream', async () => {
	const stream = new ReadableStream<string>({
		start(controller) {
			for (const item of items) controller.enqueue(item)

			controller.close()
		},
	})

	asserts.assertEquals(await collectStream(stream), items)
})
