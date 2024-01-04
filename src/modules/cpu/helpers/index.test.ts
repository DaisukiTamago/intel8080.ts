import {getConcatenatedBytes, getRegisterPairValue, getRegisterValue, setValueIntoRegisterPair} from "./index"
import {generateCPUState} from "../../../../__tests__/stubs/CPU"
import {Register} from "../types"

describe("CPU Helpers", () => {
	describe("tests byte concatenation", () => {
		it("should concat two bytes", () => {
			expect(getConcatenatedBytes(0b11110000, 0b0)).toEqual(0b1111000000000000)
			expect(getConcatenatedBytes(0b11110000, 0b1)).toEqual(0b1111000000000001)
			expect(getConcatenatedBytes(0b11110000, 0b10)).toEqual(0b1111000000000010)
			expect(getConcatenatedBytes(0b11110000, 0b10000000)).toEqual(0b1111000010000000)
			expect(getConcatenatedBytes(0xFF, 0xF0)).toEqual(0b1111111111110000)
			expect(getConcatenatedBytes(0x0, 0xF)).toEqual(0x0F)
		})

		it("should throw an error if either byte is undefined", () => {
			expect(() => getConcatenatedBytes(undefined, 0)).toThrow()
			expect(() => getConcatenatedBytes(0, undefined)).toThrow()
		})

		it("should throw an error if either byte is greater than 8 bits", () => {
			expect(() => getConcatenatedBytes(0xFFFF, 0)).toThrow()
			expect(() => getConcatenatedBytes(0, 0xFFFF)).toThrow()
		})
	})

	describe("tests getting register pair value", () => {
		it("should return the correct value contained in a register pair for given CPU state", () => {
			const cpuState = generateCPUState()

			cpuState.registers.set("B", 0xF0)
			cpuState.registers.set("C", 0xF0)

			cpuState.registers.set("D", 0xAB)
			cpuState.registers.set("E", 0xCD)

			cpuState.registers.set("H", 0xEE)
			cpuState.registers.set("L", 0xFF)

			expect(getRegisterPairValue("B", cpuState)).toEqual(0xF0F0)
			expect(getRegisterPairValue("D", cpuState)).toEqual(0xABCD)
			expect(getRegisterPairValue("H", cpuState)).toEqual(0xEEFF)
		})

		it("should throw an error if the register pair is undefined", () => {
			const cpuState = generateCPUState()

			cpuState.registers.set("B", 0xF0)
			cpuState.registers.set("C", 0xF0)

			expect(() => getRegisterPairValue("D", cpuState)).toThrow()
		})

		it("should throw an error if the register pair does not exist", () => {
			const cpuState = generateCPUState()

			// @ts-expect-error - intentionally passing invalid register pair
			expect(() => getRegisterPairValue("I DONT EXIST AT ALL LMAO", cpuState)).toThrow()
		})

		it("should throw an error if only one of the registers is defined", () => {
			const cpuState = generateCPUState()

			cpuState.registers.set("D", 0xF0)
			cpuState.registers.set("C", 0xF0)

			expect(() => getRegisterPairValue("D", cpuState)).toThrow()
		})
	})

	describe("tests setting register pair value", () => {
		it("should set the correct values in a register pair for given CPU state", () => {
			const cpuState = generateCPUState()

			expect(getRegisterPairValue("B", setValueIntoRegisterPair("B", [0xAB, 0xCD], cpuState))).toEqual(0xABCD)
			expect(getRegisterPairValue("D", setValueIntoRegisterPair("D", [0x12, 0x34], cpuState))).toEqual(0x1234)
			expect(getRegisterPairValue("H", setValueIntoRegisterPair("H", [0x96, 0x69], cpuState))).toEqual(0x9669)

			expect(getRegisterPairValue("B", setValueIntoRegisterPair("B", 0xABCD, cpuState))).toEqual(0xABCD)
			expect(getRegisterPairValue("D", setValueIntoRegisterPair("D", 0X1234, cpuState))).toEqual(0x1234)
			expect(getRegisterPairValue("H", setValueIntoRegisterPair("H", 0X9669, cpuState))).toEqual(0x9669)
		})

		it("should throw an error if the register pair does not exist", () => {
			const cpuState = generateCPUState()

			// @ts-expect-error - intentionally passing invalid register pair
			expect(() => setValueIntoRegisterPair("I DONT EXIST AT ALL LMAO", 0x1234, cpuState)).toThrow()
		})
	})

	describe("tests getting single register value", () => {
		it("should return the correct value contained in a register for given CPU state", () => {
			const cpuState = generateCPUState()

			cpuState.registers.set("B", 0xAA)
			cpuState.registers.set("C", 0xBB)
			cpuState.registers.set("D", 0xCC)
			cpuState.registers.set("E", 0xDD)
			cpuState.registers.set("H", 0xEE)
			cpuState.registers.set("L", 0xFF)

			expect(getRegisterValue(Register.B, cpuState)).toEqual(0xAA)
			expect(getRegisterValue(Register.C, cpuState)).toEqual(0xBB)
			expect(getRegisterValue(Register.D, cpuState)).toEqual(0xCC)
			expect(getRegisterValue(Register.E, cpuState)).toEqual(0xDD)
			expect(getRegisterValue(Register.H, cpuState)).toEqual(0xEE)
			expect(getRegisterValue(Register.L, cpuState)).toEqual(0xFF)
		})

		it("should throw an error if the register value is undefined", () => {
			const cpuState = generateCPUState()

			expect(() => getRegisterValue(Register.L, cpuState)).toThrow()
		})
	})
})

