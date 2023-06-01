import { readFile } from "fs/promises";
import { Translator } from "../translator";
import { Opcode } from "../translator/types";
import { CpuState, Register, RegisterPair } from "./types";

// for reference https://en.wikipedia.org/wiki/Intel_8080
export class CPU {
    private static rom: Uint8Array | undefined;
    private static programCounter: number = 0x0000;
    private static stackPointer: number = 0x0000;
    private static registers: Map<Register, number> = new Map(Object.entries({
        [Register.B]: 0x00,
        [Register.C]: 0x00,
        [Register.D]: 0x00,
        [Register.E]: 0x00,
        [Register.H]: 0x00,
        [Register.L]: 0x00,
        [Register.A]: 0x00,
      }) as [Register, number][]);
    private static flags = new Map(Object.entries({ Z: 0b0, S: 0b0, P: 0b0, CY: 0b0, AC: 0b0 }));

    static async load(romPath: string): Promise<void> {
        const romBuffer = await readFile(romPath);
        this.rom = new Uint8Array(romBuffer);
    }

    static run() {
        if (!this.rom) {
            throw Error("ROM not loaded")
        }

        while (true) {
            if (this.programCounter >= this.rom.length) {
                break;
            }
            
            this.executeCycle()
        }

        console.log("Program finished")
    }

    private static executeCycle(): void {
        const currentInstruction = this.fetch();

        const newState = this.executeInstruction(currentInstruction, {
            programCounter: this.programCounter,
            stackPointer: this.stackPointer,
            registers: this.registers,
            flags: this.flags,
            memory: this.rom!,
        });

        // If the executed instruction did not changed the program counter, we add the actual instruction size to it
        // so in the next cycle, the program counter will be pointing to the correct next instruction
        this.programCounter === newState.programCounter && (newState.programCounter += currentInstruction.size)

        this.setCPUState(newState);
    }

    private static fetch(): Opcode {
        return Translator.decode(this.rom![this.programCounter], this.programCounter,this.rom!);
    }

    private static executeInstruction(opcode: Opcode, originalState: CpuState): CpuState {
        console.log(`ADDRESS: ${originalState.programCounter.toString(16)} CODE: $${opcode.code.toString(16)} OPERANDS: ${opcode.operands?.join(" ")} INSTRUCTION: ${opcode.instruction}}`)
        const newState: CpuState = { ...originalState }

        switch (opcode.code) {
            case 0x00: 
                return newState;

            case 0x06:  {
                newState.registers.set("B", Translator.getOpcodeSingleOperand(opcode))

                return newState
            }

            case 0x11: { // LXI D,D16
                return this.setValueIntoRegisterPair("D", [opcode.operands![1], opcode.operands![0]], newState)
            }

            case 0x1A: { // LDAX D
                const memoryAddress = this.getRegisterPairValue(Register.D, newState)
                const value = newState.memory[memoryAddress]

                newState.registers.set(Register.A, value)
                return newState;
            }

            case 0x21: { // LXI H,D16
                return this.setValueIntoRegisterPair("H", [opcode.operands![1], opcode.operands![0]], newState)
            }

            case 0x77: { // MOV M,A
                return this.setValueIntoRegisterPair("H", [opcode.operands![1], opcode.operands![0]], newState)
            }

            case 0xc3: // JMP Addr
                const jumpAddress = Translator.getOpcodeOperandsAsAddress(opcode);
                
                newState.programCounter = jumpAddress;

                return newState;

            case 0xCD: // CALL address
                const returnAddress = newState.memory[newState.programCounter] + opcode.size // address of next instruction

                // saves the return addres into the stackpointer memory
                newState.memory[newState.stackPointer - 1] = this.getBitsFromNumber(8, returnAddress, "MSB") // leftmost address byte
                newState.memory[newState.stackPointer - 2] = this.getBitsFromNumber(8, returnAddress, "LSB") // rightmost address btye

                const subroutineAddress = Translator.getOpcodeOperandsAsAddress(opcode);

                newState.programCounter = subroutineAddress; // program now will execute the routine
                newState.stackPointer -= 2; // before jumping into the subroutine, sets the stackpointer to the return address
            
                return newState;

            case 0x31:
                const routineAddress = Translator.getOpcodeOperandsAsAddress(opcode);

                newState.stackPointer = routineAddress;

                return newState;
        
            default:
                throw Error(`Opcode not implemented: CODE: $${opcode.code.toString(16)} OPERANDS: ${opcode.operands?.join(" ")} INSTRUCTION: ${opcode.instruction}}`)
        }
    }

    private static setValueIntoRegisterPair(pairSpecifier: RegisterPair, pairValues: [firstRegister: number, secondRegister: number], originalState: CpuState) {
        const newState = { ...originalState }

        switch (pairSpecifier) {
            case "B":
                newState.registers.set("B", pairValues[0])
                newState.registers.set("C", pairValues[1])
                return newState

            case "D":
                newState.registers.set("D", pairValues[0])
                newState.registers.set("E", pairValues[1])
                return newState

            case "H":
                newState.registers.set("H", pairValues[0])
                newState.registers.set("L", pairValues[1])
                return newState
        
            default:
                throw Error("Accessing undefined register pair")
        }
    }

    private static getRegisterPairValue(pairSpecifier: RegisterPair, originalState: CpuState): number {
        switch (pairSpecifier) {
            case "B": {
                const highOrderByte = originalState.registers.get("B")
                const lowOrderByte = originalState.registers.get("C")
                return this.getConcatenedBytes(highOrderByte, lowOrderByte)
            }

            case "D": {
                const highOrderByte = originalState.registers.get("D")
                const lowOrderByte = originalState.registers.get("E")
                return this.getConcatenedBytes(highOrderByte, lowOrderByte)
            }

            case "H": {
                const highOrderByte = originalState.registers.get("B")
                const lowOrderByte = originalState.registers.get("C")
                return this.getConcatenedBytes(highOrderByte, lowOrderByte)
            }
        
            default:
                throw Error("Accessing undefined register pair")
        }
    }

    private static getConcatenedBytes(highByte?: number, lowByte?: number) {
        if (highByte === undefined || lowByte === undefined) throw Error("Trying to get undefined register value")

        return (highByte << 8) | lowByte
    }

    private static setCPUState(newState: CpuState): void {
        this.programCounter = newState.programCounter;
        this.stackPointer = newState.stackPointer;
        this.registers = newState.registers as Map<Register, number>;
    }

    private static getBitsFromNumber(quantityOfBits: number, source: number, operation: "MSB" | "LSB") {
       const mask = 0b11111111 >>> (8 - quantityOfBits);

        if (operation === "MSB") {
            return source >>> quantityOfBits;
        } else {
            return source & mask;
        }
}
}