// deno-lint-ignore-file no-explicit-any

export class UserError extends Error {
	code = 'USER_FAULT'
}

export function isUserError(error: any): error is UserError {
	return error.code === 'USER_FAULT'
}

export class ForbiddenError extends Error {
	code = 'FORBIDDEN'
}

export function isForbiddenError(error: any): error is ForbiddenError {
	return error.code === 'FORBIDDEN'
}

export class NotAuthenticatedError extends Error {
	code = 'NOT_AUTHENTICATED'
}

export function isNotAuthenticatedError(error: any): error is NotAuthenticatedError {
	return error.code === 'NOT_AUTHENTICATED'
}

export class BadParamsError extends Error {
	code = 'BAD_PARAMS'
}

export function isBadParamsError(error: any): error is BadParamsError {
	return error.code === 'BAD_PARAMS'
}

export class NotFoundError extends Error {
	code = 'NOT_FOUND'
}

export function isNotFoundError(error: any): error is NotFoundError {
	return error.code === 'NOT_FOUND'
}
