/**
 * Chooses a random item from the array and returns it
 */
export function chooseRandArrItem<T>(arr: T[]): T {
	if (!arr.length) throw new Error(`Cannot choose a random item from an empty array!`)

	return arr[randomNumber(0, arr.length - 1)]
}

/**
 * Returns a random number between `min` and `max` (both included)
 */
export function randomNumber(min: number, max: number): number {
	if (max < min) throw new Error(`Cannot choose a random number: 'max' is less than 'min'`)
	if (max === min) return max

	return Math.floor(Math.random() * (max - min + 1)) + min
}

export function chooseArrItemFromString<T>(str: string, arr: T[]): T {
	if (!arr.length) throw new Error(`Array is empty.  No items to choose from`)
	if (arr.length === 1) return arr[0]

	const num = getHash(str, 0, arr.length - 1)
	return arr[num]
}

const chars = '0123456789abcdefghijklmnopqrstuvwxyz'.split('')
export function getHash(str: string, min: number, max: number) {
	min = Math.round(min)
	max = Math.round(max)
	if (min >= max) throw new Error(`After rounding to the nearest whole number, max was not greater than min`)

	let num = min

	btoa(str)
		.split('')
		.forEach((char) => {
			if (char === '=') return

			char = char.toLowerCase()

			const index = chars.indexOf(char)
			if (index === -1) throw new Error(`Unrecognized char: ${char}`)

			num = num + index

			if (num > max) num = num - max
		})

	while (num > max) num = num - max

	return num
}
