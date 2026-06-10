import { useState } from 'react'
import { addTemperature } from '../../hooks/useHealthData'

export default function TemperatureForm({ dateStr, onSave, onClose }) {
  const [value, setValue]   = useState('')
  const [memo, setMemo]     = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  const handleSave = async () => {
    const v = parseFloat(value)
    if (!v) { setError('体温を入力してください'); return }
    if (v < 34 || v > 42) { setError('体温の値が範囲外です (34〜42°C)'); return }
    setSaving(true)
    try {
      await addTemperature(dateStr, { value: v, memo: memo.trim() })
      onSave()
    } catch (e) {
      setError('保存に失敗しました: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  const color = () => {
    const v = parseFloat(value)
    if (!v) return 'var(--text-secondary)'
    if (v >= 38) return '#EF4444'
    if (v >= 37) return '#F59E0B'
    return 'var(--temp-color)'
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🌡️ 体温を記録</h2>
          <button className="sheet-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {error && <div style={errStyle}>{error}</div>}

          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 56, fontWeight: 800, color: color(), lineHeight: 1 }}>
              {value || '--'}
            </div>
            <div style={{ fontSize: 18, color: 'var(--text-secondary)' }}>°C</div>
          </div>

          <div className="form-group">
            <label>体温 (°C) *</label>
            <input className="form-control" type="number" inputMode="decimal" step="0.1"
              placeholder="36.5" value={value} onChange={e => setValue(e.target.value)}
              style={{ fontSize: 20, textAlign: 'center' }} />
          </div>

          {/* Quick buttons */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, justifyContent: 'center' }}>
            {['35.5','36.0','36.5','37.0','37.5','38.0'].map(v => (
              <button key={v} onClick={() => setValue(v)} style={{
                padding: '6px 10px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
                background: value === v ? 'var(--temp-color)' : '#F5F7FA',
                color: value === v ? '#fff' : 'var(--text)',
                border: '1px solid var(--border)', fontWeight: 600,
              }}>{v}</button>
            ))}
          </div>

          <div className="form-group">
            <label>メモ</label>
            <textarea className="form-control" placeholder="体調など..." rows={2}
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
