import { dirname } from 'https://deno.land/std@0.85.0/path/mod.ts'
import { exists } from 'https://deno.land/std@0.85.0/fs/mod.ts'
import { Json } from './extra.ts'

export { exists }

const ensureDirExists = async (file: string) => {
	const dir = dirname(file)
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

export async function writeJson(file: string, json: Json) {
	await ensureDirExists(file)
	await Deno.writeTextFile(file, JSON.stringify(json))
}

export async function readBinary(file: string): Promise<Uint8Array> {
	try {
		return await Deno.readFile(file)
	} catch (e) {
		return new Uint8Array()
	}
}

export async function readText(file: string): Promise<string> {
	try {
		return await Deno.readTextFile(file)
	} catch (e) {
		return ``
	}
}

export async function readJson(file: string): Promise<Json> {
	try {
		return JSON.parse(await Deno.readTextFile(file))
	} catch (e) {
		return {}
	}
}

export async function readJsonStrict(file: string): Promise<Json> {
	let json: string

	try {
		json = await Deno.readTextFile(file)
	} catch (e) {
		return {}
	}

	try {
		return JSON.parse(json)
	} catch (e) {
		throw 'Failed to parse "${file}":' + e
	}
}
