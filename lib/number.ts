import { repeat } from './loop.ts'

/**
 * Sets the amount of zeros before a number.  If `digits` is `null`, there will be no extra digits in front of the number
 */
export function fixedStartDigits(number: number, digits: number | null): string {
	if (!digits) return String(number)

	const str = String(number)
	if (str.length < digits) return `${multiplyString(`0`, digits - str.length)}${str}`
	else return str
}

export function multiplyString(string: string, number: number): string {
	let str = ``

	repeat(number, () => (str += string))

	return str
}

export function wrap(num: number, min: number, max: number) {
	if (min < 0) throw new Error('max must be greater than 0')
	if (min >= max) throw new Error('max must be greater than min')

	while (num < min || num > max) {
		if (num > max) num = num - max
		if (num < min) num = num + max
	}

	return num
}
