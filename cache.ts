import { pathUtils } from './deps.ts'
import { readBytes, writeBinary } from './fs.ts'
import { Md5 } from './mod.ts'

export class FsCache {
	#dir: string
	#encoder = new TextEncoder()
	#decoder = new TextDecoder()

	constructor(scope?: string) {
		const subDir = scope ?? getFallbackScope()
		this.#dir = pathUtils.join(getCacheDirectory(), subDir)
	}

	/** Set a cache entry at `key`. Entry can be either a string or plain bytes */
	async set(key: string, content: string | Uint8Array): Promise<void> {
		const bytes = typeof content === 'string' ? this.#encoder.encode(content) : content
		await writeBinary(pathUtils.join(this.#dir, key), bytes)
	}

	/** Get cache entry `key` as a string */
	async getString(key: string): Promise<string | null> {
		const bytes = await readBytes(key)
		if (!bytes) return null

		return this.#decoder.decode(bytes)
	}

	/** Get a cache entry `key` as bytes */
	async getBytes(key: string): Promise<Uint8Array | null> {
		return await readBytes(pathUtils.join(this.#dir, key))
	}

	/** Removes all entries under `scope` in cache dir */
	async clear(): Promise<void> {
		for await (const file of Deno.readDir(this.#dir)) await Deno.remove(pathUtils.join(this.#dir, file.name))
	}
}

function getFallbackScope() {
	return Md5.hash(Deno.mainModule)
}

function getCacheDirectory() {
	const home = Deno.env.get('HOME')
	if (!home) throw new Error('Could not detect users HOME directory')

	return pathUtils.join(home, '.cache', 'fs_cache')
}
