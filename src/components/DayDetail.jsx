import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { fetchDayData, deleteBloodPressure, deleteTemperature, deleteWeight, deleteInjection, deleteEvent } from '../hooks/useHealthData'
import { toDisplayDate } from '../utils/dateUtils'
import BloodPressureForm from './forms/BloodPressureForm'
import TemperatureForm from './forms/TemperatureForm'
import WeightForm from './forms/WeightForm'
import InjectionForm from './forms/InjectionForm'
import EventForm from './forms/EventForm'

const CATEGORY_LABEL = { medical: '診療', rehab: 'リハ', other: 'その他' }

const ADD_BUTTONS = [
  { key: 'bp',        label: '💉 血圧',    color: '#2196F3' },
  { key: 'temp',      label: '🌡️ 体温',   color: '#FF5722' },
  { key: 'weight',    label: '⚖️ 体重',   color: '#4CAF50' },
  { key: 'injection', label: '💊 注射',   color: '#9C27B0' },
  { key: 'event',     label: '📋 イベント', color: '#FF9800' },
]

export default function DayDetail({ dateStr, onClose }) {
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [openForm, setOpenForm]  = useState(null)
  const [snap, setSnap]          = useState('partial') // 'partial' | 'half' | 'full'

  const touchStartY = useRef(0)
  const contentRef  = useRef(null)

  const load = async () => {
    setLoading(true)
    try { setData(await fetchDayData(dateStr)) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [dateStr])

  const handleSaved = () => {
    setOpenForm(null)
    load()
  }

  const del = async (type, id) => {
    if (!confirm('削除しますか？')) return
    const map = {
      bp: deleteBloodPressure, temp: deleteTemperature,
      weight: deleteWeight, injection: deleteInjection, event: deleteEvent,
    }
    await map[type](dateStr, id)
    load()
  }

  const onTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY
  }

  const onTouchEnd = (e) => {
    const dy = touchStartY.current - e.changedTouches[0].clientY
    const scrollTop = contentRef.current?.scrollTop ?? 0

    if (dy > 50) {
      if (snap === 'partial') setSnap('half')
      else if (snap === 'half') setSnap('full')
    } else if (dy < -50) {
      if (snap === 'full' && scrollTop > 10) return
      if (snap === 'full') setSnap('half')
      else if (snap === 'half') setSnap('partial')
      else onClose()
    }
  }

  return createPortal(
    <>
      <div className="overlay" onClick={onClose}>
        <div
          className={`bottom-sheet bottom-sheet--${snap}`}
          onClick={e => e.stopPropagation()}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div className="sheet-handle" />

          <div className="sheet-header">
            <h2>{toDisplayDate(dateStr)}</h2>
            <button className="sheet-close" onClick={onClose}>✕</button>
          </div>

          <div className="sheet-add-row">
            {ADD_BUTTONS.map(({ key, label, color }) => (
              <button key={key} onClick={() => setOpenForm(key)} style={{
                background: color + '1A', border: `1.5px solid ${color}`,
                color, padding: '9px 14px', borderRadius: 20,
                fontSize: 14, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                flexShrink: 0,
              }}>
                {label}
              </button>
            ))}
          </div>

          <div ref={contentRef} className="sheet-content">
            {loading ? <div className="spinner" /> : (
              <div style={{ paddingBottom: 24 }}>
                {data?.bloodPressures?.map(r => (
                  <div key={r.id} className="card" style={{ borderLeft: '4px solid var(--bp-color)' }}>
                    <div className="card-header">
                      <span className="card-title" style={{ color: 'var(--bp-color)' }}>💉 血圧</span>
                      <button onClick={() => del('bp', r.id)} style={delBtn}>🗑</button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <span className="card-value">{r.systolic}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>/</span>
                      <span className="card-value">{r.diastolic}</span>
                      <span className="card-unit">mmHg</span>
                      {r.pulse && <><span className="card-value" style={{ fontSize: 18, marginLeft: 8 }}>{r.pulse}</span><span className="card-unit">bpm</span></>}
                    </div>
                    {r.location && <div style={metaText}>📍 {r.location}</div>}
                    {r.memo && <div style={memoText}>{r.memo}</div>}
                  </div>
                ))}

                {data?.temperatures?.map(r => (
                  <div key={r.id} className="card" style={{ borderLeft: '4px solid var(--temp-color)' }}>
                    <div className="card-header">
                      <span className="card-title" style={{ color: 'var(--temp-color)' }}>🌡️ 体温</span>
                      <button onClick={() => del('temp', r.id)} style={delBtn}>🗑</button>
                    </div>
                    <div><span className="card-value">{r.value}</span><span className="card-unit">°C</span></div>
                    {r.memo && <div style={memoText}>{r.memo}</div>}
                  </div>
                ))}

                {data?.weights?.map(r => (
                  <div key={r.id} className="card" style={{ borderLeft: '4px solid var(--weight-color)' }}>
                    <div className="card-header">
                      <span className="card-title" style={{ color: 'var(--weight-color)' }}>⚖️ 体重</span>
                      <button onClick={() => del('weight', r.id)} style={delBtn}>🗑</button>
                    </div>
                    <div><span className="card-value">{r.value}</span><span className="card-unit">kg</span></div>
                    {r.memo && <div style={memoText}>{r.memo}</div>}
                  </div>
                ))}

                {data?.injections?.map(r => (
                  <div key={r.id} className="card" style={{ borderLeft: '4px solid var(--injection-color)' }}>
                    <div className="card-header">
                      <span className="card-title" style={{ color: 'var(--injection-color)' }}>💊 自己注射</span>
                      <button onClick={() => del('injection', r.id)} style={delBtn}>🗑</button>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 4 }}>{r.drugName}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', gap: 12 }}>
                      <span>予定: {r.scheduledDate || '未設定'}</span>
                      {r.actualDate && <span>実施: {r.actualDate}</span>}
                    </div>
                    {r.memo && <div style={memoText}>{r.memo}</div>}
                  </div>
                ))}

                {data?.events?.map(r => (
                  <div key={r.id} className="card" style={{ borderLeft: '4px solid var(--event-color)' }}>
                    <div className="card-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="card-title" style={{ color: 'var(--event-color)' }}>📋 イベント</span>
                        <span className={`badge badge-${r.category}`}>{CATEGORY_LABEL[r.category] || r.category}</span>
                      </div>
                      <button onClick={() => del('event', r.id)} style={delBtn}>🗑</button>
                    </div>
                    {r.location && <div style={metaText}>📍 {r.location}</div>}
                    {r.content && <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{r.content}</div>}
                    {r.memo && <div style={memoText}>{r.memo}</div>}
                    {r.imageUrls?.length > 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginTop: 8 }}>
                        {r.imageUrls.map((url, i) => (
                          <img key={i} src={url} alt="" onClick={() => window.open(url)}
                            style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 6, cursor: 'pointer' }} />
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {!data?.bloodPressures?.length && !data?.temperatures?.length &&
                 !data?.weights?.length && !data?.injections?.length && !data?.events?.length && (
                  <div className="empty-state">
                    <div className="empty-icon">📝</div>
                    <p>記録がありません<br />上にスワイプして追加できます</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {openForm === 'bp'        && <BloodPressureForm dateStr={dateStr} onSave={handleSaved} onClose={() => setOpenForm(null)} />}
      {openForm === 'temp'      && <TemperatureForm   dateStr={dateStr} onSave={handleSaved} onClose={() => setOpenForm(null)} />}
      {openForm === 'weight'    && <WeightForm        dateStr={dateStr} onSave={handleSaved} onClose={() => setOpenForm(null)} />}
      {openForm === 'injection' && <InjectionForm     dateStr={dateStr} onSave={handleSaved} onClose={() => setOpenForm(null)} />}
      {openForm === 'event'     && <EventForm         dateStr={dateStr} onSave={handleSaved} onClose={() => setOpenForm(null)} />}
    </>,
    document.body
  )
}

const delBtn = {
  background: 'none', border: 'none', fontSize: 18, cursor: 'pointer',
  color: 'var(--text-secondary)', padding: '4px 6px', minHeight: 36,
}
const metaText = { fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }
const memoText = { fontSize: 13, color: 'var(--text)', marginTop: 6, lineHeight: 1.6, whiteSpace: 'pre-wrap' }
