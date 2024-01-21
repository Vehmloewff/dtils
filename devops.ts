import { check } from './deno.ts'

export async function ci(): Promise<void> {
	await check({ unstable: true, permissions: 'all' })
}
