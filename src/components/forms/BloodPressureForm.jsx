import { useState } from 'react'
import { createPortal } from 'react-dom'
import { addBloodPressure, updateBloodPressure } from '../../hooks/useHealthData'

const LOCATIONS = ['自宅', '病院', 'DS', 'その他']
const TEMP_PRESETS = ['35.5', '36.0', '36.5', '37.0', '37.5', '38.0']

export default function BloodPressureForm({ dateStr, initialData, onSave, onClose }) {
  const [form, setForm] = useState(initialData ? {
    systolic:    String(initialData.systolic),
    diastolic:   String(initialData.diastolic),
    pulse:       initialData.pulse != null ? String(initialData.pulse) : '',
    location:    initialData.location || '',
    memo:        initialData.memo || '',
    temperature: initialData.temperature != null ? String(initialData.temperature) : '',
  } : { systolic: '', diastolic: '', pulse: '', location: '', memo: '', temperature: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const tempColor = () => {
    const v = parseFloat(form.temperature)
    if (!v) return 'var(--text-secondary)'
    if (v >= 38) return '#EF4444'
    if (v >= 37) return '#F59E0B'
    return 'var(--temp-color)'
  }

  const handleSave = async () => {
    const s = parseInt(form.systolic), d = parseInt(form.diastolic)
    if (!s || !d) { setError('収縮期・拡張期血圧を入力してください'); return }
    if (s < 50 || s > 300 || d < 30 || d > 200) { setError('血圧の値が範囲外です'); return }
    if (form.temperature) {
      const t = parseFloat(form.temperature)
      if (isNaN(t) || t < 34 || t > 42) { setError('体温の値が範囲外です (34〜42°C)'); return }
    }
    setSaving(true)
    try {
      const record = {
        systolic: s, diastolic: d,
        pulse: form.pulse ? parseInt(form.pulse) : null,
        location: form.location.trim(),
        memo: form.memo.trim(),
        temperature: form.temperature ? parseFloat(form.temperature) : null,
      }
      if (initialData) {
        await updateBloodPressure(dateStr, initialData.id, record)
      } else {
        await addBloodPressure(dateStr, record)
      }
      onSave()
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
          <h2>💉 血圧を{initialData ? '編集' : '記録'}</h2>
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

          <div style={{ textAlign: 'center', margin: '-4px 0 18px' }}>
            {form.systolic && form.diastolic
              ? <strong style={{ fontSize: 26, color: 'var(--bp-color)' }}>{form.systolic}/{form.diastolic}</strong>
              : <span style={{ fontSize: 26, color: 'var(--border)' }}>---/---</span>}
            <span style={{ fontSize: 14, color: 'var(--text-secondary)', marginLeft: 4 }}>mmHg</span>
            {form.pulse && <span style={{ fontSize: 14, color: 'var(--text-secondary)', marginLeft: 12 }}>{form.pulse} bpm</span>}
          </div>

          <div className="form-group">
            <label>体温 (°C) <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 400 }}>任意</span></label>
            <input className="form-control" type="number" inputMode="decimal" step="0.1"
              placeholder="36.5" value={form.temperature}
              onChange={e => set('temperature', e.target.value)}
              style={form.temperature ? { color: tempColor(), fontWeight: 700 } : {}} />
            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              {TEMP_PRESETS.map(v => (
                <button key={v} type="button" onClick={() => set('temperature', v)} style={{
                  padding: '5px 9px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                  background: form.temperature === v ? 'var(--temp-color)' : '#F5F7FA',
                  color: form.temperature === v ? '#fff' : 'var(--text)',
                  border: '1px solid var(--border)', fontWeight: 600,
                }}>{v}</button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>場所</label>
            <div className="location-btn-group">
              {LOCATIONS.map(loc => (
                <button
                  key={loc}
                  type="button"
                  className={`location-btn${form.location === loc ? ' active' : ''}`}
                  onClick={() => set('location', form.location === loc ? '' : loc)}
                >
                  {loc}
                </button>
              ))}
            </div>
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
    </div>,
    document.body
  )
}

const errStyle = {
  background: '#FEF2F2', color: '#DC2626',
  padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 12,
}
