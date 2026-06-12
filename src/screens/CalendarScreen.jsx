import { useState, useEffect, useCallback } from 'react'
import { fetchRangeData, fetchSchedules, getScheduledDatesInRange } from '../hooks/useHealthData'
import {
  toDisplayMonth, getDaysInMonth, getFirstDayOfMonth,
  monthRange, today, toDateStr, DOW_LABELS
} from '../utils/dateUtils'
import DayDetail from '../components/DayDetail'

const now = new Date()

export default function CalendarScreen() {
  const [year, setYear]     = useState(now.getFullYear())
  const [month, setMonth]   = useState(now.getMonth())
  const [monthData, setMonthData]           = useState({})
  const [scheduledInjDates, setScheduledInjDates] = useState(new Set())
  const [loading, setLoading]               = useState(false)
  const [selected, setSelected]             = useState(null)

  const loadMonth = useCallback(async (y, m) => {
    setLoading(true)
    try {
      const { start, end } = monthRange(y, m)
      const [rows, schedules] = await Promise.all([
        fetchRangeData(start, end),
        fetchSchedules(),
      ])

      const map = {}
      rows.forEach(({ date, data }) => { map[date] = data })
      setMonthData(map)

      const planned = new Set()
      schedules
        .filter(s => s.active && s.startDate)
        .forEach(s => {
          getScheduledDatesInRange(s, start, end).forEach(d => planned.add(d))
        })
      setScheduledInjDates(planned)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadMonth(year, month) }, [year, month, loadMonth])

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const todayStr = today()
  const daysInMonth    = getDaysInMonth(year, month)
  const firstDayOfWeek = getFirstDayOfMonth(year, month)

  const cells = []
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const getIndicators = (dateStr) => {
    const d = monthData[dateStr]
    const dots = []
    if (d?.bloodPressures?.length) dots.push('bp')
    if (d?.temperatures?.length)   dots.push('temp')
    if (d?.weights?.length)        dots.push('weight')
    if (d?.injections?.length) {
      dots.push('injection')
    } else if (scheduledInjDates.has(dateStr)) {
      dots.push('injection-plan')
    }
    if (d?.events?.length) dots.push('event')
    return dots
  }

  const handleDayClose = () => {
    setSelected(null)
    loadMonth(year, month)
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100%' }}>
      {/* Header */}
      <div className="screen-header">
        <button className="icon-btn" onClick={prevMonth}>‹</button>
        <h1>{toDisplayMonth(year, month)}</h1>
        <div className="header-actions">
          <button className="icon-btn" onClick={nextMonth}>›</button>
          <button className="icon-btn" onClick={() => {
            const n = new Date()
            setYear(n.getFullYear()); setMonth(n.getMonth())
          }}>今</button>
        </div>
      </div>

      {/* Day-of-week labels */}
      <div style={gridStyle}>
        {DOW_LABELS.map((d, i) => (
          <div key={d} style={{
            ...dowCell,
            color: i === 0 ? '#EF4444' : i === 6 ? '#2196F3' : 'var(--text-secondary)',
          }}>{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      {loading ? <div className="spinner" /> : (
        <div style={gridStyle}>
          {cells.map((day, idx) => {
            if (!day) return <div key={`e${idx}`} />
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const isToday    = dateStr === todayStr
            const isSelected = dateStr === selected
            const dots = getIndicators(dateStr)
            const dow = (firstDayOfWeek + day - 1) % 7

            return (
              <div key={day} onClick={() => setSelected(dateStr)} style={{
                ...dayCell,
                color: dow === 0 ? '#EF4444' : dow === 6 ? '#2196F3' : 'var(--text)',
              }}>
                <div style={{
                  ...dayNumber,
                  background: isToday ? 'var(--primary)' : isSelected ? 'var(--primary-light)' : 'transparent',
                  color: isToday ? '#fff' : undefined,
                  fontWeight: isToday ? 700 : 400,
                }}>
                  {day}
                </div>
                <div style={{ display: 'flex', gap: 2, justifyContent: 'center', minHeight: 8, flexWrap: 'wrap' }}>
                  {dots.map(t => (
                    <span key={t} className={`dot dot-${t}`} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Legend */}
      <div style={{ padding: '8px 16px', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[
          ['bp', '血圧'], ['temp', '体温'], ['weight', '体重'],
          ['injection', '注射(実績)'], ['injection-plan', '注射(予定)'], ['event', 'イベント'],
        ].map(([t, label]) => (
          <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-secondary)' }}>
            <span className={`dot dot-${t}`} />
            {label}
          </div>
        ))}
      </div>

      {selected && (
        <DayDetail
          dateStr={selected}
          onClose={handleDayClose}
        />
      )}
    </div>
  )
}

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(7, 1fr)',
  gap: 2,
  padding: '2px 8px',
}
const dowCell = {
  textAlign: 'center',
  padding: '6px 0',
  fontSize: 12,
  fontWeight: 600,
}
const dayCell = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '2px 0 4px',
  cursor: 'pointer',
  borderRadius: 8,
  gap: 2,
}
const dayNumber = {
  width: 32,
  height: 32,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 14,
}
