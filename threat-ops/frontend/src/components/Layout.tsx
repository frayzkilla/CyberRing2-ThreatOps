import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Sidebar from './Sidebar'

export default function Layout() {
  const { user, logout, changePassword } = useAuth()
  const navigate = useNavigate()
  const [sessionTime, setSessionTime] = useState(0)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setSessionTime(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [])

  const fmtSession = (s: number) => {
    const h = Math.floor(s / 3600).toString().padStart(2, '0')
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0')
    const sec = (s % 60).toString().padStart(2, '0')
    return `${h}:${m}:${sec}`
  }

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const resetPasswordForm = () => {
    setOldPassword('')
    setNewPassword('')
    setRepeatPassword('')
    setPasswordError('')
    setPasswordSuccess('')
    setPasswordSaving(false)
  }

  const openPasswordModal = () => {
    resetPasswordForm()
    setPasswordModalOpen(true)
  }

  const closePasswordModal = () => {
    resetPasswordForm()
    setPasswordModalOpen(false)
  }

  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    if (!oldPassword || !newPassword || !repeatPassword) {
      setPasswordError('Fill in all password fields')
      return
    }

    if (newPassword !== repeatPassword) {
      setPasswordError('New password confirmation does not match')
      return
    }

    if (oldPassword === newPassword) {
      setPasswordError('New password must differ from the current one')
      return
    }

    setPasswordSaving(true)
    try {
      await changePassword(oldPassword, newPassword)
      setPasswordSuccess('Password updated')
      setOldPassword('')
      setNewPassword('')
      setRepeatPassword('')
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : 'Failed to update password')
    } finally {
      setPasswordSaving(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <header className="corp-header">
        <div className="corp-header__brand">
          <div className="corp-header__brand-dot" />
          ALLSAFE CYBERSECURITY
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.58rem', letterSpacing: '0.06em' }}>
            threat operations
          </span>
        </div>

        <div className="corp-header__classification">
          confidential // internal use only
        </div>

        <div className="corp-header__meta">
          <div className="corp-header__meta-item">
            <span>operator</span>
            <span style={{ color: 'var(--text-primary)' }}>{user?.username ?? '-'}</span>
            {user?.is_admin && (
              <span style={{ color: 'var(--red)', fontSize: '0.5rem', letterSpacing: '0.1em' }}>ADMIN</span>
            )}
            <button
              type="button"
              className="corp-header__action"
              onClick={openPasswordModal}
            >
              change password
            </button>
          </div>
          <div style={{ color: 'var(--border-subtle)' }}>|</div>
          <div className="corp-header__meta-item">
            <span style={{ color: 'var(--green)', fontSize: '0.45rem' }}>■</span>
            <span>session</span>
            <span style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
              {fmtSession(sessionTime)}
            </span>
          </div>
          <div style={{ color: 'var(--border-subtle)' }}>|</div>
          <button
            onClick={handleLogout}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.6rem',
              letterSpacing: '0.08em',
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '0.1rem 0.3rem',
              transition: 'color var(--transition)',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            logout
          </button>
        </div>
      </header>

      <div
        style={{
          display: 'flex',
          minHeight: '100vh',
          paddingTop: 'var(--header-height)',
        }}
      >
        <Sidebar />

        <main
          style={{
            flex: 1,
            minWidth: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            borderLeft: '1px solid var(--border-subtle)',
          }}
        >
          <div
            style={{
              padding: '1.75rem 2rem',
              maxWidth: '1380px',
              animation: 'fadeInUp 0.3s ease',
            }}
          >
            <Outlet />
          </div>
        </main>
      </div>

      {passwordModalOpen && (
        <div className="modal-overlay" onClick={closePasswordModal}>
          <div className="modal-card fade-in-up" onClick={e => e.stopPropagation()}>
            <div className="modal-card__header">
              <div style={{ minWidth: 0 }}>
                <div className="section-title" style={{ marginBottom: '0.55rem' }}>Credentials</div>
                <div className="page-title" style={{ fontSize: '1rem' }}>Change Password</div>
              </div>
              <button type="button" className="corp-header__action" onClick={closePasswordModal}>
                close
              </button>
            </div>

            <form onSubmit={handleChangePassword} style={{ display: 'grid', gap: '0.95rem' }}>
              <div>
                <label className="label-form" htmlFor="old-password">Current password</label>
                <input
                  id="old-password"
                  className="input-field"
                  type="password"
                  value={oldPassword}
                  onChange={e => setOldPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>

              <div>
                <label className="label-form" htmlFor="new-password">New password</label>
                <input
                  id="new-password"
                  className="input-field"
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>

              <div>
                <label className="label-form" htmlFor="repeat-password">Repeat new password</label>
                <input
                  id="repeat-password"
                  className="input-field"
                  type="password"
                  value={repeatPassword}
                  onChange={e => setRepeatPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>

              {passwordError && (
                <div className="notification notification-error" style={{ position: 'static', top: 'auto', right: 'auto', maxWidth: 'none' }}>
                  {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div className="notification notification-success" style={{ position: 'static', top: 'auto', right: 'auto', maxWidth: 'none' }}>
                  {passwordSuccess}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn" onClick={closePasswordModal}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-green"
                  disabled={passwordSaving || !oldPassword || !newPassword || !repeatPassword}
                >
                  {passwordSaving ? 'Saving...' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
