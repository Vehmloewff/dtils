import { chooseRandArrItem } from './random.ts'
import { readText, writeText } from './fs.ts'
import { blue, cyan, green, magenta, red, yellow, bold, stripColor, gray } from 'https://deno.land/std@0.85.0/fmt/colors.ts'
import { formatDate, monthsAbbr } from './date.ts'
import { join } from 'https://deno.land/std@0.85.0/path/mod.ts'

const debugStrategy = Deno.env.get('DEBUG')
const debugOutput = Deno.env.get('DEBUG_OUTPUT')

const chooseRandomColor = () => {
	return chooseRandArrItem([blue, cyan, green, magenta, red, yellow])
}

let lastTime = Date.now()
let scopes: Map<string, (v: string) => string> = new Map()

export function debug(scope: string) {
	if (!scopes.has(scope)) scopes.set(scope, chooseRandomColor())

	const colorFunc = scopes.get(scope)
	if (!colorFunc) throw new Error(`something is really wrong`)

	return (...args: any[]) => {
		if (!debugStrategy) return

		const strung =
			args
				.map(arg => {
					if (typeof arg === 'string') return arg
					return Deno.inspect(arg, { depth: Infinity })
				})
				.join(' ') + '\n'

		if (debugOutput) {
			writeLog(`${formatDate(new Date(), 'hh:MM:ss:l T')} ${scope} ${stripColor(strung)}`)
		} else {
			const now = Date.now()
			Deno.stdout.writeSync(new TextEncoder().encode(`${colorFunc(bold(scope))} ${strung} ${gray(`+${now - lastTime}ms`)}`))
			lastTime = now
		}
	}
}

let writeScheduled = false
let leftoverPromise: null | Promise<null> = null
let nextLogs: string[] = []

function writeLog(log: string) {
	nextLogs.push(log)
	scheduleWrite()
}

function scheduleWrite() {
	const leaveLeftovers = () =>
		(leftoverPromise = new Promise(resolve => {
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
	if (!debugOutput) throw new Error(`wat??  logical error in here!`)

	const date = new Date()
	const filename = `${monthsAbbr[date.getUTCMonth()]}-${date.getUTCDate()}-${date.getUTCFullYear()}-UTC.log`
	const path = join(debugOutput, filename)

	const oldLines = await readText(path)
	await writeText(path, oldLines + logs)
}
