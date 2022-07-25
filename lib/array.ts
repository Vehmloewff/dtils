export function arraysMatch<T>(a1: T[], a2: T[]): boolean {
	if (a1.length !== a2.length) return false

	let foundNoMatch = false

	for (const index in a1) {
		const v1 = a1[index]
		const v2 = a2[index]

		if (v1 !== v2) {
			foundNoMatch = true
			break
		}
	}

	return !foundNoMatch
}
