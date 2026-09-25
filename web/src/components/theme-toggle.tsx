'use client'

import {Moon, Sun} from 'lucide-react'
import {useTheme} from 'next-themes'
import {useSyncExternalStore} from 'react'

const subscribe = () => () => {}

export function ThemeToggle() {
  const {resolvedTheme, setTheme} = useTheme()
  // Avoids a hydration mismatch: the server cannot know the visitor's theme.
  const mounted = useSyncExternalStore(subscribe, () => true, () => false)
  const dark = mounted && resolvedTheme === 'dark'
  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode ("night shift")'}
      className="grid h-10 w-10 place-items-center rounded-full border border-rule bg-paper-2 text-ink transition hover:border-ink"
    >
      {mounted ? dark ? <Sun className="h-[1.1rem] w-[1.1rem]" aria-hidden="true" /> : <Moon className="h-[1.1rem] w-[1.1rem]" aria-hidden="true" /> : <span className="h-[1.1rem] w-[1.1rem]" />}
    </button>
  )
}
