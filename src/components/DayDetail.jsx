import { useState, useEffect } from 'react'
import { fetchDayData, deleteBloodPressure, deleteTemperature, deleteWeight, deleteInjection, deleteEvent } from '../hooks/useHealthData'
import { toDisplayDate } from '../utils/dateUtils'
import BloodPressureForm from './forms/BloodPressureForm'
import TemperatureForm from './forms/TemperatureForm'
import WeightForm from './forms/WeightForm'
import InjectionForm from './forms/InjectionForm'
import EventForm from './forms/EventForm'

const CATEGORY_LABEL = { medical: '診療', rehab: 'リハ', other: 'その他' }

export default function DayDetail({ dateStr, onClose }) {
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [openForm, setOpenForm]  = useState(null)

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

  const addButtons = [
    { key: 'bp',        label: '💉 血圧',   color: 'var(--bp-color)' },
    { key: 'temp',      label: '🌡️ 体温',   color: 'var(--temp-color)' },
    { key: 'weight',    label: '⚖️ 体重',   color: 'var(--weight-color)' },
    { key: 'injection', label: '💊 注射',   color: 'var(--injection-color)' },
    { key: 'event',     label: '📋 イベント', color: 'var(--event-color)' },
  ]

  return (
    <>
      <div className="overlay" onClick={onClose}>
        <div className="bottom-sheet" onClick={e => e.stopPropagation()}>
          <div className="sheet-handle" />
          <div className="sheet-header">
            <h2>{toDisplayDate(dateStr)}</h2>
            <button className="sheet-close" onClick={onClose}>✕</button>
          </div>

          {/* Add buttons */}
          <div style={{ padding: '12px 16px', display: 'flex', gap: 8, overflowX: 'auto' }}>
            {addButtons.map(({ key, label, color }) => (
              <button key={key} onClick={() => setOpenForm(key)} style={{
                background: color + '1A', border: `1.5px solid ${color}`,
                color: color, padding: '7px 13px', borderRadius: 20,
                fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
              }}>
                {label}
              </button>
            ))}
          </div>

          {loading ? <div className="spinner" /> : (
            <div style={{ padding: '0 0 24px' }}>
              {/* Blood Pressure */}
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
                    {r.pulse && <><span className="card-value" style={{ fontSize: 16, marginLeft: 8 }}>{r.pulse}</span><span className="card-unit">bpm</span></>}
                  </div>
                  {r.location && <div style={metaText}>📍 {r.location}</div>}
                  {r.memo && <div style={memoText}>{r.memo}</div>}
                </div>
              ))}

              {/* Temperature */}
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

              {/* Weight */}
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

              {/* Injections */}
              {data?.injections?.map(r => (
                <div key={r.id} className="card" style={{ borderLeft: '4px solid var(--injection-color)' }}>
                  <div className="card-header">
                    <span className="card-title" style={{ color: 'var(--injection-color)' }}>💊 自己注射</span>
                    <button onClick={() => del('injection', r.id)} style={delBtn}>🗑</button>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{r.drugName}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', gap: 12 }}>
                    <span>予定: {r.scheduledDate || '未設定'}</span>
                    {r.actualDate && <span>実施: {r.actualDate}</span>}
                  </div>
                  {r.memo && <div style={memoText}>{r.memo}</div>}
                </div>
              ))}

              {/* Events */}
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
                  <p>記録がありません<br />上のボタンで追加できます</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {openForm === 'bp'        && <BloodPressureForm dateStr={dateStr} onSave={handleSaved} onClose={() => setOpenForm(null)} />}
      {openForm === 'temp'      && <TemperatureForm   dateStr={dateStr} onSave={handleSaved} onClose={() => setOpenForm(null)} />}
      {openForm === 'weight'    && <WeightForm        dateStr={dateStr} onSave={handleSaved} onClose={() => setOpenForm(null)} />}
      {openForm === 'injection' && <InjectionForm     dateStr={dateStr} onSave={handleSaved} onClose={() => setOpenForm(null)} />}
      {openForm === 'event'     && <EventForm         dateStr={dateStr} onSave={handleSaved} onClose={() => setOpenForm(null)} />}
    </>
  )
}

const delBtn = {
  background: 'none', border: 'none', fontSize: 16, cursor: 'pointer',
  color: 'var(--text-secondary)', padding: '0 4px',
}
const metaText = { fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }
const memoText = { fontSize: 13, color: 'var(--text)', marginTop: 6, lineHeight: 1.5, whiteSpace: 'pre-wrap' }
