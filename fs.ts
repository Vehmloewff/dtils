import { pathUtils } from './deps.ts'
import { Json } from './json.ts'

export async function exists(file: string) {
	try {
		await Deno.stat(file)
		return true
	} catch (_) {
		return false
	}
}

const ensureDirExists = async (file: string) => {
	const dir = pathUtils.dirname(file)
	if (!(await exists(dir))) await Deno.mkdir(dir, { recursive: true })
}

export async function writeBinary(file: string, binary: Uint8Array) {
	await ensureDirExists(file)
	await Deno.writeFile(file, binary)
}

export async function writeText(file: string, text: string) {
	await ensureDirExists(file)
	await Deno.writeTextFile(file, text)
}

export interface WriteJsonOptions {
	separator?: string
}

export async function writeJson(file: string, json: Json, options: WriteJsonOptions = {}) {
	await ensureDirExists(file)
	await Deno.writeTextFile(file, JSON.stringify(json, null, options.separator))
}

export async function readBinary(file: string): Promise<Uint8Array> {
	try {
		return await Deno.readFile(file)
	} catch (_) {
		return new Uint8Array()
	}
}

export async function readText(file: string): Promise<string> {
	try {
		return await Deno.readTextFile(file)
	} catch (_) {
		return ``
	}
}

export async function readJson(file: string): Promise<Json> {
	try {
		return JSON.parse(await Deno.readTextFile(file))
	} catch (_) {
		return {}
	}
}

export async function readJsonStrict(file: string): Promise<Json> {
	let json: string

	try {
		json = await Deno.readTextFile(file)
	} catch (_) {
		return {}
	}

	try {
		return JSON.parse(json)
	} catch (error) {
		throw 'Failed to parse "${file}":' + error
	}
}
