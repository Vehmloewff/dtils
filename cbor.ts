import { cbor } from './deps.ts'

export function cborEncode(value: unknown): Uint8Array {
	return cbor.encode(value)
}

export function cborDecode(bytes: Uint8Array): unknown {
	return cbor.decode(bytes)
}
