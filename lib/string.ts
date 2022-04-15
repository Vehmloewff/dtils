export function truncate(str: string, maxLength: number) {
	if (str.length > maxLength) return `${str.slice(0, maxLength - 1)}…`

	return str
}

export function regexReplace(string: string, regex: RegExp, replacer: (match: string, ...groups: string[]) => string) {
	const match = string.match(regex)
	if (!match) return string

	let resultString = ``

	while (string.length) {
		const match = string.match(regex)
		if (!match) {
			resultString += string
			string = ``
			continue
		}

		const completeMatch = match[0]
		const groups = match.slice(1)
		const newValue = replacer(completeMatch, ...groups)

		resultString += `${string.slice(0, match.index)}${newValue}`
		string = string.slice(match.index! + completeMatch.length)
	}

	return resultString
}
