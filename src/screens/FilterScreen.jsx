import { useState } from 'react'
import { fetchRangeData } from '../hooks/useHealthData'
import { today, addDays, toDisplayDate } from '../utils/dateUtils'
import { exportCSV } from '../utils/csv'

const CATEGORY_LABEL = { medical: '診療', rehab: 'リハ', other: 'その他' }

const TYPE_FILTERS = [
  { key: 'bp',        label: '血圧',    color: 'var(--bp-color)' },
  { key: 'temp',      label: '体温',    color: 'var(--temp-color)' },
  { key: 'weight',    label: '体重',    color: 'var(--weight-color)' },
  { key: 'injection', label: '注射',   color: 'var(--injection-color)' },
  { key: 'event',     label: 'イベント', color: 'var(--event-color)' },
]

export default function FilterScreen() {
  const todayStr = today()
  const [startDate, setStartDate] = useState(addDays(todayStr, -30))
  const [endDate, setEndDate]     = useState(todayStr)
  const [types, setTypes]         = useState(new Set(['bp','temp','weight','injection','event']))
  const [search, setSearch]       = useState('')
  const [results, setResults]     = useState(null)
  const [loading, setLoading]     = useState(false)

  const toggleType = (key) => {
    setTypes(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const handleSearch = async () => {
    if (!startDate || !endDate) return
    setLoading(true)
    try {
      const rows = await fetchRangeData(startDate, endDate)
      const filtered = []
      rows.forEach(({ date, data }) => {
        const q = search.toLowerCase()

        if (types.has('bp')) {
          ;(data.bloodPressures || []).forEach(r => {
            if (!q || String(r.systolic).includes(q) || String(r.diastolic).includes(q)
              || (r.location || '').toLowerCase().includes(q) || (r.memo || '').toLowerCase().includes(q)) {
              filtered.push({ date, type: 'bp', data: r })
            }
          })
        }
        if (types.has('temp')) {
          ;(data.temperatures || []).forEach(r => {
            if (!q || String(r.value).includes(q) || (r.memo || '').toLowerCase().includes(q)) {
              filtered.push({ date, type: 'temp', data: r })
            }
          })
        }
        if (types.has('weight')) {
          ;(data.weights || []).forEach(r => {
            if (!q || String(r.value).includes(q) || (r.memo || '').toLowerCase().includes(q)) {
              filtered.push({ date, type: 'weight', data: r })
            }
          })
        }
        if (types.has('injection')) {
          ;(data.injections || []).forEach(r => {
            if (!q || (r.drugName || '').toLowerCase().includes(q) || (r.memo || '').toLowerCase().includes(q)) {
              filtered.push({ date, type: 'injection', data: r })
            }
          })
        }
        if (types.has('event')) {
          ;(data.events || []).forEach(r => {
            if (!q || (r.location || '').toLowerCase().includes(q)
              || (r.content || '').toLowerCase().includes(q) || (r.memo || '').toLowerCase().includes(q)) {
              filtered.push({ date, type: 'event', data: r })
            }
          })
        }
      })
      filtered.sort((a, b) => b.date.localeCompare(a.date))
      setResults(filtered)
    } finally {
      setLoading(false)
    }
  }

  const handleCSV = async () => {
    setLoading(true)
    try {
      const rows = await fetchRangeData(startDate, endDate)
      exportCSV(rows, `health-diary-${startDate}-${endDate}.csv`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100%' }}>
      <div className="screen-header">
        <h1>🔍 フィルター・検索</h1>
        <button className="icon-btn" title="CSV出力" onClick={handleCSV} disabled={loading}>📥</button>
      </div>

      <div style={{ padding: '12px 16px' }}>
        {/* Date range */}
        <div className="card" style={{ margin: '0 0 12px' }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>📅 期間</div>
          <div className="form-row">
            <div className="form-group" style={{ margin: 0 }}>
              <label>開始日</label>
              <input className="form-control" type="date" value={startDate}
                onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>終了日</label>
              <input className="form-control" type="date" value={endDate}
                onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>

          {/* Quick range chips */}
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            {[
              { label: '今日', days: 0 },
              { label: '7日', days: 7 },
              { label: '30日', days: 30 },
              { label: '90日', days: 90 },
            ].map(({ label, days }) => (
              <button key={label} onClick={() => {
                setEndDate(todayStr)
                setStartDate(addDays(todayStr, -days))
              }} style={{
                padding: '5px 12px', borderRadius: 16, fontSize: 12, cursor: 'pointer',
                background: '#F5F7FA', border: '1px solid var(--border)', color: 'var(--text-secondary)',
              }}>{label}</button>
            ))}
          </div>
        </div>

        {/* Type filters */}
        <div className="card" style={{ margin: '0 0 12px' }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>📋 種類</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {TYPE_FILTERS.map(({ key, label, color }) => (
              <button key={key} onClick={() => toggleType(key)} style={{
                padding: '7px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                cursor: 'pointer',
                background: types.has(key) ? color + '20' : '#fff',
                color: types.has(key) ? color : 'var(--text-secondary)',
                border: `1.5px solid ${types.has(key) ? color : 'var(--border)'}`,
              }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Text search */}
        <div className="card" style={{ margin: '0 0 12px' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label>🔍 テキスト検索</label>
            <input className="form-control" type="search" placeholder="薬名・場所・メモなど..."
              value={search} onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <button className="btn btn-primary btn-full" onClick={handleSearch} disabled={loading}>
            {loading ? '検索中...' : '検索する'}
          </button>
          <button className="btn btn-ghost" style={{ whiteSpace: 'nowrap' }} onClick={handleCSV} disabled={loading}>
            📥 CSV
          </button>
        </div>

        {/* Results */}
        {results !== null && (
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>
              {results.length} 件ヒット
            </div>
            {results.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🔍</div>
                <p>該当する記録がありません</p>
              </div>
            ) : (
              results.map((item, i) => <ResultCard key={i} item={item} />)
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function ResultCard({ item }) {
  const { date, type, data: r } = item
  const typeConfig = {
    bp:        { label: '💉 血圧', color: 'var(--bp-color)' },
    temp:      { label: '🌡️ 体温', color: 'var(--temp-color)' },
    weight:    { label: '⚖️ 体重', color: 'var(--weight-color)' },
    injection: { label: '💊 注射', color: 'var(--injection-color)' },
    event:     { label: '📋 イベント', color: 'var(--event-color)' },
  }
  const cfg = typeConfig[type]

  return (
    <div style={{
      background: '#fff', borderRadius: 10, padding: '12px 14px', marginBottom: 8,
      borderLeft: `4px solid ${cfg.color}`, boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: cfg.color }}>{cfg.label}</span>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{toDisplayDate(date)}</span>
      </div>
      {type === 'bp' && (
        <div>
          <strong>{r.systolic}/{r.diastolic}</strong> mmHg
          {r.pulse && <span style={{ marginLeft: 8, color: 'var(--text-secondary)' }}>{r.pulse} bpm</span>}
          {r.location && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>📍 {r.location}</div>}
        </div>
      )}
      {type === 'temp' && <div><strong>{r.value}</strong> °C</div>}
      {type === 'weight' && <div><strong>{r.value}</strong> kg</div>}
      {type === 'injection' && (
        <div>
          <strong>{r.drugName}</strong>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
            予定: {r.scheduledDate || '未設定'}{r.actualDate ? ` → 実施: ${r.actualDate}` : ''}
          </div>
        </div>
      )}
      {type === 'event' && (
        <div>
          <span className={`badge badge-${r.category}`}>{CATEGORY_LABEL[r.category]}</span>
          {r.location && <div style={{ fontSize: 13, marginTop: 4 }}>📍 {r.location}</div>}
          {r.content && <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{r.content}</div>}
        </div>
      )}
      {r.memo && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.5 }}>{r.memo}</div>}
    </div>
  )
}
