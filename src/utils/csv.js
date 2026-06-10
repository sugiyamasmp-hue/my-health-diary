import { toDisplayDate } from './dateUtils'

const CATEGORY_LABELS = { medical: '診療', rehab: 'リハ', other: 'その他' }

export const exportCSV = (records, filename = 'health-diary.csv') => {
  const rows = [
    ['日付', '種別', '項目1', '値1', '項目2', '値2', '項目3', '値3', 'メモ'],
  ]

  records.forEach(({ date, data }) => {
    const disp = toDisplayDate(date)

    ;(data.bloodPressures || []).forEach(r => {
      rows.push([disp, '血圧', '収縮期', r.systolic, '拡張期', r.diastolic, '脈拍', r.pulse, `場所:${r.location || ''} ${r.memo || ''}`])
    })
    ;(data.temperatures || []).forEach(r => {
      rows.push([disp, '体温', '体温', r.value, '', '', '', '', r.memo || ''])
    })
    ;(data.weights || []).forEach(r => {
      rows.push([disp, '体重', '体重', r.value, '', '', '', '', r.memo || ''])
    })
    ;(data.injections || []).forEach(r => {
      rows.push([disp, '自己注射', '薬名', r.drugName, '予定日', r.scheduledDate, '実施日', r.actualDate || '', r.memo || ''])
    })
    ;(data.events || []).forEach(r => {
      rows.push([disp, 'イベント', 'カテゴリ', CATEGORY_LABELS[r.category] || r.category, '場所', r.location || '', '内容', r.content || '', r.memo || ''])
    })
  })

  const bom = '﻿'
  const csv = bom + rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
