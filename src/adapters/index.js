import config from '../pocket.config.js'
import { createDemoAdapters } from './demo.js'

// Applications can replace either adapter independently.
export const { auth, messages } = createDemoAdapters()
export const demoSettingsEnabled = Boolean(config.demoSettings && auth.demo && messages.demo)
