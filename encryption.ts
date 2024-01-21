// A quick note about symmetric keys.  The string returned is the counter + the key.
// The first 16 bytes are the counter, the remaining 16 are the actual key.
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

import { base64 } from './deps.ts'
import { joinByteArrays } from './binary.ts'

interface ParsedSymmetricKey {
	keyBytes: Uint8Array
	counterBytes: Uint8Array
}

interface ParsedAsymmetricKey {
	keyBytes: Uint8Array
	isPrivate: boolean
}

const parseSymmetricKeyBytes = (bytes: Uint8Array): ParsedSymmetricKey => {
	const counterBytes = bytes.slice(0, 16)
	const keyBytes = bytes.slice(16)

	return { keyBytes, counterBytes }
}

const prepareAesKeyBytes = (counterBytes: Uint8Array, keyBytes: Uint8Array) => {
	return joinByteArrays(counterBytes, keyBytes)
}

const getAesAlgorithmData = (counter: Uint8Array): AesCtrParams => ({
	name: 'AES-CTR',
	counter,
	length: 128,
})

const importAesKey = (keyData: ParsedSymmetricKey, usages: KeyUsage[]) => {
	if (keyData.counterBytes.length !== 16) throw new Error("`key` is an invalid aes symmetric key.  It doesn't have a 16 byte counter")
	if (keyData.keyBytes.length !== 16) {
		throw new Error("`key` is an invalid aes symmetric key. It doesn't have a 16 byte section for the true key")
	}

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
	namedCurve: 'P-256',
	hash: 'SHA-256',
})

const importEcKey = (keyData: ParsedAsymmetricKey, usages: KeyUsage[]) => {
	return crypto.subtle.importKey(keyData.isPrivate ? 'pkcs8' : 'spki', keyData.keyBytes, getEcAlgorithmData(), false, usages)
}

/**  Symmetrically encrypt bytes using `keyBytes`, which must be an AES key, with a 16 byte counter prepended  */
export async function encryptSymmetricallyWithBytes(keyBytes: Uint8Array, plainBytes: Uint8Array): Promise<Uint8Array> {
	const keyData = parseSymmetricKeyBytes(keyBytes)
	const cryptoKey = await importAesKey(keyData, ['encrypt'])

	const encryptedBuff = await crypto.subtle.encrypt(getAesAlgorithmData(keyData.counterBytes), cryptoKey, plainBytes)
	return new Uint8Array(encryptedBuff)
}

/** Symmetrically encrypt bytes using `key`, which must be a base64 encoded AES key and prepended 16 byte counter */
export async function encryptSymmetrically(key: string, plainBytes: Uint8Array): Promise<Uint8Array> {
	return await encryptSymmetricallyWithBytes(base64.decode(key), plainBytes)
}

/** Symmetrically decrypt bytes using `keyBytes`, which must be an AES key, with a 16 byte counter prepended */
export async function decryptSymmetricallyUsingBytes(keyBytes: Uint8Array, encryptedBytes: Uint8Array): Promise<Uint8Array> {
	const keyData = parseSymmetricKeyBytes(keyBytes)
	const cryptoKey = await importAesKey(keyData, ['decrypt'])

	const plainBuff = await crypto.subtle.decrypt(getAesAlgorithmData(keyData.counterBytes), cryptoKey, encryptedBytes)
	return new Uint8Array(plainBuff)
}

/** Symmetrically decrypt bytes using `key`, which must be a base64 encoded AES key and prepended 16 byte counter */
export async function decryptSymmetrically(key: string, encryptedBytes: Uint8Array): Promise<Uint8Array> {
	return await decryptSymmetricallyUsingBytes(base64.decode(key), encryptedBytes)
}

/** Asymmetrically decrypt `encryptedBytes` using `privateKeyBytes`. Function will error if `privateKeyBytes` is not an RSA public key */
export async function decryptAsymmetricallyUsingBytes(privateKeyBytes: Uint8Array, encryptedBytes: Uint8Array): Promise<Uint8Array> {
	const cryptoKey = await importRsaKey({ isPrivate: true, keyBytes: privateKeyBytes }, ['decrypt'])

	const plainBuff = await crypto.subtle.decrypt(getRsaAlgorithmData(), cryptoKey, encryptedBytes)
	return new Uint8Array(plainBuff)
}

/** Asymmetrically decrypt `encryptedBytes` using a base64 encoded `privateKey`. Function will error if `privateKey` is not an RSA private key */
export async function decryptAsymmetrically(privateKey: string, encryptedBytes: Uint8Array): Promise<Uint8Array> {
	return await decryptAsymmetricallyUsingBytes(base64.decode(privateKey), encryptedBytes)
}

/** Asymmetrically encrypt `plainBytes` using `publicKeyBytes`. Function will error if `publicKeyBytes` is not an RSA public key */
export async function encryptAsymmetricallyUsingBytes(publicKeyBytes: Uint8Array, plainBytes: Uint8Array): Promise<Uint8Array> {
	const cryptoKey = await importRsaKey({ isPrivate: false, keyBytes: publicKeyBytes }, ['encrypt'])

	const encryptedBuff = await crypto.subtle.encrypt(getRsaAlgorithmData(), cryptoKey, plainBytes)
	return new Uint8Array(encryptedBuff)
}

/** Asymmetrically encrypt `plainBytes` using a base64 encoded `publicKey`. Function will error if `publicKey` is not an RSA public key */
export async function encryptAsymmetrically(publicKey: string, plainBytes: Uint8Array): Promise<Uint8Array> {
	return await encryptAsymmetricallyUsingBytes(base64.decode(publicKey), plainBytes)
}

/**
 * Creates a digital signature using an EC private key. Note: function will error if the key passed
 * in is not a private key */
export async function signUsingBytes(privateKeyBytes: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
	const cryptoKey = await importEcKey({ isPrivate: true, keyBytes: privateKeyBytes }, ['sign'])
	const signatureBuff = await crypto.subtle.sign(getEcAlgorithmData(), cryptoKey, data)

	return new Uint8Array(signatureBuff)
}

/**
 * Creates a digital signature using a base64 encoded EC private key. Note: function will error if the key passed
 * in is not a private key */
export async function sign(privateKey: string, data: Uint8Array): Promise<string> {
	return base64.encode(await signUsingBytes(base64.decode(privateKey), data))
}

/**
 * Verifies that `signature` is from the EC private key corresponding to `publicKey`. Function will error if `publicKey`
 * is not an EC public key */
export async function verifyUsingBytes(signatureBytes: Uint8Array, publicKeyBytes: Uint8Array, data: Uint8Array): Promise<boolean> {
	const cryptoKey = await importEcKey({ isPrivate: false, keyBytes: publicKeyBytes }, ['verify'])

	return await crypto.subtle.verify(getEcAlgorithmData(), cryptoKey, signatureBytes, data)
}

/**
 * Verifies that `signature` is from the EC private key corresponding to `publicKey`. Function will error if `publicKey`
 * is not a base64 encoded EC public key */
export async function verify(signature: string, publicKey: string, data: Uint8Array): Promise<boolean> {
	return await verifyUsingBytes(base64.decode(signature), base64.decode(publicKey), data)
}

/** Generates an encryption key for symmetric encryptions using the AES algorithm */
export async function generateKeyBytes(): Promise<Uint8Array> {
	const counterBytes = crypto.getRandomValues(new Uint8Array(16))
	const algorithm = getAesAlgorithmData(counterBytes)

	const cryptoKey = await crypto.subtle.generateKey(algorithm, true, ['encrypt'])
	const keyBytes = new Uint8Array(await crypto.subtle.exportKey('raw', cryptoKey))

	return prepareAesKeyBytes(counterBytes, keyBytes)
}

/** Generates a base64 encoded encryption key for symmetric encryptions using the AES algorithm */
export async function generateKey(): Promise<string> {
	return base64.encode(await generateKeyBytes())
}

export interface KeyPairBytes {
	privateKey: Uint8Array
	publicKey: Uint8Array
}

/** Generates an asymmetric key pair for signing or encryption purposes */
export async function generateKeyPairBytes(algorithm: 'rsa' | 'ec'): Promise<KeyPairBytes> {
	const usages: KeyUsage[] = algorithm === 'rsa'
		? ['encrypt', 'decrypt'] // So weird, but I have to set both usages in here.  Just 'encrypt' fails...
		: ['sign']

	const pair = await crypto.subtle.generateKey(algorithm === 'rsa' ? getRsaAlgorithmData() : getEcAlgorithmData(), true, usages)

	const publicKeyBytes = new Uint8Array(await crypto.subtle.exportKey('spki', pair.publicKey))
	const privateKeyBytes = new Uint8Array(await crypto.subtle.exportKey('pkcs8', pair.privateKey))

	return { privateKey: privateKeyBytes, publicKey: publicKeyBytes }
}

export interface KeyPair {
	privateKey: string
	publicKey: string
}

/** Generates an asymmetric, base64 encoded key pair for signing or encryption purposes */
export async function generateKeyPair(algorithm: 'rsa' | 'ec'): Promise<KeyPair> {
	const { privateKey, publicKey } = await generateKeyPairBytes(algorithm)

	return { privateKey: base64.encode(privateKey), publicKey: base64.encode(publicKey) }
}

/** Generates a key pair for asymmetric encryptions using the RSA algorithm */
export async function generateEncryptionKeyPairBytes(): Promise<KeyPairBytes> {
	return await generateKeyPairBytes('rsa')
}

/** Generates a base64 encoded key pair for asymmetric encryptions using the RSA algorithm */
export async function generateEncryptionKeyPair(): Promise<KeyPair> {
	return await generateKeyPair('rsa')
}

/** Generates a key pair for asymmetric signings using the EC algorithm */
export async function generateSigningKeyPairBytes(): Promise<KeyPairBytes> {
	return await generateKeyPairBytes('ec')
}

/** Generates a base64 encoded key pair for asymmetric signings using the EC algorithm */
export async function generateSigningKeyPair(): Promise<KeyPair> {
	return await generateKeyPair('ec')
}

/** Hashes a password into a symmetric encryption key for encryptions using the AES algorithm */
export async function hashPasswordBytes(passwordBytes: Uint8Array, saltBytes: Uint8Array): Promise<Uint8Array> {
	const importedKey = await crypto.subtle.importKey('raw', passwordBytes, 'PBKDF2', false, ['deriveBits'])

	const derivation = await crypto.subtle.deriveBits(
		{
			name: 'PBKDF2',
			hash: 'SHA-256',
			salt: saltBytes,
			iterations: 100000,
		},
		importedKey,
		16 * 8,
	)

	const keyBytes = new Uint8Array(derivation)
	const counterBytes = keyBytes.slice(0, 16)

	return prepareAesKeyBytes(counterBytes, keyBytes)
}

/**
 * Hashes a password into a symmetric encryption key for encryptions using the AES algorithm. Function assumes that
 * password and salt are utf characters, not base64 */
export async function hashPassword(password: string, salt: string): Promise<string> {
	const textEncoder = new TextEncoder()
	const passwordBytes = textEncoder.encode(password)
	const saltBytes = textEncoder.encode(salt)

	return base64.encode(await hashPasswordBytes(passwordBytes, saltBytes))
}
