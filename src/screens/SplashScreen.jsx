import { useEffect, useState } from 'react'
import amadoImg from '../assets/amado.png'

const styles = {
  container: {
    position: 'fixed', inset: 0,
    background: 'linear-gradient(135deg, #1565C0 0%, #2196F3 50%, #42A5F5 100%)',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    zIndex: 9999,
  },
  img: {
    width: 140, height: 140, borderRadius: '50%',
    objectFit: 'cover',
    marginBottom: 20,
    boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
    animation: 'pulse 1.2s ease-in-out infinite',
  },
  title: { color: '#fff', fontSize: 28, fontWeight: 800, letterSpacing: 1, marginBottom: 6 },
  sub:   { color: 'rgba(255,255,255,0.75)', fontSize: 14, letterSpacing: 2, marginBottom: 50 },
  dots:  { display: 'flex', gap: 8 },
}

export default function SplashScreen() {
  const [dot, setDot] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setDot(d => (d + 1) % 3), 500)
    return () => clearInterval(t)
  }, [])

  return (
    <div style={styles.container}>
      <style>{`@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}`}</style>
      <img src={amadoImg} alt="アマド" style={styles.img} />
      <h1 style={styles.title}>My Health Diary</h1>
      <p style={styles.sub}>マイ ヘルス ダイアリー</p>
      <div style={styles.dots}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 10, height: 10, borderRadius: '50%',
            background: i === dot ? '#fff' : 'rgba(255,255,255,0.35)',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>
    </div>
  )
}
