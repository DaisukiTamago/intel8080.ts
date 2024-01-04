import { CPU } from "."
import { resolve } from "path"
import { Translator } from "../translator"

describe("CPU", () => {
	let cpu = new CPU()

	beforeEach(() => {
		Translator.loadOpcodes()
		cpu = new CPU() // reset CPU state before each test
	})

	describe("Memory Routines", () => {
		it("should load the ROM file into memory", async () => {
			const filePath = resolve(__dirname, "../../../roms/invaders") 

			await cpu.load(filePath)
			
			expect(cpu.state.memory).toBeDefined()
		})

		it("should throw an error if running without loaded program in memory", () => {
			expect(cpu.state.memory).toBeUndefined()
			expect(() => { cpu.run() }).toThrow()
		})
	})

	describe("CPU Routines", () => {
		it("should be able to run rom", async () => {
			const filePath = resolve(__dirname, "../../../roms/invaders") 

			await cpu.load(filePath)
			
			expect(() => { cpu.run() }).toThrow()
		})
	})
})

