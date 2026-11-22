import { fileURLToPath } from 'node:url'
import { writeReadingRoom } from './project.js'

const output = fileURLToPath(new URL('../../.build/reading-room/', import.meta.url))
await writeReadingRoom(output)
console.log('示例项目已生成到 ' + output)
