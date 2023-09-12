import { BadParamsError } from './errors.ts'

export type SafeUnknownType = 'null' | 'string' | 'number' | 'bigint' | 'boolean' | 'array' | 'object' | 'function'

export class SafeUnknown {
	data: unknown
	#contextPath: string

	constructor(data: unknown, contextPath = '$') {
		this.data = data
		this.#contextPath = contextPath
	}

	getType(): SafeUnknownType {
		if (this.data === null) return 'null'
		if (typeof this.data === 'string') return 'string'
		if (typeof this.data === 'number') return 'number'
		if (typeof this.data === 'bigint') return 'bigint'
		if (typeof this.data === 'boolean') return 'boolean'
		if (Array.isArray(this.data)) return 'array'
		if (typeof this.data === 'object') return 'object'

		throw new Error(`Encountered undefined type in value "${this.data}"`)
	}

	isString(): boolean {
		return this.getType() === 'string'
	}

	asString(): string {
		if (!this.isString()) {
			throw new BadParamsError(`Expected data to be of type string, but found type ${this.getType()} at ${this.#contextPath}`)
		}

		// @ts-ignore check is above
		return this.data
	}

	isBoolean(): boolean {
		return this.getType() === 'boolean'
	}

	asBoolean(): boolean {
		if (!this.isBoolean()) {
			throw new BadParamsError(`Expected data to be of type boolean, but found type ${this.getType()} at ${this.#contextPath}`)
		}

		// @ts-ignore check is above
		return this.data
	}

	isNumber(): boolean {
		return this.getType() === 'number'
	}

	asNumber(): number {
		if (!this.isNumber()) {
			throw new BadParamsError(`Expected data to be of type number, but found type ${this.getType()} at ${this.#contextPath}`)
		}

		// @ts-ignore check is above
		return this.data
	}

	isNull(): boolean {
		return this.getType() === 'null'
	}

	asNull(): null {
		if (!this.isNull()) {
			throw new BadParamsError(`Expected data to be null, but found type ${typeof this.data} at ${this.#contextPath}`)
		}

		// @ts-ignore check is above
		return this.data
	}

	isArray(): boolean {
		return this.getType() === 'array'
	}

	asArray(): SafeUnknownArray {
		if (!this.isArray()) throw new Error(`Expected data to be an array, but found type ${this.getType()}`)

		// @ts-ignore check is above
		return new SafeUnknownArray(this.data)
	}

	isObject(): boolean {
		return this.getType() === 'object'
	}

	asObject(): SafeUnknownObject {
		if (!this.isObject()) throw new Error(`Expected data to be an object, but found type ${typeof this.data}`)

		// @ts-ignore check is above
		return new SafeUnknownObject(this.data)
	}
}

export class SafeUnknownObject {
	data: Record<string, unknown>
	#contextPath: string

	constructor(data: Record<string, unknown>, contextPath = '$') {
		this.data = data
		this.#contextPath = contextPath
	}

	/** Gets the value of a single key in the object. If the key doesn't exist, a `SafeUnknown` with `null` will be returned */
	getSingle(key: string): SafeUnknown {
		const value = this.data[key] ?? null

		return new SafeUnknown(value, `${this.#contextPath}.${key}`)
	}

	/** Gets the value of a single key in the object. If the key doesn't exist, an error is thrown */
	sureGetSingle(key: string): SafeUnknown {
		const value = this.data[key]
		if (value === undefined) throw new BadParamsError(`Expected to find a value for key "${key}" at ${this.#contextPath}`)

		return new SafeUnknown(value, `${this.#contextPath}.${key}`)
	}

	/**
	 * Gets the value of an object path in the object. If a key doesn't exist, a `SafeUnknown` with `null` will be returned. If a key gives null,
	 * either by it not existing, or it actually being null, a `SafeUnknown` with `null` is immediately returned.
	 *
	 * Examples:
	 *
	 * ```ts
	 * new SafeUnknownObject({ foo: null }).get('foo', 'bar', 'bin', 'baz').isNull() // true
	 * new SafeUnknownObject({}).get('foo').isNull() // true
	 * new SafeUnknownObject({}).get('foo', 'bar', 'bin', 'baz').isNull() // true
	 * new SafeUnknownObject({ foo: "hello" }).get('foo', 'bar', 'bin', 'baz') // Error: Expected data to be an object, but found type string at $.foo
	 * new SafeUnknownObject({ foo: { bar: { bin: { baz: "Hello" }}}}).asString() // "Hello"
	 * ```
	 */
	get(...keys: string[]): SafeUnknown {
		if (!keys.length) throw new Error('Expected at least 1 key to be provided')

		const firstKey = keys[0]
		const firstValue = this.getSingle(firstKey)

		if (firstValue.isNull() || keys.length === 1) return firstValue

		return firstValue.asObject().get(...keys.slice(1))
	}

	/**
	 * Gets the value of an object path in the object. If a key doesn't exist, an error is thrown. Unlike `get`, `null` is not
	 * immediately returned.
	 *
	 * Examples:
	 *
	 * ```ts
	 * new SafeUnknownObject({ foo: null }).sureGet('foo', 'bar', 'bin', 'baz') // Error: Expected data to be an object, but found type null at $.foo
	 * new SafeUnknownObject({}).sureGet('foo') // Error: Expected to find a value for key "foo" at $
	 * new SafeUnknownObject({}).sureGet('foo', 'bar', 'bin', 'baz').isNull() // Error: Expected to find a value for key "foo" at $
	 * new SafeUnknownObject({ foo: "hello" }).sureGet('foo', 'bar', 'bin', 'baz') // Error: Expected data to be an object, but found type string at $.foo
	 * new SafeUnknownObject({ foo: { bar: { bin: { baz: "Hello" }}}}).sureGet('foo', 'bar', 'bin', 'baz').asString() // "Hello"
	 * ```
	 */
	sureGet(...keys: string[]): SafeUnknown {
		if (!keys.length) throw new Error('Expected at least 1 key to be provided')

		const firstKey = keys[0]
		const firstValue = this.sureGetSingle(firstKey)

		if (keys.length === 1) return firstValue

		return firstValue.asObject().get(...keys.slice(1))
	}
}

export class SafeUnknownArray {
	data: unknown[]
	#contextPath: string

	constructor(data: unknown[], contextPath = '$') {
		this.data = data
		this.#contextPath = contextPath
	}

	/** Gets the value of a single index in the array. If the index doesn't exist, a `SafeUnknown` with `null` will be returned */
	get(index: number): SafeUnknown {
		const value = this.data[index] ?? null

		return new SafeUnknown(value, `${this.#contextPath}[${index}]`)
	}

	/** Gets the value of a single index in the array. If the index doesn't exist, an error is thrown */
	sureGet(index: number): SafeUnknown {
		const value = this.data[index]
		if (value === undefined) throw new BadParamsError(`Expected to find an item for index "${index}" at ${this.#contextPath}`)

		return new SafeUnknown(value, `${this.#contextPath}[${index}]`)
	}
}
