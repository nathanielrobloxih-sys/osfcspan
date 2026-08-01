import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { supabase } from '../lib/supabase'

const CATEGORY_LABEL: Record<string, string> = {
  breaking: 'Breaking News',
  foreign: 'Washington This Week',
  newsletter: 'Newsletter',
}

// Used to build absolute og:url / og:image values — update if the domain changes.
const SITE_URL = 'https://osfcspan.netlify.app'

export const Route = createFileRoute('/story/$id')({
  loader: async ({ params }) => {
    const { data: post, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', params.id)
      .eq('status', 'approved')
      .single()

    if (error || !post) throw notFound()
    return { post }
  },
  head: ({ loaderData }) => {
    const post = loaderData?.post
    if (!post) {
      return { meta: [{ title: 'Story not found — OSFUSA C-SPAN' }] }
    }

    const description = post.body.length > 200 ? post.body.slice(0, 197) + '...' : post.body
    const url = `${SITE_URL}/story/${post.id}`

    return {
      meta: [
        { title: `${post.title} — OSFUSA C-SPAN` },
        { name: 'description', content: description },
        { property: 'og:title', content: post.title },
        { property: 'og:description', content: description },
        { property: 'og:type', content: 'article' },
        { property: 'og:url', content: url },
        { property: 'og:site_name', content: 'OSFUSA C-SPAN' },
        ...(post.image_url ? [{ property: 'og:image', content: post.image_url }] : []),
        { name: 'twitter:card', content: post.image_url ? 'summary_large_image' : 'summary' },
        { name: 'twitter:title', content: post.title },
        { name: 'twitter:description', content: description },
        ...(post.image_url ? [{ name: 'twitter:image', content: post.image_url }] : []),
      ],
    }
  },
  component: StoryPage,
  notFoundComponent: () => (
    <div style={{ padding: '80px 20px', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: 24, marginBottom: 12 }}>Story not found</h1>
      <Link to="/" style={{ color: '#123a7a', fontWeight: 700 }}>← Back to OSFUSA C-SPAN</Link>
    </div>
  ),
})

function StoryPage() {
  const { post } = Route.useLoaderData()
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 20px 80px', fontFamily: 'Georgia, "Times New Roman", serif', color: '#1a202c' }}>
      <Link to="/" style={{ fontSize: 13, color: '#123a7a', textDecoration: 'none', fontWeight: 700, letterSpacing: 0.4, fontFamily: 'sans-serif' }}>
        ← OSFUSA C-SPAN
      </Link>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: 1, marginTop: 24, fontFamily: 'sans-serif' }}>
        {CATEGORY_LABEL[post.category] || post.category}
      </div>
      <h1 style={{ fontSize: 32, lineHeight: 1.25, margin: '8px 0 16px' }}>{post.title}</h1>
      <div style={{ fontSize: 13, color: '#718096', marginBottom: 20, fontFamily: 'sans-serif' }}>
        {new Date(post.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
      </div>
      {post.image_url && (
        <img src={post.image_url} alt="" style={{ width: '100%', borderRadius: 8, marginBottom: 24, display: 'block' }} />
      )}
      <p style={{ fontSize: 18, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{post.body}</p>
    </div>
  )
}
