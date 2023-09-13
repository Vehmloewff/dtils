// deno-lint-ignore no-explicit-any
export type Json = any

/** @deprecated Use `SafeUnknown` instead of validators */
export interface StringDescriptor {
	type: 'string'
	values?: string[]
}

/** @deprecated Use `SafeUnknown` instead of validators */
export interface NumberDescriptor {
	type: 'number'
	min?: number
	max?: number
	/** @default false */
	forbidDecimals?: boolean
	/** @default false */
	canBeNaN?: boolean
}

/** @deprecated Use `SafeUnknown` instead of validators */
export interface NullDescriptor {
	type: 'null'
}

/** @deprecated Use `SafeUnknown` instead of validators */
export interface BooleanDescriptor {
	type: 'boolean'
}

/** @deprecated Use `SafeUnknown` instead of validators */
export interface ArrayDescriptor {
	type: 'array'
	keyType: JsonDescriptor
	maxLength?: number
	minLength?: number
}

/** @deprecated Use `SafeUnknown` instead of validators */
export interface ObjectDescriptor {
	type: 'object'
	/** Either `keys` or `valueType` must be specified */
	keys?: {
		[key: string]: JsonDescriptor
	}
	/**
	 * The key can be anything, but the value must match this.
	 * Either `keys` or `valueType` must be specified
	 */
	valueType?: JsonDescriptor
}

/** @deprecated Use `SafeUnknown` instead of validators */
export interface AnyDescriptor {
	type: 'any'
}

/** @deprecated Use `SafeUnknown` instead of validators */
export interface TypeChoiceDescriptor {
	type: 'choice'
	options: JsonDescriptor[]
}

/** @deprecated Use `SafeUnknown` instead of validators */
export type JsonDescriptor =
	| NullDescriptor
	| StringDescriptor
	| NumberDescriptor
	| BooleanDescriptor
	| ArrayDescriptor
	| ObjectDescriptor
	| AnyDescriptor
	| TypeChoiceDescriptor

/** @deprecated Use `SafeUnknown` instead of validators */
export interface ValidatorError {
	message: string
	path: string
}

/** @deprecated Use `SafeUnknown` instead of validators */
export interface ValidatorResultOk {
	ok: true
}
/** @deprecated Use `SafeUnknown` instead of validators */
export interface ValidatorResultNotOk {
	ok: false
	errors: ValidatorError[]
}

/** @deprecated Use `SafeUnknown` instead of validators */
export type ValidatorResult = ValidatorResultOk | ValidatorResultNotOk

/** @deprecated Use `SafeUnknown` instead of validators */
export function validateJson(descriptor: JsonDescriptor, json: Json): ValidatorResult {
	interface ValidatorResultOk {
		ok: true
	}
	interface ValidatorResultNotOk {
		ok: false
		errors: ValidatorError[]
	}

	type ValidatorResult = ValidatorResultOk | ValidatorResultNotOk

	const ok = (): ValidatorResultOk => ({ ok: true })
	const notOk = (errors: ValidatorError[]): ValidatorResultNotOk => ({ ok: false, errors })

	const getIdKeyFormat = (path: string, key: string) => path + (/[a-zA-Z_$][a-zA-Z0-9_$]*/.test(key) ? `.${key}` : `['${key}']`)

	function getCorrectValidator(descriptor: JsonDescriptor) {
		let validator: null | ((value: Json, path: string) => ValidatorResult) = null

		if (descriptor.type === 'null') validator = (value, path) => validateNull(value, descriptor, path)
		else if (descriptor.type === 'string') validator = (value, path) => validateString(value, descriptor, path)
		else if (descriptor.type === 'number') validator = (value, path) => validateNumber(value, descriptor, path)
		else if (descriptor.type === 'boolean') validator = (value, path) => validateBoolean(value, descriptor, path)
		else if (descriptor.type === 'array') validator = (value, path) => validateArray(value, descriptor, path)
		else if (descriptor.type === 'object') validator = (value, path) => validateObject(value, descriptor, path)
		else if (descriptor.type === 'any') validator = (value, path) => validateAny(value, descriptor, path)
		else validator = (value, path) => validateChoice(value, descriptor, path)

		return validator
	}

	function validateNull(value: Json, _descriptor: NullDescriptor, path: string): ValidatorResult {
		if (value === null || value === undefined) return ok()
		return notOk([{ message: `Expected null, but got: ${value}`, path }])
	}

	function validateString(value: Json, descriptor: StringDescriptor, path: string): ValidatorResult {
		if (typeof value !== 'string') return notOk([{ message: `Expected a string, but got: '${value}'`, path }])

		if (!descriptor.values) return ok()

		if (descriptor.values.indexOf(value) === -1) {
			return notOk([
				{
					message: `Expected one of the following values: ${
						descriptor.values
							.map((i) => `'${i}'`)
							.join(', ')
					}, but found '${value}'`,
					path,
				},
			])
		}

		return ok()
	}

	function validateNumber(value: Json, descriptor: NumberDescriptor, path: string): ValidatorResult {
		if (typeof value !== 'number') return notOk([{ message: `Expected a number, but got: '${value}'`, path }])

		if (isNaN(value)) {
			if (descriptor.canBeNaN) return ok()
			else return notOk([{ message: `NaN is not allowed`, path }])
		}

		if (descriptor.min !== undefined && value < descriptor.min) {
			return notOk([{ message: `Value was ${value}, lower than the minimum of ${descriptor.min}`, path }])
		}
		if (descriptor.max !== undefined && value > descriptor.max) {
			return notOk([{ message: `Value was ${value}, greater than the maximum of ${descriptor.max}`, path }])
		}

		if (descriptor.forbidDecimals && String(value).indexOf('.') !== -1) {
			return notOk([{ message: `Decimal numbers are not allowed`, path }])
		}

		return ok()
	}

	function validateBoolean(value: Json, _descriptor: BooleanDescriptor, path: string): ValidatorResult {
		if (typeof value !== 'boolean') return notOk([{ message: `Expected a boolean, but got: ${value}`, path }])
		return ok()
	}

	function validateArray(value: Json, descriptor: ArrayDescriptor, path: string): ValidatorResult {
		if (!Array.isArray(value)) return notOk([{ message: `Expected an array, but got: ${value}`, path }])

		if (descriptor.minLength !== undefined && value.length < descriptor.minLength) {
			return notOk([{ message: `Array length was ${value}, lower than the minimum length of ${descriptor.minLength}`, path }])
		}
		if (descriptor.maxLength !== undefined && value.length > descriptor.maxLength) {
			return notOk([{ message: `Array length was ${value}, greater than the maximum length of ${descriptor.maxLength}`, path }])
		}

		const errors: ValidatorError[] = []
		const validator = getCorrectValidator(descriptor.keyType)

		value.forEach((item, index) => {
			const res = validator(item, `${path}[${index}]`)
			if (!res.ok) errors.push(...res.errors)
		})

		if (errors.length) return notOk(errors)
		return ok()
	}

	function validateObject(value: Json, descriptor: ObjectDescriptor, path: string): ValidatorResult {
		if (typeof value !== 'object' || Array.isArray(value) || value === null || typeof value === 'undefined') {
			return notOk([{ message: `Expected an object, but found: ${value}`, path }])
		}

		// Keys and value types must match
		if (descriptor.keys) {
			const errors: ValidatorError[] = []
			const uncheckedValueKeys = Object.keys(value)

			Object.keys(descriptor.keys).forEach((key) => {
				if (!descriptor.keys) throw new Error(`What was... wasn't...`)

				const index = uncheckedValueKeys.indexOf(key)
				if (index === -1) return errors.push({ message: `Property '${key}' was expected, but not found`, path })
				uncheckedValueKeys.splice(index, 1)

				const newPath = getIdKeyFormat(path, key)
				const res = getCorrectValidator(descriptor.keys[key])(value[key], newPath)

				if (!res.ok) errors.push(...res.errors)
			})

			uncheckedValueKeys.forEach((key) => errors.push({ message: `Property '${key}' is not allowed here`, path }))

			if (errors.length) return notOk(errors)
			return ok()
		} // Each key must match this descriptor
		else if (descriptor.valueType) {
			const validator = getCorrectValidator(descriptor.valueType)
			const errors: ValidatorError[] = []

			Object.keys(value).forEach((key) => {
				const item = value[key]
				const newPath = getIdKeyFormat(path, key)

				const res = validator(item, newPath)

				if (!res.ok) errors.push(...res.errors)
				return ok()
			})

			if (errors.length) return notOk(errors)
			return ok()
		} // Object is expected to be empty
		else {
			if (Object.keys(value).length) return notOk([{ message: `Expected object to be empty`, path }])
			return ok()
		}
	}

	function validateAny(_value: Json, _descriptor: AnyDescriptor, _path: string): ValidatorResult {
		return ok()
	}

	function validateChoice(value: Json, descriptor: TypeChoiceDescriptor, path: string): ValidatorResult {
		if (!descriptor.options.length) return ok()

		const errors: ValidatorError[] = []

		for (const typeDescriptor of descriptor.options) {
			const res = getCorrectValidator(typeDescriptor)(value, path)

			if (!res.ok) errors.push(...res.errors)
			else return res
		}

		return notOk([
			{ message: `Did not match any of the types expected: ${descriptor.options.map((t) => t.type).join(', ')}`, path },
			...errors,
		])
	}

	const res = getCorrectValidator(descriptor)(json, '')

	// Remove the first dot on some of the paths and return
	if (res.ok) return res
	return {
		ok: false,
		errors: res.errors.map((error) => {
			if (error.path.startsWith('.')) error.path = error.path.slice(1)
			return error
		}),
	}
}

/** @deprecated Will be removed in next major release. Use `jsonDecode` instead */
// deno-lint-ignore ban-types
export function jsonParse(json: string, fallback: {} | [] | null = null): Json {
	if (!json.length) return json
	if (json.startsWith('"') && json.endsWith('"')) return json.slice(1, -1)
	if (json === 'true') return true
	if (json === 'false') return false
	if (json === 'null' || json === 'undefined') return null
	if ((json.startsWith('{') && json.endsWith('}')) || (json.startsWith('[') && json.endsWith(']'))) {
		try {
			return JSON.parse(json)
		} catch (e) {
			if (!fallback) {
				e.raw = json
				throw e
			}
			console.warn(`Failed to parse JSON.  Resorting to fallback.  DUMP:`, e, json)
			return fallback
		}
	}

	const numTry = Number(json)
	if (!isNaN(numTry)) return numTry

	return json
}

/** @deprecated Will be removed in next major release. Use `jsonEncode` instead */
export function jsonStringify(data: Json, spacer = ''): string {
	return JSON.stringify(data, undefined, spacer)
}

/**
 * Parse json.
 *
 * Wraps the native implementation, the difference being that primitives are parsed at the top level
 * (i.e. `jsonParse("null")`) is valid */
export function jsonDecode(json: string): unknown {
	json = json.trim()

	if (!json.length) throw new Error('Expected a json primitive, object, or array, but found nothing')
	if (json.startsWith('"') && json.endsWith('"')) return json.slice(1, -1)
	if (json === 'true') return true
	if (json === 'false') return false
	if (json === 'null' || json === 'undefined') return null
	if ((json.startsWith('{') && json.endsWith('}')) || (json.startsWith('[') && json.endsWith(']'))) {
		try {
			return JSON.parse(json)
		} catch (error) {
			throw new Error(`Failed to parse json. ${error.message} ... Dump: "${json}"`)
		}
	}

	const numTry = Number(json)
	if (!isNaN(numTry)) return numTry

	throw new Error(`Expected a json primitive, object, or array, but found: "${json}"`)
}

/** Stringify json with an optional spacer. Wraps the native implementation */
export function jsonEncode(data: unknown, spacer = ''): string {
	return JSON.stringify(data, undefined, spacer)
}
