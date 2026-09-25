/** The Bureau seal. Decorative when next to the wordmark, labelled when used alone. */
export function Seal({size = 32, label, className}: {size?: number; label?: string; className?: string}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <circle cx="16" cy="16" r="14.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16" cy="16" r="11" fill="none" stroke="currentColor" strokeWidth="0.75" strokeDasharray="1.5 1.5" />
      <path
        d="M10.5 20.5c0-3.2 2.4-5.6 5.5-5.6s5.5 2.4 5.5 5.6M13 14.2c0-1.7 1.3-3 3-3s3 1.3 3 3"
        fill="none"
        stroke="var(--debunked)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="16" cy="22.2" r="1.1" fill="var(--debunked)" />
    </svg>
  )
}

/** Shared SVG filters, mounted once in the root layout. The rough ink edge on stamps comes from here. */
export function SvgDefs() {
  return (
    <svg width="0" height="0" aria-hidden="true" focusable="false" style={{position: 'absolute'}}>
      <defs>
        <filter id="ink-edge" x="-5%" y="-10%" width="110%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.6" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  )
}
