import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.jsx'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(form.email, form.password)
      navigate('/child/home')
    } catch (err) {
      if (!navigator.onLine) {
        setError('You are offline. Please connect to the internet to log in for the first time.')
      } else {
        setError(err.response?.data?.detail || 'Invalid email or password')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: 24,
      background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a35 100%)'
    }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: 72, marginBottom: 8 }} className="animate-float">🌟</div>
        <h1 className="heading display-text" style={{ fontSize: 36, background: 'linear-gradient(135deg, #6C63FF, #FF6B6B)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Little Learner
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>Learning made fun for little ones</p>
      </div>

      {/* Form */}
      <div className="glass-card" style={{ width: '100%', maxWidth: 400, padding: 32 }}>
        <h2 style={{ marginBottom: 24, textAlign: 'center', fontWeight: 800 }}>Parent / Teacher Login</h2>

        {error && (
          <div style={{
            background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)',
            borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 20,
            color: '#FF6B6B', fontSize: 14, fontWeight: 600
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              id="login-email"
              type="email"
              className="form-input"
              placeholder="parent@example.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              id="login-password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required autoComplete="current-password"
            />
          </div>
          <button id="login-submit" type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? <span className="spinner" style={{ width: 24, height: 24, borderWidth: 2 }} /> : '🚀 Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, color: 'var(--text-secondary)', fontSize: 14 }}>
          No account?{' '}
          <button className="btn" style={{ padding: 0, minHeight: 'auto', color: 'var(--color-primary)', background: 'none', display: 'inline', fontWeight: 700 }}
            onClick={() => navigate('/register')}>
            Register here
          </button>
        </p>
      </div>

      <p style={{ marginTop: 24, color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>
        ⚡ After logging in, the app works offline!
      </p>
    </div>
  )
}
