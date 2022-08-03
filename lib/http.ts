import { isBadParamsError, isForbiddenError, isNotAuthenticatedError, isNotFoundError } from './errors.ts'

// deno-lint-ignore no-explicit-any
export function errorToResponse(error: any) {
	if (isForbiddenError(error)) return new Response(error.message, { status: 403 })
	if (isNotAuthenticatedError(error)) return new Response(error.message, { status: 401 })
	if (isBadParamsError(error)) return new Response(error.message, { status: 400 })
	if (isNotFoundError(error)) return new Response(error.message, { status: 404 })

	console.error(error)

	return new Response('Internal error has occurred', { status: 500 })
}
