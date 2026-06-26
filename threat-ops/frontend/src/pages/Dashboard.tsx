import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchTasks, fetchRecentTasksFeed } from '../api'
import type { Task, RecentTaskFeedItem, DashboardStats } from '../types'
import StatusBadge from '../components/StatusBadge'

function computeStats(tasks: Task[]): DashboardStats {
  const confirmedVishing = tasks.filter(t => t.vishing_result === true)
  return {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    confirmed: tasks.filter(t => t.status === 'confirmed').length,
    vishing_count: tasks.filter(t => t.label === 'p').length,
    osint_count: tasks.filter(t => t.label !== 'p').length,
    confirmed_vishing: confirmedVishing.length,
    threat_level: tasks.length > 0 ? Math.round((confirmedVishing.length / tasks.length) * 100) : 0,
  }
}

function StatCard({ title, value, sub, accent = false }: {
  title: string
  value: number | string
  sub?: string
  accent?: boolean
}) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      padding: '1.1rem 1.25rem',
      borderRight: '1px solid var(--border-subtle)',
    }}>
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '0.6rem',
        letterSpacing: '0.12em',
        color: 'var(--text-secondary)',
        textTransform: 'uppercase',
        marginBottom: '0.55rem',
      }}>
        {title}
      </div>
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '2rem',
        color: accent ? 'var(--red)' : 'var(--text-primary)',
        lineHeight: 1,
        marginBottom: '0.25rem',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {value}
      </div>
      {sub && (
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.6rem',
          color: 'var(--text-secondary)',
          opacity: 0.7,
        }}>
          {sub}
        </div>
      )}
    </div>
  )
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [recentFeed, setRecentFeed] = useState<RecentTaskFeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const navigate = useNavigate()

  const load = useCallback(async () => {
    try {
      const [taskData, recentData] = await Promise.all([
        fetchTasks(),
        fetchRecentTasksFeed(),
      ])
      setTasks(taskData)
      setRecentFeed(recentData)
      setLastUpdate(new Date())
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    load()
    const iv = setInterval(load, 10000)
    return () => clearInterval(iv)
  }, [load])

  const stats = computeStats(tasks)
  const recent = recentFeed.slice(0, 8)

  const threatColor = stats.threat_level >= 60 ? 'var(--red)' : stats.threat_level >= 30 ? 'var(--gold)' : 'var(--green)'
  const threatLabel = stats.threat_level >= 60 ? 'critical' : stats.threat_level >= 30 ? 'elevated' : 'nominal'

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <div className="loading-dots"><span /><span /><span /></div>
      </div>
    )
  }

  return (
    <div style={{ animation: 'fadeInUp 0.3s ease' }}>

      {/* Page header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="page-title">dashboard</h1>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.65rem',
            color: 'var(--text-secondary)',
            marginTop: '0.3rem',
          }}>
            last sync {lastUpdate.toLocaleTimeString('ru-RU')} — auto refresh 10s
          </div>
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.6rem',
          color: 'var(--green)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          opacity: 0.8,
        }}>
          <span style={{ animation: 'flicker 3s infinite', fontSize: '0.5rem' }}>■</span>
          live
        </div>
      </div>

      {/* Threat status bar */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderLeft: `2px solid ${threatColor}`,
        padding: '1rem 1.25rem',
        marginBottom: '1px',
        display: 'flex',
        alignItems: 'center',
        gap: '2.5rem',
      }}>
        <div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.58rem',
            color: 'var(--text-secondary)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: '0.3rem',
          }}>
            threat level
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem' }}>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '2.2rem',
              color: threatColor,
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {stats.threat_level}%
            </span>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.68rem',
              color: threatColor,
              opacity: 0.8,
              letterSpacing: '0.08em',
            }}>
              {threatLabel}
            </span>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ height: '2px', background: 'var(--border-dim)', marginBottom: '0.4rem' }}>
            <div style={{
              width: `${stats.threat_level}%`,
              height: '100%',
              background: threatColor,
              opacity: 0.7,
              transition: 'width 1.2s ease',
            }} />
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.62rem',
            color: 'var(--text-secondary)',
          }}>
            {stats.confirmed_vishing} confirmed threats / {stats.total} total incidents
          </div>
        </div>

        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.62rem',
          color: 'var(--text-secondary)',
          textAlign: 'right',
        }}>
          <div style={{ marginBottom: '0.2rem' }}>
            vishing <span style={{ color: 'var(--text-primary)' }}>{stats.vishing_count}</span>
          </div>
          <div>
            cve <span style={{ color: 'var(--text-primary)' }}>{stats.osint_count}</span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="stats-grid" style={{ marginBottom: '1.75rem' }}>
        <StatCard title="total incidents"    value={stats.total}            sub="in database" />
        <StatCard title="pending"            value={stats.pending}          sub="awaiting triage" />
        <StatCard title="in progress"        value={stats.in_progress}      sub="under analysis" />
        <StatCard title="confirmed threats"  value={stats.confirmed_vishing} sub="fraud threats" accent />
      </div>

      {/* Type distribution */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div className="section-title">type distribution</div>
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          padding: '1rem 1.25rem',
        }}>
          {stats.total > 0 ? (
            <>
              <div style={{ display: 'flex', height: '20px', marginBottom: '0.6rem' }}>
                {stats.vishing_count > 0 && (
                  <div style={{
                    width: `${(stats.vishing_count / stats.total) * 100}%`,
                    background: 'var(--magenta)',
                    opacity: 0.6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.58rem',
                    color: 'var(--text-primary)',
                    transition: 'width 0.8s ease',
                  }}>
                    {stats.vishing_count > 2 ? `${Math.round((stats.vishing_count / stats.total) * 100)}%` : ''}
                  </div>
                )}
                {stats.osint_count > 0 && (
                  <div style={{
                    flex: 1,
                    background: 'var(--green)',
                    opacity: 0.35,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.58rem',
                    color: 'var(--text-primary)',
                  }}>
                    {stats.osint_count > 2 ? `${Math.round((stats.osint_count / stats.total) * 100)}%` : ''}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '1.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <div style={{ width: 8, height: 8, background: 'var(--magenta)', opacity: 0.6 }} />
                  <span style={{ color: 'var(--text-secondary)' }}>fraud</span>
                  <span style={{ color: 'var(--text-primary)' }}>{stats.vishing_count}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <div style={{ width: 8, height: 8, background: 'var(--green)', opacity: 0.45 }} />
                  <span style={{ color: 'var(--text-secondary)' }}>cve</span>
                  <span style={{ color: 'var(--text-primary)' }}>{stats.osint_count}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <div style={{ width: 8, height: 8, background: '#5aaa5e', opacity: 0.5 }} />
                  <span style={{ color: 'var(--text-secondary)' }}>closed</span>
                  <span style={{ color: 'var(--text-primary)' }}>{stats.confirmed}</span>
                </div>
              </div>
            </>
          ) : (
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              padding: '0.75rem 0',
            }}>
              no incidents recorded
            </div>
          )}
        </div>
      </div>

      {/* Recent incidents table */}
      <div>
        <div className="section-title">recent incidents</div>
        <div style={{ border: '1px solid var(--border-subtle)' }}>
          {recent.length === 0 ? (
            <div style={{
              padding: '2rem',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-secondary)',
              fontSize: '0.78rem',
            }}>
              no records found
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  {['id', 'title', 'type', 'status', 'priority', 'created'].map(col => (
                    <th key={col} style={{
                      padding: '0.5rem 0.85rem',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.6rem',
                      letterSpacing: '0.1em',
                      color: 'var(--text-secondary)',
                      textAlign: 'left',
                      textTransform: 'uppercase',
                      fontWeight: 400,
                      background: 'var(--bg-sidebar)',
                    }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map((task, i) => (
                  <tr
                    key={task.id}
                    onClick={() => navigate(`/tasks/${task.id}`)}
                    style={{
                      borderBottom: i < recent.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                      cursor: 'pointer',
                      transition: 'background var(--transition)',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-card-hover)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                  >
                    <td style={{ padding: '0.55rem 0.85rem', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                      #{String(task.id).padStart(4, '0')}
                    </td>
                    <td style={{ padding: '0.55rem 0.85rem', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-primary)', maxWidth: '260px' }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {task.title}
                      </div>
                    </td>
                    <td style={{ padding: '0.55rem 0.85rem' }}>
                      <StatusBadge label={task.label} size="sm" />
                    </td>
                    <td style={{ padding: '0.55rem 0.85rem' }}>
                      <StatusBadge status={task.status} size="sm" />
                    </td>
                    <td style={{ padding: '0.55rem 0.85rem', fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}>
                      <span style={{
                        color: task.priority > 85 ? 'var(--red)' : task.priority > 50 ? 'var(--gold)' : 'var(--text-secondary)',
                      }}>
                        {task.priority}
                      </span>
                    </td>
                    <td style={{ padding: '0.55rem 0.85rem', fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {formatDate(task.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
