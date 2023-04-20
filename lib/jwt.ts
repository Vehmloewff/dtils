import * as jwt from 'https://deno.land/x/djwt@v2.8/mod.ts'
import * as base64 from 'https://deno.land/std@0.184.0/encoding/base64.ts'

const algorithmData = {
	name: 'HMAC',
	hash: 'SHA-512',
} as const

export class JwtProducer<T> {
	#cryptoKey: CryptoKey

	constructor(cryptoKey: CryptoKey) {
		this.#cryptoKey = cryptoKey
	}

	async create(lifetime: number, data: T) {
		return await jwt.create({ alg: 'HS512', typ: 'JWT' }, { exp: Date.now() + lifetime, data }, this.#cryptoKey)
	}

	async verify(token: string): Promise<T | null> {
		try {
			const { data } = await jwt.verify(token, this.#cryptoKey)

			return data as T
		} catch (_) {
			return null
		}
	}

	static async from<T>(secret: string) {
		const key = await crypto.subtle.importKey('raw', base64.decode(secret), algorithmData, false, ['sign', 'verify'])

		return new this<T>(key)
	}
}

export async function generateJwtSecret() {
	const key = await crypto.subtle.generateKey(
		algorithmData,
		true,
		['sign', 'verify'],
	)

	const bytes = await crypto.subtle.exportKey('raw', key as CryptoKey)

	return base64.encode(bytes)
}

export function getTokenInformation<T>(token: string) {
	const [_, payload, __] = jwt.decode(token)

	// @ts-ignore payload should always be on the payload
	const data = payload.data
	if (!data) throw new Error('Expected JWT to have a data property')

	// @ts-ignore payload should include an expiration time
	const expiration = payload.exp
	if (!expiration) throw new Error('Expected JWT to have an "exp" property')

	return { data: data as T, expiration: expiration as number }
}
