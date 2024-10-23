import { Translator } from "../../translator"
import { Opcode } from "../../translator/types"
import {
	setValueIntoRegisterPair,
	getRegisterPairValue,
	getRegisterValue,
	getBitsFromNumber
} from "../helpers"
import { CPUState, Register } from "../types"
import { OpcodeHandler } from "./types"

const opcodeHandlers: Record<Opcode["code"], OpcodeHandler> = {}

export function executeOpcode(opcode: Opcode, initialState: CPUState): CPUState {
	const opcodeHandler = opcodeHandlers[opcode.code]

	if (!opcodeHandler) {
		throw Error(`Opcode not implemented ${opcode.code.toString(16)}`)
	}

	return opcodeHandler(initialState, opcode)
}

/**
 * No operation
 * - Does nothing
 * @param initialState CPU state before the execution of the opcode
 * @returns next CPU state after the execution of the opcode
 */
opcodeHandlers[0x00] = function NOP(initialState) {
	return initialState
}

opcodeHandlers[0x06] = function MVI_B_D8(initialState, opcode) {
	initialState.registers.set("B", Translator.getOpcodeSingleOperand(opcode))

	return initialState
}

opcodeHandlers[0x11] = function LXI_D_D16(initialState, opcode) {
	if (!opcode.operands) throw Error("No operands found")

	return setValueIntoRegisterPair("D", [opcode.operands[1], opcode.operands[0]], initialState)
}

opcodeHandlers[0x13] = function INX_D(initialState) {
	const pairValue = getRegisterPairValue(Register.D, initialState)

	return setValueIntoRegisterPair("D", pairValue + 1, initialState)
}

opcodeHandlers[0x1a] = function LDAX_D(initialState) {
	const memoryAddress = getRegisterPairValue(Register.D, initialState)
	const value = initialState.memory[memoryAddress]

	initialState.registers.set(Register.A, value)
	return initialState
}

opcodeHandlers[0x21] = function LXI_H_D16(initialState, opcode) {
	if (!opcode.operands) throw Error("No operands found")

	return setValueIntoRegisterPair("H", [opcode.operands[1], opcode.operands[0]], initialState)
}

opcodeHandlers[0x23] = function INX_H(initialState) {
	const pairValue = getRegisterPairValue("H", initialState)
	return setValueIntoRegisterPair("H", pairValue + 1, initialState)
}

opcodeHandlers[0x31] = function LXI_SP_D16(initialState, opcode) {
	if (!opcode.operands) throw Error("No operands found")

	initialState.stackPointer = Translator.getOpcodeOperandsAsAddress(opcode)

	return initialState
}

opcodeHandlers[0x77] = function MOV_M_A(initialState) {
	const accumulatorRegisterValue = getRegisterValue(Register.A, initialState)
	const targetMemoryAddress = getRegisterPairValue("H", initialState)

	initialState.memory[targetMemoryAddress] = accumulatorRegisterValue

	return initialState
}

opcodeHandlers[0xc3] = function JMP(initialState, opcode) {
	const jumpAddress = Translator.getOpcodeOperandsAsAddress(opcode)

	initialState.programCounter = jumpAddress

	return initialState
}

opcodeHandlers[0xcd] = function CALL(initialState, opcode) {
	const returnAddress = initialState.memory[initialState.programCounter] + opcode.size // address of next instruction

	// saves the return addres into the stackpointer memory
	initialState.memory[initialState.stackPointer - 1] = getBitsFromNumber(8, returnAddress, "MSB") // leftmost address byte
	initialState.memory[initialState.stackPointer - 2] = getBitsFromNumber(8, returnAddress, "LSB") // rightmost address btye

	const subroutineAddress = Translator.getOpcodeOperandsAsAddress(opcode)

	initialState.programCounter = subroutineAddress // program now will execute the routine
	initialState.stackPointer -= 2 // before jumping into the subroutine, sets the stackpointer to the return address

	return initialState
}
