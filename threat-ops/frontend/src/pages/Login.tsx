import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

type Mode = 'login' | 'register'

export default function Login() {
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password) return
    setLoading(true)
    setError(null)
    try {
      if (mode === 'login') {
        await login(username.trim(), password)
      } else {
        await register(username.trim(), password)
      }
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const tabBtn = (active: boolean): React.CSSProperties => ({
    fontFamily: 'var(--font-mono)',
    fontSize: '0.72rem',
    letterSpacing: '0.06em',
    padding: '0.5rem 1.5rem',
    border: '1px solid',
    borderColor: active ? 'rgba(61,139,64,0.5)' : 'var(--border-subtle)',
    background: active ? 'rgba(61,139,64,0.08)' : 'var(--bg-input)',
    color: active ? 'var(--green)' : 'var(--text-secondary)',
    cursor: 'pointer',
    transition: 'all var(--transition)',
  })

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-deep)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
    }}>
      {/* Header bar */}
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        height: 'var(--header-height)',
        background: 'var(--bg-header)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 1.25rem',
        gap: '0.6rem',
      }}>
        <div style={{ width: 5, height: 5, background: 'var(--green)', animation: 'flicker 6s infinite' }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', letterSpacing: '0.12em', color: 'var(--text-primary)' }}>
          ALLSAFE CYBERSECURITY
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--text-secondary)', letterSpacing: '0.06em' }}>
          threat operations
        </span>
        <div style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-secondary)', letterSpacing: '0.18em', padding: '0.15rem 0.6rem', border: '1px solid var(--border-subtle)' }}>
          confidential // internal use only
        </div>
      </div>

      {/* Login card */}
      <div style={{ width: '100%', maxWidth: '400px', animation: 'fadeInUp 0.3s ease' }}>
        <div style={{ marginBottom: '1.75rem', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-primary)', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>
            allsafe<span style={{ color: 'var(--green)' }}>_ops</span>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--text-secondary)', letterSpacing: '0.08em' }}>
            threat operations platform
          </div>
        </div>

        {/* Mode toggle */}
        <div style={{ display: 'flex', marginBottom: '1px' }}>
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null) }}
            style={{ ...tabBtn(mode === 'login'), flex: 1, borderRight: 'none' }}
          >
            login
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(null) }}
            style={{ ...tabBtn(mode === 'register'), flex: 1 }}
          >
            register
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderLeft: '2px solid var(--green)',
            padding: '1.5rem',
          }}>
            {error && (
              <div style={{
                background: '#0f0808',
                border: '1px solid rgba(138,50,40,0.35)',
                borderLeft: '2px solid var(--red)',
                padding: '0.65rem 0.9rem',
                marginBottom: '1.1rem',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                color: '#c06050',
              }}>
                {error}
              </div>
            )}

            <div style={{ marginBottom: '1rem' }}>
              <label className="label-form">operator id</label>
              <input
                className="input-field"
                type="text"
                placeholder="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
                required
                minLength={3}
                maxLength={64}
              />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label className="label-form">access key</label>
              <input
                className="input-field"
                type="password"
                placeholder="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
                minLength={4}
              />
            </div>

            <button
              type="submit"
              className="btn btn-green"
              disabled={loading || !username.trim() || !password}
              style={{ width: '100%' }}
            >
              {loading ? 'authenticating...' : mode === 'login' ? 'authenticate' : 'create account'}
            </button>
          </div>
        </form>

        <div style={{
          marginTop: '1rem',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.58rem',
          color: 'var(--text-muted)',
          textAlign: 'center',
          letterSpacing: '0.06em',
        }}>
          unauthorized access is prohibited and monitored
        </div>
      </div>
    </div>
  )
}
