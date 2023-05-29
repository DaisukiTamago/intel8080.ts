import { readFile, writeFile } from 'fs/promises';
import { Translator } from '../translator';

class Disassembler {
    private filePath: string;
    private rom: Uint8Array | undefined;
    private programCounter: number = 0;

    constructor(filePath: string) {
        this.filePath = filePath;
    }

    async load() {
        const file = await readFile(this.filePath);
        this.rom = new Uint8Array(file);
    }

    async disassemble() {
        const disassembledInstructions: string[] = [];

        if (!this.rom) {
            return;
        }

        let instruction = this.rom[this.programCounter]

        while (instruction !== undefined) {
            const opcode = Translator.decode(this.rom[this.programCounter])
            const disassembledInstruction = []
            const dataBytes = []
            let instructionSpacesPadding = 6;

            for (let i = 1; i < opcode.size; i++) {
                dataBytes.push(this.rom[this.programCounter + i]);
                instructionSpacesPadding -= 3;
            }

            const instructionAddress = String(this.programCounter).padStart(4, '0')
            const instructionData = dataBytes.map(value => value.toString(16).padStart(2, '0'))
            const instructionCode = opcode.code.toString(16).padStart(2, '0').concat(" ".repeat(instructionSpacesPadding))

            disassembledInstruction.push(instructionAddress, instructionCode)
            dataBytes.length >= 1 && disassembledInstruction.push(instructionData.join(" "))
            disassembledInstruction.push(opcode.instruction)

            disassembledInstructions.push(disassembledInstruction.join(" "))

            opcode.size > 0 ? this.programCounter += opcode.size : this.programCounter++;

            instruction = this.rom[this.programCounter]
        }

        if (instruction === undefined) {
            await writeFile(`${this.filePath}.asm`, disassembledInstructions.join("\n"))
            return;
        }
    }
}

async function main() {
    process.stdout.write("\u001b[2J\u001b[0;0H");
    Translator.loadOpcodes()
    const ds = new Disassembler(process.argv[2]);
    await ds.load();
    await ds.disassemble();
}

main();