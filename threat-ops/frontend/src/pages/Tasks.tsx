import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchTasks } from '../api'
import type { Task, TaskStatus } from '../types'
import TaskCard from '../components/TaskCard'

type SortKey = 'created_at' | 'priority'
type FilterStatus = 'all' | TaskStatus
type FilterLabel = 'all' | 'p' | 'other'
type FilterVisibility = 'all' | 'public' | 'private'

const filterBtn = (active: boolean): React.CSSProperties => ({
  fontFamily: 'var(--font-mono)',
  fontSize: '0.65rem',
  letterSpacing: '0.06em',
  padding: '0.3rem 0.75rem',
  border: '1px solid',
  borderColor: active ? 'rgba(61,139,64,0.45)' : 'var(--border-subtle)',
  background: active ? 'rgba(61,139,64,0.07)' : 'transparent',
  color: active ? 'var(--green)' : 'var(--text-secondary)',
  cursor: 'pointer',
  transition: 'all var(--transition)',
})

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [filterLabel, setFilterLabel] = useState<FilterLabel>('all')
  const [filterVisibility, setFilterVisibility] = useState<FilterVisibility>('all')
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const navigate = useNavigate()

  const load = useCallback(async () => {
    try {
      const data = await fetchTasks()
      setTasks(data)
      setLastUpdate(new Date())
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    load()
    const iv = setInterval(load, 15000)
    return () => clearInterval(iv)
  }, [load])

  const filtered = tasks
    .filter(t => filterStatus === 'all' || t.status === filterStatus)
    .filter(t => {
      if (filterLabel === 'all') return true
      if (filterLabel === 'p') return t.label === 'p'
      return t.label !== 'p'
    })
    .filter(t => filterVisibility === 'all' || t.visibility === filterVisibility)
    .sort((a, b) => {
      if (sortKey === 'priority')
        return sortDir === 'desc' ? b.priority - a.priority : a.priority - b.priority
      const ta = new Date(a.created_at).getTime()
      const tb = new Date(b.created_at).getTime()
      return sortDir === 'desc' ? tb - ta : ta - tb
    })

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortKey(key); setSortDir('desc') }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <div className="loading-dots"><span /><span /><span /></div>
      </div>
    )
  }

  return (
    <div style={{ animation: 'fadeInUp 0.3s ease' }}>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="page-title">incidents</h1>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.62rem',
            color: 'var(--text-secondary)',
            marginTop: '0.3rem',
          }}>
            {filtered.length}/{tasks.length} records — synced {lastUpdate.toLocaleTimeString('ru-RU')}
          </div>
        </div>
        <button className="btn btn-green" onClick={() => navigate('/tasks/new')}>
          + new incident
        </button>
      </div>

      {/* Filter bar */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        padding: '0.75rem 1.1rem',
        marginBottom: '1px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
        alignItems: 'center',
      }}>
        {/* Status filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--text-secondary)', letterSpacing: '0.1em', marginRight: '0.15rem' }}>
            status
          </span>
          {(['all', 'pending', 'in_progress', 'confirmed'] as const).map(s => (
            <button key={s} style={filterBtn(filterStatus === s)} onClick={() => setFilterStatus(s)}>
              {s === 'all' ? 'all' : s === 'pending' ? 'pending' : s === 'in_progress' ? 'active' : 'closed'}
            </button>
          ))}
        </div>

        {/* Label filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--text-secondary)', letterSpacing: '0.1em', marginRight: '0.15rem' }}>
            type
          </span>
          {(['all', 'p', 'other'] as const).map(l => (
            <button key={l} style={filterBtn(filterLabel === l)} onClick={() => setFilterLabel(l)}>
              {l === 'all' ? 'all' : l === 'p' ? 'fraud' : 'cve'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--text-secondary)', letterSpacing: '0.1em', marginRight: '0.15rem' }}>
            visibility
          </span>
          {(['all', 'private', 'public'] as const).map(v => (
            <button key={v} style={filterBtn(filterVisibility === v)} onClick={() => setFilterVisibility(v)}>
              {v}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginLeft: 'auto' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--text-secondary)', letterSpacing: '0.1em', marginRight: '0.15rem' }}>
            sort
          </span>
          {(['created_at', 'priority'] as const).map(key => (
            <button key={key} style={filterBtn(sortKey === key)} onClick={() => toggleSort(key)}>
              {key === 'created_at' ? 'date' : 'priority'}
              {sortKey === key && <span style={{ marginLeft: '0.2rem' }}>{sortDir === 'desc' ? '↓' : '↑'}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{
          padding: '3rem 1.5rem',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-secondary)',
          fontSize: '0.75rem',
        }}>
          <div style={{ marginBottom: '0.75rem' }}>no records match current filters</div>
          <button className="btn btn-green" onClick={() => navigate('/tasks/new')}>
            + create incident
          </button>
        </div>
      ) : (
        <div className="tasks-grid" style={{ border: '1px solid var(--border-subtle)', borderRight: 'none', borderBottom: 'none' }}>
          {filtered.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  )
}
