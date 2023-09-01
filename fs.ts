import { pathUtils } from './deps.ts'
import { Json } from './json.ts'

export async function exists(file: string): Promise<boolean> {
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

export async function writeBinary(file: string, binary: Uint8Array): Promise<void> {
	await ensureDirExists(file)
	await Deno.writeFile(file, binary)
}

export async function writeText(file: string, text: string): Promise<void> {
	await ensureDirExists(file)
	await Deno.writeTextFile(file, text)
}

export interface WriteJsonOptions {
	separator?: string
}

export async function writeJson(file: string, json: Json, options: WriteJsonOptions = {}): Promise<void> {
	await ensureDirExists(file)
	await Deno.writeTextFile(file, JSON.stringify(json, null, options.separator))
}

/** @deprecated Will be removed in next major release. Use `readBytes` instead */
export async function readBinary(file: string): Promise<Uint8Array> {
	try {
		return await Deno.readFile(file)
	} catch (_) {
		return new Uint8Array()
	}
}

/** Read a file as a Uint8Array. Returns `null` if the file doesn't exist */
export async function readBytes(file: string): Promise<Uint8Array | null> {
	try {
		return await Deno.readFile(file)
	} catch (_) {
		return null
	}
}

/**
 * Read a file as a string. Returns an empty string if the file doesn't exist.
 *
 * NOTICE: At the next major release, this will return string|null */
export async function readText(file: string): Promise<string> {
	try {
		return await Deno.readTextFile(file)
	} catch (_) {
		return ``
	}
}

/**
 * Read a file, parsing it as json. Returns an empty object if the file doesn't exist or can't be parsed.
 *
 * NOTICE: At the next major release, this will return Json|null */
export async function readJson(file: string): Promise<Json> {
	try {
		return JSON.parse(await Deno.readTextFile(file))
	} catch (_) {
		return {}
	}
}

/**
 * Read a file, parsing it as json. Returns an empty object if the file doesn't exist. Throws if the json can't be parsed.
 *
 * NOTICE: At the next major release, this will return Json|null */
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

/** Recursively read all files in `rootDir`. Resulting paths will include `rootDir` */
export async function recursiveReadDir(rootDir: string): Promise<string[]> {
	if (!await exists(rootDir)) return []

	// The following was ported from https://deno.land/x/recursive_readdir@v2.0.0/mod.ts?source
	const files: string[] = []

	const getFiles = async (path: string) => {
		for await (const dirEntry of Deno.readDir(path)) {
			if (dirEntry.isDirectory) {
				await getFiles(pathUtils.join(path, dirEntry.name))
				continue
			}

			if (dirEntry.isFile) files.push(pathUtils.join(path, dirEntry.name))
		}
	}

	await getFiles(rootDir)

	return files
}

/** Get all entries in `dir`. Resulting paths will not include `dir`  */
export async function readDir(dir: string): Promise<string[]> {
	if (!await exists(dir)) return []

	const names: string[] = []

	for await (const dirEntry of Deno.readDir(dir)) names.push(dirEntry.name)

	return names
}
