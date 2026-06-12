import { useState, useEffect } from 'react'
import { addInjection, updateInjection, fetchSchedules } from '../../hooks/useHealthData'
import { today } from '../../utils/dateUtils'

export default function InjectionForm({ dateStr, initialData, onSave, onClose }) {
  const [schedules, setSchedules]   = useState([])
  const [scheduleId, setScheduleId] = useState(initialData?.scheduleId || '')
  const [drugName, setDrugName]     = useState(initialData?.drugName || '')
  const [scheduledDate, setScheduledDate] = useState(initialData?.scheduledDate || dateStr)
  const [actualDate, setActualDate] = useState(initialData?.actualDate || dateStr)
  const [memo, setMemo]             = useState(initialData?.memo || '')
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState('')

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
    if (s) setDrugName(s.drugName)
    else setDrugName('')
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
      onSave()
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
    </div>
  )
}

const errStyle = { background: '#FEF2F2', color: '#DC2626', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 12 }
