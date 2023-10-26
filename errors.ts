import { asyncUtils } from './deps.ts'

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

export function errorFromResponse(status: number, text: string): Error {
	if (status === 403) return new ForbiddenError(text)
	if (status === 401) return new NotAuthenticatedError(text)
	if (status === 400) return new BadParamsError(text)
	if (status === 404) return new NotFoundError(text)

	return new Error(text)
}

/**
 * Bind error recovery to `fn`, which is expected to be a function. If when the function is later called and errors,
 * `recoverWith` will be returned instead.
 *
 * Examples:
 *
 * ```ts
 * function foo() {
 * 	throw new Error('I throw')
 * }
 *
 * const safeFoo = bindErrorRecovery(foo, null)
 *
 * foo() // Error: I throw
 * safeFoo() // null
 * ```
 */
export function bindErrorRecovery<
	Args extends unknown[],
	Return extends unknown,
	O,
>(fn: (...args: Args) => Return, recoverWith: O): (...args: Args) => Return | O {
	if (typeof fn !== 'function') throw new Error('Cannot bind error recovery to a value that is not a function')

	// @ts-ignore returned function will match `fn`
	return (...args) => {
		try {
			const res = fn(...args)
			if (res instanceof Promise) return res.catch(() => recoverWith)

			return res
		} catch (_) {
			return recoverWith
		}
	}
}

/**
 * Call `fn`, returning its result, but return `recoverWith` if it errors. If `fn` returns a promise,
 * use `withAsyncErrorRecovery` */
export function withErrorRecovery<T, O>(fn: () => T, recoverWith: O): T | O {
	try {
		return fn()
	} catch (_) {
		return recoverWith
	}
}

/**
 * Call `fn`, returning its result, but return `recoverWith` if it errors. If `fn` doesn't return a promise,
 * use `withErrorRecovery` instead */
export async function withAsyncErrorRecovery<T, O>(fn: () => Promise<T>, recoverWith: O): Promise<T | O> {
	try {
		return await fn()
	} catch (_) {
		return recoverWith
	}
}

/** Call `fn`. If it throws, delay for `delayTime`, then call it again, up to `retryCount` times. */
export async function retryFailures<T>(fn: () => Promise<T> | T, delayTime = 3000, retryCount = 3): Promise<T> {
	let triedTime = 0
	let lastError: unknown

	while (triedTime <= retryCount) {
		triedTime++

		try {
			return await fn()
		} catch (error) {
			lastError = error
			await asyncUtils.delay(delayTime)
		}
	}

	prependErrorMessageWith(lastError, `After ${retryCount} retries, the error remains:`)

	throw lastError
}

/** Modifies the `message` field of `error` to be prepended with `prepend` */
export function prependErrorMessageWith(error: unknown, prepend: string): void {
	// @ts-ignore we want to append some info to the error message if it exists
	if (error.message) error.message = `${prepend} ${error.message}`
}
