import { asserts } from './deps.ts'
import { collectStream } from './stream.ts'

const items = ['This', 'is', 'the', 'day', 'that the', 'Lord', 'has', 'made']

Deno.test('collectStream collects a stream', async () => {
	const stream = new ReadableStream<string>({
		start(controller) {
			for (const item of items) controller.enqueue(item)

			controller.close()
		},
	})

	asserts.assertEquals(await collectStream(stream), items)
})
