import { useState, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine
} from 'recharts'
import { fetchRangeData } from '../hooks/useHealthData'
import { today, addDays, toDisplayDate } from '../utils/dateUtils'

const RANGES = [
  { label: '1週間', days: 7 },
  { label: '2週間', days: 14 },
  { label: '1ヶ月', days: 30 },
  { label: '3ヶ月', days: 90 },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#fff', border: '1px solid var(--border)',
      borderRadius: 10, padding: '10px 14px', fontSize: 13, boxShadow: 'var(--shadow-md)',
    }}>
      <div style={{ fontWeight: 700, marginBottom: 6, color: 'var(--text-secondary)' }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  )
}

export default function GraphScreen() {
  const [range, setRange]   = useState(1)
  const [data, setData]     = useState([])
  const [loading, setLoading] = useState(false)

  const loadData = async (rangeIdx) => {
    setLoading(true)
    try {
      const days = RANGES[rangeIdx].days
      const end = today()
      const start = addDays(end, -days)
      const rows = await fetchRangeData(start, end)

      const points = []
      rows.forEach(({ date, data: d }) => {
        const bps = d.bloodPressures || []
        const lastBP = bps.length > 0 ? bps[bps.length - 1] : null
        const lastTemp = (d.temperatures || []).slice(-1)[0]
        const lastWeight = (d.weights || []).slice(-1)[0]
        const tempValue = lastTemp?.value ?? lastBP?.temperature ?? null
        const weightValue = lastWeight?.value ?? null
        if (!lastBP && tempValue == null && weightValue == null) return
        points.push({
          date,
          label: date.slice(5),
          systolic:  lastBP?.systolic ?? null,
          diastolic: lastBP?.diastolic ?? null,
          pulse:     lastBP?.pulse ?? null,
          temp:      tempValue,
          weight:    weightValue,
        })
      })
      points.sort((a, b) => a.date.localeCompare(b.date))
      setData(points)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData(range) }, [range])

  const hasBP     = data.some(d => d.systolic != null)
  const hasTemp   = data.some(d => d.temp != null)
  const hasWeight = data.some(d => d.weight != null)

  const stats = hasBP ? {
    maxSys: Math.max(...data.map(d => d.systolic ?? 0)),
    minSys: Math.min(...data.filter(d => d.systolic).map(d => d.systolic)),
    avgSys: Math.round(data.filter(d => d.systolic).reduce((s, d) => s + d.systolic, 0) / data.filter(d => d.systolic).length),
    avgDia: Math.round(data.filter(d => d.diastolic).reduce((s, d) => s + d.diastolic, 0) / data.filter(d => d.diastolic).length),
  } : null

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100%' }}>
      <div className="screen-header">
        <h1>📊 グラフ</h1>
      </div>

      {/* Range selector */}
      <div style={{ padding: '12px 16px', display: 'flex', gap: 8 }}>
        {RANGES.map((r, i) => (
          <button key={r.label} onClick={() => setRange(i)} style={{
            flex: 1, padding: '8px 0', borderRadius: 20, fontSize: 13, fontWeight: 600,
            cursor: 'pointer',
            background: range === i ? 'var(--primary)' : '#fff',
            color: range === i ? '#fff' : 'var(--text-secondary)',
            border: `1.5px solid ${range === i ? 'var(--primary)' : 'var(--border)'}`,
            transition: 'all 0.15s',
          }}>
            {r.label}
          </button>
        ))}
      </div>

      {loading ? <div className="spinner" /> : data.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <p>この期間のデータがありません</p>
        </div>
      ) : (
        <div>
          {/* Blood Pressure Chart */}
          {hasBP && (
            <div className="card" style={{ margin: '0 16px 16px', padding: '14px 4px 4px' }}>
              <div style={{ padding: '0 12px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--bp-color)' }}>💉 血圧</span>
                {stats && (
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    平均 {stats.avgSys}/{stats.avgDia}
                  </span>
                )}
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data} margin={{ left: -10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                  <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <ReferenceLine y={140} stroke="#FCA5A5" strokeDasharray="4 2" label={{ value: '140', position: 'right', fontSize: 10 }} />
                  <ReferenceLine y={90}  stroke="#FBBF24" strokeDasharray="4 2" label={{ value: '90', position: 'right', fontSize: 10 }} />
                  <Line type="monotone" dataKey="systolic"  name="収縮期" stroke="#2196F3" strokeWidth={2} dot={{ r: 4 }} connectNulls />
                  <Line type="monotone" dataKey="diastolic" name="拡張期" stroke="#64B5F6" strokeWidth={2} dot={{ r: 4 }} connectNulls />
                  {data.some(d => d.pulse) && (
                    <Line type="monotone" dataKey="pulse" name="脈拍" stroke="#90CAF9" strokeWidth={1.5} dot={{ r: 3 }} strokeDasharray="5 3" connectNulls />
                  )}
                </LineChart>
              </ResponsiveContainer>

              {/* Stats row */}
              {stats && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', padding: '8px 12px 4px', gap: 8 }}>
                  {[
                    { label: '最高', value: stats.maxSys },
                    { label: '最低', value: stats.minSys },
                    { label: '平均SBP', value: stats.avgSys },
                    { label: '平均DBP', value: stats.avgDia },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{label}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--bp-color)' }}>{value}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Temperature Chart */}
          {hasTemp && (
            <div className="card" style={{ margin: '0 16px 16px', padding: '14px 4px 4px' }}>
              <div style={{ padding: '0 12px 12px', fontWeight: 700, fontSize: 15, color: 'var(--temp-color)' }}>🌡️ 体温</div>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={data} margin={{ left: -10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                  <YAxis domain={[35, 39]} tick={{ fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={37} stroke="#FBBF24" strokeDasharray="4 2" />
                  <ReferenceLine y={38} stroke="#FCA5A5" strokeDasharray="4 2" />
                  <Line type="monotone" dataKey="temp" name="体温(°C)" stroke="#FF5722" strokeWidth={2} dot={{ r: 4 }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Weight Chart */}
          {hasWeight && (
            <div className="card" style={{ margin: '0 16px 16px', padding: '14px 4px 4px' }}>
              <div style={{ padding: '0 12px 12px', fontWeight: 700, fontSize: 15, color: 'var(--weight-color)' }}>⚖️ 体重</div>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={data} margin={{ left: -10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                  <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="weight" name="体重(kg)" stroke="#4CAF50" strokeWidth={2} dot={{ r: 4 }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
