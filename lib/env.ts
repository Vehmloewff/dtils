/**
 * Provides a high-level api for standard application env variables (TODO reference blog post of standards)
 *
 * We make heavy use of caching in this module because we don't want to overload the user with
 * permission prompts to these env vars
 *
 * @module
 */

export type Env = 'dev' | 'staging' | 'production'
export type LogLevel = 'quiet' | 'verbose' | 'normal'

let stashedEnv: Env | null = null
let stashedLogLevel: LogLevel | null = null
let stashedDeploy: boolean | null = null
let stashedReload: boolean | null = null

/** Get the current env level ($ENV). Assumes "dev" if invalid or unspecified */
export function getEnv(): Env {
	if (stashedEnv) return stashedEnv

	const env = inferEnv()
	stashedEnv = env

	return env
}

/** Get the current log level ($LOG_LEVEL). Assumes "normal" if invalid or unspecified */
export function getLogLevel(): LogLevel {
	if (stashedLogLevel) return stashedLogLevel

	const logLevel = inferLogLevel()
	stashedLogLevel = logLevel

	return logLevel
}

/** Get the current deployment disposition ($DEPLOY). Assumes false if unset, 0, or false */
export function getShouldDeploy(): boolean {
	if (stashedDeploy !== null) return stashedDeploy

	const deploy = inferDeploy()
	stashedDeploy = deploy

	return deploy
}

/** Get the current disposition for reloading dependencies ($RELOAD_DEPS). Assumes false if unset, 0, or false */
export function getShouldReloadDeps(): boolean {
	if (stashedReload !== null) return stashedReload

	const reload = inferReload()
	stashedReload = reload

	return reload
}

function inferReload() {
	const reload = Deno.env.get('RELOAD_DEPS')
	if (!reload || reload === '0' || reload === 'false') return false

	return true
}

function inferDeploy() {
	const deploy = Deno.env.get('DEPLOY')
	if (!deploy || deploy === '0' || deploy === 'false') return false

	return true
}

function inferLogLevel(): LogLevel {
	const logLevel = Deno.env.get('LOG_LEVEL')
	if (!logLevel) return 'normal'

	if (logLevel === 'quiet' || logLevel === 'verbose' || logLevel === 'normal') return logLevel

	// We will log a warning and assume default if logLevel is invalid instead of throwing an error.
	// The reason for this is that we don't want to make it easy for outside sources to crash the application
	console.warn(
		`Invalid value for logLevel variable LOG_LEVEL. Expected "normal", "quiet", or "verbose", but got "${logLevel}". Resorting to "normal"`,
	)

	return 'normal'
}

function inferEnv(): Env {
	const env = Deno.env.get('ENV')
	if (!env) return 'dev'

	if (env === 'production' || env === 'staging' || env === 'dev') return env

	// We will log a warning and assume default if env is invalid instead of throwing an error.
	// The reason for this is that we don't want to make it easy for outside sources to crash the application
	console.warn(`Invalid value for env variable ENV. Expected "dev", "staging", or "production", but got "${env}". Resorting to "dev"`)
	return 'dev'
}
