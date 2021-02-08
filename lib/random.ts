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
