import { joinByteArrays } from '../binary.ts'
import { hexEncodingUtils } from '../deps.ts'

// @deno-types="./spark_md5.d.ts"
import SparkMd5 from './spark_md5.js'

export class Md5 {
	#spark = new SparkMd5()

	static hash(contents: Uint8Array | string): string {
		const string = typeof contents === 'string' ? contents : new TextDecoder().decode(contents)
		return SparkMd5.hash(string)
	}

	append(contents: Uint8Array | string): void {
		const string = typeof contents === 'string' ? contents : new TextDecoder().decode(contents)
		this.#spark.append(string)
	}

	get(): string {
		return this.#spark.end()
	}
}

export class Sha256 {
	#buff = new Uint8Array()

	static async hash(contents: Uint8Array | string): Promise<string> {
		const hash = new Sha256()
		await hash.append(contents)

		return hash.get()
	}

	async append(contents: Uint8Array | string): Promise<void> {
		const bytes = typeof contents === 'string' ? new TextEncoder().encode(contents) : contents
		const data = joinByteArrays(this.#buff, bytes)

		this.#buff = new Uint8Array(await crypto.subtle.digest('SHA-256', data))
	}

	get(): string {
		return new TextDecoder().decode(hexEncodingUtils.encode(this.#buff))
	}
}

export class Sha512 {
	#buff = new Uint8Array()

	static async hash(contents: Uint8Array | string): Promise<string> {
		const hash = new Sha256()
		await hash.append(contents)

		return hash.get()
	}

	async append(contents: Uint8Array | string): Promise<void> {
		const bytes = typeof contents === 'string' ? new TextEncoder().encode(contents) : contents
		const data = joinByteArrays(this.#buff, bytes)

		this.#buff = new Uint8Array(await crypto.subtle.digest('SHA-512', data))
	}

	get(): string {
		return new TextDecoder().decode(hexEncodingUtils.encode(this.#buff))
	}
}
