import { exists } from './fs.ts'

const getCommandArgs = async (command: string) => {
	// Always use PowerShell on windows
	if (Deno.build.os === 'windows') return ['PowerShell.exe', '-Command', command]

	// The default shell path is usually in the SHELL env variable
	const shellFile = Deno.env.get('SHELL') || '/bin/bash'

	if (!(await exists(shellFile))) throw new Error(`Cannot detect default shell`)

	return [shellFile, '-c', command]
}

export interface ShOptions {
	cwd?: string
	env?: Record<string, string>
}

/**
 * Executes shell code.  Returns the exit code of the sh runner
 * @param command Shell code to be executed
 */
export async function sh(command: string, options: ShOptions = {}): Promise<number> {
	const process = Deno.run({
		env: Deno.env.toObject(),
		...options,
		cmd: await getCommandArgs(command),
	})

	let didFinish = false

	globalThis.window.addEventListener('unload', () => {
		if (didFinish) return
		process.kill('SIGINT')
	})

	const { code } = await process.status()

	process.close()
	didFinish = true

	return code
}

export interface ShCaptureResult {
	code: number
	error: string
	output: string
}

/**
 * Executes shell code and captures the output.
 * @param command Shell code to be executed
 */
export async function shCapture(command: string, options: ShOptions = {}): Promise<ShCaptureResult> {
	const process = Deno.run({
		env: Deno.env.toObject(),
		...options,
		cmd: await getCommandArgs(command),
		stderr: 'piped',
		stdout: 'piped',
		stdin: 'inherit',
	})

	let didFinish = false

	globalThis.window.addEventListener('unload', () => {
		if (didFinish) return
		process.kill('SIGINT')
	})

	const [{ code }, errorRaw, outputRaw] = await Promise.all([process.status(), process.stderrOutput(), process.output()])

	process.close()
	didFinish = true

	let error = ``
	let output = ``

	const decode = (raw: Uint8Array) => new TextDecoder().decode(raw)

	if (errorRaw) error = decode(errorRaw)
	if (outputRaw) output = decode(outputRaw)

	return {
		code,
		error,
		output,
	}
}

export interface ShIgnoreOptions extends ShOptions {
	alwaysIgnoreStderr?: boolean
}

/**
 * Executes shell code and ignores the output, except when the program is unsuccessful.
 * In that case, the stderr is printed.
 * @param command Shell code to be executed
 */
export async function shIgnore(command: string, options: ShIgnoreOptions = {}) {
	const { code, error } = await shCapture(command, options)

	if (code) {
		if (error.trim()) {
			console.error(`Command ${command} exited with a code of ${code}:`)
			console.error(error)
		} else {
			console.error(`Command ${command} exited with a code of ${code} but didn't write anything to it's stderr`)
		}
	}

	return { code }
}
