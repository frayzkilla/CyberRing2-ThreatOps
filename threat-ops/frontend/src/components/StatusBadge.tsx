import type { TaskStatus } from '../types'

interface StatusBadgeProps {
  status?: TaskStatus
  label?: string
  visibility?: 'public' | 'private'
  size?: 'sm' | 'md'
}

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; bg: string }> = {
  pending:     { label: 'pending',    color: '#8a7230', bg: 'rgba(138,114,48,0.1)' },
  in_progress: { label: 'in progress', color: '#3d8b40', bg: 'rgba(61,139,64,0.1)' },
  confirmed:   { label: 'confirmed',  color: '#5aaa5e', bg: 'rgba(90,170,94,0.1)' },
}

const LABEL_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  p:     { label: 'fraud', color: '#6b7b6b', bg: 'rgba(107,123,107,0.1)' },
  other: { label: 'cve', color: '#3d8b40', bg: 'rgba(61,139,64,0.1)'  },
}

const VISIBILITY_CONFIG: Record<'public' | 'private', { label: string; color: string; bg: string }> = {
  public:  { label: 'public', color: '#bba15b', bg: 'rgba(187,161,91,0.1)' },
  private: { label: 'private', color: '#8e98a3', bg: 'rgba(142,152,163,0.1)' },
}

export default function StatusBadge({ status, label, visibility, size = 'sm' }: StatusBadgeProps) {
  let config
  if (status)           config = STATUS_CONFIG[status]
  else if (label !== undefined) config = label === 'p' ? LABEL_CONFIG.p : LABEL_CONFIG.other
  else if (visibility) config = VISIBILITY_CONFIG[visibility]
  if (!config) return null

  const fontSize = size === 'sm' ? '0.6rem' : '0.68rem'
  const padding  = size === 'sm' ? '0.15rem 0.45rem' : '0.2rem 0.6rem'

  return (
    <span style={{
      display: 'inline-block',
      fontFamily: 'var(--font-mono)',
      fontSize,
      fontWeight: 400,
      letterSpacing: '0.08em',
      color: config.color,
      background: config.bg,
      border: `1px solid ${config.color}`,
      opacity: 0.9,
      padding,
      whiteSpace: 'nowrap',
    }}>
      {config.label}
    </span>
  )
}
