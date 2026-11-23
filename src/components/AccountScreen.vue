<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { configuredBlocks, resolveBlocks } from '../account-blocks.js'
import AccountIdentity from './AccountIdentity.vue'
import NovaIcon from './NovaIcon.vue'
import NovaRow from './NovaRow.vue'
// #ifdef NOVA_POCKET_DEMO_STATS
import ServiceStats from './ServiceStats.vue'
// #endif
// #ifdef NOVA_POCKET_DEMO_ORDERS
import ServiceOrders from './ServiceOrders.vue'
// #endif
// #ifdef NOVA_POCKET_DEMO_REVIEWS
import ServiceReviews from './ServiceReviews.vue'
// #endif
import MessagePanel from './MessagePanel.vue'
import StatePanel from './StatePanel.vue'
import { useHeaderPadding } from '../use-header-padding.js'
import config from '../pocket.config.js'
import { auth, demoSettingsEnabled } from '../adapters/index.js'
import { accountTarget, host, requiresLogin, isTab, openAccountView, returnToAccountHome, services, shortcuts, tabs, viewNames } from '../account-navigation.js'
// #ifdef NOVA_POCKET_DEMO_RECORDS
import { resetServiceDemo } from '../service-demo.js'
// #endif
import { account, activeTheme, mutedTone as tone, authRoute, confirm, hint, layouts, modes, reset, scenarios, state, themes } from '../state.js'

const props = defineProps({ route: String, recordId: String, tab: String, active: Boolean })
const emit = defineEmits(['back', 'select-tab'])
const headerPadding = useHeaderPadding()
const serviceLabels = services.map(([, label]) => label).join('、')
const navigationLabels = tabs.map(([, label]) => label).join('、')
const configured = configuredBlocks(config.blocks)
const presets = [['layout', '首页布局', layouts], ['mode', '账户状态', modes], ['theme', '界面主题', themes], ['scenario', '消息状态', scenarios]].filter(([key]) => key !== 'layout' || !configured.home)
const guest = computed(() => state.mode === 'guest')
const isHome = computed(() => props.route === 'home')
const isDetail = computed(() => props.route !== props.tab)
const canLogin = Boolean(host?.loginPage || auth.login)
const canLogout = typeof auth.logout === 'function'
const canRegister = !host && Boolean(auth.register && auth.sendCode)
const accountRows = [
  ['profile', '个人资料', 'user-round'], ['security', '账户安全', 'shield-check'], ['settings', '账户设置', 'settings'],
  ['activity', '最近活动', 'clock-3'], ['help', '帮助与反馈', 'circle-help'], ['privacy', '隐私说明', 'shield-check'],
  ['messages', '消息中心', 'bell'], ['notifications', '通知偏好', 'bell'], ['demo', '演示设置', 'sparkles', '切换首页、主题与模拟状态'],
]
const entries = new Map([...accountRows, ...tabs, ...services, ...shortcuts]
  .filter(([key]) => viewNames[key]).map(row => [row[0], row]))
const defaults = new Map(accountRows.filter(([key]) => viewNames[key]).map(row => [row[0], row]))
const blocks = computed(() => {
  const login = canLogin ? ['login', canRegister ? '登录或注册' : '登录', 'log-in'] : null
  const profile = guest.value ? login : defaults.get('profile')
  const service = isHome.value && isTab('services') ? ['services', viewNames.services, 'layers', serviceLabels] : null
  const groups = {
    shortcuts: { title: state.layout === 'shortcuts' ? '常用操作' : '快捷入口', rows: shortcuts },
    management: { title: '账户管理', rows: [profile, defaults.get('security'), defaults.get('settings')].filter(Boolean) },
    more: { title: isHome.value ? '动态与帮助' : '更多', rows: [service, defaults.get('activity'), defaults.get('help')].filter(Boolean) },
    demo: { title: '关于', rows: defaults.has('demo') ? [defaults.get('demo')] : [] },
  }
  const statusAvailable = guest.value ? canLogin : state.mode === 'incomplete' ? viewNames.profile : viewNames.security
  return resolveBlocks(configured, { page: props.route, layout: state.layout, embedded: Boolean(host), groups, entries, statusAvailable })
})
const unread = computed(() => account.inbox.unreadCount)
const scrollTo = ref(0)
let scrollPosition = 0

watch(() => props.route, async () => {
  scrollTo.value = scrollPosition
  await nextTick()
  scrollTo.value = 0
})

function storeScroll(event) {
  scrollPosition = event.detail.scrollTop
}

function openAuth(kind, view = props.route, id = props.recordId) {
  return authRoute(kind, false, accountTarget(view, id, props.tab))
}

function page(dest, id) {
  if (isTab(dest)) {
    emit('select-tab', dest)
  } else if (dest === 'login' || (guest.value && ['profile', 'security', 'activity'].includes(dest))) {
    openAuth('login', dest === 'login' ? props.route : dest, id)
  } else {
    openAccountView(dest, id, props.tab)
  }
}

function serviceNavigate({ view, id }) {
  page(view, id)
}

function option(key, values) {
  return values.findIndex(([value]) => value === state[key])
}

function select(key, values, event) {
  const choice = values[Number(event.detail.value)]
  if (!choice) return
  if (key === 'mode' && demoSettingsEnabled) account.useDemoSession(auth.setMode(choice[0]))
  else state[key] = choice[0]
  hint('已切换：' + choice[1])
}

async function logout() {
  if (!await confirm('退出当前账号？', '退出后可重新登录。', '退出')) return
  try {
    await account.logout()
    state.messageFilter = 'all'
    emit('select-tab', 'mine')
  } catch (error) {
    hint(error.message || '退出失败，请重试')
  }
}

async function restore() {
  if (!await confirm('重置演示？', '布局、主题、昵称和消息状态都会恢复默认。', '重置')) return
  reset()
  // #ifdef NOVA_POCKET_DEMO_RECORDS
  resetServiceDemo()
  // #endif
  hint('演示已重置')
}

function explain(title, content) {
  uni.showModal({ title, content, showCancel: false, confirmText: '知道了' })
}

</script>
<template>
<view class="surface np-surface account-app" :style="activeTheme.style" :class="[activeTheme.base, {'host-tab':host && !isDetail, embedded:!!host}]">
 <scroll-view scroll-y class="screen" :scroll-top="scrollTo" @scroll="storeScroll">
  <view class="shell" :style="headerPadding">
   <view class="app-head" :class="{'sub-head':isDetail}">
    <button role="button" v-if="isDetail" class="icon-button" aria-label="返回上一页" @tap="$emit('back')"><NovaIcon name="chevron-left" :tone="tone" /></button>
    <view class="heading"><text class="title" role="heading" aria-level="1">{{viewNames[route] || '页面未找到'}}</text><text v-if="!isDetail" class="note">{{config.brand.name}}</text></view>
    <button v-if="isHome && !configured.home && viewNames.settings" class="icon-button" aria-label="账户设置" @tap="page('settings')"><NovaIcon name="settings" :tone="tone" /></button>
   </view>

   <StatePanel v-if="!viewNames[route]" title="页面不可用" action="返回账户中心" @action="returnToAccountHome" />
   <StatePanel v-else-if="account.session.status==='loading' || account.session.status==='idle'" title="正在加载账户…" />
   <StatePanel v-else-if="account.session.status==='error'" title="暂时无法加载账户" :detail="account.session.error" action="重试" @action="account.restoreSession" />
   <view v-else-if="account.session.expired" class="np-stack">
    <StatePanel title="登录已过期" detail="重新登录后可继续查看当前页面。" action="重新登录" @action="openAuth('login')" />
    <button class="link" @tap="account.session.expired=false">继续以访客身份浏览</button>
   </view>
   <StatePanel v-else-if="guest && requiresLogin(route)" title="登录后可查看这项服务" action="去登录" @action="openAuth('login')" />
   <view v-else-if="route==='home'||route==='mine'" class="account-grid">
    <template v-for="block in blocks" :key="block.key">
     <AccountIdentity v-if="block.type==='identity'" :compact="isHome && state.layout!=='overview'"
       :actions="block.actions!==false" :can-login="canLogin" :can-register="canRegister"
       @login="openAuth('login')" @register="openAuth('register')" @profile="page('profile')" />
     <view v-else-if="block.type==='status'" class="panel status-panel">
      <view class="status-icon"><NovaIcon :name="guest?'user-round':state.mode==='incomplete'?'circle-alert':'shield-check'" :tone="activeTheme.iconAccent" :size="23" /></view>
      <view class="status-copy"><text class="section-title">{{guest?'体验完整账户功能':state.mode==='incomplete'?'个人资料待完善':'账户状态正常'}}</text><text class="note">{{guest?'登录后可管理个人资料。':state.mode==='incomplete'?'可随时完善展示昵称。':'可管理个人资料与账户设置。'}}</text></view>
      <button class="btn status-action" @tap="page(guest?'login':state.mode==='incomplete'?'profile':'security')">{{guest?'去登录':state.mode==='incomplete'?'去完善':'查看安全'}}</button>
     </view>
     <slot v-else-if="block.type==='business'" name="business" />
     <view v-else class="block">
      <text class="section-title block-title">{{block.title}}</text>
      <view class="rows">
       <NovaRow v-for="[key,label,icon,detail] in block.rows" :key="key" :icon="icon" :label="label" :detail="detail"
         :tone="block.type==='shortcuts'||block.type==='menu' ? activeTheme.iconAccent : tone" @select="page(key)" />
      </view>
     </view>
    </template>
   </view>

   <view v-else-if="route==='services'" class="details">
    <view class="service-banner">
     <view class="service-symbol"><NovaIcon name="layers" tone="white" :size="25" /></view>
     <text class="service-title">常用服务</text><text class="service-note">{{serviceLabels}}</text>
    </view>
    <view class="block"><text class="section-title block-title">服务记录</text><view class="rows">
     <NovaRow v-for="[key,label,icon,detail] in services" :key="key" :icon="icon" :label="label" :detail="detail" :tone="tone" @select="page(key)" />
    </view></view>
    <text v-if="demoSettingsEnabled" class="note">这里使用模拟记录，不会产生付款、交易或公开评论。</text>
   </view>
   <!-- #ifdef NOVA_POCKET_DEMO_STATS -->
   <view v-else-if="route==='stats'" class="details"><ServiceStats /></view>
   <!-- #endif -->
   <!-- #ifdef NOVA_POCKET_DEMO_ORDERS -->
   <view v-else-if="route==='orders'||route==='order'" class="details"><ServiceOrders :view="route" :id="recordId" @navigate="serviceNavigate" /></view>
   <!-- #endif -->
   <!-- #ifdef NOVA_POCKET_DEMO_REVIEWS -->
   <view v-else-if="route==='reviews'||route==='review'" class="details"><ServiceReviews :view="route" :id="recordId" @navigate="serviceNavigate" /></view>
   <!-- #endif -->

   <view v-else-if="route==='messages' || route==='message'" class="details">
    <MessagePanel :detail="route==='message'" :record-id="recordId" :active="active" :tone="tone" @login="openAuth('login')" @open="page('message', $event)" />
   </view>

   <view v-else class="details">
    <view v-if="route==='demo'">
     <text class="note">预设只影响当前演示，不使用真实账号或数据。</text>
     <view class="rows extra">
      <picker v-for="[key,label,values] in presets" :key="key" :range="values.map(v=>v[1])" :value="option(key,values)" @change="select(key,values,$event)">
       <view class="pick-row"><text class="pick-label">{{label}}</text><text class="pick-value">{{values[option(key,values)][1]}}</text><NovaIcon name="chevron-right" :tone="tone" :size="15" /></view>
      </picker>
     </view>
     <view class="actions extra"><button v-if="isTab('home')" class="btn primary" @tap="$emit('select-tab', 'home')">查看概览</button><button v-if="isTab('messages')" class="btn" @tap="$emit('select-tab', 'messages')">查看消息</button><button class="link" @tap="restore">重置演示</button></view>
     <view class="rows extra"><NovaRow icon="log-in" label="登录页演示" :tone="tone" @select="openAuth('login')" /><NovaRow icon="user-round" label="注册页演示" :tone="tone" @select="openAuth('register')" /></view>
    </view>
    <view v-else-if="route==='profile'"><slot name="profile" /></view>
    <view v-else-if="route==='settings'" class="rows">
     <NovaRow v-if="viewNames.notifications" icon="bell" label="通知偏好" :tone="tone" @select="page('notifications')" />
     <picker v-if="!host" :range="themes.map(v=>v[1])" :value="option('theme',themes)" @change="select('theme',themes,$event)"><view class="pick-row"><text class="pick-label">外观</text><text class="pick-value">{{themes[option('theme',themes)][1]}}</text><NovaIcon name="chevron-right" :tone="tone" :size="15" /></view></picker>
     <NovaRow v-if="viewNames.privacy" icon="shield-check" label="隐私说明" :tone="tone" @select="page('privacy')" />
     <NovaRow v-if="guest ? canLogin : canLogout" :icon="guest?'log-in':'log-out'" :label="guest?'登录':'退出登录'" :tone="tone" @select="guest?openAuth('login'):logout()" />
    </view>
    <view v-else-if="route==='security'&&!guest" class="rows">
     <NovaRow icon="monitor" label="登录设备" :tone="tone" @select="explain('登录设备','这里只有一个模拟会话，不读取真实设备。')" />
     <NovaRow icon="key-round" label="验证方式" :tone="tone" @select="explain('验证方式','实际验证由接入的小程序处理。本演示不会发送验证码。')" />
     <NovaRow icon="shield-check" label="注销流程说明" :tone="tone" @select="explain('注销流程','正式产品需核验身份并告知影响；本演示不接收注销申请。')" />
    </view>
    <view v-else-if="route==='activity'&&!guest" class="rows">
     <NovaRow icon="shield-check" label="安全检查" tail="今天" :tone="tone" @select="explain('安全检查','示例：最近一次安全检查已完成。')" />
     <NovaRow icon="user-round" label="资料更新" tail="昨天" :tone="tone" @select="explain('资料更新','示例：账户资料已更新。')" />
    </view>
    <view v-else-if="guest&&['security','activity'].includes(route)" class="panel">
     <text class="section-title">请先登录账号</text><button class="btn extra" @tap="page('login')">去登录</button>
    </view>
    <view v-else-if="route==='privacy'" class="panel"><text class="section-title">隐私说明</text><text class="note extra">{{auth.demo && demoSettingsEnabled ? '本机保存演示会话、昵称和消息已读状态，可在演示设置中重置。' : '有关账号和通知的数据处理方式，请查阅服务提供方的隐私政策。'}}</text></view>
    <view v-else-if="route==='help'" class="panel"><text class="section-title">使用帮助</text><text class="note extra">底部可以切换{{navigationLabels}}。</text></view>
    <StatePanel v-else title="页面不可用" detail="这个入口可能已关闭或链接有误。" action="返回账户中心" @action="returnToAccountHome" />
   </view>
  </view>
 </scroll-view>
 <view v-if="!host" class="tabbar" role="navigation" aria-label="底部导航">
  <button v-for="[key,label,icon] in tabs" :key="key" role="button" tabindex="0" class="tab-button"
    :class="{active:tab===key}" :aria-current="tab===key?'page':undefined"
    :aria-label="key==='messages' && !guest && state.scenario==='normal' && unread ? label+'，'+unread+' 条未读通知' : label"
    @tap="$emit('select-tab', key)" @keydown.enter.prevent="$emit('select-tab', key)" @keydown.space.prevent="$emit('select-tab', key)">
   <view class="tab-icon">
    <NovaIcon class="tab-symbol" :name="icon" :tone="tab===key?activeTheme.iconAccent:tone" />
    <text v-if="key==='messages' && !guest && state.scenario==='normal' && unread" class="unread-badge" aria-hidden="true">{{unread}}</text>
   </view>
   <text>{{label}}</text>
  </button>
 </view>
</view>
</template>
<style scoped>
.account-app{height:100vh;height:100dvh;display:flex;flex-direction:column;overflow:hidden}.screen{flex:1 1 0%;height:0;min-height:0;min-width:0;width:100%}.shell{width:100%;padding:calc(12px + env(safe-area-inset-top)) max(16px,env(safe-area-inset-right)) 23px max(16px,env(safe-area-inset-left))}
.app-head{display:flex;align-items:center;gap:10px;min-height:54px;margin-bottom:13px}.heading{flex:1;min-width:0}.app-head .note{margin-top:4px}.sub-head{display:grid;grid-template-columns:44px minmax(0,1fr) 44px}.sub-head .heading{grid-column:2;text-align:center;margin:0}.sub-head .title{font-size:20px}
.account-grid{display:flex;flex-direction:column;gap:15px}
.actions{position:relative;display:flex;gap:10px;flex-wrap:wrap}.actions{align-items:stretch;flex-direction:column}.actions .btn,.actions .link{width:100%}
.status-panel{display:grid;grid-template-columns:39px minmax(0,1fr);align-items:center;gap:11px}.status-icon{width:39px;height:39px;flex:none;display:flex;align-items:center;justify-content:center;border-radius:11px;background:var(--soft)}.status-copy{min-width:0}.status-action{grid-column:1 / -1;width:100%;min-height:44px}.section-title{display:block;font-size:16px;font-weight:750}.block-title{margin:0 0 8px}.rows{border:1px solid var(--line);background:var(--card);border-radius:15px;overflow:hidden}
.details{display:flex;flex-direction:column;gap:15px}.filter{margin-bottom:11px}.extra{margin-top:12px}.pick-row{min-height:52px;display:flex;align-items:center;gap:7px;padding:8px 12px;font-size:15px;font-weight:680;border-bottom:1px solid var(--line)}.pick-row:active{background:var(--soft)}.pick-label{min-width:0;flex:1;overflow-wrap:anywhere}.pick-value{min-width:0;max-width:60%;text-align:right;overflow-wrap:anywhere}.pick-value{margin-left:auto;color:var(--muted);font-weight:500}
.tabbar{flex:none;width:100%;display:grid;grid-auto-columns:minmax(0,1fr);grid-auto-flow:column;padding:4px 8px max(4px,env(safe-area-inset-bottom));background:var(--card);border-top:1px solid var(--line)}.tabbar .tab-button{width:100%;min-width:0;margin:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;min-height:53px;font-size:12px;font-weight:730;background:transparent;color:var(--muted);padding:0}.tab-icon{display:grid;place-items:center;width:49px;min-height:28px;border-radius:10px}.tabbar .active{color:var(--brand)}.active .tab-icon{background:var(--soft)}
.tab-symbol,.unread-badge{grid-area:1/1}
.unread-badge{position:relative;align-self:start;justify-self:end;display:flex;align-items:center;justify-content:center;min-width:17px;min-height:17px;margin-right:1px;padding:0 3px;border-radius:100px;background:var(--brand);color:var(--brand-on);font-size:10px;line-height:1.4;text-align:center}
.service-banner{background:linear-gradient(115deg,var(--hero-start),var(--hero));color:#fff;border-radius:19px;padding:17px}.service-symbol{display:flex;align-items:center;justify-content:center;width:41px;height:41px;border-radius:11px;background:#ffffff24;margin-bottom:9px}.service-title,.service-note{display:block}.service-title{font-size:20px;font-weight:780}.service-note{margin-top:4px;font-size:14px;color:#eaf1ff}
/* Keep the title centered on the viewport even with a desktop scrollbar. */
/* #ifdef H5 */
.account-app.host-tab{height:calc(100vh - var(--window-bottom,0px));height:calc(100dvh - var(--window-bottom,0px))}
.screen :deep(.uni-scroll-view){scrollbar-gutter:stable both-edges}
/* #endif */
@media(min-width:760px){.shell{padding-left:clamp(20px,4vw,56px);padding-right:clamp(20px,4vw,56px)}.account-grid{gap:19px}.app-head .title{font-size:29px}.app-head.sub-head .title{font-size:20px}.status-action,.actions .btn,.actions .link{width:fit-content;min-width:128px}}
@media(max-width:340px){.shell{padding-left:11px;padding-right:11px}}
</style>
