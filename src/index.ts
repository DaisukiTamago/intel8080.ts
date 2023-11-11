// self invoked 

import { CPU } from "./modules/cpu"
import { Translator } from "./modules/translator";

(async () => {
	const romPath = "./roms/invaders" || process.argv[2]
	Translator.loadOpcodes()
	await CPU.load(romPath)

	CPU.run()
})()