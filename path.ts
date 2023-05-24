export interface MatchPathResult {
	params: Record<string, string | number>
	query: Record<string, boolean | string | number>
}

/**
 * @example
 * matchPath('/user/{id}/method/{action}/request', '/user/23/method/create/request?timeout=40&hurry')
 * // ->
 * {
 *     params: {
 *         id: 23,
 *         action: 'create'
 *     },
 *     query: {
 *         timeout: 40,
 *         hurry: true,
 *     }
 * }
 */
export function matchPath(pattern: string, path: string): MatchPathResult | null {
	const result: MatchPathResult = { params: {}, query: {} }

	// Remove the first slashes
	if (!pattern.startsWith('/')) throw new Error('`pattern` must start with a slash')
	else pattern = pattern.slice(1)
	if (!path.startsWith('/')) throw new Error('`path` must start with a slash')
	else path = path.slice(1)

	// Parse the query and take it off the path
	const extractedAndLeftovers = extractQuery(path)
	path = extractedAndLeftovers.path
	result.query = parseQuery(extractedAndLeftovers.query)

	// Take care of the empty string cases
	if (!pattern.length && !path.length) return result
	else if (!pattern.length) return null
	else if (!path.length) return null

	// Make sure they don't end with a slash
	if (pattern.endsWith('/')) throw new Error('`pattern` must not end with a slash')
	if (path.endsWith('/')) throw new Error('`path` must not end with a slash')

	// Split them into sections
	const patternSections = pattern.split('/')
	const pathSections = path.split('/')

	// If the sections are not the same length, there is no way there can be a match
	if (patternSections.length !== pathSections.length) return null

	// Walk through the sections at the same time
	for (const index in patternSections) {
		const patternSection = patternSections[index]
		const pathSection = pathSections[index]
		// If we have a parameter, extract it.  Sections can be different here
		if (patternSection.startsWith('{') && patternSection.endsWith('}')) {
			const key = patternSection.slice(1, -1)
			const value = pathSection
			result.params[key] = tryNumber(value)
		} // Otherwise, there is not a parameter.  Sections must match.
		// If they don't exit the function prematurely
		else if (patternSection !== pathSection) return null
	}

	return result
}

function tryNumber(maybeNum: string): number | string {
	const num = Number(maybeNum)

	if (isNaN(num)) return maybeNum
	return num
}

function extractQuery(path: string): { query: string; path: string } {
	const sections = path.split('?')
	if (sections.length > 2) throw new Error(`Multiple '?' characters found in path`)

	return {
		path: sections[0],
		query: sections[1] || '',
	}
}

/**
 * Parses a string of query string parameters */
export function parseQuery(queryString: string): Record<string, boolean | string | number> {
	const result: Record<string, boolean | string | number> = {}

	if (!queryString.length) return result
	if (queryString.startsWith('?')) queryString = queryString.slice(1)

	queryString.split('&').forEach((kvPair) => {
		if (!kvPair.length) return

		const [key, value] = kvPair.split('=')

		// If there is no value for a key, it is automatically `true`
		if (!value) result[key] = true
		else result[key] = tryNumber(value)
	})

	return result
}
