<script setup>
import { computed, ref } from 'vue'
import NovaIcon from '../../components/NovaIcon.vue'
import NovaRow from '../../components/NovaRow.vue'
import ServiceStats from '../../components/ServiceStats.vue'
import ServiceOrders from '../../components/ServiceOrders.vue'
import ServiceReviews from '../../components/ServiceReviews.vue'
import { resetServiceDemo } from '../../service-demo.js'
import { authRoute, confirm, hint, layouts, modes, reset, scenarios, state, themes } from '../../state.js'
const tabs=[['home','概览','layout-grid'],['services','服务','layers'],['messages','消息','bell'],['mine','我的','user-round']]
const base=[
 ['profile','个人资料','user-round','管理昵称和展示信息'],
 ['security','账户安全','shield-check','查看设备与验证方式'],
 ['messages','消息中心','bell','查看通知与安全提醒'],
 ['settings','账户设置','settings','管理通知、外观和隐私']
]
const services=[
 ['orders','我的订单','package-check','查看不同类型的订单、当前状态和详情'],
 ['stats','使用统计','chart-no-axes-combined','切换统计区间与指标，查看单日数据'],
 ['reviews','我的评价','message-square-text','查看评价记录，体验评分与评论流程'],
]
const names={services:'服务',orders:'我的订单',order:'订单详情',stats:'使用统计',reviews:'我的评价',review:'评价详情',home:'概览',messages:'消息',mine:'我的',profile:'个人资料',security:'账户安全',settings:'账户设置',activity:'最近活动',privacy:'隐私说明',help:'帮助与反馈',demo:'演示设置',message:'消息详情'}
const presets=[['layout','首页布局',layouts],['mode','账户状态',modes],['theme','界面主题',themes],['scenario','消息状态',scenarios]]
const messages=[
 ['welcome','欢迎使用 Nova Pocket','刚刚','这里演示通用账户通知、阅读状态和消息详情，不连接真实消息服务。'],
 ['security','账号安全检查','今天','实际产品可提醒用户查看设备、登录记录和安全设置。当前只是示例。'],
 ['profile','个人资料提示','昨天','用户可随时编辑昵称。原型只保存当前页面的模拟状态。']
]
const serviceIds=ref({}), tab=ref('home'), stack=ref([]), draft=ref(''), error=ref(''), filter=ref('all'), selected=ref(null), scroller=ref(0), scrollTo=ref(0)
const guest=computed(()=>state.mode==='guest'), avatar=computed(()=>guest.value?'访':Array.from(state.nickname)[0]||'示')
const route=computed(()=>stack.value.at(-1)||tab.value), isHome=computed(()=>route.value==='home')
const tone=computed(()=>state.theme==='dark'?'light':'muted'), activeTone=computed(()=>state.theme==='dark'?'light':'blue')
const identity=computed(()=>guest.value?'你好，访客':state.nickname), role=computed(()=>guest.value?'浏览账户中心':state.mode==='incomplete'?'资料待完善':'演示账号')
const unread=computed(()=>messages.filter(m=>!state.read.includes(m[0])).length)
const filtered=computed(()=>messages.filter(m=>filter.value==='all'||!state.read.includes(m[0])))
function top(){scrollTo.value=scroller.value;setTimeout(()=>{scrollTo.value=0},0)}
function initialName(){return state.mode==='incomplete'?'':state.nickname}
async function guard(){return route.value!=='profile'||draft.value===initialName()||await confirm('放弃未保存的资料？','取消后可以继续编辑。','放弃')}
async function page(dest){
 if(dest==='messages'||dest==='services'){await switchTab(dest);return}
 if(!await guard())return
 if(dest==='login'||guest.value&&['profile','security','activity'].includes(dest)){authRoute('login');return}
 if(dest==='profile'){draft.value=initialName();error.value=''}
 stack.value=[...stack.value,dest];top()
}
function serviceNavigate(e){if(!['orders','order','reviews','review'].includes(e?.view))return;if(e.id)serviceIds.value[e.view]=e.id;page(e.view)}
async function switchTab(dest){if(!await guard())return;tab.value=dest;stack.value=[];top()}
async function back(){if(await guard()){stack.value=stack.value.slice(0,-1);top()}}
function save(){
 const name=draft.value.trim(), size=Array.from(name).length
 if(!size||size>20){error.value='请输入 1–20 个字符的虚构昵称。';return}
 state.nickname=name;state.mode='member';stack.value=stack.value.slice(0,-1);hint('示例资料已保存');top()
}
function showMessage(m){selected.value=m;if(!state.read.includes(m[0]))state.read.push(m[0]);page('message')}
function option(key,values){return values.findIndex(([v])=>v===state[key])}
function select(key,values,event){const x=values[Number(event.detail.value)];if(!x)return;state[key]=x[0];hint('已切换：'+x[1])}
async function logout(){if(await confirm('退出演示账号？','仅改变当前原型的账户状态。','模拟退出')){state.mode='guest';stack.value=[];tab.value='mine';top()}}
async function restore(){if(await confirm('重置演示？','布局、主题、昵称和消息状态都会恢复默认。','重置')){reset();resetServiceDemo();serviceIds.value={};filter.value='all';hint('演示已重置')}}
function explain(title,content){uni.showModal({title,content,showCancel:false,confirmText:'知道了'})}
function retry(){state.scenario='normal';hint('已恢复示例消息')}
</script>
<template>
<view class="surface account-app" :class="state.theme">
 <scroll-view scroll-y class="screen" :scroll-top="scrollTo" @scroll="scroller=$event.detail.scrollTop">
  <view class="shell">
   <view class="app-head" :class="{'sub-head':stack.length}">
    <button v-if="stack.length" class="icon-button" aria-label="返回上一页" @tap="back"><NovaIcon name="chevron-left" :tone="tone" /></button>
    <view class="heading"><text class="title" role="heading" aria-level="1">{{names[route]}}</text><text v-if="!stack.length" class="note">Nova Pocket</text></view>
    <button v-if="isHome" class="icon-button" aria-label="账户设置" @tap="page('settings')"><NovaIcon name="settings" :tone="tone" /></button>
   </view>

   <view v-if="route==='home'||route==='mine'" class="account-grid">
    <view class="hero" :class="{'compact':isHome&&state.layout!=='overview','push':isHome&&state.layout==='shortcuts'}">
     <view class="orbit" aria-hidden="true"><view></view><view></view><view></view><NovaIcon name="sparkles" tone="white" :size="52" /></view>
     <view class="identity"><view class="avatar" aria-hidden="true">{{avatar}}</view><view><text class="hero-name">{{identity}}</text><text class="hero-note">{{role}}</text></view></view>
     <view class="actions">
      <button v-if="guest" class="hero-btn" @tap="authRoute('login')">登录</button>
      <button v-if="guest" class="hero-btn secondary-hero" @tap="authRoute('register')">注册</button>
      <button v-if="!guest" class="hero-btn" @tap="page('profile')">{{state.mode==='incomplete'?'完善资料':'编辑资料'}}</button>
     </view>
    </view>
    <view v-if="isHome&&state.layout==='overview'" class="panel status-panel">
     <view class="status-icon"><NovaIcon :name="guest?'user-round':state.mode==='incomplete'?'circle-alert':'shield-check'" :tone="activeTone" :size="23" /></view>
     <view class="status-copy"><text class="section-title">{{guest?'体验完整账户功能':state.mode==='incomplete'?'个人资料待完善':'账户状态正常'}}</text><text class="note">{{guest?'此处仅提供模拟登录。':state.mode==='incomplete'?'可随时完善展示昵称。':'最近一次安全检查：今天'}}</text></view>
     <button class="btn status-action" @tap="page(guest?'login':state.mode==='incomplete'?'profile':'security')">{{guest?'去登录':state.mode==='incomplete'?'去完善':'查看安全'}}</button>
    </view>
    <view v-if="isHome&&state.layout!=='minimal'" class="block" :class="{'first':state.layout==='shortcuts'}">
     <text class="section-title block-title">{{state.layout==='shortcuts'?'常用操作':'快捷入口'}}</text>
     <view class="rows"><NovaRow v-for="[key,label,icon,detail] in base" :key="key" :icon="icon" :label="label" :detail="detail" :tone="activeTone" @select="page(key)" /></view>
    </view>
    <view v-if="!isHome||state.layout==='minimal'" class="block"><text class="section-title block-title">账户管理</text><view class="rows">
     <NovaRow :icon="guest?'log-in':'user-round'" :label="guest?'登录或注册':'个人资料'" :tone="tone" @select="page(guest?'login':'profile')" />
     <NovaRow icon="shield-check" label="账户安全" :tone="tone" @select="page('security')" />
     <NovaRow icon="settings" label="账户设置" :tone="tone" @select="page('settings')" />
    </view></view>
    <view class="block"><text class="section-title block-title">{{isHome?'动态与帮助':'更多'}}</text><view class="rows">
     <NovaRow v-if="isHome" icon="layers" label="服务中心" detail="订单、统计和评价" :tone="tone" @select="page('services')" />
     <NovaRow icon="clock-3" label="最近活动" :tone="tone" @select="page('activity')" />
     <NovaRow icon="circle-help" label="帮助与反馈" :tone="tone" @select="page('help')" />
    </view></view>
    <view v-if="!isHome" class="block"><text class="section-title block-title">关于</text><view class="rows">
     <NovaRow icon="sparkles" label="演示设置" detail="切换首页、主题与模拟状态" :tone="tone" @select="page('demo')" />
    </view></view>
   </view>

   <view v-else-if="route==='services'" class="details">
    <view class="service-banner">
     <view class="service-symbol"><NovaIcon name="layers" tone="white" :size="25" /></view>
     <text class="service-title">常用服务</text><text class="service-note">管理订单、查看趋势、回顾评价。</text>
    </view>
    <view class="block"><text class="section-title block-title">服务记录</text><view class="rows">
     <NovaRow v-for="[key,label,icon,detail] in services" :key="key" :icon="icon" :label="label" :detail="detail" :tone="tone" @select="page(key)" />
    </view></view>
    <text class="note">这里使用模拟记录，不会产生付款、交易或公开评论。</text>
   </view>
   <view v-else-if="route==='stats'" class="details"><ServiceStats /></view>
   <view v-else-if="route==='orders'||route==='order'" class="details"><ServiceOrders :view="route" :id="serviceIds[route]" @navigate="serviceNavigate" /></view>
   <view v-else-if="route==='reviews'||route==='review'" class="details"><ServiceReviews :view="route" :id="serviceIds[route]" @navigate="serviceNavigate" /></view>

   <view v-else-if="route==='messages'" class="details">
    <view v-if="guest" class="panel"><text class="section-title">登录后查看消息</text><text class="note">这里只展示模拟通知，不读取个人数据。</text><button class="btn extra" @tap="page('login')">去登录</button></view>
    <view v-else-if="state.scenario==='empty'" class="panel"><text class="section-title">暂时没有消息</text><text class="note">收到新的通知后，会显示在这里。</text></view>
    <view v-else-if="state.scenario==='error'" class="panel"><text class="section-title">暂时无法加载消息</text><text class="note">这是模拟错误，点重试可恢复。</text><button class="btn extra" @tap="retry">重试</button></view>
    <view v-else>
     <view class="message-tools"><text class="note">{{unread?unread+' 条未读通知':'所有通知已读'}}</text><button class="btn outline" :aria-pressed="filter==='unread'" @tap="filter=filter==='all'?'unread':'all'">{{filter==='all'?'只看未读':'显示全部'}}</button></view>
     <view v-if="filtered.length" class="rows"><NovaRow v-for="m in filtered" :key="m[0]" icon="bell" :label="m[1]" :tail="state.read.includes(m[0])?'已读':'未读'" :detail="m[2]" :emphasis="!state.read.includes(m[0])" :tone="tone" @select="showMessage(m)" /></view>
     <view v-else class="panel"><text class="section-title">没有未读消息</text></view>
     <button v-if="unread" class="link extra" @tap="state.read=messages.map(m=>m[0])">全部标为已读</button>
    </view>
   </view>

   <view v-else class="details">
    <view v-if="route==='demo'">
     <text class="note">预设只影响当前演示，不使用真实账号或数据。</text>
     <view class="rows extra">
      <picker v-for="[key,label,values] in presets" :key="key" :range="values.map(v=>v[1])" :value="option(key,values)" @change="select(key,values,$event)">
       <view class="pick-row"><text>{{label}}</text><text class="pick-value">{{values[option(key,values)][1]}}</text><NovaIcon name="chevron-right" :tone="tone" :size="15" /></view>
      </picker>
     </view>
     <view class="actions extra"><button class="btn primary" @tap="switchTab('home')">查看概览</button><button class="btn" @tap="switchTab('messages')">查看消息</button><button class="link" @tap="restore">重置演示</button></view>
     <view class="rows extra"><NovaRow icon="log-in" label="登录页演示" :tone="tone" @select="authRoute('login')" /><NovaRow icon="user-round" label="注册页演示" :tone="tone" @select="authRoute('register')" /></view>
    </view>
    <view v-else-if="route==='profile'" class="panel profile">
     <text class="section-title">展示昵称</text><input v-model="draft" aria-label="展示昵称" maxlength="64" placeholder="虚构昵称" @input="error=''" />
     <text v-if="error" class="error" role="alert">{{error}}</text>
     <text class="note">请输入 1–20 个字符。不必填写真实资料。</text>
     <view class="actions extra"><button class="btn primary" @tap="save">保存资料</button><button class="btn" @tap="back">取消</button></view>
    </view>
    <view v-else-if="route==='settings'" class="rows">
     <view class="pick-row"><text>接收通知</text><switch :checked="state.notices" color="#1d4ed8" aria-label="接收通知" @change="state.notices=$event.detail.value" /></view>
     <picker :range="themes.map(v=>v[1])" :value="option('theme',themes)" @change="select('theme',themes,$event)"><view class="pick-row"><text>外观</text><text class="pick-value">{{themes[option('theme',themes)][1]}}</text><NovaIcon name="chevron-right" :tone="tone" :size="15" /></view></picker>
     <NovaRow icon="shield-check" label="隐私说明" :tone="tone" @select="page('privacy')" />
     <NovaRow :icon="guest?'log-in':'log-out'" :label="guest?'登录':'模拟退出'" :tone="tone" @select="guest?authRoute('login'):logout()" />
    </view>
    <view v-else-if="route==='security'" class="rows">
     <NovaRow icon="monitor" label="登录设备" :tone="tone" @select="explain('登录设备','这里只有一个模拟会话，不读取真实设备。')" />
     <NovaRow icon="key-round" label="验证方式" :tone="tone" @select="explain('验证方式','实际验证由接入的小程序处理。本演示不会发送验证码。')" />
     <NovaRow icon="shield-check" label="注销流程说明" :tone="tone" @select="explain('注销流程','正式产品需核验身份并告知影响；本演示不接收注销申请。')" />
    </view>
    <view v-else-if="route==='activity'" class="rows">
     <NovaRow icon="shield-check" label="安全检查" tail="今天" :tone="tone" @select="explain('安全检查','示例：最近一次安全检查已完成。')" />
     <NovaRow icon="user-round" label="资料更新" tail="昨天" :tone="tone" @select="explain('资料更新','示例：账户资料已更新。')" />
    </view>
    <view v-else-if="route==='message'" class="panel"><text class="section-title">{{selected[1]}}</text><text class="note extra">{{selected[3]}}</text></view>
    <view v-else-if="route==='privacy'" class="panel"><text class="section-title">不收集真实账号资料</text><text class="note extra">所有登录及注册均为模拟，昵称、提醒和阅读状态只存于页面内存，刷新后重置。</text></view>
    <view v-else-if="route==='help'" class="panel"><text class="section-title">使用帮助</text><text class="note extra">底部可以切换概览、服务、消息和我的。所有演示预设在「我的 → 演示设置」。</text></view>
   </view>
  </view>
 </scroll-view>
 <view class="tabbar" role="navigation" aria-label="底部导航">
  <button v-for="[key,label,icon] in tabs" :key="key" role="button" tabindex="0" @keydown.enter.prevent="switchTab(key)" @keydown.space.prevent="switchTab(key)" :class="{'active':tab===key}" :aria-current="tab===key?'page':undefined" @tap="switchTab(key)"><view class="tab-icon"><NovaIcon :name="icon" :tone="tab===key?activeTone:tone" /></view><text>{{label}}</text></button>
 </view>
</view>
</template>
<style scoped>
.account-app{height:100vh;height:100dvh;display:flex;flex-direction:column;overflow:hidden}.screen{flex:1 1 0%;height:0;min-height:0;min-width:0;width:100%}.shell{width:100%;padding:calc(12px + env(safe-area-inset-top)) max(16px,env(safe-area-inset-right)) 23px max(16px,env(safe-area-inset-left))}
.app-head{display:flex;align-items:center;gap:10px;min-height:54px;margin-bottom:13px}.heading{flex:1;min-width:0}.app-head .note{margin-top:4px}.sub-head{display:grid;grid-template-columns:44px minmax(0,1fr) 44px}.sub-head .heading{grid-column:2;text-align:center;margin:0}.sub-head .title{font-size:20px}
.account-grid{display:flex;flex-direction:column;gap:15px}.hero{position:relative;overflow:hidden;border-radius:21px;min-height:138px;background:linear-gradient(113deg,#192a52,var(--hero));color:#fff;padding:18px}.hero.compact{min-height:110px}.hero.push{order:-1}.first{order:-2}.orbit{position:absolute;pointer-events:none;right:-24px;top:-57px;width:235px;height:235px;opacity:.43;display:flex;align-items:center;justify-content:center}.orbit view{position:absolute;width:200px;height:106px;border:1px solid #c9d9ff;border-radius:100%;transform:rotate(-36deg)}.orbit view:nth-child(2){transform:rotate(36deg)}.orbit view:nth-child(3){width:142px;height:142px;border-style:dashed;transform:rotate(0deg)}
.identity,.actions{position:relative;display:flex;align-items:center;gap:10px;flex-wrap:wrap}.identity{flex-wrap:nowrap}.identity>view:last-child{min-width:0;flex:1}.actions{align-items:stretch;flex-direction:column}.actions button{width:100%}.avatar{display:flex;align-items:center;justify-content:center;width:49px;height:49px;border-radius:15px;background:#eef3fb;color:#1e3f9c;font-size:21px;font-weight:840;flex:none}.hero-name,.hero-note{display:block;overflow-wrap:anywhere}.hero-name{font-size:22px;font-weight:780}.hero-note{font-size:14px;color:#edf3ff;margin-top:2px}.hero .actions{margin-top:12px}.hero-btn{display:flex;align-items:center;justify-content:center;line-height:1.4;border-radius:10px;min-height:44px;padding:0 16px;background:#eef3fb;color:#1e3f9c;font-weight:730}.secondary-hero{background:#ffffff22;color:#fff}
.status-panel{display:grid;grid-template-columns:39px minmax(0,1fr);align-items:center;gap:11px}.status-icon{width:39px;height:39px;flex:none;display:flex;align-items:center;justify-content:center;border-radius:11px;background:var(--soft)}.status-copy{min-width:0}.status-action{grid-column:1 / -1;width:100%;min-height:44px}.section-title{display:block;font-size:16px;font-weight:750}.block-title{margin:0 0 8px}.rows{border:1px solid var(--line);background:var(--card);border-radius:15px;overflow:hidden}.message-tools{display:flex;flex-direction:column;gap:9px;margin-bottom:12px}.message-tools .btn{align-self:flex-start}
.details{display:flex;flex-direction:column;gap:15px}.filter{margin-bottom:11px}.extra{margin-top:12px}.profile input{width:100%;height:46px;min-width:0;margin:9px 0 6px;min-height:46px;padding:0 11px;background:var(--canvas);border:1px solid var(--control);border-radius:10px}.error{font-size:14px;color:var(--error)}.pick-row{min-height:52px;display:flex;align-items:center;gap:7px;padding:8px 12px;font-size:15px;font-weight:680;border-bottom:1px solid var(--line)}.pick-row:active{background:var(--soft)}.pick-row>text:first-child{min-width:0;flex:1;overflow-wrap:anywhere}.pick-value{min-width:0;max-width:60%;text-align:right;overflow-wrap:anywhere}.pick-value,.pick-row switch{margin-left:auto;color:var(--muted);font-weight:500}.pick-row switch{flex:none}
.tabbar{flex:none;width:100%;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));padding:4px 8px max(4px,env(safe-area-inset-bottom));background:var(--card);border-top:1px solid var(--line)}.tabbar button{width:100%;min-width:0;margin:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;min-height:53px;font-size:12px;font-weight:730;background:transparent;color:var(--muted);padding:0}.tab-icon{width:49px;height:28px;border-radius:10px;display:flex;align-items:center;justify-content:center}.tabbar .active{color:var(--brand)}.active .tab-icon{background:var(--soft)}
.service-banner{background:linear-gradient(115deg,#172e68,var(--hero));color:#fff;border-radius:19px;padding:17px}.service-symbol{display:flex;align-items:center;justify-content:center;width:41px;height:41px;border-radius:11px;background:#ffffff24;margin-bottom:9px}.service-title,.service-note{display:block}.service-title{font-size:20px;font-weight:780}.service-note{margin-top:4px;font-size:14px;color:#eaf1ff}
/* Keep the title centered on the viewport even with a desktop scrollbar. */
/* #ifdef H5 */
.screen :deep(.uni-scroll-view){scrollbar-gutter:stable both-edges}
/* #endif */
@media(min-width:760px){.shell{padding-left:clamp(20px,4vw,56px);padding-right:clamp(20px,4vw,56px)}.account-grid{gap:19px}.hero{padding:23px}.app-head .title{font-size:29px}.app-head.sub-head .title{font-size:20px}.status-action,.hero-btn,.actions button{width:fit-content;min-width:128px}}
@media(max-width:340px){.shell{padding-left:11px;padding-right:11px}}
</style>
