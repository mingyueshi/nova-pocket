import { reactive } from 'vue'
export const layouts=[['overview','状态概览'],['shortcuts','快捷工作台'],['minimal','极简列表']]
export const modes=[['member','已登录'],['guest','访客'],['incomplete','资料待完善']]
export const themes=[['blue','Nova 蓝'],['teal','松绿'],['dark','深色']]
export const scenarios=[['normal','正常'],['empty','空列表'],['error','加载失败']]
const defaults=()=>({layout:'overview',mode:'member',theme:'blue',scenario:'normal',nickname:'演示用户',notices:true,read:['profile']})
export const state=reactive(defaults())
export function reset(){Object.assign(state,defaults())}
export function authRoute(key,replace=false){const url='/pages/auth/'+key;replace?uni.redirectTo({url}):uni.navigateTo({url})}
export function accountHome(){if(getCurrentPages().length>1)uni.navigateBack();else uni.reLaunch({url:'/pages/index/index'})}
export function hint(title){uni.showToast({title,icon:'none',duration:1900})}
export function confirm(title,content,confirmText='确认'){
 return new Promise(resolve=>uni.showModal({title,content,confirmText,success:(x)=>resolve(!!x.confirm),fail:()=>resolve(false)}))
}
