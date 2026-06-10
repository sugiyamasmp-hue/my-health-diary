import { useState } from 'react'
import { addBloodPressure } from '../../hooks/useHealthData'

export default function BloodPressureForm({ dateStr, onSave, onClose }) {
  const [form, setForm]     = useState({ systolic: '', diastolic: '', pulse: '', location: '', memo: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    const s = parseInt(form.systolic), d = parseInt(form.diastolic)
    if (!s || !d) { setError('収縮期・拡張期血圧を入力してください'); return }
    if (s < 50 || s > 300 || d < 30 || d > 200) { setError('血圧の値が範囲外です'); return }
    setSaving(true)
    try {
      await addBloodPressure(dateStr, {
        systolic: s, diastolic: d,
        pulse: form.pulse ? parseInt(form.pulse) : null,
        location: form.location.trim(),
        memo: form.memo.trim(),
      })
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
          <h2>💉 血圧を記録</h2>
          <button className="sheet-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {error && <div style={errStyle}>{error}</div>}

          <div className="form-row-3">
            <div className="form-group">
              <label>収縮期 *</label>
              <input className="form-control" type="number" inputMode="numeric"
                placeholder="120" value={form.systolic}
                onChange={e => set('systolic', e.target.value)} />
            </div>
            <div className="form-group">
              <label>拡張期 *</label>
              <input className="form-control" type="number" inputMode="numeric"
                placeholder="80" value={form.diastolic}
                onChange={e => set('diastolic', e.target.value)} />
            </div>
            <div className="form-group">
              <label>脈拍</label>
              <input className="form-control" type="number" inputMode="numeric"
                placeholder="72" value={form.pulse}
                onChange={e => set('pulse', e.target.value)} />
            </div>
          </div>

          <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)', margin: '-8px 0 12px' }}>
            {form.systolic && form.diastolic
              ? <strong style={{ fontSize: 22, color: 'var(--bp-color)' }}>{form.systolic}/{form.diastolic}</strong>
              : '---/---'} mmHg
            {form.pulse && <span style={{ marginLeft: 12, color: 'var(--text-secondary)' }}>{form.pulse} bpm</span>}
          </div>

          <div className="form-group">
            <label>場所</label>
            <input className="form-control" type="text" placeholder="自宅・病院など"
              value={form.location} onChange={e => set('location', e.target.value)} />
          </div>
          <div className="form-group">
            <label>メモ</label>
            <textarea className="form-control" placeholder="気になること、体調など..."
              rows={3} value={form.memo} onChange={e => set('memo', e.target.value)} />
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

const errStyle = {
  background: '#FEF2F2', color: '#DC2626',
  padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 12,
}
