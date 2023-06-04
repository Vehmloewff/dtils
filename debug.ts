import { chooseArrItemFromString } from './random.ts'
import { readText, writeText } from './fs.ts'
import { colors as colorTools, pathUtils } from './deps.ts'
import { formatDate, monthsAbbr } from './date.ts'
import { arraysMatch } from './array.ts'

let stashedDebugStrategy: string | null = null
let stashedDebugOutput: string | null = null

const colors = [
	20,
	21,
	26,
	27,
	32,
	33,
	38,
	39,
	40,
	41,
	42,
	43,
	44,
	45,
	56,
	57,
	62,
	63,
	68,
	69,
	74,
	75,
	76,
	77,
	78,
	79,
	80,
	81,
	92,
	93,
	98,
	99,
	112,
	113,
	128,
	129,
	134,
	135,
	148,
	149,
	160,
	161,
	162,
	163,
	164,
	165,
	166,
	167,
	168,
	169,
	170,
	171,
	172,
	173,
	178,
	179,
	184,
	185,
	196,
	197,
	198,
	199,
	200,
	201,
	202,
	203,
	204,
	205,
	206,
	207,
	208,
	209,
	214,
	215,
	220,
	221,
]

const chooseRandomColor = (str: string) => {
	const color = chooseArrItemFromString(str, colors)

	return () => {
		const colorCode = '\u001B[3' + (color < 8 ? color : '8;5;' + color)

		return `${colorCode};1m${str}\u001B[0m`
	}
}

const initDebugStashes = () => {
	if (!stashedDebugStrategy) stashedDebugStrategy = Deno.env.get('DEBUG') || null
	if (!stashedDebugOutput) stashedDebugOutput = Deno.env.get('DEBUG_OUTPUT') || null
}

let lastTime = Date.now()
const scopes: Map<string, () => string> = new Map()

export type DebugLogFn = (...args: unknown[]) => void

export function debug(scope: string): DebugLogFn {
	initDebugStashes()
	if (!scopes.has(scope)) scopes.set(scope, chooseRandomColor(scope))

	const colorFunc = scopes.get(scope)
	if (!colorFunc) throw new Error(`something is really wrong`)

	// deno-lint-ignore no-explicit-any
	return (...args: any[]) => {
		if (!stashedDebugStrategy) return

		if (!scopeMatchesStrategy(scope, stashedDebugStrategy)) return

		const strung = args
			.map((arg) => {
				if (typeof arg === 'string') return arg
				return Deno.inspect(arg, { depth: Infinity })
			})
			.join(' ') + '\n'

		if (stashedDebugOutput) {
			writeLog(`${formatDate(new Date(), 'hh:MM:ss:l T')} ${scope} ${colorTools.stripColor(strung)}`)
		} else {
			const now = Date.now()
			Deno.stdout.writeSync(
				new TextEncoder().encode(`${colorTools.bold(colorFunc())} ${strung.trim()} ${colorTools.gray(`+${now - lastTime}ms`)}\n`),
			)
			lastTime = now
		}
	}
}

let writeScheduled = false
let leftoverPromise: null | Promise<null> = null
const nextLogs: string[] = []

function writeLog(log: string) {
	nextLogs.push(log)
	scheduleWrite()
}

function scheduleWrite() {
	const leaveLeftovers = () => (leftoverPromise = new Promise((resolve) => {
		writeLogs(nextLogs).then(() => resolve(null))
	}))

	if (leftoverPromise) {
		if (writeScheduled) return

		writeScheduled = true
		leftoverPromise.then(() => leaveLeftovers())
	} else {
		leaveLeftovers()
	}
}

async function writeLogs(logs: string[]) {
	if (!stashedDebugOutput) throw new Error(`wat??  logical error in here!`)

	const date = new Date()
	const filename = `${monthsAbbr[date.getUTCMonth()]}-${date.getUTCDate()}-${date.getUTCFullYear()}-UTC.log`
	const path = pathUtils.join(stashedDebugOutput, filename)

	const oldLines = await readText(path)
	await writeText(path, oldLines + logs.join(''))
}

function scopeMatchesStrategy(scope: string, strategy: string) {
	const scopeSections = scope.split(':').map((t) => t.trim())
	const strategySections = strategy.split(':').map((t) => t.trim())

	const isWild = strategySections[strategySections.length - 1] === '*'
	if (isWild) strategySections.pop()

	// no match if there is less scope than strategy. ex: scope(a:b), strategy(a:b:c)
	if (scopeSections.length < strategySections.length) return false
	if (scopeSections.length > strategySections.length) {
		// no match if there is more scope than strategy and not wild.
		// no match ex: scope(a:b) strategy(a)
		// match ex: scope(a:*), strategy(a:b)
		if (!isWild) return false
	}

	// either scope and strategy are the same,
	// or there is more scope than strategy but strategy is wild at the end
	const scopeSectionsToStrategyLength = scopeSections.slice(0, strategySections.length)

	return arraysMatch(scopeSectionsToStrategyLength, strategySections)
}
