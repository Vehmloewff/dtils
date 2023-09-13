import { BadParamsError, isBadParamsError, isForbiddenError, isNotAuthenticatedError, isNotFoundError, isUserError } from './errors.ts'
import { machineNameRegex } from './regex.ts'

export function errorToResponse(error: unknown): Response {
	if (isForbiddenError(error)) return new Response(error.message, { status: 403 })
	if (isNotAuthenticatedError(error)) return new Response(error.message, { status: 401 })
	if (isBadParamsError(error)) return new Response(error.message, { status: 400 })
	if (isNotFoundError(error)) return new Response(error.message, { status: 404 })
	if (isUserError(error)) return new Response(error.message, { status: 400 })

	console.error(error)

	return new Response('Internal error has occurred', { status: 500 })
}

export class ExpectantQuery {
	params: URLSearchParams

	constructor(params: URLSearchParams) {
		this.params = params
	}

	get(name: string): string {
		const value = this.params.get(name)
		if (!value) throw new BadParamsError(`Expected the "${name}" query param to be set`)

		return value
	}

	static from(raw: string): ExpectantQuery {
		return new this(new URLSearchParams(raw))
	}
}

/** @deprecated Use `SafeUnknown` instead */
export class JsonBody {
	body: unknown

	constructor(body: unknown) {
		this.body = body
	}

	static async from(request: Request): Promise<JsonBody> {
		return new this(await request.json())
	}

	getValue(key: string): unknown {
		if (!this.body || typeof this.body !== 'object') throw new Error('Expected body to be an object')
		if (Array.isArray(this.body)) throw new Error('Expected body to be an object')

		// @ts-ignore type check is below
		const value = this.body[key]
		if (value === undefined) throw new BadParamsError(`Expected a "${key}" property in body`)

		return value
	}

	getMachineName(key: string): string {
		const value = this.getString(key)
		if (!machineNameRegex.test(value)) {
			throw new BadParamsError(
				`Expected property "${key}" to be a machine readable name, matching the following regex: ${machineNameRegex}`,
			)
		}

		return value
	}

	getString(key: string): string {
		const value = this.getValue(key)
		if (typeof value !== 'string') throw new BadParamsError(`Expected "${key}" to be of type string, but found "${typeof value}"`)

		return value
	}

	static async fromResponse(response: Response): Promise<JsonBody> {
		return new this(await response.json())
	}
}
