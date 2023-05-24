import { colors } from './deps.ts'

console.warn(
	colors.bold(colors.yellow('Warn')),
	'Importing lib/logger.ts directly is deprecated and will be removed in the next major release',
)

export * from './debug.ts'
