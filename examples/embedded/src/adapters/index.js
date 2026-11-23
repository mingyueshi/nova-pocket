import { getSession, mailbox, signOut, updateProfile } from '../trail/member.js'

/** @satisfies {import('#pocket/types').AuthAdapter} */
export const auth = { getSession, updateProfile, logout: signOut }
/** @satisfies {import('#pocket/types').MessageAdapter} */
export const messages = mailbox
