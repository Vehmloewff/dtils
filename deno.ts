/**
 * @module
 *
 * UNSTABLE
 *
 * Programmatic apis to the Deno CLI
 */

// Untested. Logic is pretty simple. Should always "just work"

import { colors } from './deps.ts'
import { exec } from './sh.ts'

export type DenoExecPermissions = 'all' | Deno.PermissionOptions

export interface DenoExecOptions extends DenoOptions {
	/**
	 * The permissions to execute files with
	 *
	 * NOTE: 'inherit' permissions are equivalent to 'all' */
	permissions?: DenoExecPermissions

	/** If true, operation be provided with the unstable apis of the Deno runtime */
	unstable?: boolean
}

export interface DenoOptions {
	/** If true, operation will not resolve and continue to keep Deno alive, monitoring the files for changes */
	watch?: boolean

	/** If true, all output is suppressed */
	quiet?: boolean
}

/** Run Deno's builtin test suite */
export async function test(options: DenoExecOptions = {}): Promise<void> {
	const args = ['deno', 'test', ...stringifyDenoExecOptions(options)]

	await exec(args, { env: Deno.env.toObject() })
}

/** Run Deno's builtin linter */
export async function lint(options: DenoOptions = {}): Promise<void> {
	const args = [
		'deno',
		'lint',
		// We always want to lint in quiet mode because we will log an alternative success message
		...stringifyDenoOptions({ ...options }),
	]

	await exec(args, { env: Deno.env.toObject() })
}

export interface FormatOptions extends DenoOptions {
	check?: boolean
}

/** Run Deno's builtin formatter */
export async function format(options: FormatOptions = {}): Promise<void> {
	const args = ['deno', 'fmt', ...stringifyDenoOptions(options)]

	if (options.check) args.push('--check')

	await exec(args, { env: Deno.env.toObject() })
}

/** Test, lint, and format check source code in the current working directory */
export async function check(options: DenoExecOptions = {}): Promise<void> {
	await Promise.all([
		test(options).then(() => {
			if (!options.quiet) console.log(colors.green('Success'), 'tests passed')
		}),
		lint(options).then(() => {
			if (!options.quiet) console.log(colors.green('Success'), 'linting passed')
		}),
		format({ ...options, check: true }).then(() => {
			if (!options.quiet) console.log(colors.green('Success'), 'formatting is ok')
		}),
	])
}

function stringifyDenoOptions(options: DenoOptions) {
	const args: string[] = []

	if (options.watch) args.push('--watch')
	if (options.quiet) args.push('--quiet')

	return args
}

function stringifyDenoExecOptions(options: DenoExecOptions) {
	const args: string[] = []

	args.push(...stringifyDenoOptions(options))

	if (options.permissions) args.push(...stringifyPermissions(options.permissions))
	if (options.unstable) args.push('--unstable')

	return args
}

function stringifyPermissions(permissions: DenoExecPermissions) {
	if (permissions === 'all') return ['-A']
	if (permissions === 'none') return []

	if (permissions === 'inherit') {
		permissions = {
			env: 'inherit',
			ffi: 'inherit',
			hrtime: 'inherit',
			net: 'inherit',
			read: 'inherit',
			run: 'inherit',
			sys: 'inherit',
			write: 'inherit',
		}
	}

	const args: string[] = []

	if (permissions.env) {
		if (permissions.env === 'inherit' || permissions.env === true) args.push('--allow-env')
		else args.push(`--allow-env="${permissions.env.join(',')}"`)
	}

	if (permissions.ffi) {
		if (permissions.ffi === 'inherit' || permissions.ffi === true) args.push('--allow-ffi')
		else args.push(`--allow-ffi=${permissions.ffi.join(',')}`)
	}

	if (permissions.hrtime) args.push('--allow-hrtime')

	if (permissions.net) {
		if (permissions.net === 'inherit' || permissions.net === true) args.push('--allow-net')
		else args.push(`--allow-net=${permissions.net.join(',')}`)
	}

	if (permissions.read) {
		if (permissions.read === 'inherit' || permissions.read === true) args.push('--allow-read')
		else args.push(`--allow-read=${permissions.read.join(',')}`)
	}

	if (permissions.run) {
		if (permissions.run === 'inherit' || permissions.run === true) args.push('--allow-run')
		else args.push(`--allow-run=${permissions.run.join(',')}`)
	}

	if (permissions.sys) {
		if (permissions.sys === 'inherit' || permissions.sys === true) args.push('--allow-sys')
		else args.push(`--allow-sys=${permissions.sys.join(',')}`)
	}

	if (permissions.write) {
		if (permissions.write === 'inherit' || permissions.write === true) args.push('--allow-write')
		else args.push(`--allow-write=${permissions.write.join(',')}`)
	}

	return args
}
