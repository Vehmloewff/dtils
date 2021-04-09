export function truncate(str: string, maxLength: number) {
	if (str.length > maxLength) return `${str.slice(0, maxLength - 1)}…`

	return str
}
