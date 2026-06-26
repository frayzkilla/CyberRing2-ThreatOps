import { useState, useRef, DragEvent, ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { createTask } from '../api'

interface FormState {
  title: string
  analysisType: 'cve' | 'fraud'
  priority: number
  description: string
  comments: string
  visibility: 'public' | 'private'
  file: File | null
}

interface Notification {
  type: 'success' | 'error'
  message: string
}

export default function NewTask() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [notification, setNotification] = useState<Notification | null>(null)

  const [form, setForm] = useState<FormState>({
    title: '',
    analysisType: 'cve',
    priority: 50,
    description: '',
    comments: '',
    visibility: 'private',
    file: null,
  })

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 4000)
  }

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) setField('file', file)
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setField('file', file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) {
      showNotification('error', 'title is required')
      return
    }
    setSubmitting(true)
    try {
      const task = await createTask({
        title: form.title.trim(),
        label: form.analysisType === 'fraud' ? 'p' : 'o',
        priority: form.priority,
        description: form.description.trim() || undefined,
        comments: form.comments.trim() || undefined,
        visibility: form.visibility,
        file: form.file || undefined,
      })
      showNotification('success', `incident #${task.id} created`)
      setTimeout(() => navigate(`/tasks/${task.id}`), 800)
    } catch (e) {
      showNotification('error', e instanceof Error ? e.message : 'create failed')
      setSubmitting(false)
    }
  }

  const priorityPct = Math.round((form.priority / 127) * 100)
  const priorityColor = priorityPct > 75 ? 'var(--red)' : priorityPct > 40 ? 'var(--gold)' : 'var(--green)'
  const priorityLabel = priorityPct > 75 ? 'high' : priorityPct > 40 ? 'medium' : 'low'

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
    <div style={{ animation: 'fadeInUp 0.3s ease', maxWidth: '720px' }}>
      {notification && (
        <div className={`notification notification-${notification.type}`}>
          {notification.message}
        </div>
      )}

      <div className="page-header">
        <h1 className="page-title">new incident</h1>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.65rem',
          color: 'var(--text-secondary)',
          marginTop: '0.3rem',
        }}>
          create a vishing or osint analysis task
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Main card */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderLeft: '2px solid var(--green)',
          padding: '1.5rem',
          marginBottom: '1px',
        }}>

          {/* Title */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label className="label-form">incident title *</label>
            <input
              className="input-field"
              type="text"
              placeholder="brief description of the threat or target"
              value={form.title}
              onChange={e => setField('title', e.target.value)}
              required
              maxLength={200}
            />
          </div>

          {/* Type toggle */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label className="label-form">analysis type</label>
            <div style={{ display: 'flex', gap: '0' }}>
              <button type="button" onClick={() => setField('analysisType', 'cve')} style={{ ...tabBtn(form.analysisType === 'cve'), borderRight: 'none' }}>
                cve
              </button>
              <button type="button" onClick={() => setField('analysisType', 'fraud')} style={tabBtn(form.analysisType === 'fraud')}>
                fraud
              </button>
            </div>
            <div style={{
              marginTop: '0.4rem',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.62rem',
              color: 'var(--text-secondary)',
            }}>
              {form.analysisType === 'fraud'
                ? 'voice fraud detection and analysis'
                : 'cve vulnerability analysis'}

            </div>
          </div>

          {/* Visibility */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label className="label-form">visibility</label>
            <div style={{ display: 'flex', gap: '0' }}>
              <button type="button" onClick={() => setField('visibility', 'private')} style={{ ...tabBtn(form.visibility === 'private'), borderRight: 'none' }}>
                private
              </button>
              <button type="button" onClick={() => setField('visibility', 'public')} style={tabBtn(form.visibility === 'public')}>
                public
              </button>
            </div>
            <div style={{ marginTop: '0.4rem', fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-secondary)' }}>
              {form.visibility === 'private'
                ? 'only you can view this incident'
                : 'visible to all authenticated users'}
            </div>
          </div>

          {/* Priority */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label className="label-form">
              priority — <span style={{ color: priorityColor }}>{form.priority}</span>/127
              <span style={{ marginLeft: '0.6rem', color: 'var(--text-secondary)', fontSize: '0.55rem' }}>
                ({priorityLabel})
              </span>
            </label>

            <input
              type="range"
              min={0}
              max={127}
              value={form.priority}
              onChange={e => setField('priority', parseInt(e.target.value))}
              style={{
                width: '100%',
                appearance: 'none',
                height: '2px',
                background: `linear-gradient(90deg, ${priorityColor} ${priorityPct}%, var(--border-subtle) ${priorityPct}%)`,
                outline: 'none',
                cursor: 'pointer',
                margin: '0.5rem 0',
              }}
            />
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.58rem',
              color: 'var(--text-secondary)',
            }}>
              <span>0 — low</span>
              <span>64 — medium</span>
              <span>127 — critical</span>
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label className="label-form">description</label>
            <textarea
              className="input-field"
              placeholder="detailed context, urls, indicators of compromise..."
              value={form.description}
              onChange={e => setField('description', e.target.value)}
              rows={4}
            />
          </div>

          {/* Comments */}
          <div>
            <label className="label-form">operator notes</label>
            <textarea
              className="input-field"
              placeholder="internal notes, analyst instructions..."
              value={form.comments}
              onChange={e => setField('comments', e.target.value)}
              rows={3}
            />
          </div>
        </div>

        {/* File upload */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderLeft: '2px solid var(--border-subtle)',
          padding: '1.25rem 1.5rem',
          marginBottom: '1.25rem',
        }}>
          <div className="section-title">attachment</div>
          <div
            onDragOver={e => { e.preventDefault(); setIsDragOver(true) }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `1px dashed ${isDragOver ? 'var(--green)' : form.file ? 'rgba(61,139,64,0.4)' : 'var(--border-subtle)'}`,
              padding: '1.75rem',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all var(--transition)',
              background: isDragOver ? 'rgba(61,139,64,0.04)' : 'transparent',
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            {form.file ? (
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--green)', marginBottom: '0.25rem' }}>
                  ✓ {form.file.name}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-secondary)' }}>
                  {(form.file.size / 1024).toFixed(1)} kb — click to replace
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  {isDragOver ? 'drop file here' : 'drag & drop or click to select'}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                  audio, documents, any format
                </div>
              </div>
            )}
          </div>
          {form.file && (
            <div style={{ marginTop: '0.5rem', textAlign: 'right' }}>
              <button
                type="button"
                onClick={() => setField('file', null)}
                style={{ background: 'none', border: 'none', color: 'var(--red)', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', cursor: 'pointer', opacity: 0.7 }}
              >
                remove
              </button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn"
            onClick={() => navigate('/tasks')}
            disabled={submitting}
          >
            cancel
          </button>
          <button
            type="submit"
            className="btn btn-green"
            disabled={submitting || !form.title.trim()}
            style={{ minWidth: '120px' }}
          >
            {submitting ? 'creating...' : 'create incident'}
          </button>
        </div>
      </form>

      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 10px;
          height: 10px;
          background: var(--green);
          cursor: pointer;
        }
        input[type="range"]::-moz-range-thumb {
          width: 10px;
          height: 10px;
          border: none;
          background: var(--green);
          cursor: pointer;
        }
      `}</style>
    </div>
  )
}
