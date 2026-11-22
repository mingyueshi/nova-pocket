function dateDaysAgo(days, today) {
  const date = new Date(today)
  date.setDate(date.getDate() - days)
  return date
}

function compactDate(days, today) {
  const date = dateDaysAgo(days, today)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return month + '/' + day
}

export function orderDate(days, today = new Date()) {
  const date = dateDaysAgo(days, today)
  return (date.getMonth() + 1) + ' 月 ' + date.getDate() + ' 日'
}

export function trendLabels(today = new Date()) {
  return {
    week: Array.from({ length: 7 }, (_, index) => compactDate(6 - index, today)),
    month: Array.from({ length: 5 }, (_, index) => {
      const start = 29 - 6 * index
      return compactDate(start, today) + '–' + compactDate(start - 5, today)
    }),
  }
}

export function summarizeValues(values) {
  const total = values.reduce((sum, value) => sum + value, 0)
  const maximum = values.length ? Math.max(...values) : 0
  return { total, maximum, scale: Math.max(maximum, 1), peak: values.indexOf(maximum) }
}
