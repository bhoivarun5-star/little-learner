import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/client.js'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', name: '', password: '', password2: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.password2) { setError('Passwords do not match'); return }
    setLoading(true); setError('')
    try {
      await api.post('/auth/register/', { ...form, role: 'PARENT' })
      navigate('/login?registered=1')
    } catch (err) {
      const data = err.response?.data || {}
      setError(Object.values(data).flat().join(' ') || 'Registration failed')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: 420, padding: 32 }}>
        <button className="btn btn-secondary" style={{ padding: '6px 14px', minHeight: 'auto', marginBottom: 20 }} onClick={() => navigate('/login')}>← Back</button>
        <h2 style={{ marginBottom: 24, fontWeight: 800 }}>Create Account</h2>
        {error && <div style={{ background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 20, color: '#FF6B6B', fontSize: 14 }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { id: 'reg-name', label: 'Full Name', key: 'name', type: 'text', placeholder: 'Jane Smith' },
            { id: 'reg-email', label: 'Email', key: 'email', type: 'email', placeholder: 'jane@example.com' },
            { id: 'reg-password', label: 'Password', key: 'password', type: 'password', placeholder: '••••••••' },
            { id: 'reg-password2', label: 'Confirm Password', key: 'password2', type: 'password', placeholder: '••••••••' },
          ].map(f => (
            <div key={f.key} className="form-group">
              <label className="form-label">{f.label}</label>
              <input id={f.id} type={f.type} className="form-input" placeholder={f.placeholder}
                value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} required />
            </div>
          ))}
          <button id="reg-submit" type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? <span className="spinner" style={{ width: 24, height: 24, borderWidth: 2 }} /> : '✨ Create Account'}
          </button>
        </form>
      </div>
    </div>
  )
}
