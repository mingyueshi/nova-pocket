import config from '../pocket.config.js'
import { createDemoAdapters } from './demo.js'

// Applications can replace either adapter independently.
const storageKey = 'nova-pocket:demo:v1'
export const { auth, messages } = createDemoAdapters({
  load: () => uni.getStorageSync(storageKey),
  save: snapshot => uni.setStorageSync(storageKey, snapshot),
})
export const demoSettingsEnabled = Boolean(config.demoSettings && auth.demo && messages?.demo)
