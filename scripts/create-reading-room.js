import { writeReadingRoom } from '../examples/reading-room/project.js'
import { runCreator } from './creator/run.js'

await runCreator(writeReadingRoom, process.env.INIT_CWD || process.cwd())
