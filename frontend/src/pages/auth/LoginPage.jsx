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
      background: 'var(--color-bg)'
    }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 72, marginBottom: 8 }} className="animate-float">🌟</div>
        <h1 className="heading display-text" style={{
          fontSize: 40,
          background: 'linear-gradient(135deg, #F97316 0%, #EC4899 50%, #8B5CF6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Little Learner
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 8, fontSize: 16, fontWeight: 700 }}>
          Learning made fun for little ones
        </p>
      </div>

      {/* Form Card */}
      <div className="card" style={{
        width: '100%', maxWidth: 420, padding: 32,
        background: '#FFFFFF', border: '1.5px solid var(--color-border)',
        boxShadow: 'var(--shadow-card)', borderRadius: 'var(--radius-xl)'
      }}>
        <h2 className="subheading" style={{ marginBottom: 24, textAlign: 'center', fontSize: 22 }}>
          Parent / Teacher Login
        </h2>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1.5px solid rgba(239,68,68,0.3)',
            borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 20,
            color: '#DC2626', fontSize: 14, fontWeight: 700
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
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
            {loading ? <span className="spinner" style={{ width: 24, height: 24, borderWidth: 3 }} /> : '🚀 Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, color: 'var(--text-secondary)', fontSize: 14, fontWeight: 700 }}>
          No account?{' '}
          <button className="btn" style={{ padding: 0, minHeight: 'auto', color: '#F97316', background: 'none', display: 'inline', fontWeight: 800 }}
            onClick={() => navigate('/register')}>
            Register here
          </button>
        </p>
      </div>

      <p style={{ marginTop: 24, color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', fontWeight: 700 }}>
        ✨ Learning activities available anytime!
      </p>
    </div>
  )
}
