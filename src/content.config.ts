import { defineCollection, z } from 'astro:content'
import { glob, type Loader } from 'astro/loaders'

// Fetch a repo's README from GitHub. Relative links/images are rewritten to
// point at the repo so they still work when rendered here.
async function fetchReadme(repo: string): Promise<string | null> {
  try {
    const res = await fetch(`https://raw.githubusercontent.com/${repo}/HEAD/README.md`)
    if (!res.ok) return null
    const md = await res.text()
    return md
      .replace(/^#\s+.*\n+/, '') // the page already shows the title
      .replace(/(!?)\]\((?!https?:|#|mailto:)([^)]+)\)/g, (_, img, path) =>
        `${img}](https://${img ? 'raw.githubusercontent.com' : 'github.com'}/${repo}/${img ? '' : 'blob/'}HEAD/${path.replace(/^\.?\//, '')})`
      )
  } catch {
    return null
  }
}

// Markdown files in src/content/projects. If a file has no body but has a
// `repo`, its README is pulled in at build time for the notes page.
function projectsLoader(): Loader {
  const base = glob({ pattern: '**/*.md', base: './src/content/projects' })
  return {
    name: 'projects',
    async load(ctx) {
      await base.load(ctx)
      for (const entry of ctx.store.values()) {
        const repo = entry.data.repo as string | undefined
        if (entry.body?.trim() || !repo) continue
        const readme = await fetchReadme(repo)
        if (!readme) {
          ctx.logger.warn(`No README found for ${repo}`)
          continue
        }
        ctx.store.set({
          ...entry,
          body: readme,
          rendered: await ctx.renderMarkdown(readme),
          digest: ctx.generateDigest(readme),
        })
      }
    },
  }
}

const projects = defineCollection({
  loader: projectsLoader(),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    url: z.string().url(),             // live site, e.g. https://loom.robertfarrelly.com
    local: z.string().url().optional(), // used instead of `url` when running `npm run dev`
    repo: z.string().optional(),       // "owner/name" — README is pulled from here
    tags: z.array(z.string()).default([]),
    date: z.string(),
    color: z.string().optional(),      // CSS background for the card, overrides the default gradient
    image: z.string().optional(),      // screenshot in public/, e.g. /projects/loom.png; replaces the gradient
  })
})

export const collections = { projects }
