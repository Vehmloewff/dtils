import { fixedStartDigits } from './number.ts'

function extractPrettyTimezone(date: Date) {
	const res = /\((.*)\)/.exec(date.toString())
	if (!res) throw new Error(`A weird error occurred whilst getting the timezone`)
	return res[1]
}

function negativeOrPositiveSign(num: number): string {
	if (num >= 0) return '+' + num
	return String(num)
}

export const weekdaysAbbr = [`Mon`, `Tue`, `Wed`, `Thu`, `Fri`, `Sat`, `Sun`]
export const weekdays = [`Monday`, `Tuesday`, `Wednesday`, `Thursday`, `Friday`, `Saturday`, `Sunday`]
export const monthsAbbr = [`Jan`, `Feb`, `Mar`, `Apr`, `May`, `Jun`, `Jul`, `Aug`, `Sep`, `Nov`, `Dec`]
export const months = [`January`, `February`, `March`, `April`, `May`, `June`, `July`, `August`, `September`, `November`, `December`]

export function getYear(date: Date): number {
	return date.getFullYear()
}

export function getShortYear(date: Date): number {
	return Number(String(getYear(date)).slice(-2))
}

export function getShortMonth(date: Date): string {
	return monthsAbbr[date.getMonth()]
}

export function getMonth(date: Date): string {
	return months[date.getMonth()]
}

export function getMonthDigits(date: Date): number {
	return date.getMonth() + 1
}

export function getDate(date: Date): number {
	return date.getDate()
}

export function getShortWeekday(date: Date): string {
	return weekdaysAbbr[date.getDay()]
}

export function getWeekday(date: Date): string {
	return weekdays[date.getDay()]
}

export function getAMP(date: Date): string {
	return (date.getHours() >= 12 ? 'PM' : 'AM')
}

export function isAM(date: Date): boolean {
	return date.getHours() >= 12
}

export function getHours(date: Date): number {
	return (date.getHours() > 12 ? date.getHours() - 12 : date.getHours())
}

export function get24StyleHours(date: Date): number {
	return date.getHours()
}

export function getMinutes(date: Date): number {
	return date.getMinutes()
}

export function getSeconds(date: Date): number {
	return date.getSeconds()
}

export function getMilliseconds(date: Date): number {
	return date.getMilliseconds()
}

export function getTimezone(date: Date): string {
	return `${extractPrettyTimezone(date)} (GMT${negativeOrPositiveSign(date.getTimezoneOffset())}min)`
}

/**
 * Format `date` using the specified `pattern`.
 *
 * ```ts
 * formatDate(new Date(), 'm/d/yy') // -> 2/3/21
 * ```
 *
 * Special characters are:
 *
 * - `d`: Day of the month as digits; no leading zero for single-digit days.
 *
 * - `dd`: Day of the month as digits; leading zero for single-digit days.
 *
 * - `ddd`: Day of the week as a three-letter abbreviation.
 *
 * - `dddd`: Day of the week as its full name.
 *
 * - `m`: Month as digits; no leading zero for single-digit months.
 *
 * - `mm`: Month as digits; leading zero for single-digit months.
 *
 * - `mmm`: Month as a three-letter abbreviation.
 *
 * - `mmmm`: Month as its full name.
 *
 * - `yy`: Year as last two digits; leading zero for years less than 10.
 *
 * - `yyyy`: Year represented by four digits.
 *
 * - `h`: Hours; no leading zero for single-digit hours (12-hour clock).
 *
 * - `hh`: Hours; leading zero for single-digit hours (12-hour clock).
 *
 * - `H`: Hours; no leading zero for single-digit hours (24-hour clock).
 *
 * - `HH`: Hours; leading zero for single-digit hours (24-hour clock).
 *
 * - `M`: Minutes; no leading zero for single-digit minutes.
 *
 * - `MM`: Minutes; leading zero for single-digit minutes.
 *
 * - `s`: Seconds; no leading zero for single-digit seconds.
 *
 * - `ss`: Seconds; leading zero for single-digit seconds.
 *
 * - `l`: Milliseconds; 3 digits
 *
 * - `L`: Milliseconds; 2 digits.
 *
 * - `t`: Lowercase, single-character time marker string: a or p.
 *
 * - `tt`: Lowercase, two-character time marker string: am or pm.
 *
 * - `T`: Uppercase, single-character time marker string: A or P.
 *
 * - `TT`: Uppercase, two-character time marker string: AM or PM.
 */
export function formatDate(date: Date, pattern: string): string {
	if (pattern.slice(0, 4) === 'UTC:') date.getTimezoneOffset()

	return pattern
		// day
		.replace(/dddd/g, getWeekday(date))
		.replace(/ddd/g, getShortWeekday(date))
		.replace(/dd/g, fixedStartDigits(getDate(date), 2))
		.replace(/d/g, fixedStartDigits(getDate(date), null))
		// month
		.replace(/mmmm/g, getMonth(date))
		.replace(/mmm/g, getShortMonth(date))
		.replace(/mm/g, fixedStartDigits(getMonthDigits(date), 2))
		.replace(/m/g, fixedStartDigits(getMonthDigits(date), null))
		// year
		.replace(/yyyy/g, String(getYear(date)))
		.replace(/yy/g, String(getShortYear(date)))
		// hour
		.replace(/hh/g, fixedStartDigits(getHours(date), 2))
		.replace(/h/g, fixedStartDigits(getHours(date), null))
		.replace(/HH/g, fixedStartDigits(get24StyleHours(date), 2))
		.replace(/H/g, fixedStartDigits(get24StyleHours(date), null))
		// minutes
		.replace(/MM/g, fixedStartDigits(getMinutes(date), 2))
		.replace(/M/g, fixedStartDigits(getMinutes(date), null))
		// seconds
		.replace(/ss/g, fixedStartDigits(getSeconds(date), 2))
		.replace(/s/g, fixedStartDigits(getSeconds(date), null))
		// milliseconds
		.replace(/l/g, fixedStartDigits(getMilliseconds(date), 3))
		.replace(/L/g, fixedStartDigits(getMilliseconds(date), 2))
		// AM/PM
		.replace(/tt/g, isAM(date) ? 'am' : 'pm')
		.replace(/t/g, isAM(date) ? 'a' : 'p')
		.replace(/TT/g, isAM(date) ? 'AM' : 'PM')
		.replace(/T/g, isAM(date) ? 'A' : 'P')
}
