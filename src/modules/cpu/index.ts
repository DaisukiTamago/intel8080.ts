import { readFile } from "fs/promises"
import { Translator } from "../translator"
import { Opcode } from "../translator/types"
import { CPUState, Register } from "./types"
import { executeOpcode } from "./executor"

// for reference https://en.wikipedia.org/wiki/Intel_8080
export class CPU {
	private memory: Uint8Array | undefined
	private programCounter: number = 0x0000
	private stackPointer: number = 0x0000
	private flags = new Map(Object.entries({ Z: 0b0, S: 0b0, P: 0b0, CY: 0b0, AC: 0b0 }))
	private registers: Map<Register, number> = new Map(
		Object.entries({
			[Register.B]: 0x00,
			[Register.C]: 0x00,
			[Register.D]: 0x00,
			[Register.E]: 0x00,
			[Register.H]: 0x00,
			[Register.L]: 0x00,
			[Register.A]: 0x00
		}) as [Register, number][]
	)

	async load(romPath: string): Promise<void> {
		const romBuffer = await readFile(romPath)
		this.memory = new Uint8Array(romBuffer)
	}

	run() {
		if (!this.memory) {
			throw Error("ROM not loaded")
		}

		while (this.memory) {
			if (this.programCounter >= this.memory.length) {
				break
			}

			this.executeCycle()
		}
	}

	private executeCycle(): void {
		const currentInstruction = this.fetch()
		const { programCounter, stackPointer, registers, flags, memory: rom } = this

		if (!rom) throw Error("ROM not loaded")

		const newState = this.executeInstruction(currentInstruction, {
			programCounter,
			stackPointer,
			registers,
			flags,
			memory: rom
		})

		// If the executed instruction did not changed the program counter, we add the actual instruction size to it
		// so in the next cycle, the program counter will be pointing to the correct next instruction
		if (this.programCounter === newState.programCounter) {
			newState.programCounter += currentInstruction.size
		}

		this.setCPUState(newState)
	}

	private fetch(): Opcode {
		return Translator.decode(this.memory![this.programCounter], this.programCounter, this.memory!)
	}

	private executeInstruction(opcode: Opcode, originalState: CPUState): CPUState {
		return executeOpcode(opcode, originalState)
	}

	private setCPUState(newState: CPUState): void {
		this.programCounter = newState.programCounter
		this.stackPointer = newState.stackPointer
		this.registers = newState.registers as Map<Register, number>
	}

	get state(): CPUState {
		return {
			programCounter: this.programCounter,
			stackPointer: this.stackPointer,
			registers: this.registers,
			flags: this.flags,
			memory: this.memory!
		}
	}
}
