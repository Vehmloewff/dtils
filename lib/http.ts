// deno-lint-ignore no-explicit-any
export function errorToResponse(error: any) {
	if (error.code === 'authentication') return new Response(error.message, { status: 401 })
	if (error.code === 'authorization') return new Response(error.message, { status: 403 })
	if (error.code === 'bad-params') return new Response(error.message, { status: 400 })
	if (error.code === 'not-found') return new Response(error.message, { status: 404 })

	console.error(error)

	return new Response('Internal error has occurred', { status: 500 })
}
