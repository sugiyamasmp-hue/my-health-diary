import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/calendar', icon: '📅', label: 'カレンダー' },
  { to: '/graph',    icon: '📊', label: 'グラフ' },
  { to: '/filter',   icon: '🔍', label: 'フィルター' },
  { to: '/settings', icon: '⚙️', label: '設定' },
]

export default function BottomNav() {
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 480,
      background: '#fff',
      borderTop: '1px solid #E5E7EB',
      display: 'flex',
      boxShadow: '0 -2px 12px rgba(0,0,0,0.08)',
      zIndex: 50,
    }}>
      {tabs.map(({ to, icon, label }) => (
        <NavLink key={to} to={to} style={({ isActive }) => ({
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '8px 4px', textDecoration: 'none',
          color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
          fontWeight: isActive ? 700 : 400,
          fontSize: 10,
          gap: 2,
          transition: 'color 0.2s',
        })}>
          <span style={{ fontSize: 22 }}>{icon}</span>
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
