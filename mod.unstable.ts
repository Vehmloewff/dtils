/**
 * @module
 *
 * UNSTABLE
 *
 * Entrypoint for all existing and unstable Dtils apis
 */

import { colors } from './deps.ts'

console.warn(colors.yellow(colors.bold('CAUTION')), 'deno module is unstable')

export * from './mod.ts'

export * from './deno.ts'
