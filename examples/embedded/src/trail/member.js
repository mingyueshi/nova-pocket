// The club owns this offline fixture. Pocket never writes a second login token.
const key = 'trail-club:member:v1'
export const routeNoticeId = '河岸/集合'
const welcome = { id: routeNoticeId, title: '河岸步道集合地点', date: '路线公告', body: '请在南门步道入口集合。', read: false }

function load() {
  return uni.getStorageSync(key) || {
    signedIn: true, nickname: '林溪', reminders: true, joined: false, inbox: [{ ...welcome }],
  }
}

function write(member) {
  uni.setStorageSync(key, member)
}

function current() {
  const member = load()
  if (!member.signedIn) throw Object.assign(new Error('请先登录俱乐部'), { code: 'SESSION_EXPIRED' })
  return member
}

function identity(member) {
  return { id: 'trail-walker', nickname: member.nickname }
}

export function getSession() {
  const member = load()
  return member.signedIn ? identity(member) : null
}
export function signIn() { write({ ...load(), signedIn: true }) }
export function signOut() { write({ ...load(), signedIn: false }) }
export function updateProfile({ nickname }) {
  const member = { ...current(), nickname }
  write(member)
  return identity(member)
}

export function getReminders() { return current().reminders }
export function setReminders(enabled) { write({ ...current(), reminders: enabled }) }
export function hasJoined() { return Boolean(getSession() && load().joined) }
export function joinWalk() {
  const member = current()
  if (member.joined) return
  if (member.reminders) member.inbox.unshift({
    id: 'morning-walk', title: '已加入河岸晨行', date: '行程提醒', body: '你的步行行程已保存。', read: false,
  })
  write({ ...member, joined: true })
}

export const mailbox = {
  list: () => current().inbox,
  markRead(ids) {
    const member = current()
    write({ ...member, inbox: member.inbox.map(item => ids.includes(item.id) ? { ...item, read: true } : item) })
  },
}
