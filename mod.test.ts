import { sh } from './sh.ts'

Deno.test('mod does not require permissions upon import', async () => {
	await sh('deno run mod.ts')
})
