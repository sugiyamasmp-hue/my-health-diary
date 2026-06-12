import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  fetchSchedules, addSchedule, updateSchedulePeriod,
  endSchedule, deleteSchedule, getCurrentPeriod, getScheduledDatesInRange,
} from '../hooks/useHealthData'
import { today, addDays } from '../utils/dateUtils'

const PERIOD_OPTIONS = [
  { days: 7,  label: '1週間' },
  { days: 14, label: '2週間' },
  { days: 21, label: '3週間' },
  { days: 28, label: '4週間' },
]

export default function SettingsScreen() {
  const [schedules, setSchedules]     = useState([])
  const [loading, setLoading]         = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)

  const loadSchedules = async () => {
    setLoading(true)
    try { setSchedules(await fetchSchedules()) }
    finally { setLoading(false) }
  }

  useEffect(() => { loadSchedules() }, [])

  const active  = schedules.filter(s => s.active && !s.endDate)
  const ended   = schedules.filter(s => !s.active || s.endDate)

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100%' }}>
      <div className="screen-header">
        <h1>⚙️ 設定</h1>
      </div>

      {/* Injection Schedules */}
      <div style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>💊 注射スケジュール</div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddForm(true)}>
            ＋ 追加
          </button>
        </div>

        {loading ? <div className="spinner" /> : schedules.length === 0 ? (
          <div className="empty-state" style={{ padding: '24px' }}>
            <div className="empty-icon">💊</div>
            <p>注射スケジュールがありません</p>
          </div>
        ) : (
          <>
            {active.map(s => (
              <ScheduleCard key={s.id} schedule={s} onChanged={loadSchedules} />
            ))}
            {ended.length > 0 && (
              <>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600, margin: '16px 0 6px' }}>
                  過去のスケジュール
                </div>
                {ended.map(s => (
                  <ScheduleCard key={s.id} schedule={s} onChanged={loadSchedules} />
                ))}
              </>
            )}
          </>
        )}
      </div>

      {/* App Info */}
      <div style={{ padding: '0 16px 24px' }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: '16px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>ℹ️ アプリ情報</div>
          <InfoRow label="アプリ名" value="My Health Diary" />
          <InfoRow label="バージョン" value="1.0.0" />
          <InfoRow label="データ保存" value="Firebase Firestore" />
          <InfoRow label="画像保存" value="Cloudinary" />
        </div>
      </div>

      {showAddForm && (
        <AddScheduleModal
          onSaved={() => { setShowAddForm(false); loadSchedules() }}
          onClose={() => setShowAddForm(false)}
        />
      )}
    </div>
  )
}

// ─── ScheduleCard ────────────────────────────────────────────────────────────

function ScheduleCard({ schedule, onChanged }) {
  const todayStr = today()
  const period   = getCurrentPeriod(schedule)
  const isEnded  = !!schedule.endDate

  const [editing, setEditing]       = useState(null) // 'period' | 'end' | null
  const [newPeriod, setNewPeriod]   = useState(period)
  const [periodStart, setPeriodStart] = useState(todayStr)
  const [endDateVal, setEndDateVal] = useState(todayStr)
  const [saving, setSaving]         = useState(false)

  const nextDue = (() => {
    if (!schedule.active || !schedule.startDate || isEnded) return null
    const lookahead = addDays(todayStr, (period || 14) * 4)
    return getScheduledDatesInRange(schedule, todayStr, lookahead)[0] || null
  })()

  const handleUpdatePeriod = async () => {
    if (!newPeriod) return
    setSaving(true)
    try {
      await updateSchedulePeriod(schedule.id, Number(newPeriod), periodStart)
      onChanged(); setEditing(null)
    } finally { setSaving(false) }
  }

  const handleEnd = async () => {
    if (!endDateVal) return
    setSaving(true)
    try {
      await endSchedule(schedule.id, endDateVal)
      onChanged(); setEditing(null)
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!confirm(`「${schedule.drugName}」を削除しますか？`)) return
    await deleteSchedule(schedule.id)
    onChanged()
  }

  return (
    <div style={{
      background: '#fff', borderRadius: 12, marginBottom: 10,
      boxShadow: 'var(--shadow-sm)', overflow: 'hidden',
      opacity: isEnded ? 0.6 : 1,
    }}>
      <div style={{ padding: '14px 16px' }}>
        {/* Title row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
              <span style={{ fontWeight: 700, fontSize: 16 }}>{schedule.drugName}</span>
              {isEnded && (
                <span style={{ fontSize: 11, background: '#F3F4F6', color: '#6B7280', borderRadius: 4, padding: '2px 6px', fontWeight: 600 }}>
                  終了
                </span>
              )}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span>
                開始日: {schedule.startDate || '未設定'}　周期: {PERIOD_OPTIONS.find(p => p.days === period)?.label ?? `${period}日`}
              </span>
              {isEnded && <span>終了日: {schedule.endDate}</span>}
              {nextDue && <span style={{ color: 'var(--injection-color)', fontWeight: 600 }}>次回予定: {nextDue}</span>}
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            {!isEnded && (
              <>
                <button
                  onClick={() => setEditing(editing === 'period' ? null : 'period')}
                  style={{ ...actionBtn, background: editing === 'period' ? '#EFF6FF' : '#F3F4F6', color: editing === 'period' ? 'var(--primary)' : 'var(--text-secondary)' }}>
                  周期変更
                </button>
                <button
                  onClick={() => setEditing(editing === 'end' ? null : 'end')}
                  style={{ ...actionBtn, background: editing === 'end' ? '#FEF2F2' : '#F3F4F6', color: 'var(--danger)' }}>
                  終了
                </button>
              </>
            )}
            <button onClick={handleDelete} style={{ ...actionBtn, color: '#9CA3AF' }}>削除</button>
          </div>
        </div>

        {/* Period history */}
        {schedule.periodHistory?.length > 1 && (
          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
            <strong>周期履歴:</strong>
            {[...schedule.periodHistory]
              .sort((a, b) => b.startDate.localeCompare(a.startDate))
              .map((h, i) => (
                <span key={i} style={{ marginLeft: 6 }}>
                  {h.startDate}: {PERIOD_OPTIONS.find(p => p.days === h.period)?.label ?? `${h.period}日`}
                </span>
              ))}
          </div>
        )}
      </div>

      {/* Period change panel */}
      {editing === 'period' && (
        <div style={{ padding: '12px 16px', background: '#F9FAFB', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>周期を変更</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            {PERIOD_OPTIONS.map(({ days, label }) => (
              <button key={days} type="button" onClick={() => setNewPeriod(days)} style={{
                padding: '7px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                border: `2px solid ${newPeriod === days ? 'var(--injection-color)' : 'var(--border)'}`,
                background: newPeriod === days ? '#F3E5F5' : '#fff',
                color: newPeriod === days ? 'var(--injection-color)' : 'var(--text-secondary)',
              }}>{label}</button>
            ))}
          </div>
          <div className="form-group" style={{ margin: '0 0 10px' }}>
            <label>変更開始日</label>
            <input className="form-control" type="date" value={periodStart}
              onChange={e => setPeriodStart(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setEditing(null)}>キャンセル</button>
            <button className="btn btn-primary btn-sm" onClick={handleUpdatePeriod} disabled={saving}>
              {saving ? '更新中...' : '周期を更新'}
            </button>
          </div>
        </div>
      )}

      {/* End schedule panel */}
      {editing === 'end' && (
        <div style={{ padding: '12px 16px', background: '#FFF5F5', borderTop: '1px solid #FECACA' }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6, color: 'var(--danger)' }}>スケジュールを終了</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>
            終了日以降はカレンダーの予定表示が止まります。履歴として残ります。
          </div>
          <div className="form-group" style={{ margin: '0 0 10px' }}>
            <label>終了日</label>
            <input className="form-control" type="date" value={endDateVal}
              onChange={e => setEndDateVal(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setEditing(null)}>キャンセル</button>
            <button onClick={handleEnd} disabled={saving} style={{
              background: 'var(--danger)', color: '#fff', border: 'none', borderRadius: 8,
              padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>
              {saving ? '処理中...' : '終了を設定'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── AddScheduleModal ────────────────────────────────────────────────────────

function AddScheduleModal({ onSaved, onClose }) {
  const [drugName, setDrugName] = useState('')
  const [startDate, setStartDate] = useState(today())
  const [period, setPeriod]     = useState(14)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')

  const handleSave = async () => {
    if (!drugName.trim()) { setError('薬名を入力してください'); return }
    if (!startDate) { setError('開始日を入力してください'); return }
    setSaving(true)
    try {
      await addSchedule(drugName.trim(), period, startDate)
      onSaved()
    } catch (e) {
      setError('保存に失敗しました: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>💊 注射スケジュールを追加</h2>
          <button className="sheet-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {error && <div style={errStyle}>{error}</div>}
          <div className="form-group">
            <label>薬名 *</label>
            <input className="form-control" type="text" placeholder="薬品名を入力"
              value={drugName} onChange={e => setDrugName(e.target.value)} />
          </div>
          <div className="form-group">
            <label>最初の注射日（開始日）*</label>
            <input className="form-control" type="date"
              value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div className="form-group">
            <label>繰り返し間隔 *</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {PERIOD_OPTIONS.map(({ days, label }) => (
                <button key={days} type="button" onClick={() => setPeriod(days)} style={{
                  padding: '9px 18px', borderRadius: 20, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  border: `2px solid ${period === days ? 'var(--injection-color)' : 'var(--border)'}`,
                  background: period === days ? '#F3E5F5' : '#fff',
                  color: period === days ? 'var(--injection-color)' : 'var(--text-secondary)',
                  transition: 'all 0.15s',
                }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>キャンセル</button>
          <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSave} disabled={saving}>
            {saving ? '追加中...' : '追加'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0',
      borderBottom: '1px solid var(--border)', fontSize: 14 }}>
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  )
}

const actionBtn = {
  padding: '5px 10px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
  background: '#F3F4F6', color: 'var(--text-secondary)', border: 'none', fontWeight: 600,
}

const errStyle = { background: '#FEF2F2', color: '#DC2626', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 12 }
