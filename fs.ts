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

/** @deprecated Will be removed in next major release. Use `writeBytes` instead */
export const writeBinary = writeBytes

/** Write `bytes` to `file`. Creates the directory if it doesn't exist */
export async function writeBytes(file: string, bytes: Uint8Array): Promise<void> {
	await ensureDirExists(file)
	await Deno.writeFile(file, bytes)
}

/** Write `text` to `file`. Creates the directory if it doesn't exist */
export async function writeText(file: string, text: string): Promise<void> {
	await ensureDirExists(file)
	await Deno.writeTextFile(file, text)
}

export interface WriteJsonOptions {
	separator?: string
}

/** Write `json` to `file`. Creates the directory if it doesn't exist */
export async function writeJson(file: string, json: unknown, options: WriteJsonOptions = {}): Promise<void> {
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
	const files = await recursiveReadInsideDir(rootDir)

	return files.map(({ path }) => path)
}

/** Get all entries in `dir`. Resulting paths will not include `dir`. Symlinks are ignored. */
export async function readDir(dir: string): Promise<string[]> {
	if (!await exists(dir)) return []

	const names: string[] = []

	for await (const dirEntry of Deno.readDir(dir)) names.push(dirEntry.name)

	return names
}

export interface PathPair {
	/** The path to a file from inside the directory */
	innerPath: string
	/** The path to the file */
	path: string
}

/** Recursively read all files in `rootDir`. Symlinks are ignored. */
export async function recursiveReadInsideDir(rootDir: string): Promise<PathPair[]> {
	if (!await exists(rootDir)) return []

	const results: PathPair[] = []

	const getFiles = async (path: string, innerPath: string) => {
		for await (const dirEntry of Deno.readDir(path)) {
			const childPath = pathUtils.join(path, dirEntry.name)
			const childInnerPath = pathUtils.join(innerPath, dirEntry.name)

			if (dirEntry.isDirectory) {
				await getFiles(childPath, childInnerPath)
				continue
			}

			if (dirEntry.isFile) results.push({ path: childPath, innerPath: childInnerPath })
		}
	}

	await getFiles(rootDir, '.')

	return results
}

export interface CopyDirOptions {
	/**
	 * If specified, `pathFilter` will be called for every `path` in `directory`.
	 *
	 * `path` will be a subpath of `directory`, and not include it. */
	pathFilter?(path: string): boolean
}

/** Copy the contents of `srcDirectory` into `destDirectory`, optionally filtering with `options.pathFilter`. Symlinks are ignored. */
export async function copyDir(srcDirectory: string, destDirectory: string, options: CopyDirOptions = {}): Promise<void> {
	const rawCurrentPaths = await recursiveReadInsideDir(srcDirectory)

	for (const { innerPath, path } of rawCurrentPaths) {
		if (options.pathFilter && !options.pathFilter(innerPath)) continue

		const newPath = pathUtils.join(destDirectory, innerPath)
		const currentFile = await Deno.open(path, { read: true })

		const newPathDir = pathUtils.dirname(newPath)
		if (!await exists(newPathDir)) await Deno.mkdir(newPathDir, { recursive: true })

		const newFile = await Deno.open(newPath, { create: true, write: true, truncate: true })
		await currentFile.readable.pipeTo(newFile.writable)
	}
}

/**
 *  Read the contents of `directory` into the returned map. Symlinks are ignored.
 *
 * **Example**
 *
 * Assume an FS structure like so...
 *
 * ```txt
 * /root
 *   |- foo
 *     |- bin
 *   |- bar
 *     |- baz
 * ```
 *
 * ...when running with the text reader...
 *
 * ```ts
 * console.log(await recursiveReadFiles('/root', readText))
 * ```
 *
 * ... the output should match this:
 *
 * ```txt
 * Map(2) {
 *   "foo/bin" => "...",
 *   "bar/baz" => "..."
 * }
 * ``` */
export async function recursiveReadFiles<T>(directory: string, reader: (path: string) => Promise<T>): Promise<Map<string, T>> {
	const files = await recursiveReadInsideDir(directory)
	const map = new Map<string, T>()

	for (const { innerPath, path } of files) map.set(innerPath, await reader(path))

	return map
}
