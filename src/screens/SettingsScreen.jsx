import { useState, useEffect } from 'react'
import {
  fetchSchedules, addSchedule, updateSchedulePeriod,
  toggleScheduleActive, deleteSchedule, getCurrentPeriod
} from '../hooks/useHealthData'
import { today, addDays, toDisplayDate } from '../utils/dateUtils'

export default function SettingsScreen() {
  const [schedules, setSchedules]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId]   = useState(null)

  const loadSchedules = async () => {
    setLoading(true)
    try { setSchedules(await fetchSchedules()) }
    finally { setLoading(false) }
  }

  useEffect(() => { loadSchedules() }, [])

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
          schedules.map(schedule => (
            <ScheduleCard
              key={schedule.id}
              schedule={schedule}
              isEditing={editingId === schedule.id}
              onEdit={() => setEditingId(editingId === schedule.id ? null : schedule.id)}
              onChanged={loadSchedules}
            />
          ))
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

function ScheduleCard({ schedule, isEditing, onEdit, onChanged }) {
  const period = getCurrentPeriod(schedule)
  const todayStr = today()
  const [newPeriod, setNewPeriod]   = useState(period)
  const [periodStart, setPeriodStart] = useState(todayStr)
  const [saving, setSaving]         = useState(false)

  const handleToggleActive = async () => {
    await toggleScheduleActive(schedule.id, !schedule.active)
    onChanged()
  }
  const handleDelete = async () => {
    if (!confirm(`「${schedule.drugName}」を削除しますか？`)) return
    await deleteSchedule(schedule.id)
    onChanged()
  }
  const handleUpdatePeriod = async () => {
    if (!newPeriod || newPeriod < 1) return
    setSaving(true)
    try {
      await updateSchedulePeriod(schedule.id, parseInt(newPeriod), periodStart)
      onChanged(); onEdit()
    } finally { setSaving(false) }
  }

  const nextDue = schedule.active
    ? (() => {
        const history = [...(schedule.periodHistory || [])].sort((a, b) => b.startDate.localeCompare(a.startDate))
        const p = history[0]?.period ?? 7
        return addDays(todayStr, p)
      })()
    : null

  return (
    <div style={{
      background: '#fff', borderRadius: 12, marginBottom: 10,
      boxShadow: 'var(--shadow-sm)', overflow: 'hidden',
      opacity: schedule.active ? 1 : 0.6,
    }}>
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{schedule.drugName}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', gap: 12 }}>
              <span>周期: {period}日</span>
              {nextDue && <span>次回予定: {nextDue}</span>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={handleToggleActive} style={{
              padding: '5px 10px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
              background: schedule.active ? '#D1FAE5' : '#F3F4F6',
              color: schedule.active ? '#065F46' : 'var(--text-secondary)',
              border: 'none', fontWeight: 600,
            }}>
              {schedule.active ? '有効' : '無効'}
            </button>
            <button onClick={onEdit} style={{
              padding: '5px 10px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
              background: '#EFF6FF', color: 'var(--primary)', border: 'none', fontWeight: 600,
            }}>編集</button>
            <button onClick={handleDelete} style={{
              padding: '5px 10px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
              background: '#FEF2F2', color: 'var(--danger)', border: 'none', fontWeight: 600,
            }}>削除</button>
          </div>
        </div>

        {/* Period history */}
        {schedule.periodHistory?.length > 1 && (
          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
            <strong>周期履歴:</strong>
            {[...schedule.periodHistory].sort((a, b) => b.startDate.localeCompare(a.startDate)).map((h, i) => (
              <span key={i} style={{ marginLeft: 6 }}>{h.startDate}: {h.period}日</span>
            ))}
          </div>
        )}
      </div>

      {isEditing && (
        <div style={{ padding: '12px 16px', background: '#F9FAFB', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>周期を変更</div>
          <div className="form-row">
            <div className="form-group" style={{ margin: 0 }}>
              <label>新しい周期 (日)</label>
              <input className="form-control" type="number" inputMode="numeric" min="1"
                value={newPeriod} onChange={e => setNewPeriod(e.target.value)} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>変更開始日</label>
              <input className="form-control" type="date" value={periodStart}
                onChange={e => setPeriodStart(e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button className="btn btn-ghost btn-sm" onClick={onEdit}>キャンセル</button>
            <button className="btn btn-primary btn-sm" onClick={handleUpdatePeriod} disabled={saving}>
              {saving ? '更新中...' : '周期を更新'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function AddScheduleModal({ onSaved, onClose }) {
  const [drugName, setDrugName] = useState('')
  const [period, setPeriod]     = useState(7)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')

  const handleSave = async () => {
    if (!drugName.trim()) { setError('薬名を入力してください'); return }
    if (!period || period < 1) { setError('周期を入力してください'); return }
    setSaving(true)
    try {
      await addSchedule(drugName.trim(), parseInt(period))
      onSaved()
    } catch (e) {
      setError('保存に失敗しました: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
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
            <label>注射周期（日数）*</label>
            <input className="form-control" type="number" inputMode="numeric" min="1"
              placeholder="7" value={period} onChange={e => setPeriod(e.target.value)} />
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
              例: 7 = 週1回、14 = 隔週、28 = 月1回
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
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0',
      borderBottom: '1px solid var(--border)', fontSize: 14 }}>
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  )
}

const errStyle = { background: '#FEF2F2', color: '#DC2626', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 12 }
