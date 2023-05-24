export async function promisify<T>(val: T | Promise<T>): Promise<T> {
	return await val
}
