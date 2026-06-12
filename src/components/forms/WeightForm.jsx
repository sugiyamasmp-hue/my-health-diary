import { useState } from 'react'
import { addWeight, updateWeight } from '../../hooks/useHealthData'

export default function WeightForm({ dateStr, initialData, onSave, onClose }) {
  const [value, setValue]   = useState(initialData ? String(initialData.value) : '')
  const [memo, setMemo]     = useState(initialData?.memo || '')
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  const handleSave = async () => {
    const v = parseFloat(value)
    if (!v) { setError('体重を入力してください'); return }
    if (v < 10 || v > 300) { setError('体重の値が範囲外です'); return }
    setSaving(true)
    try {
      if (initialData) {
        await updateWeight(dateStr, initialData.id, { value: v, memo: memo.trim() })
      } else {
        await addWeight(dateStr, { value: v, memo: memo.trim() })
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
          <h2>⚖️ 体重を{initialData ? '編集' : '記録'}</h2>
          <button className="sheet-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {error && <div style={errStyle}>{error}</div>}

          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 56, fontWeight: 800, color: 'var(--weight-color)', lineHeight: 1 }}>
              {value || '--'}
            </div>
            <div style={{ fontSize: 18, color: 'var(--text-secondary)' }}>kg</div>
          </div>

          <div className="form-group">
            <label>体重 (kg) *</label>
            <input className="form-control" type="number" inputMode="decimal" step="0.1"
              placeholder="65.0" value={value} onChange={e => setValue(e.target.value)}
              style={{ fontSize: 20, textAlign: 'center' }} />
          </div>
          <div className="form-group">
            <label>メモ</label>
            <textarea className="form-control" placeholder="食後・起床時など..." rows={2}
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
