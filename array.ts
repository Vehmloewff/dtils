/** Returns true if arrays are found to match in a shallow-equal test */
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

/** Prepends new items onto items */
export function prepend<T>(items: T[], newItems: T[]): void {
	if (!newItems.length) return

	// loop through array backwards and unshift each element on
	for (let index = newItems.length - 1; index >= 0; index--) items.unshift(newItems[index])
}
