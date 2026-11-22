import { writeProject } from '../examples/projects.js'
import { runCreator } from './creator/run.js'

await runCreator(writeProject, process.env.INIT_CWD || process.cwd())
