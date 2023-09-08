export function truncate(str: string, maxLength: number): string {
	if (str.length > maxLength) return `${str.slice(0, maxLength - 1)}…`

	return str
}

export function regexReplace(string: string, regex: RegExp, replacer: (match: string, ...groups: string[]) => string): string {
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

/** Concatenates two strings in such a way that path delimiter attacks cannot occur */
export function concatenate(sections: string[]): string {
	return sections.map((section) => section.replaceAll('\\', '\\\\').replaceAll('/', '\\/')).join('/')
}

/** Slices a string concatenated with `concat` into an array of sections */
export function sliceConcatenated(concatenated: string): string[] {
	const sections: string[] = []

	let isEscaped = false
	let currentSection = ''

	for (const char of concatenated.split('')) {
		if (isEscaped) {
			isEscaped = false
			currentSection += char

			continue
		}

		if (char === '\\') {
			isEscaped = true

			continue
		}

		if (char === '/') {
			sections.push(currentSection)
			currentSection = ''

			continue
		}

		currentSection += char
	}

	sections.push(currentSection)

	return sections
}
