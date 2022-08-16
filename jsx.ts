// deno-lint-ignore-file no-explicit-any

declare global {
	namespace JSX {
		interface IntrinsicElements {
			[elemName: string]: any
		}
		interface ElementClass {
			render: any
		}
	}
}
