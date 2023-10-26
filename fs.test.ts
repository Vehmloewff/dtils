import { asserts, pathUtils } from './deps.ts'
import { copyDir, PathPair, readText, recursiveReadFiles, recursiveReadInsideDir, writeText } from './fs.ts'

const testFileNames = [
	'some/file/all/the/way/in/here',
	'surface.txt',
	'a space here',
	'some/file/all/frat/way/in/here',
	'surface.txt.js',
	'a space  here',
	'some/file/all/the/way/in/there',
	'surface.txt.json',
	'a space here ',
]

Deno.test('recursiveReadInsideDir reads inside the dir', async () => {
	const dir = await Deno.makeTempDir()
	const sort = (pairs: PathPair[]) => pairs.sort((a, b) => a.innerPath.localeCompare(b.innerPath))
	const expected = sort(testFileNames.map((file) => ({ path: pathUtils.join(dir, file), innerPath: file })))

	for (const { path } of expected) await writeText(path, crypto.randomUUID())

	asserts.assertEquals(sort(await recursiveReadInsideDir(dir)), expected)
	asserts.assertEquals(sort(await recursiveReadInsideDir(dir + '/')), expected)
	asserts.assertEquals(sort(await recursiveReadInsideDir(dir + '/.')), expected)
	asserts.assertEquals(sort(await recursiveReadInsideDir(dir + '///.//.///')), expected)
})

Deno.test('copyDir copies directories', async () => {
	const wrapper = await Deno.makeTempDir()
	const src = pathUtils.join(wrapper, 'src')
	const dest = pathUtils.join(wrapper, 'dest')

	const midIndex = Math.round(testFileNames.length / 2)
	const naughtyFile = testFileNames[midIndex]

	for (const file of testFileNames) await writeText(pathUtils.join(src, file), crypto.randomUUID())

	await copyDir(src, dest, {
		pathFilter(file) {
			return file !== naughtyFile
		},
	})

	const srcFiles = await recursiveReadFiles(src, readText)
	srcFiles.delete(naughtyFile)

	const destFiles = await recursiveReadFiles(dest, readText)

	asserts.assertEquals([...srcFiles.entries()], [...destFiles.entries()])
})
