export function binaryToString(binary: Uint8Array): string {
	return new TextDecoder().decode(binary)
}

export function stringToBinary(string: string): Uint8Array {
	return new TextEncoder().encode(string)
}

export function getTotalByteLength(byteArrays: Uint8Array[]): number {
	let length = 0

	for (const bytes of byteArrays) length += bytes.length

	return length
}

export function joinByteArrays(...byteArrays: Uint8Array[]): Uint8Array {
	const totalCount = getTotalByteLength(byteArrays)
	const joined = new Uint8Array(totalCount)

	let soFar = 0

	byteArrays.forEach((bytes) => {
		bytes.forEach((byte) => {
			joined[soFar] = byte
			soFar++
		})
	})

	return joined
}
