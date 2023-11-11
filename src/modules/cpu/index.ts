import { readFile } from "fs/promises"
import { Translator } from "../translator"
import { Opcode } from "../translator/types"
import { CPUState, Register } from "./types"
import { executeOpcode } from "./executor"

// for reference https://en.wikipedia.org/wiki/Intel_8080
export class CPU {
	private static rom: Uint8Array | undefined
	private static programCounter: number = 0x0000
	private static stackPointer: number = 0x0000
	private static flags = new Map(Object.entries({ Z: 0b0, S: 0b0, P: 0b0, CY: 0b0, AC: 0b0 }))
	private static registers: Map<Register, number> = new Map(Object.entries({
		[Register.B]: 0x00,
		[Register.C]: 0x00,
		[Register.D]: 0x00,
		[Register.E]: 0x00,
		[Register.H]: 0x00,
		[Register.L]: 0x00,
		[Register.A]: 0x00,
	}) as [Register, number][])

	static async load(romPath: string): Promise<void> {
		const romBuffer = await readFile(romPath)
		this.rom = new Uint8Array(romBuffer)
	}

	static run() {
		if (!this.rom) {
			throw Error("ROM not loaded")
		}

		while (this.rom) {
			if (this.programCounter >= this.rom.length) {
				break
			}
            
			this.executeCycle()
		}

		console.log("Program finished")
	}

	private static executeCycle(): void {
		const currentInstruction = this.fetch()
		const { programCounter, stackPointer, registers, flags, rom } = this

		if (!rom) throw Error("ROM not loaded")

		const newState = this.executeInstruction(currentInstruction, {
			programCounter,
			stackPointer,
			registers,
			flags,
			memory: rom,
		})

		// If the executed instruction did not changed the program counter, we add the actual instruction size to it
		// so in the next cycle, the program counter will be pointing to the correct next instruction
		this.programCounter === newState.programCounter && (newState.programCounter += currentInstruction.size)

		this.setCPUState(newState)
	}

	private static fetch(): Opcode {
		return Translator.decode(this.rom![this.programCounter], this.programCounter,this.rom!)
	}

	private static executeInstruction(opcode: Opcode, originalState: CPUState): CPUState {
		return executeOpcode(opcode, originalState)
	}

	private static setCPUState(newState: CPUState): void {
		this.programCounter = newState.programCounter
		this.stackPointer = newState.stackPointer
		this.registers = newState.registers as Map<Register, number>
	}
}