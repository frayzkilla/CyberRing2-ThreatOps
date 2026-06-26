import { useState, useEffect, useCallback } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { fetchTasks } from '../api'
import type { Task } from '../types'

interface NavItem {
  path: string
  label: string
  sub: string
}

const NAV_ITEMS: NavItem[] = [
  { path: '/dashboard', label: 'dashboard',   sub: 'overview' },
  { path: '/tasks',     label: 'incidents',   sub: 'all records' },
  { path: '/tasks/new', label: 'new incident', sub: 'create' },
]

function SvcRow({ name, port, online }: { name: string; port: string; online: boolean }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.3rem 0',
      fontFamily: 'var(--font-mono)',
      fontSize: '0.65rem',
    }}>
      <span style={{
        width: 5,
        height: 5,
        background: online ? 'var(--green)' : 'var(--red)',
        opacity: online ? 0.85 : 0.55,
        flexShrink: 0,
        animation: online ? 'flicker 5s infinite' : 'none',
      }} />
      <span style={{ flex: 1, color: 'var(--text-secondary)' }}>{name}</span>
      <span style={{ color: 'var(--text-muted)', fontSize: '0.58rem' }}>:{port}</span>
      <span style={{ color: online ? 'var(--green)' : 'var(--red)', opacity: 0.7, fontSize: '0.58rem' }}>
        {online ? 'up' : 'dn'}
      </span>
    </div>
  )
}

export default function Sidebar() {
  const location = useLocation()
  const [time, setTime] = useState(new Date())
  const [tasks, setTasks] = useState<Task[]>([])
  const [online, setOnline] = useState(false)

  const loadTasks = useCallback(async () => {
    try {
      const data = await fetchTasks()
      setTasks(data)
      setOnline(true)
    } catch {
      setOnline(false)
    }
  }, [])

  useEffect(() => {
    loadTasks()
    const iv = setInterval(loadTasks, 30000)
    return () => clearInterval(iv)
  }, [loadTasks])

  useEffect(() => {
    const iv = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(iv)
  }, [])

  const confirmed = tasks.filter(t => t.vishing_result === true).length
  const threat = tasks.length > 0 ? Math.round((confirmed / tasks.length) * 100) : 0
  const threatColor = threat >= 60 ? 'var(--red)' : threat >= 30 ? 'var(--gold)' : 'var(--green)'
  const threatLabel = threat >= 60 ? 'critical' : threat >= 30 ? 'elevated' : 'nominal'

  const fmt = (d: Date) =>
    d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const fmtDate = (d: Date) =>
    d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' })

  return (
    <aside style={{
      width: 'var(--sidebar-width)',
      minHeight: '100%',
      background: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      overflow: 'hidden',
    }}>

      {/* Logo block */}
      <div style={{
        padding: '1.1rem 1.25rem 1rem',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.78rem',
          color: 'var(--text-primary)',
          letterSpacing: '0.06em',
          marginBottom: '0.2rem',
        }}>
          allsafe<span style={{ color: 'var(--green)' }}>_ops</span>
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.58rem',
          color: 'var(--text-secondary)',
          letterSpacing: '0.08em',
        }}>
          vishing / osint / analytics
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '0.5rem 0' }}>
        <div style={{
          padding: '0.5rem 1.25rem 0.3rem',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.58rem',
          color: 'var(--text-muted)',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
        }}>
          modules
        </div>

        {NAV_ITEMS.map(item => {
          const isActive =
            location.pathname === item.path ||
            (item.path === '/tasks' &&
              location.pathname.startsWith('/tasks') &&
              location.pathname !== '/tasks/new')

          return (
            <NavLink
              key={item.path}
              to={item.path}
              style={{
                display: 'flex',
                flexDirection: 'column',
                padding: '0.55rem 1.25rem',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                letterSpacing: '0.04em',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                textDecoration: 'none',
                borderLeft: `2px solid ${isActive ? 'var(--green)' : 'transparent'}`,
                background: isActive ? 'rgba(61,139,64,0.06)' : 'transparent',
                transition: 'all var(--transition)',
              }}
            >
              <span>{item.label}</span>
              <span style={{
                fontSize: '0.55rem',
                color: 'var(--text-muted)',
                marginTop: '1px',
                letterSpacing: '0.06em',
              }}>
                {item.sub}
              </span>
            </NavLink>
          )
        })}
      </nav>

      {/* Services */}
      <div style={{
        padding: '0.85rem 1.25rem',
        borderTop: '1px solid var(--border-subtle)',
      }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.58rem',
          color: 'var(--text-muted)',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          marginBottom: '0.45rem',
        }}>
          services
        </div>
        <SvcRow name="backend"   port="8000" online={online} />
        <SvcRow name="analytics" port="8001" online={online} />
        <SvcRow name="vishing"   port="8002" online={online} />
        <SvcRow name="osint"     port="8003" online={online} />
      </div>

      {/* Clock */}
      <div style={{
        padding: '0.65rem 1.25rem',
        borderTop: '1px solid var(--border-subtle)',
      }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '1.05rem',
          color: 'var(--text-primary)',
          letterSpacing: '0.05em',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {fmt(time)}
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.58rem',
          color: 'var(--text-secondary)',
          marginTop: '1px',
        }}>
          {fmtDate(time)}
        </div>
      </div>

      {/* Threat level */}
      <div style={{
        padding: '0.75rem 1.25rem 1rem',
        borderTop: '1px solid var(--border-subtle)',
      }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.58rem',
          color: 'var(--text-muted)',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          marginBottom: '0.5rem',
        }}>
          threat level
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.4rem' }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '1.25rem',
            color: threatColor,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {threat}%
          </span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.6rem',
            color: threatColor,
            opacity: 0.8,
          }}>
            {threatLabel}
          </span>
        </div>

        <div style={{ height: '2px', background: 'var(--border-dim)' }}>
          <div style={{
            width: `${threat}%`,
            height: '100%',
            background: threatColor,
            opacity: 0.7,
            transition: 'width 0.8s ease',
          }} />
        </div>

        <div style={{
          marginTop: '0.35rem',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.58rem',
          color: 'var(--text-secondary)',
        }}>
          {confirmed}/{tasks.length} confirmed
        </div>
      </div>
    </aside>
  )
}
