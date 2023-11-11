import { Opcode } from "../../translator/types"
import { CPUState } from "../types"

export type OpcodeHandler = (initialState: CPUState, instructionData: Opcode) => CPUState;