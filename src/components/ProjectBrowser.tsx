import { useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, Check, ChevronDown, LayoutGrid, List } from 'lucide-react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { ProjectCard } from '@/lib/projects'
import { isLocalHost } from '@/lib/projects-host'

type Sort = 'newest' | 'oldest' | 'alpha'
type View = 'grid' | 'list'

const SORTS: { value: Sort; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'alpha', label: 'A–Z' },
]

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

// Browser storage can be unavailable (private mode, blocked site data); the view just isn't remembered then.
const readView = (): View => {
  try {
    return localStorage.getItem('view') === 'list' ? 'list' : 'grid'
  } catch {
    return 'grid'
  }
}

function Card({ p, view, local }: { p: ProjectCard; view: View; local: boolean }) {
  const list = view === 'list'
  // Viewed locally, links go to the project's local .test site
  const href = local && p.local ? p.local : p.href
  const host = new URL(href).host
  return (
    <article className={cn('group', list && 'flex items-center gap-5')}>
      <a href={href} className={cn('block', list && 'shrink-0')} tabIndex={-1} aria-hidden>
        <div
          className={cn('overflow-hidden rounded-lg transition-opacity duration-300 group-hover:opacity-90', list ? 'aspect-[16/10] w-36' : 'mb-4 aspect-[16/10] w-full')}
          style={p.image ? undefined : { background: p.background }}
        >
          {p.image && <img src={p.image} alt="" loading="lazy" className="size-full object-cover" />}
        </div>
      </a>
      <div className="min-w-0 space-y-1.5">
        <h2 className="text-sm font-medium leading-snug">
          <a href={href} className="inline-flex items-center gap-1 transition-colors hover:text-foreground/80">
            {p.title}
            <ArrowUpRight className="size-3.5 text-muted-foreground" strokeWidth={1.5} aria-hidden />
          </a>
        </h2>
        {p.description && <p className="text-xs text-muted-foreground">{p.description}</p>}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground/70">
          {p.tags.map(t => <span key={t}>{capitalise(t)}</span>)}
          <span>{host}</span>
          {p.notes && (
            <a href={`/projects/${p.id}`} className="transition-colors hover:text-foreground">Readme</a>
          )}
        </div>
      </div>
    </article>
  )
}

export default function ProjectBrowser({ projects }: { projects: ProjectCard[] }) {
  const [tag, setTag] = useState('')
  const [sort, setSort] = useState<Sort>('newest')
  const [view, setView] = useState<View>('grid')
  const [local, setLocal] = useState(false)

  // Read the URL and saved view after hydration, so the server-rendered page and first client render match.
  useEffect(() => {
    setTag(new URLSearchParams(location.search).get('tags') ?? '')
    setView(readView())
    setLocal(isLocalHost(location.hostname))
  }, [])

  const tags = useMemo(() => [...new Set(projects.flatMap(p => p.tags))].sort(), [projects])

  const shown = useMemo(() => {
    const list = tag ? projects.filter(p => p.tags.includes(tag)) : [...projects]
    return list.sort((a, b) =>
      sort === 'alpha' ? a.title.localeCompare(b.title)
        : (new Date(b.date).getTime() - new Date(a.date).getTime()) * (sort === 'newest' ? 1 : -1))
  }, [projects, tag, sort])

  const pickTag = (t: string) => {
    setTag(t)
    const url = new URL(location.href)
    if (t) url.searchParams.set('tags', t)
    else url.searchParams.delete('tags')
    history.replaceState({}, '', url)
  }

  const pickView = (v: View) => {
    setView(v)
    try {
      localStorage.setItem('view', v)
    } catch {
      /* not remembered */
    }
  }

  const textToggle = 'h-auto min-w-0 rounded-none bg-transparent px-0 text-sm font-normal text-muted-foreground hover:bg-transparent hover:text-foreground data-[state=on]:bg-transparent data-[state=on]:text-foreground'

  return (
    <>
      <div className="mb-6 flex items-center gap-6">
        {/* The tags scroll sideways inside their own space, so a long list never widens the page */}
        <div className="no-scrollbar min-w-0 flex-1 overflow-x-auto">
        <ToggleGroup
          type="single"
          aria-label="Filter by tag"
          value={tag || 'all'}
          onValueChange={v => pickTag(v === 'all' || !v ? '' : v)}
          spacing={6}
          className="w-max"
        >
          <ToggleGroupItem value="all" className={textToggle}>All</ToggleGroupItem>
          {tags.map(t => (
            <ToggleGroupItem key={t} value={t} className={cn(textToggle, 'shrink-0')}>{capitalise(t)}</ToggleGroupItem>
          ))}
        </ToggleGroup>
        </div>

        <div className="flex shrink-0 items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:text-foreground">
              Sort
              <ChevronDown className="size-3" strokeWidth={1.5} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-36">
              {SORTS.map(s => (
                <DropdownMenuItem key={s.value} onSelect={() => setSort(s.value)} className="justify-between text-xs">
                  {s.label}
                  {sort === s.value && <Check className="size-3.5" strokeWidth={1.5} />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <ToggleGroup type="single" aria-label="View" value={view} onValueChange={v => v && pickView(v as View)} spacing={1}>
            <ToggleGroupItem value="grid" aria-label="Grid" className="size-7 min-w-0 p-0 text-muted-foreground data-[state=on]:bg-transparent data-[state=on]:text-foreground">
              <LayoutGrid className="size-3.5" strokeWidth={1.5} />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="List" className="size-7 min-w-0 p-0 text-muted-foreground data-[state=on]:bg-transparent data-[state=on]:text-foreground">
              <List className="size-3.5" strokeWidth={1.5} />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="py-24 text-sm text-muted-foreground">No projects match this filter.</p>
      ) : (
        <div className={view === 'grid' ? 'grid grid-cols-1 gap-x-6 gap-y-16 sm:grid-cols-2 lg:grid-cols-3' : 'flex flex-col gap-6'}>
          {shown.map(p => <Card key={p.id} p={p} view={view} local={local} />)}
        </div>
      )}
    </>
  )
}
