export interface Opcode {
    code: number;
    size: number;
    instruction: string;
    operands?: number[];
}