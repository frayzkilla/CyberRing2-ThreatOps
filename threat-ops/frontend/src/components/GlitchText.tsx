import { CSSProperties } from 'react'

interface GlitchTextProps {
  text: string
  className?: string
  style?: CSSProperties
  tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'span' | 'div' | 'p'
  color?: 'cyan' | 'magenta' | 'green' | 'gold' | 'red'
}

export default function GlitchText({ text, className = '', style, tag: Tag = 'span' }: GlitchTextProps) {
  return <Tag className={className} style={style}>{text}</Tag>
}
