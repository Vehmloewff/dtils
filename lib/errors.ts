export class UserError extends Error {
	code = 'USER_FAULT'
}

export class ForbiddenError extends Error {
	code = 'FORBIDDEN'
	message = 'Forbidden'
}

export function isUserError(error: any) {
	return error.code === 'USER_FAULT'
}

export function isForbiddenError(error: any) {
	return error.code === 'FORBIDDEN'
}
