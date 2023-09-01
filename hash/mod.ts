import { joinByteArrays } from '../binary.ts'
import { hexEncodingUtils } from '../deps.ts'

// @deno-types="./spark_md5.d.ts"
import SparkMd5 from './spark_md5.js'

/**
 * A utility for creating an Md5 hash from a string or Uint8Array.
 *
 * ```ts
 * Md5.hash("Hello!") // 952d2c56d0485958336747bcdd98590d
 * ```
 *
 * Incremental hashing is also supported:
 *
 * ```ts
 * const md5 = new Md5()
 *
 * md5.append("Hello")
 * md5.append("World!")
 *
 * md5.get() // 06e0e6637d27b2622ab52022db713ce2
 * ```
 */
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

/**
 * A utility for creating an Sha256 hash from a string or Uint8Array.
 *
 * ```ts
 * await Sha256.hash("Hello!") // 334d016f755cd6dc58c53a86e183882f8ec14f52fb05345887c8a5edd42c87b7
 * ```
 *
 * Incremental hashing is also supported:
 *
 * ```ts
 * const sha = new Sha256()
 *
 * sha.append("Hello")
 * sha.append("World!")
 *
 * sha.get() // d5c49b74a17cc9fbedf02aec7f3f87bdeab2ab5233ac7ef49a8bbb66ce77f8f4
 * ```
 */
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

/**
 * A utility for creating an Sha512 hash from a string or Uint8Array.
 *
 * ```ts
 * await Sha512.hash("Hello!") // 3a928aa2cc3bf291a4657d1b51e0e087dfb1dea060c89d20776b8943d24e712ea65778fe608ddaee0a191bc6680483ad12be1f357389a2380f660db246be5844
 * ```
 *
 * Incremental hashing is also supported:
 *
 * ```ts
 * const sha = new Sha512()
 *
 * await sha.append("Hello")
 * await sha.append("World!")
 *
 * sha.get() // c9754d63f472cd8cc34e07e9d33a489216215eed87ed516d216581b47cba9f940413a32a342cc1062e003e21fa2800e16516eaa33c227c34374484a0bbe1bb96
 * ```
 */
export class Sha512 {
	#buff = new Uint8Array()

	static async hash(contents: Uint8Array | string): Promise<string> {
		const hash = new Sha512()
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
