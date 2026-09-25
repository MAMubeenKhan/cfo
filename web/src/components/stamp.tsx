'use client'

import {motion, useReducedMotion} from 'motion/react'
import clsx from 'clsx'
import {STATUS_STAMP, STATUS_TEXT, type Status} from '@/lib/status'

type Tone = Status | 'restricted' | 'redacted'

const TONE_CLASS: Record<Tone, string> = {
  ...STATUS_TEXT,
  restricted: 'text-debunked',
  redacted: 'text-ink',
}

/**
 * An ink stamp. The text is always present (colour is never the only signal).
 * With `animate`, it lands with a small overshoot; reduced-motion users get a plain fade.
 */
export function Stamp({
  tone,
  children,
  animate = false,
  size = 'md',
  solid = false,
  className,
}: {
  tone: Tone
  children?: React.ReactNode
  animate?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** paper backing and no blend mode, for stamps that sit on top of a photo */
  solid?: boolean
  className?: string
}) {
  const reduce = useReducedMotion()
  const label = children ?? (tone in STATUS_STAMP ? STATUS_STAMP[tone as Status] : String(tone))
  const sizeVar = {sm: '0.68rem', md: '0.92rem', lg: '1.35rem', xl: '2.1rem'}[size]
  const classes = clsx('stamp', TONE_CLASS[tone], solid && 'bg-paper !mix-blend-normal !opacity-100', className)
  const style = {'--stamp-size': sizeVar} as React.CSSProperties

  if (!animate) {
    return (
      <span className={classes} style={style}>
        {label}
      </span>
    )
  }
  return (
    <motion.span
      className={classes}
      style={style}
      initial={reduce ? {opacity: 0} : {opacity: 0, scale: 1.45, rotate: -12}}
      animate={reduce ? {opacity: 0.92} : {opacity: 0.92, scale: 1, rotate: -5}}
      transition={reduce ? {duration: 0.2} : {type: 'spring', stiffness: 520, damping: 22, mass: 0.7}}
    >
      {label}
    </motion.span>
  )
}
