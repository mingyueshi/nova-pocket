#!/usr/bin/env node
import { cp, rename } from 'node:fs/promises'
import { join } from 'node:path'
import { runCreator } from './run.js'

await runCreator(async (output, template) => {
  await cp(new URL('./templates/' + template + '/', import.meta.url), output, { recursive: true })
  await rename(join(output, 'gitignore.template'), join(output, '.gitignore'))
  await rename(join(output, 'package-lock.json.template'), join(output, 'package-lock.json'))
})
