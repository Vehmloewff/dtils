import { asserts } from './deps.ts'
import { FsCache } from './cache.ts'

Deno.test('FsCache can get and set strings', async () => {
	const key = 'some key'
	const value = 'some value'
	const cache = new FsCache()

	await cache.clear()
	await cache.set(key, value)

	asserts.assertEquals(await cache.getString(key), value)
})

Deno.test('FsCache can get and set bytes', async () => {
	const key = 'some key'
	const value = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20])
	const cache = new FsCache()

	await cache.clear()
	await cache.set(key, value)

	asserts.assertEquals(await cache.getBytes(key), value)
})

Deno.test('FsCache can list keys', async () => {
	const keys = ['key1', 'key2', 'key3', 'key4', 'key5']

	const cache = new FsCache()
	await cache.clear()

	for (const key of keys) await cache.set(key, crypto.randomUUID())

	const sortKeys = (keys: string[]) => keys.sort((a, b) => a.localeCompare(b))

	asserts.assertEquals(sortKeys(await cache.list()), sortKeys(keys))
})
