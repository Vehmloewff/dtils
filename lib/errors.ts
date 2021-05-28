export class UserError extends Error {
	code = 'USER_FAULT'
}

export class ProgramError extends Error {
	code = 'PROGRAM_FAULT'
	message = 'Program error'
}

export class ForbiddenError extends Error {
	code = 'FORBIDDEN'
	message = 'Forbidden'
}
