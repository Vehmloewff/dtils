import { BadParamsError, isBadParamsError, isForbiddenError, isNotAuthenticatedError, isNotFoundError, isUserError } from './errors.ts'
import { Json } from './json.ts'

// deno-lint-ignore no-explicit-any
export function errorToResponse(error: any) {
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

	get(name: string) {
		const value = this.params.get(name)
		if (!value) throw new BadParamsError(`Expected the "${name}" query param to be set`)

		return value
	}

	static from(raw: string) {
		return new this(new URLSearchParams(raw))
	}
}

export class JsonBody {
	body: Json

	constructor(body: Json) {
		this.body = body
	}

	static async from(request: Request) {
		return new this(await request.json())
	}

	getValue(key: string): Json {
		const value = this.body[key]
		if (value === undefined) throw new BadParamsError(`Expected a "${key}" property in body`)

		return value
	}

	getString(key: string) {
		const value = this.getValue(key)
		if (typeof value !== 'string') throw new BadParamsError(`Expected "${key}" to be of type string, but found "${typeof value}"`)

		return value
	}

	static async fromResponse(response: Response) {
		return new this(await response.json())
	}
}
