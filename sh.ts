import { colors, pathUtils, streamUtils } from './deps.ts'
import { sureGetEnvVar } from './env.ts'
import { exists } from './fs.ts'
import { readStreamToFn } from './stream.ts'

const getCommandArgs = async (command: string) => {
	// Always use PowerShell on windows
	if (Deno.build.os === 'windows') return ['PowerShell.exe', '-Command', command]

	// The default shell path is usually in the SHELL env variable
	const shellFile = Deno.env.get('SHELL') || '/bin/bash'

	if (!(await exists(shellFile))) throw new Error(`Cannot detect default shell`)

	return [shellFile, '-c', command]
}

export interface ExecOptions {
	/** Called right after the child process is created. A returned promise will be awaited */
	onSetup?(params: ExecEventParams): unknown | Promise<unknown>

	/** A shortcut to setting the NO_COLOR env var */
	supressColor?: boolean

	/**
	 * Normally, only the $PATH env var is sent to the child process. If `true` the $PATH env var will not be sent to the child process.
	 *
	 * NOTE: This disables the automatic discovery of executables. You can use the `getExecFromPath` function to get the path to an executable
	 * before running the child process. */
	supressPath?: boolean

	/** The directory that the process should run in */
	cwd?: string

	/** Any env variables that should be specified for the child process */
	env?: Record<string, string>
}

export interface ExecEventParams {
	process: Deno.ChildProcess
}

export interface ExecCaptureIncrementalOptions extends ExecOptions {
	onLogLine?(line: string, params: ExecEventParams): unknown | Promise<unknown>
	onErrorLine?(line: string, params: ExecEventParams): unknown | Promise<unknown>
}

/** Executes `command` in defualt shell, printing the command's output. Throws if command exits with a non-zero status */
export async function sh(command: string, options: ExecOptions = {}) {
	return exec(await getCommandArgs(command), options)
}

/** Executes `command` in default shell. Throws if command exits with a non-zero status. */
export async function shIgnore(command: string, options: ExecOptions = {}) {
	return execIgnore(await getCommandArgs(command), options)
}

/**
 * Executes `command` in default shell. Returns `errorLines` and `logLines` containing all the lines written
 * to stdout and stderr, respectively. Throws if command exits with a non-zero status. */
export async function shCapture(command: string, options: ExecOptions = {}) {
	return execCapture(await getCommandArgs(command), options)
}

/**
 * Executes `command` in default shell. Incrementally calls `options.onLogLine` and `options.onErrorLine`
 * for each new line writen to stdout an stderr, respectively. Throws if command exits with a
 * non-zero status. */
export async function shCaptureIncremental(command: string, options: ExecCaptureIncrementalOptions = {}) {
	return execCaptureIncremental(await getCommandArgs(command), options)
}

/**
 * Executes `segments` as a child process, printing the child's output. Throws if the child exits with a non-zero status
 *
 * @param segments The segments to execute. The first should be the file, the rest will be passed as arguments */
export async function exec(segments: string[], options: ExecOptions = {}) {
	await execCaptureIncremental(segments, {
		...options,
		onErrorLine(line) {
			console.error(line)
		},
		onLogLine(line) {
			console.log(line)
		},
	})
}

/**
 * Executes `segments` as a child process. Throws if the child exits with a non-zero status.
 *
 * @param segments The segments to execute. The first should be the file, the rest will be passed as arguments */
export async function execIgnore(segments: string[], options: ExecOptions = {}) {
	await execCaptureIncremental(segments, options)
}

/**
 * Executes `segments` as a child process. Returns `errorLines` and `logLines` containing all the lines written
 * to the child's stdout and stderr, respectively. Throws if the child exits with a non-zero status.
 *
 * @param segments The segments to execute. The first should be the file, the rest will be passed as arguments */
export async function execCapture(segments: string[], options: ExecOptions = {}) {
	const errorLines: string[] = []
	const logLines: string[] = []

	await execCaptureIncremental(segments, {
		...options,
		onErrorLine(line) {
			errorLines.push(line)
		},
		onLogLine(line) {
			logLines.push(line)
		},
	})

	return { errorLines, logLines }
}

/**
 * Executes `segments` as a child process. Incrementally calls `options.onLogLine` and `options.onErrorLine`
 * for each new line writen to the child's stdout an stderr, respectively. Throws if the child exits with a
 * non-zero status.
 *
 * @param segments The segments to execute. The first should be the file, the rest will be passed as arguments */
export async function execCaptureIncremental(segments: string[], options: ExecCaptureIncrementalOptions = {}) {
	if (!segments.length) throw new Error('segments must not be empty')

	const env = { ...options.env }

	if (options.supressColor && !env.NO_COLOR) env.NO_COLOR = '1'
	if (!options.supressPath && !env.PATH) env.PATH = sureGetEnvVar('PATH')

	const process = new Deno.Command(segments[0], {
		args: segments.slice(1),
		stderr: 'piped',
		stdout: 'piped',
		stdin: 'piped',
		cwd: options.cwd,
		env,
		clearEnv: true,
	}).spawn()

	const errorLines: string[] = []
	const eventParams: ExecEventParams = { process }

	if (options.onSetup) await options.onSetup(eventParams)

	const logLinesStream = process.stdout.pipeThrough(new TextDecoderStream()).pipeThrough(new streamUtils.TextLineStream())
	const errorLinesStream = process.stderr.pipeThrough(new TextDecoderStream()).pipeThrough(new streamUtils.TextLineStream())

	const oututPromise = readStreamToFn(logLinesStream, async (line) => {
		if (options.onLogLine) await options.onLogLine(line, eventParams)
	})

	const outputLogPromise = readStreamToFn(errorLinesStream, async (line) => {
		errorLines.push(line)

		if (options.onErrorLine) await options.onErrorLine(line, eventParams)
	})

	const [status] = await Promise.all([process.status, oututPromise, outputLogPromise])

	if (status.success) return

	const spacer = '    '
	const errorHeap = errorLines.map((line) => `${spacer}${colors.gray('>')} ${line}`).join('\n')
	const paddedHeap = errorLines.length
		? `\n\n    ${colors.gray(colors.bold('Error Output:'))}\n\n${errorHeap}\n\n`
		: `\n\n${spacer}${colors.italic(colors.gray('no error output'))}\n`

	throw new Error(`Command failed: ${paddedHeap}`)
}

export async function getExecFromPath(name: string) {
	const path = Deno.env.get('PATH')
	if (!path) throw new Error('Could not detect the $PATH env var')

	const directories = path.split(':')

	for (const directory of directories) {
		for await (const entry of Deno.readDir(directory)) {
			if (entry.name === name) return pathUtils.join(directory, name)
		}
	}

	throw new Error(`Could not find ${name} in $PATH`)
}
