import { Opcode } from "./types"
import opcodes from "./opcodes.json"

export class Translator {
    static table: Map<number, Opcode> = new Map();

    static loadOpcodes() {
        for (const opcode of opcodes) {
            const code = parseInt(opcode.code, 16);

            this.table.set(code, {
                code,
                instruction: opcode.instruction,
                size:opcode.size
            })
        }
    }

    static decode(instructionCode: number, instructionAddress?: number, loadedProgram?: Uint8Array): Opcode {
        const opcode = this.table.get(instructionCode)
        
        if(!opcode) {
            throw Error("Opcode not found")
        }

        if (instructionAddress && loadedProgram && opcode.size > 1) {
            opcode.operands = this.fetchOpcodeOperands(opcode, instructionAddress, loadedProgram);
        }
        
        return opcode;
    }

    private static fetchOpcodeOperands(opcode: Opcode, instructionAddress: number, loadedProgram: Uint8Array): number[] {
        const opcodeArguments = [];

        for (let i = 1; i < opcode.size; i++) {
            opcodeArguments.push(loadedProgram[instructionAddress + i]);
        }

        return opcodeArguments;
    }

    static getOpcodeOperandsAsAddress(opcode: Opcode): number {
        if (!opcode.operands) {
            throw Error("No operands found")
        }

        return opcode.operands[1] << 8 | opcode.operands[0];
    }

    static getOpcodeSingleOperand(opcode: Opcode): number {
        if (!opcode.operands) {
            throw Error("No operands found")
        }

        if (opcode.operands.length !== opcode.size - 1) {
            throw Error("Unexpected number of operand for instruction")
        }

        return opcode.operands[0];
    }
}