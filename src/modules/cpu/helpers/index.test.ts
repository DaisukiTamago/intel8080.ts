import {
	getConcatenatedBytes,
	getRegisterPairValue,
	getRegisterValue,
	setValueIntoRegisterPair
} from "./index"
import { generateCPUState } from "../../../../__tests__/stubs/CPU"
import { Register } from "../types"

describe("CPU Helpers", () => {
	describe("tests byte concatenation", () => {
		it("should concat two bytes", () => {
			expect(getConcatenatedBytes(0b11110000, 0b0)).toEqual(0b1111000000000000)
			expect(getConcatenatedBytes(0b11110000, 0b1)).toEqual(0b1111000000000001)
			expect(getConcatenatedBytes(0b11110000, 0b10)).toEqual(0b1111000000000010)
			expect(getConcatenatedBytes(0b11110000, 0b10000000)).toEqual(0b1111000010000000)
			expect(getConcatenatedBytes(0xff, 0xf0)).toEqual(0b1111111111110000)
			expect(getConcatenatedBytes(0x0, 0xf)).toEqual(0x0f)
		})

		it("should throw an error if either byte is greater than 8 bits", () => {
			expect(() => getConcatenatedBytes(0xffff, 0)).toThrow()
			expect(() => getConcatenatedBytes(0, 0xffff)).toThrow()
		})
	})

	describe("tests getting register pair value", () => {
		it("should return the correct value contained in a register pair for given CPU state", () => {
			const cpuState = generateCPUState()

			cpuState.registers.set("B", 0xf0)
			cpuState.registers.set("C", 0xf0)

			cpuState.registers.set("D", 0xab)
			cpuState.registers.set("E", 0xcd)

			cpuState.registers.set("H", 0xee)
			cpuState.registers.set("L", 0xff)

			expect(getRegisterPairValue("B", cpuState)).toEqual(0xf0f0)
			expect(getRegisterPairValue("D", cpuState)).toEqual(0xabcd)
			expect(getRegisterPairValue("H", cpuState)).toEqual(0xeeff)
		})

		it("should throw an error if the register pair is undefined", () => {
			const cpuState = generateCPUState()

			cpuState.registers.set("B", 0xf0)
			cpuState.registers.set("C", 0xf0)

			expect(() => getRegisterPairValue("D", cpuState)).toThrow()
		})

		it("should throw an error if the register pair does not exist", () => {
			const cpuState = generateCPUState()

			// @ts-expect-error - intentionally passing invalid register pair
			expect(() => getRegisterPairValue("I DONT EXIST AT ALL LMAO", cpuState)).toThrow()
		})

		it("should throw an error if only one of the registers is defined", () => {
			const cpuState = generateCPUState()

			cpuState.registers.set("D", 0xf0)
			cpuState.registers.set("C", 0xf0)

			expect(() => getRegisterPairValue("D", cpuState)).toThrow()
		})
	})

	describe("tests setting register pair value", () => {
		it("should set the correct values in a register pair for given CPU state", () => {
			const cpuState = generateCPUState()

			expect(
				getRegisterPairValue("B", setValueIntoRegisterPair("B", [0xab, 0xcd], cpuState))
			).toEqual(0xabcd)
			expect(
				getRegisterPairValue("D", setValueIntoRegisterPair("D", [0x12, 0x34], cpuState))
			).toEqual(0x1234)
			expect(
				getRegisterPairValue("H", setValueIntoRegisterPair("H", [0x96, 0x69], cpuState))
			).toEqual(0x9669)

			expect(getRegisterPairValue("B", setValueIntoRegisterPair("B", 0xabcd, cpuState))).toEqual(
				0xabcd
			)
			expect(getRegisterPairValue("D", setValueIntoRegisterPair("D", 0x1234, cpuState))).toEqual(
				0x1234
			)
			expect(getRegisterPairValue("H", setValueIntoRegisterPair("H", 0x9669, cpuState))).toEqual(
				0x9669
			)
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

			cpuState.registers.set("B", 0xaa)
			cpuState.registers.set("C", 0xbb)
			cpuState.registers.set("D", 0xcc)
			cpuState.registers.set("E", 0xdd)
			cpuState.registers.set("H", 0xee)
			cpuState.registers.set("L", 0xff)

			expect(getRegisterValue(Register.B, cpuState)).toEqual(0xaa)
			expect(getRegisterValue(Register.C, cpuState)).toEqual(0xbb)
			expect(getRegisterValue(Register.D, cpuState)).toEqual(0xcc)
			expect(getRegisterValue(Register.E, cpuState)).toEqual(0xdd)
			expect(getRegisterValue(Register.H, cpuState)).toEqual(0xee)
			expect(getRegisterValue(Register.L, cpuState)).toEqual(0xff)
		})

		it("should throw an error if the register value is undefined", () => {
			const cpuState = generateCPUState()

			expect(() => getRegisterValue(Register.L, cpuState)).toThrow()
		})
	})
})
