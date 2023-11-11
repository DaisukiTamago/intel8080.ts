// self invoked 

import { CPU } from "./modules/cpu"
import { Translator } from "./modules/translator";

(async () => {
	const romPath = "./roms/invaders" || process.argv[2]
	Translator.loadOpcodes()
	
	const INTEL_8080 = new CPU()
	await INTEL_8080.load(romPath)

	INTEL_8080.run()
})()