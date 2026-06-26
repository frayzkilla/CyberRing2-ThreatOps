import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchTask, updateTaskStatus, downloadTaskFile, triggerFileDownload, downloadReport } from '../api'
import type { Task } from '../types'
import StatusBadge from '../components/StatusBadge'
import { useAuth } from '../contexts/AuthContext'

function Row({ label, value, mono = false }: {
  label: string
  value: string | number | null | undefined
  mono?: boolean
}) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div style={{
      display: 'flex',
      gap: '1rem',
      padding: '0.45rem 0',
      borderBottom: '1px solid var(--border-subtle)',
    }}>
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '0.6rem',
        letterSpacing: '0.1em',
        color: 'var(--text-secondary)',
        textTransform: 'uppercase',
        minWidth: '120px',
        paddingTop: '0.1rem',
        flexShrink: 0,
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: mono ? 'var(--font-mono)' : 'var(--font-body)',
        fontSize: mono ? '0.75rem' : '0.88rem',
        color: 'var(--text-primary)',
        lineHeight: 1.5,
        wordBreak: 'break-word',
      }}>
        {value}
      </div>
    </div>
  )
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [downloadingFile, setDownloadingFile] = useState(false)
  const [downloadingReport, setDownloadingReport] = useState(false)
  const { user } = useAuth()

  const taskId = parseInt(id || '', 10)

  const load = useCallback(async () => {
    if (isNaN(taskId)) return
    try {
      const data = await fetchTask(taskId)
      setTask(data)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'load failed')
    } finally {
      setLoading(false)
    }
  }, [taskId])

  useEffect(() => {
    load()
    const iv = setInterval(() => {
      if (task && task.status !== 'confirmed') load()
    }, 8000)
    return () => clearInterval(iv)
  }, [load, task?.status])

  const handleStatusUpdate = async (status: 'in_progress' | 'confirmed') => {
    if (!task) return
    setUpdatingStatus(true)
    try {
      const updated = await updateTaskStatus(task.id, { status })
      setTask(updated)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'update failed')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleDownloadFile = async () => {
    if (!task) return
    setDownloadingFile(true)
    try {
      const blob = await downloadTaskFile(task.id)
      const ext = task.file_key?.split('.').pop() || 'bin'
      triggerFileDownload(blob, `task_${task.id}_file.${ext}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'download failed')
    } finally {
      setDownloadingFile(false)
    }
  }

  const handleDownloadReport = async () => {
    if (!task) return
    setDownloadingReport(true)
    try {
      const blob = await downloadReport(task.id)
      triggerFileDownload(blob, `report_task_${task.id}.json`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'report failed')
    } finally {
      setDownloadingReport(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: '1rem' }}>
        <div className="loading-dots"><span /><span /><span /></div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-secondary)', letterSpacing: '0.1em' }}>
          loading...
        </div>
      </div>
    )
  }

  if (error && !task) {
    return (
      <div style={{
        padding: '2rem',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderLeft: '2px solid var(--red)',
      }}>
        <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--red)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
          error
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '1.25rem' }}>
          {error}
        </div>
        <button className="btn" onClick={() => navigate('/tasks')}>back</button>
      </div>
    )
  }

  if (!task) return null

  const isFraud = task.label === 'p'
  const priorityPct = Math.round((task.priority / 127) * 100)
  const priorityColor = priorityPct > 75 ? 'var(--red)' : priorityPct > 40 ? 'var(--gold)' : 'var(--green)'
  const analysisReady = task.status === 'confirmed' || task.vishing_result !== null || task.osint_comments !== null

  return (
    <div style={{ animation: 'fadeInUp 0.3s ease' }}>
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '0.62rem',
        color: 'var(--text-secondary)',
        marginBottom: '1.1rem',
      }}>
        <span
          style={{ cursor: 'pointer', color: 'var(--green)' }}
          onClick={() => navigate('/tasks')}
        >
          incidents
        </span>
        <span style={{ margin: '0 0.4rem', opacity: 0.4 }}>/</span>
        <span>#{String(task.id).padStart(4, '0')}</span>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
          <StatusBadge label={task.label} size="md" />
          <StatusBadge status={task.status} size="md" />
          <StatusBadge visibility={task.visibility} size="md" />
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.62rem',
            color: 'var(--text-secondary)',
            padding: '0.15rem 0.4rem',
            border: '1px solid var(--border-subtle)',
          }}>
            #{String(task.id).padStart(4, '0')}
          </span>
        </div>
        <h1 style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '1.1rem',
          fontWeight: 400,
          color: 'var(--text-primary)',
          letterSpacing: '0.04em',
          lineHeight: 1.35,
          marginBottom: '0.4rem',
        }}>
          {task.title}
        </h1>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.62rem',
          color: 'var(--text-secondary)',
        }}>
          created {formatDate(task.created_at)} &nbsp;·&nbsp; updated {formatDate(task.updated_at)}
        </div>
      </div>

      <div style={{ height: '1px', background: 'var(--border-subtle)', marginBottom: '1.5rem' }} />

      {error && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderLeft: '2px solid var(--red)',
          padding: '0.65rem 1rem',
          marginBottom: '1.25rem',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.72rem',
          color: 'var(--red)',
          opacity: 0.9,
        }}>
          {error}
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1px',
        marginBottom: '1px',
        background: 'var(--border-subtle)',
      }}>
        <div style={{ background: 'var(--bg-card)', padding: '1.25rem' }}>
          <div className="section-title">
            {isFraud ? 'fraud incident' : 'cve incident'}
          </div>

          <Row label="title"       value={task.title} />
          <Row label="type"        value={isFraud ? 'fraud - voice fraud analysis' : 'cve - standard analysis'} />
          <Row label="visibility"  value={task.visibility} mono />
          <Row label="description" value={task.description} />
          <Row label="notes"       value={task.comments} />
          <Row label="created"     value={formatDate(task.created_at)} mono />
          <Row label="updated"     value={formatDate(task.updated_at)} mono />

          <div style={{ paddingTop: '0.75rem' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.6rem',
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '0.4rem',
            }}>
              <span>priority</span>
              <span style={{ color: priorityColor }}>{task.priority}/127</span>
            </div>
            <div className="priority-bar">
              <div className="priority-fill" style={{ width: `${priorityPct}%`, background: priorityColor }} />
            </div>
            <div style={{
              marginTop: '0.3rem',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.6rem',
              color: 'var(--text-secondary)',
              opacity: 0.7,
            }}>
              {priorityPct > 75 ? 'high priority' : priorityPct > 40 ? 'medium priority' : 'low priority'}
            </div>
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="section-title">analysis results</div>

          {!analysisReady ? (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              justifyContent: 'center',
              gap: '0.6rem',
              padding: '1rem 0',
            }}>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: 4,
                    height: 4,
                    background: 'var(--green)',
                    animation: `loading-dots 1.4s ease-in-out ${i * 0.2}s infinite`,
                  }} />
                ))}
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.65rem',
                  color: 'var(--green)',
                  marginLeft: '0.5rem',
                  opacity: 0.8,
                }}>
                  processing...
                </span>
              </div>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.62rem',
                color: 'var(--text-secondary)',
              }}>
                analysis in progress. auto-refresh every 8s.
              </div>
            </div>
          ) : (
            <>
              {isFraud && task.vishing_result !== null && (
                <div style={{
                  background: task.vishing_result ? 'rgba(138,50,40,0.08)' : 'rgba(61,139,64,0.06)',
                  border: '1px solid',
                  borderColor: task.vishing_result ? 'rgba(138,50,40,0.35)' : 'rgba(61,139,64,0.3)',
                  borderLeft: `2px solid ${task.vishing_result ? 'var(--red)' : 'var(--green)'}`,
                  padding: '1rem 1.1rem',
                }}>
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.58rem',
                    color: 'var(--text-secondary)',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    marginBottom: '0.4rem',
                  }}>
                    fraud analysis result
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '1.5rem',
                    color: task.vishing_result ? 'var(--red)' : 'var(--green)',
                    lineHeight: 1,
                    marginBottom: '0.35rem',
                  }}>
                    {task.vishing_result ? 'threat detected' : 'no threat'}
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.62rem',
                    color: 'var(--text-secondary)',
                  }}>
                    {task.vishing_result
                      ? 'voice fraud indicators found in recording'
                      : 'no fraud indicators detected'}
                  </div>
                </div>
              )}

              {task.osint_comments && (
                <div>
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.6rem',
                    color: 'var(--text-secondary)',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    marginBottom: '0.4rem',
                  }}>
                    fraud analysis output
                  </div>
                  <div className="terminal-box" style={{ maxHeight: '220px' }}>
                    {task.osint_comments}
                    <span style={{ animation: 'blink 1s infinite', marginLeft: '2px' }}>_</span>
                  </div>
                </div>
              )}

              {task.vishing_result === null && !task.osint_comments && (
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.72rem',
                  color: 'var(--text-secondary)',
                  padding: '0.5rem 0',
                }}>
                  no analysis data available
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderTop: 'none',
        padding: '0.85rem 1.25rem',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.6rem',
        alignItems: 'center',
      }}>
        {(user?.id === task.owner_id || user?.is_admin) && task.status === 'pending' && (
          <button className="btn" onClick={() => handleStatusUpdate('in_progress')} disabled={updatingStatus}>
            {updatingStatus ? '...' : '▶ start analysis'}
          </button>
        )}
        {(user?.id === task.owner_id || user?.is_admin) && task.status === 'in_progress' && (
          <button className="btn btn-green" onClick={() => handleStatusUpdate('confirmed')} disabled={updatingStatus}>
            {updatingStatus ? '...' : '✓ confirm'}
          </button>
        )}

        {(task.file_key || task.report_key) && (
          <div style={{ width: '1px', height: '20px', background: 'var(--border-subtle)' }} />
        )}

        {task.file_key && (
          <button className="btn btn-magenta" onClick={handleDownloadFile} disabled={downloadingFile}>
            {downloadingFile ? '...' : '↓ download file'}
          </button>
        )}

        {task.report_key && (
          <button className="btn btn-green" onClick={handleDownloadReport} disabled={downloadingReport}>
            {downloadingReport ? '...' : '↓ download report'}
          </button>
        )}

        <button
          className="btn"
          style={{ marginLeft: 'auto' }}
          onClick={() => navigate('/tasks')}
        >
          ← back
        </button>
      </div>
    </div>
  )
}
