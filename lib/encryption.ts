// A quick note about symmetric keys.  The string returned is the counter + the key.
// The first 16 bytes are the counter, the remaining 128 are the actual key.
//
// There are three types of keys:
// - symmetric keys (for encrypting and decrypting content with the same key)
// - asymmetric encryption keys (for encrypting and decrypting content with public and private keys)
// - asymmetric signing keys (for signing and verifying content with public and private keys)
//
// Each key has a "label".  The label is separated from the key by `::`.  The labels for each type
// of key are defined below:
// - symmetric: `aes`
// - asymmetric encryption:
//   - private key: `rsa:`
//   - public key: `rsa:pub`
// - asymmetric signing:
//   - private key: `ec:private`
//   - public key: `ec:pub`

import { base64 } from '../deps.ts'

type ParsedKey = ParsedSymmetricKey | ParsedAsymmetricKey

interface ParsedSymmetricKey {
	algorithm: 'aes'
	keyBytes: Uint8Array
	counterBytes: Uint8Array
}

interface ParsedAsymmetricKey {
	algorithm: 'rsa' | 'ec'
	keyBytes: Uint8Array
	isPrivate: boolean
}

const parseKey = (key: string): ParsedKey => {
	const [label, internalKey] = key.split('::')
	if (!internalKey) throw new Error('Improperly formatted key.  Expected a label at the beginning of the key')

	const [algorithm, type] = label.split(':')

	if (algorithm === 'aes') {
		const contentBytes = base64.decode(internalKey)
		const counterBytes = contentBytes.slice(0, 16)
		const keyBytes = contentBytes.slice(16)

		return {
			algorithm,
			counterBytes,
			keyBytes,
		}
	}

	if (algorithm === 'rsa' || algorithm === 'ec') {
		const isPrivate = (() => {
			if (!type) throw new Error(`Expected a type on ${algorithm} keys`)

			if (type === 'priv') return true
			if (type === 'pub') return false

			throw new Error('Expected a type of either "pub", or "priv"')
		})()

		return {
			algorithm,
			isPrivate,
			keyBytes: base64.decode(internalKey),
		}
	}

	throw new Error('Unknown algorithm.  Expected "aes", "rsa", or "ec"')
}

const stringifyKey = (parsedKey: ParsedKey) => {
	if (parsedKey.algorithm === 'aes') {
		const joinedBytes = joinByteMaps(parsedKey.counterBytes, parsedKey.keyBytes)

		return `${parsedKey.algorithm}::${base64.encode(joinedBytes)}`
	}

	const type = parsedKey.isPrivate ? 'priv' : 'pub'

	return `${parsedKey.algorithm}:${type}::${base64.encode(parsedKey.keyBytes)}`
}

const getAesAlgorithmData = (counter: Uint8Array): AesCtrParams => ({
	name: 'AES-CTR',
	counter,
	length: 128,
})

const importAesKey = (keyData: ParsedSymmetricKey, usages: KeyUsage[]) => {
	if (keyData.counterBytes.length !== 16) throw new Error("`key` is an invalid aes symmetric key.  It doesn't have the right counter")

	return crypto.subtle.importKey('raw', keyData.keyBytes, getAesAlgorithmData(keyData.counterBytes), false, usages)
}

const getRsaAlgorithmData = (): RsaHashedKeyGenParams => ({
	name: 'RSA-OAEP',
	modulusLength: 4096,
	publicExponent: new Uint8Array([1, 0, 1]),
	hash: 'SHA-256',
})

const importRsaKey = (keyData: ParsedAsymmetricKey, usages: KeyUsage[]) => {
	return crypto.subtle.importKey(keyData.isPrivate ? 'pkcs8' : 'spki', keyData.keyBytes, getRsaAlgorithmData(), false, usages)
}

const getEcAlgorithmData = (): EcdsaParams & EcKeyGenParams => ({
	name: 'ECDSA',
	namedCurve: 'P-384',
	hash: 'SHA-256',
})

const importEcKey = (keyData: ParsedAsymmetricKey, usages: KeyUsage[]) => {
	return crypto.subtle.importKey(keyData.isPrivate ? 'pkcs8' : 'spki', keyData.keyBytes, getEcAlgorithmData(), false, usages)
}

const joinByteMaps = (map1: Uint8Array, map2: Uint8Array) => {
	const joined = new Uint8Array(map1.length + map2.length)

	for (let index = 0; index < map1.length; index++) joined[index] = map1[index]
	for (let index = 0; index < map2.length; index++) joined[index + map1.length - 1] = map2[index]

	return joined
}

/** Symmetricly encrypts bytes using `key` */
export async function encrypt(key: string, plainBytes: Uint8Array) {
	const keyData = parseKey(key)

	if (keyData.algorithm === 'aes') {
		const cryptoKey = await importAesKey(keyData, ['encrypt'])

		const encryptedBuff = await crypto.subtle.encrypt(getAesAlgorithmData(keyData.counterBytes), cryptoKey, plainBytes)
		return new Uint8Array(encryptedBuff)
	}

	if (keyData.algorithm === 'rsa') {
		const cryptoKey = await importRsaKey(keyData, ['encrypt'])

		const encryptedBuff = await crypto.subtle.encrypt(getRsaAlgorithmData(), cryptoKey, plainBytes)
		return new Uint8Array(encryptedBuff)
	}

	throw new Error('Elliptic Curve algorithms cannot encrypt/decrypt.  They are for signing/verifying.')
}

/** Symmetricly decrypts bytes using `key` */
export async function decrypt(key: string, encryptedBytes: Uint8Array) {
	const keyData = parseKey(key)

	if (keyData.algorithm === 'aes') {
		const cryptoKey = await importAesKey(keyData, ['decrypt'])

		const plainBuff = await crypto.subtle.decrypt(getAesAlgorithmData(keyData.counterBytes), cryptoKey, encryptedBytes)
		return new Uint8Array(plainBuff)
	}

	if (keyData.algorithm === 'rsa') {
		const cryptoKey = await importRsaKey(keyData, ['decrypt'])

		const plainBuff = await crypto.subtle.decrypt(getRsaAlgorithmData(), cryptoKey, encryptedBytes)
		return new Uint8Array(plainBuff)
	}

	throw new Error('Elliptic Curve algorithms cannot encrypt/decrypt.  They are for signing/verifying.')
}

/** Creates a digital signature using a key pair */
export async function sign(privateKey: string, data: Uint8Array) {
	const privateKeyData = parseKey(privateKey)
	if (privateKeyData.algorithm === 'aes') throw new Error(`Private key is of algorithm ${privateKeyData}`)

	const cryptoKey = await importEcKey(privateKeyData, ['sign'])

	const signatureBuff = await crypto.subtle.sign(getEcAlgorithmData(), cryptoKey, data)
	return base64.encode(signatureBuff)
}

/** Verifies that `signature` is from the private key corresponding to `publicKey` */
export async function verify(signature: string, publicKey: string, data: Uint8Array) {
	const publicKeyData = parseKey(publicKey)

	if (publicKeyData.algorithm !== 'ec')
		throw new Error(`Public key is of algorithm ${publicKeyData.algorithm} and does not support verifying signatures`)
	if (publicKeyData.isPrivate) throw new Error(`publicKey is a private key`)

	const signatureBytes = base64.decode(signature)
	const cryptoKey = await importEcKey(publicKeyData, ['verify'])

	return await crypto.subtle.verify(getEcAlgorithmData(), cryptoKey, signatureBytes, data)
}

/** Generates an encryption key for symmetric encryptions using the AES algorithm */
export async function generateKey() {
	const counterBytes = crypto.getRandomValues(new Uint8Array(16))
	const algorithm = getAesAlgorithmData(counterBytes)

	const cryptoKey = await crypto.subtle.generateKey(algorithm, true, ['encrypt'])
	const keyBytes = new Uint8Array(await crypto.subtle.exportKey('raw', cryptoKey))

	return stringifyKey({
		algorithm: 'aes',
		counterBytes,
		keyBytes,
	})
}

export interface KeyPair {
	privateKey: string
	publicKey: string
}

/** Generates an asymmetric key pair for signing or encryption purposes */
export async function generateKeyPair(algorithm: 'rsa' | 'ec'): Promise<KeyPair> {
	const usages: KeyUsage[] =
		algorithm === 'rsa'
			? ['encrypt', 'decrypt'] // So weird, but I have to set both usages in here.  Just 'encrypt' fails...
			: ['sign']

	const pair = await crypto.subtle.generateKey(algorithm === 'rsa' ? getRsaAlgorithmData() : getEcAlgorithmData(), true, usages)

	const publicKeyBytes = new Uint8Array(await crypto.subtle.exportKey('spki', pair.publicKey))
	const privateKeyBytes = new Uint8Array(await crypto.subtle.exportKey('pkcs8', pair.privateKey))

	const publicKey = stringifyKey({ algorithm, isPrivate: false, keyBytes: publicKeyBytes })
	const privateKey = stringifyKey({ algorithm, isPrivate: true, keyBytes: privateKeyBytes })

	return { privateKey, publicKey }
}

/** Generates a key pair for asymmetric encryptions using the RSA algorithm */
export async function generateEncryptionKeyPair() {
	return await generateKeyPair('rsa')
}

/** Generates a key pair for asymmetric signings using the EC algorithm */
export async function generateSigningKeyPair(): Promise<KeyPair> {
	return await generateKeyPair('ec')
}

/** Hashes a password into a symmetric encryption key for encryptions using the AES algorithm */
export async function hashPassword(password: string, salt: string) {
	const textEncoder = new TextEncoder()

	const passwordBytes = textEncoder.encode(password)
	const saltBytes = textEncoder.encode(salt)

	const importedKey = await crypto.subtle.importKey('raw', passwordBytes, 'PBKDF2', false, ['deriveBits'])

	const derivation = await crypto.subtle.deriveBits(
		{
			name: 'PBKDF2',
			hash: 'SHA-256',
			salt: saltBytes,
			iterations: 100000,
		},
		importedKey,
		16 * 8
	)

	const keyBytes = new Uint8Array(derivation)
	const counterBytes = keyBytes.slice(0, 16)

	return stringifyKey({
		algorithm: 'aes',
		counterBytes,
		keyBytes,
	})
}
