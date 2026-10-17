import { getCollection, type CollectionEntry } from 'astro:content'

export type Project = CollectionEntry<'projects'>

// What the browser island needs for each card: plain data, no collection entries.
export type ProjectCard = {
  id: string
  title: string
  description?: string
  tags: string[]
  date: string
  href: string // live URL
  local?: string // local .test URL, used when the index itself is viewed locally
  host: string
  background: string
  image?: string
  notes: boolean
}

const gradients = [
  'linear-gradient(135deg,#a8edea,#fed6e3)',
  'linear-gradient(135deg,#f093fb,#f5576c)',
  'linear-gradient(135deg,#4facfe,#00f2fe)',
  'linear-gradient(135deg,#43e97b,#38f9d7)',
  'linear-gradient(135deg,#fa709a,#fee140)',
  'linear-gradient(135deg,#a18cd1,#fbc2eb)',
]

export async function getProjects() {
  const projects = await getCollection('projects')
  return projects.sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime())
}

// Pages render the live URL; when the index is opened locally (a .test host or localhost),
// links switch to the project's local URL in the browser (lib/projects-host.ts, Base.astro).
export function projectHref(p: Project) {
  return p.data.url
}

export function projectHost(p: Project) {
  return new URL(p.data.url).host
}

export function hasNotes(p: Project) {
  return Boolean(p.body?.trim())
}

// Stable gradient per project so cards don't reshuffle colours on rebuild.
export function projectBackground(p: Project) {
  if (p.data.color) return p.data.color
  const hash = [...p.id].reduce((h, c) => h + c.charCodeAt(0), 0)
  return gradients[hash % gradients.length]
}

export function toCard(p: Project): ProjectCard {
  return {
    id: p.id,
    title: p.data.title,
    description: p.data.description,
    tags: p.data.tags,
    date: p.data.date,
    href: projectHref(p),
    local: p.data.local,
    host: projectHost(p),
    background: projectBackground(p),
    image: p.data.image,
    notes: hasNotes(p),
  }
}

export const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
