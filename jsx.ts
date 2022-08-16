// deno-lint-ignore-file no-explicit-any

declare global {
	namespace JSX {
		type Element = Promise<string>
		interface IntrinsicElements {
			[tag: string]: any
		}
	}
}

export type JsxComponent = (props: any, slot: string) => Promise<string> | string

export async function h(type: string | JsxComponent, props: any, ...children: Promise<string>[]): Promise<string> {
	const slot = await Promise.all(children).then(children => children.join(''))

	if (typeof type === 'function') return await type(props, slot)
	return buildHtmlTag(type, props, slot)
}

let filter: ClassFilter | null = null
export type ClassFilter = (classes: string) => string

export function setClassFilter(fn: ClassFilter) {
	filter = fn
}

function buildHtmlTag(type: string, props: any, slot: string) {
	return `<${type}${stringifyProps(props)}>${slot}</${type}>`
}

function stringifyProps(props: any): string {
	let strung = ''

	if (!props) return ''

	for (const key in props) {
		const value = props[key]
		if (!value) continue

		strung += ` ${key}="${stringifyValue(key, value)}"`
	}

	return strung
}

function stringifyValue(key: string, value: any) {
	if (key === 'class') return filterClass(value)

	return value
}

function filterClass(classes: string) {
	console.log(filter, classes)
	if (!filter) return classes

	return filter(classes)
}
