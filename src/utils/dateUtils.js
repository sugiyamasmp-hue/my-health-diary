export const toDateStr = (date) => {
  const d = date instanceof Date ? date : new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export const toDisplayDate = (dateStr) => {
  const [y, m, d] = dateStr.split('-')
  return `${y}年${parseInt(m)}月${parseInt(d)}日`
}

export const toDisplayMonth = (year, month) =>
  `${year}年${month + 1}月`

export const getDaysInMonth = (year, month) =>
  new Date(year, month + 1, 0).getDate()

export const getFirstDayOfMonth = (year, month) =>
  new Date(year, month, 1).getDay()

export const today = () => toDateStr(new Date())

export const addDays = (dateStr, days) => {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return toDateStr(d)
}

export const diffDays = (a, b) => {
  const da = new Date(a)
  const db = new Date(b)
  return Math.round((da - db) / 86400000)
}

export const monthRange = (year, month) => {
  const start = `${year}-${String(month + 1).padStart(2, '0')}-01`
  const end = `${year}-${String(month + 1).padStart(2, '0')}-${String(getDaysInMonth(year, month)).padStart(2, '0')}`
  return { start, end }
}

export const DOW_LABELS = ['日', '月', '火', '水', '木', '金', '土']
