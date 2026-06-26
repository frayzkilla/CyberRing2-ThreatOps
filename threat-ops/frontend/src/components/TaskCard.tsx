import { useNavigate } from 'react-router-dom'
import type { Task } from '../types'
import StatusBadge from './StatusBadge'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function TaskCard({ task }: { task: Task }) {
  const navigate = useNavigate()
  const priorityPct = Math.round((task.priority / 127) * 100)
  const priorityColor = priorityPct > 75 ? 'var(--red)' : priorityPct > 40 ? 'var(--gold)' : 'var(--green)'

  return (
    <div
      onClick={() => navigate(`/tasks/${task.id}`)}
      style={{
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border-subtle)',
        borderRight: '1px solid var(--border-subtle)',
        padding: '1.1rem 1.25rem',
        cursor: 'pointer',
        transition: 'background var(--transition)',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-card-hover)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-card)' }}
    >
      {/* Header row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '0.6rem',
      }}>
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <StatusBadge label={task.label} />
          <StatusBadge status={task.status} />
          <StatusBadge visibility={task.visibility} />
        </div>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.6rem',
          color: 'var(--text-secondary)',
        }}>
          #{String(task.id).padStart(4, '0')}
        </span>
      </div>

      {/* Title */}
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '0.82rem',
        color: 'var(--text-primary)',
        marginBottom: '0.5rem',
        lineHeight: 1.4,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {task.title}
      </div>

      {/* Description */}
      {task.description && (
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.72rem',
          color: 'var(--text-secondary)',
          marginBottom: '0.6rem',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          lineHeight: 1.5,
        }}>
          {task.description}
        </div>
      )}

      {/* Vishing result */}
      {task.vishing_result !== null && (
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.65rem',
          color: task.vishing_result ? 'var(--red)' : '#5aaa5e',
          marginBottom: '0.55rem',
          opacity: 0.9,
        }}>
          {task.vishing_result ? '! threat detected' : '✓ no threat'}
        </div>
      )}

      {/* Priority bar */}
      <div style={{ marginBottom: '0.65rem' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.6rem',
          color: 'var(--text-secondary)',
          marginBottom: '0.25rem',
        }}>
          <span>priority</span>
          <span style={{ color: priorityColor }}>{task.priority}/127</span>
        </div>
        <div className="priority-bar">
          <div className="priority-fill" style={{ width: `${priorityPct}%`, background: priorityColor }} />
        </div>
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.6rem',
        color: 'var(--text-secondary)',
        borderTop: '1px solid var(--border-subtle)',
        paddingTop: '0.5rem',
      }}>
        <span>{formatDate(task.created_at)}</span>
        {task.file_key && <span style={{ color: 'var(--green)', opacity: 0.6 }}>attachment</span>}
      </div>
    </div>
  )
}
