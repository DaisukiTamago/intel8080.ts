import { Opcode } from "./types"
import opcodes from "./opcodes.json"

export class Translator {
    static table: Map<number, Opcode> = new Map();

    static loadOpcodes() {
        for (const opcode of opcodes) {
            // console.log("Loading: ", opcode.code);
            const code = parseInt(opcode.code, 16);

            this.table.set(code, {
                code,
                instruction: opcode.instruction,
                size:opcode.size
            })
        }
    }

    static decode(bytesToTranslate: number) {
        const opcode = this.table.get(bytesToTranslate)
        
        if(!opcode) {
            throw Error("Opcode not found")
        }
        
        return opcode;
    }
}