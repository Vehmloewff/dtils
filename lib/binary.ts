export function binaryToString(binary: Uint8Array) {
	return new TextDecoder().decode(binary)
}

export function stringToBinary(string: string) {
	return new TextEncoder().encode(string)
}
