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

	window.addEventListener('unload', () => {
		if (didFinish) return
		process.kill('SIGINT')
	})

	const { code } = await process.status()

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
		stdin: 'piped',
	})

	let didFinish = false

	window.addEventListener('unload', () => {
		if (didFinish) return
		process.kill('SIGINT')
	})

	const [{ code }, errorRaw, outputRaw] = await Promise.all([process.status(), process.stderrOutput(), process.output()])

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
