import {Eye, Footprints, Ghost, Orbit, Radar, Wind, type LucideIcon} from 'lucide-react'
import clsx from 'clsx'
import {CATEGORY_LABEL, isCategory, type Category} from '@/lib/categories'

export const CATEGORY_ICON: Record<Category, LucideIcon> = {
  cryptid: Footprints,
  ufo: Radar,
  extraterrestrial: Orbit,
  ghost: Ghost,
  spirit: Wind,
  occult: Eye,
}

export function CategoryGlyph({category, className}: {category: string; className?: string}) {
  const Icon = isCategory(category) ? CATEGORY_ICON[category] : Eye
  return <Icon className={clsx('h-4 w-4 shrink-0', className)} aria-hidden="true" strokeWidth={1.75} />
}

/** Icon plus label. The label is always visible or announced, never icon-only. */
export function CategoryBadge({category, className, iconOnly = false}: {category: string; className?: string; iconOnly?: boolean}) {
  const label = isCategory(category) ? CATEGORY_LABEL[category] : category
  return (
    <span className={clsx('inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted', className)}>
      <CategoryGlyph category={category} />
      {iconOnly ? <span className="sr-only">{label}</span> : <span>{label}</span>}
    </span>
  )
}
