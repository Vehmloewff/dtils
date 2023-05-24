export function repeat(number: number, cb: (time: number) => void) {
	for (let time = 1; time <= number; time++) cb(time)
}
