import { reactive } from 'vue'
import { orderDate } from './service-stats.js'

const today = new Date()

export const serviceOrders = Object.freeze([
  { id: 'NP-1042', kind: '实物', title: '旅行收纳套装', date: orderDate(0, today), amount: '89.00', status: 'active', statusLabel: '配送中', summary: '已完成示例出库，预计明日送达。', progress: ['模拟下单', '模拟出库', '配送中'], glyph: '物' },
  { id: 'NP-1038', kind: '数字内容', title: '年度规划模板', date: orderDate(2, today), amount: '29.00', status: 'complete', statusLabel: '已交付', summary: '演示文件已交付。本原型不提供真实下载。', progress: ['模拟下单', '数字内容已交付'], glyph: '数' },
  { id: 'NP-1026', kind: '服务', title: '线上一对一辅导', date: orderDate(4, today), amount: '159.00', status: 'complete', statusLabel: '已完成', summary: '本次示例服务已结束，欢迎回顾体验。', progress: ['模拟下单', '预约已确认', '服务已完成'], glyph: '服' },
  { id: 'NP-1014', kind: '服务', title: '线上体验课程', date: orderDate(8, today), amount: '59.00', status: 'closed', statusLabel: '已关闭', summary: '这笔示例订单已关闭，不会产生付款或实际服务。', progress: ['模拟下单', '订单已关闭'], glyph: '服' },
])

const initialReview = () => ({ 'NP-1026': { rating: 5, content: '讲解清楚，安排也很顺畅。', date: orderDate(3, today) } })
export const serviceDemo = reactive({ reviews: initialReview(), orderFilter: 'all', reviewFilter: 'all' })
export const findServiceOrder = id => serviceOrders.find(order => order.id === id)

export function resetServiceDemo() {
  serviceDemo.reviews = initialReview()
  serviceDemo.orderFilter = 'all'
  serviceDemo.reviewFilter = 'all'
}
