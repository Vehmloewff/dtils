export class UserError extends Error {
	code = 'USER_FAULT'
}

export function isUserError(error: unknown): error is UserError {
	// @ts-ignore if error is not an object, expression will always be false
	return error?.code === 'USER_FAULT'
}

export class ForbiddenError extends Error {
	code = 'FORBIDDEN'
}

export function isForbiddenError(error: unknown): error is ForbiddenError {
	// @ts-ignore if error is not an object, expression will always be false
	return error.code === 'FORBIDDEN'
}

export class NotAuthenticatedError extends Error {
	code = 'NOT_AUTHENTICATED'
}

export function isNotAuthenticatedError(error: unknown): error is NotAuthenticatedError {
	// @ts-ignore if error is not an object, expression will always be false
	return error.code === 'NOT_AUTHENTICATED'
}

export class BadParamsError extends Error {
	code = 'BAD_PARAMS'
}

export function isBadParamsError(error: unknown): error is BadParamsError {
	// @ts-ignore if error is not an object, expression will always be false
	return error.code === 'BAD_PARAMS'
}

export class NotFoundError extends Error {
	code = 'NOT_FOUND'
}

export function isNotFoundError(error: unknown): error is NotFoundError {
	// @ts-ignore if error is not an object, expression will always be false
	return error.code === 'NOT_FOUND'
}

export function errorFromResponse(status: number, text: string) {
	if (status === 403) return new ForbiddenError(text)
	if (status === 401) return new NotAuthenticatedError(text)
	if (status === 400) return new BadParamsError(text)
	if (status === 404) return new NotFoundError(text)

	return new Error(text)
}
