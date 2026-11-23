// Public contracts for pocket.config.js and src/adapters/index.js.
export type ThemeBase = 'blue' | 'teal' | 'dark'
export interface PocketTheme {
  label: string
  base: ThemeBase
  /** Theme colors use six hex digits, e.g. #804322. */
  brand?: string
  brandOn?: string
  iconAccent?: string
  soft?: string
  canvas?: string
  hero?: string
  heroStart?: string
  heroStyle?: 'solid' | 'gradient'
}
type Tab = 'home' | 'services' | 'messages' | 'mine'
type Entry<Key = string> = [key: Key, label: string, icon: string, description?: string]
type BuiltInBlock = 'identity' | 'status' | 'shortcuts' | 'management' | 'more' | 'demo' | 'business'
export type PocketBlock = BuiltInBlock
  | { type: 'identity', enabled?: boolean, actions?: boolean }
  | { type: Exclude<BuiltInBlock, 'identity'>, enabled?: boolean }
  | { type: 'menu', title: string, entries: string[], enabled?: boolean }
export interface PocketConfig {
  brand: { name: string, subtitle?: string, logo?: string }
  /** ID of a built-in or registered theme. Validated before either platform builds. */
  defaultTheme: string
  themes?: Record<string, PocketTheme>
  defaultLayout: 'overview' | 'shortcuts' | 'minimal'
  demoSettings?: boolean
  tabs: Entry<Tab>[]
  shortcuts: Entry[]
  blocks?: Partial<Record<'home' | 'mine', PocketBlock[]>>
  modules: Record<string, {
    enabled: boolean, label?: string, icon?: string, description?: string, requiresLogin?: boolean, page?: string
  }>
  host?: { accountTab: string, loginPage: string }
  accountPages?: Partial<Record<'security' | 'activity' | 'notifications' | 'privacy' | 'help', string>>
}

type Result<T> = T | Promise<T>
export interface PocketUser { id: string | number, nickname: string, mode?: 'member' | 'incomplete' }
type Credentials = { account: string, password: string, code: string }
type Login = { account: string } & ({ method: 'password', password: string } | { method: 'code', code: string })
export interface AuthAdapter {
  getSession(): Result<PocketUser | null>
  login?(form: Login): Result<PocketUser>
  register?(form: Credentials & { nickname: string }): Result<PocketUser>
  recover?(form: Credentials): Result<unknown>
  sendCode?(input: { account: string, purpose: 'login' | 'register' | 'recover' }): Result<{ hint?: string } | void>
  updateProfile?(profile: { nickname: string }): Result<PocketUser>
  logout?(): Result<unknown>
}
export interface PocketMessage { id: string, title: string, date: string, body: string, read: boolean }
type ReadResult = { unreadCount?: number } | void
type MessageSummary = Omit<PocketMessage, 'body'> & { body?: string }
type MessagePage = { items: MessageSummary[], nextCursor: string | null, unreadCount: number }
export type MessageAdapter = { markRead(ids: string[]): Result<ReadResult> } & (
  { list(): Result<PocketMessage[]>, listPage?: never } |
  {
    list?(): Result<PocketMessage[]>
    listPage(query: { cursor: string | null, limit: number }): Result<MessagePage>
    get(id: string): Result<PocketMessage | null>
    markAllRead(): Result<ReadResult>
  }
)
export interface PocketAdapters { auth: AuthAdapter, messages?: MessageAdapter | null }
