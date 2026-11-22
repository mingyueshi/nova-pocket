import { fileURLToPath } from 'node:url'
import { writeProject } from '../projects.js'

const output = fileURLToPath(new URL('../../.build/reading-room/', import.meta.url))
await writeProject(output, 'reading-room')
console.log('示例项目已生成到 ' + output)
