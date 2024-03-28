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
	suppressColor?: boolean

	/**
	 * Normally, only the $PATH env var is sent to the child process. If `true` the $PATH env var will not be sent to the child process.
	 *
	 * NOTE: This disables the automatic discovery of executables. You can use the `getExecFromPath` function to get the path to an executable
	 * before running the child process. */
	suppressPath?: boolean

	/** The directory that the process should run in */
	cwd?: string

	/** Any env variables that should be specified for the child process */
	env?: Record<string, string>

	/** A signal to abort this process when necessary */
	signal?: AbortSignal

	/**
	 * If `true` stout and stdin will be inherited from the component. Defaults to `true` for `sh` and `exec`, but false for `shCapture`,
	 * `shCaptureIncremental`, `shIgnore`, `execCapture`, `execIgnore`, and `execCaptureIncremental` */
	inheritStdio?: boolean

	/** If specified, content will be written to the process stdin before it is closed. If unspecified, stdin will be inherited */
	input?: string
}

export interface ExecCaptureResult {
	errorLines: string[]
	logLines: string[]
}

export interface ExecEventParams {
	process: Deno.ChildProcess
}

export interface ExecCaptureIncrementalOptions extends ExecOptions {
	onLogLine?(line: string, params: ExecEventParams): unknown | Promise<unknown>
	onErrorLine?(line: string, params: ExecEventParams): unknown | Promise<unknown>
}

/** Executes `command` in default shell, printing the command's output. Throws if command exits with a non-zero status */
export async function sh(command: string, options: ExecOptions = {}): Promise<void> {
	return exec(await getCommandArgs(command), { inheritStdio: true, ...options })
}

/** Executes `command` in default shell. Throws if command exits with a non-zero status. */
export async function shIgnore(command: string, options: ExecOptions = {}): Promise<void> {
	return execIgnore(await getCommandArgs(command), options)
}

/**
 * Executes `command` in default shell. Returns `errorLines` and `logLines` containing all the lines written
 * to stdout and stderr, respectively. Throws if command exits with a non-zero status. */
export async function shCapture(command: string, options: ExecOptions = {}): Promise<ExecCaptureResult> {
	return execCapture(await getCommandArgs(command), options)
}

/**
 * Executes `command` in default shell. Incrementally calls `options.onLogLine` and `options.onErrorLine`
 * for each new line written to stdout an stderr, respectively. Throws if command exits with a
 * non-zero status. */
export async function shCaptureIncremental(command: string, options: ExecCaptureIncrementalOptions = {}): Promise<void> {
	return execCaptureIncremental(await getCommandArgs(command), options)
}

/**
 * Executes `segments` as a child process, printing the child's output. Throws if the child exits with a non-zero status
 *
 * @param segments The segments to execute. The first should be the file, the rest will be passed as arguments */
export async function exec(segments: string[], options: ExecOptions = {}): Promise<void> {
	await execCaptureIncremental(segments, {
		inheritStdio: true,
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
export async function execIgnore(segments: string[], options: ExecOptions = {}): Promise<void> {
	await execCaptureIncremental(segments, options)
}

/**
 * Executes `segments` as a child process. Returns `errorLines` and `logLines` containing all the lines written
 * to the child's stdout and stderr, respectively. Throws if the child exits with a non-zero status.
 *
 * @param segments The segments to execute. The first should be the file, the rest will be passed as arguments */
export async function execCapture(segments: string[], options: ExecOptions = {}): Promise<ExecCaptureResult> {
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
 * for each new line written to the child's stdout an stderr, respectively. Throws if the child exits with a
 * non-zero status.
 *
 * @param segments The segments to execute. The first should be the file, the rest will be passed as arguments */
export async function execCaptureIncremental(segments: string[], options: ExecCaptureIncrementalOptions = {}): Promise<void> {
	if (!segments.length) throw new Error('segments must not be empty')

	const env = { ...options.env }

	if (options.suppressColor && !env.NO_COLOR) env.NO_COLOR = '1'
	if (!options.suppressPath && !env.PATH) env.PATH = sureGetEnvVar('PATH')

	const process = new Deno.Command(segments[0], {
		args: segments.slice(1),
		stderr: options.inheritStdio ? 'inherit' : 'piped',
		stdout: options.inheritStdio ? 'inherit' : 'piped',
		stdin: options.input ? 'piped' : 'inherit',
		cwd: options.cwd,
		env,
		clearEnv: true,
		signal: options.signal,
	}).spawn()

	const errorLines: string[] = []
	const eventParams: ExecEventParams = { process }

	if (options.onSetup) await options.onSetup(eventParams)

	const logLinesStream = options.inheritStdio
		? null
		: process.stdout.pipeThrough(new TextDecoderStream()).pipeThrough(new streamUtils.TextLineStream())
	const errorLinesStream = options.inheritStdio
		? null
		: process.stderr.pipeThrough(new TextDecoderStream()).pipeThrough(new streamUtils.TextLineStream())

	if (options.input) {
		await process.stdin.getWriter().write(new TextEncoder().encode(options.input))
		await process.stdin.close()
	}

	const outputPromise = logLinesStream
		? readStreamToFn(logLinesStream, async (line) => {
			if (options.onLogLine) await options.onLogLine(line, eventParams)
		})
		: Promise.resolve()

	const outputLogPromise = errorLinesStream
		? readStreamToFn(errorLinesStream, async (line) => {
			errorLines.push(line)

			if (options.onErrorLine) await options.onErrorLine(line, eventParams)
		})
		: Promise.resolve()

	const [status] = await Promise.all([process.status, outputPromise, outputLogPromise])

	if (status.success) return

	const spacer = '    '
	const errorHeap = errorLines.map((line) => `${spacer}${colors.gray('>')} ${line}`).join('\n')
	const paddedHeap = errorLines.length
		? `\n\n    ${colors.gray(colors.bold('Error Output:'))}\n\n${errorHeap}\n\n`
		: `\n\n${spacer}${colors.italic(colors.gray('no error output'))}\n`

	throw new Error(`Command failed: ${paddedHeap}`)
}

export async function getExecFromPath(name: string): Promise<string> {
	const res = await getExecutablesFromPath(name)
	const path = res.get(name)?.[0]
	if (!path) throw new Error(`Could not find ${name} in $PATH`)

	return path
}

export async function getExecutablesFromPath(matcher: string | ((name: string) => boolean)): Promise<Map<string, string[]>> {
	const path = Deno.env.get('PATH')
	if (!path) throw new Error('Could not detect the $PATH env var')

	const matchFn = typeof matcher === 'string' ? (name: string) => name === matcher : matcher

	const directories = path.split(':')
	const matches = new Map<string, string[]>()

	for (const directory of directories) {
		for await (const entry of Deno.readDir(directory)) {
			if (entry.isDirectory) continue
			if (matchFn(entry.name)) {
				const exec = pathUtils.join(directory, name)
				const existingMatches = matches.get(name)

				if (existingMatches) existingMatches.push(exec)
				else matches.set(name, [exec])
			}
		}
	}

	return matches
}
