export interface CPUState {
	programCounter: number
	stackPointer: number
	registers: Map<keyof typeof Register, number>
	flags: Map<string, number>
	memory: Uint8Array
}

export type RegisterPair = "B" | "D" | "H" | "PSW"

export enum Register {
	B = "B",
	C = "C",
	D = "D",
	E = "E",
	H = "H",
	L = "L",
	A = "A"
}
