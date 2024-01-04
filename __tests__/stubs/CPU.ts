import {CPUState} from "../../src/modules/cpu/types"

export const generateCPUState = (): CPUState => {
	return {
		registers: new Map(),
		memory: new Uint8Array(0),
		flags: new Map(),
		programCounter: 0,
		stackPointer: 0
	}
}