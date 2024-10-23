import { CPUState, Register, RegisterPair } from "../types"

export function setValueIntoRegisterPair(
	pairSpecifier: RegisterPair,
	value: [firstRegister: number, secondRegister: number] | number,
	originalState: CPUState
): CPUState {
	const newState = { ...originalState }

	const affectedRegisters: {
		higher?: keyof typeof Register
		lower?: keyof typeof Register
	} = {}

	switch (pairSpecifier) {
		case "B":
			affectedRegisters.higher = "B"
			affectedRegisters.lower = "C"
			break

		case "D":
			affectedRegisters.higher = "D"
			affectedRegisters.lower = "E"
			break

		case "H":
			affectedRegisters.higher = "H"
			affectedRegisters.lower = "L"
			break

		default:
			throw Error("Accessing undefined register pair")
	}

	if (typeof value == "number") {
		newState.registers.set(affectedRegisters.higher, getBitsFromNumber(8, value, "MSB"))
		newState.registers.set(affectedRegisters.lower, getBitsFromNumber(8, value, "LSB"))
	} else {
		newState.registers.set(affectedRegisters.higher, value[0])
		newState.registers.set(affectedRegisters.lower, value[1])
	}

	return newState
}

export function getBitsFromNumber(
	quantityOfBits: number,
	source: number,
	operation: "MSB" | "LSB"
) {
	const mask = 0b11111111 >>> (8 - quantityOfBits)

	if (operation === "MSB") {
		return source >>> quantityOfBits
	} else {
		return source & mask
	}
}

export function getConcatenatedBytes(highByte: number, lowByte: number) {
	if ([highByte, lowByte].some(byte => byte > 0xff))
		throw Error("Attempting to concatenate bytes with more than 8 bits, likely a bug")

	return (highByte << 8) | lowByte
}

export function getRegisterPairValue(pairSpecifier: RegisterPair, originalState: CPUState): number {
	switch (pairSpecifier) {
		case "B": {
			const highOrderByte = getRegisterValue(Register.B, originalState)
			const lowOrderByte = getRegisterValue(Register.C, originalState)
			return getConcatenatedBytes(highOrderByte, lowOrderByte)
		}

		case "D": {
			const highOrderByte = getRegisterValue(Register.D, originalState)
			const lowOrderByte = getRegisterValue(Register.E, originalState)
			return getConcatenatedBytes(highOrderByte, lowOrderByte)
		}

		case "H": {
			const highOrderByte = getRegisterValue(Register.H, originalState)
			const lowOrderByte = getRegisterValue(Register.L, originalState)
			return getConcatenatedBytes(highOrderByte, lowOrderByte)
		}

		default:
			throw Error("Accessing undefined register pair")
	}
}

export function getRegisterValue(registerIdentifier: Register, originalState: CPUState) {
	const value = originalState.registers.get(registerIdentifier)

	if (value === undefined) throw Error("Attempting to access undefined register")

	return value
}
