import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { addInjection, updateInjection, fetchSchedules, getCurrentPeriod } from '../../hooks/useHealthData'
import { today, addDays } from '../../utils/dateUtils'

const GCAL_BASE = 'https://calendar.google.com/calendar/render'

function makeGCalUrl(drugName, dateStr, memo) {
  const d = dateStr.replace(/-/g, '')
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `💉 注射（${drugName}）`,
    dates: `${d}/${d}`,
    details: memo ? `${drugName}\n${memo}` : drugName,
  })
  return `${GCAL_BASE}?${params}`
}

function buildDates(startDate, period, count) {
  const dates = []
  let cur = startDate
  for (let i = 0; i < count; i++) {
    dates.push(cur)
    cur = addDays(cur, period)
  }
  return dates
}

export default function InjectionForm({ dateStr, initialData, onSave, onClose }) {
  const [schedules, setSchedules]         = useState([])
  const [scheduleId, setScheduleId]       = useState(initialData?.scheduleId || '')
  const [drugName, setDrugName]           = useState(initialData?.drugName || '')
  const [scheduledDate, setScheduledDate] = useState(initialData?.scheduledDate || dateStr)
  const [actualDate, setActualDate]       = useState(initialData?.actualDate || dateStr)
  const [memo, setMemo]                   = useState(initialData?.memo || '')
  const [saving, setSaving]               = useState(false)
  const [error, setError]                 = useState('')
  const [calInfo, setCalInfo]             = useState(null)
  const [multiCount, setMultiCount]       = useState(6)

  useEffect(() => {
    fetchSchedules().then(list => {
      setSchedules(list.filter(s => s.active))
      if (!initialData && list.length > 0) {
        setScheduleId(list[0].id)
        setDrugName(list[0].drugName)
      }
    })
  }, [])

  const handleScheduleChange = (id) => {
    setScheduleId(id)
    const s = schedules.find(s => s.id === id)
    setDrugName(s ? s.drugName : '')
  }

  const handleSave = async () => {
    if (!drugName.trim()) { setError('薬名を入力してください'); return }
    setSaving(true)
    try {
      const record = {
        drugName: drugName.trim(),
        scheduleId: scheduleId || null,
        scheduledDate,
        actualDate: actualDate || null,
        memo: memo.trim(),
      }
      if (initialData) {
        await updateInjection(dateStr, initialData.id, record)
      } else {
        await addInjection(dateStr, record)
      }
      const sel = schedules.find(s => s.id === scheduleId)
      const period = sel ? getCurrentPeriod(sel) : null
      setCalInfo({ drugName: drugName.trim(), scheduledDate, period, memo: memo.trim() })
    } catch (e) {
      setError('保存に失敗しました: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  // ─── Post-save calendar panel ────────────────────────────────────────────
  if (calInfo) {
    const isRecurring = calInfo.period != null
    const count = isRecurring ? multiCount : 1
    const dates = isRecurring
      ? buildDates(calInfo.scheduledDate, calInfo.period, count)
      : [calInfo.scheduledDate]

    return createPortal(
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>✅ 保存しました</h2>
            <button className="sheet-close" onClick={onSave}>✕</button>
          </div>

          <div className="modal-body">
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
                💉 注射（{calInfo.drugName}）
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Googleカレンダーに予定を追加できます
              </div>
            </div>

            {isRecurring && (
              <>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  追加する件数を選択（{calInfo.period}日おきの予定）
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  {[3, 6, 12].map(n => (
                    <button key={n} onClick={() => setMultiCount(n)} style={{
                      flex: 1, padding: '8px 0', borderRadius: 20, fontSize: 14, fontWeight: 600,
                      cursor: 'pointer', border: '1.5px solid var(--border)',
                      background: multiCount === n ? 'var(--injection-color)' : '#fff',
                      color: multiCount === n ? '#fff' : 'var(--text-secondary)',
                      transition: 'all 0.15s',
                    }}>{n}件</button>
                  ))}
                </div>
              </>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {dates.map(date => (
                <a
                  key={date}
                  href={makeGCalUrl(calInfo.drugName, date, calInfo.memo)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 16px', borderRadius: 10, textDecoration: 'none',
                    background: '#F0F5FF', border: '1.5px solid #C7D7FD',
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>📅 {date}</span>
                  <span style={{ fontSize: 12, color: '#4F7FFF', fontWeight: 700 }}>追加 →</span>
                </a>
              ))}
            </div>
          </div>

          <div className="modal-footer">
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>スキップ</button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={onSave}>閉じる</button>
          </div>
        </div>
      </div>,
      document.body
    )
  }

  // ─── Form ────────────────────────────────────────────────────────────────
  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>💊 自己注射を{initialData ? '編集' : '記録'}</h2>
          <button className="sheet-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {error && <div style={errStyle}>{error}</div>}

          {schedules.length > 0 && (
            <div className="form-group">
              <label>注射スケジュールから選択</label>
              <select className="form-control" value={scheduleId}
                onChange={e => handleScheduleChange(e.target.value)}>
                <option value="">手動入力</option>
                {schedules.map(s => (
                  <option key={s.id} value={s.id}>{s.drugName}</option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label>薬名 *</label>
            <input className="form-control" type="text" placeholder="薬品名を入力"
              value={drugName} onChange={e => setDrugName(e.target.value)} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>予定日</label>
              <input className="form-control" type="date"
                value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label>実施日</label>
              <input className="form-control" type="date"
                value={actualDate} onChange={e => setActualDate(e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label>メモ</label>
            <textarea className="form-control" placeholder="副作用・体調など..." rows={3}
              value={memo} onChange={e => setMemo(e.target.value)} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>キャンセル</button>
          <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSave} disabled={saving}>
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

const errStyle = { background: '#FEF2F2', color: '#DC2626', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 12 }
