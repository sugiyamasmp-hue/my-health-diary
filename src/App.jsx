import { useState, useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import SplashScreen from './screens/SplashScreen'
import CalendarScreen from './screens/CalendarScreen'
import GraphScreen from './screens/GraphScreen'
import FilterScreen from './screens/FilterScreen'
import SettingsScreen from './screens/SettingsScreen'
import BottomNav from './components/BottomNav'

export default function App() {
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 2600)
    return () => clearTimeout(t)
  }, [])

  if (showSplash) return <SplashScreen />

  return (
    <HashRouter>
      <div className="app">
        <div className="screen">
          <Routes>
            <Route path="/" element={<Navigate to="/calendar" replace />} />
            <Route path="/calendar" element={<CalendarScreen />} />
            <Route path="/graph" element={<GraphScreen />} />
            <Route path="/filter" element={<FilterScreen />} />
            <Route path="/settings" element={<SettingsScreen />} />
          </Routes>
        </div>
        <BottomNav />
      </div>
    </HashRouter>
  )
}
