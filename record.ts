export class ManyMap<K, V> {
	#map = new Map<K, V[]>()

	add(key: K, value: V): void {
		const values = this.#map.get(key)

		if (!values) {
			this.#map.set(key, [value])
			return
		}

		values.push(value)
	}

	getValues(key: K): V[] {
		return this.#map.get(key) || []
	}

	clear(): void {
		this.#map.clear()
	}

	clearValues(key: K): void {
		this.#map.delete(key)
	}
}

export function mapRecord<KT extends string, IT, NT>(record: Record<KT, IT>, fn: (value: IT, key: string) => NT): Record<KT, NT> {
	// @ts-ignore all key constraints will be met in the mapping process
	const newRecord: Record<KT, NT> = {}

	for (const key in record) {
		const value = record[key]
		const newValue = fn(value, key)

		newRecord[key] = newValue
	}

	return newRecord
}
