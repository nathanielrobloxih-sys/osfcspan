import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export const Route = createFileRoute('/')({ component: CSPANHome })

const TABS = [
  { id: 'home',        label: 'Home' },
  { id: 'newsletter',  label: 'Newsletters' },
  { id: 'breaking',    label: 'Breaking News' },
  { id: 'foreign',     label: 'Foreign / Intl' },
  { id: 'livestream',  label: 'Live Stream' },
  { id: 'about',       label: 'About' },
] as const

type TabId = (typeof TABS)[number]['id']

const C = {
  navy: '#123a7a', navyDark: '#0b2f6b', navyLight: '#1e4a94',
  white: '#ffffff', offWhite: '#f7f9fc', lightGray: '#e8edf5',
  gray: '#718096', darkGray: '#2d3748', border: '#d1dce8',
  text: '#1a202c', textMuted: '#4a5568',
  red: '#c53030', redLight: '#fff5f5', redBorder: '#feb2b2',
  green: '#276749', greenLight: '#f0fff4', greenBorder: '#9ae6b4',
}

type Post = {
  id: string
  category: 'newsletter' | 'breaking' | 'foreign'
  title: string
  body: string
  image_url?: string | null
  source?: string | null
  pinned?: boolean
  created_at: string
}

/* ─── Header ────────────────────────────────────────────────────── */
function Header({ tab, setTab }: { tab: TabId; setTab: (t: TabId) => void }) {
  return (
    <header style={{ background: `linear-gradient(180deg, ${C.navyDark} 0%, ${C.navy} 100%)`, borderBottom: `4px solid ${C.red}` }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${C.white}`, flexShrink: 0 }}>
            <img src="/cspan-emblem.png" alt="C-SPAN" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.style.display = 'none' }} />
          </div>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 3, color: '#d7e0f2', textTransform: 'uppercase' }}>OSFUSA ROBLOX RP</div>
            <Link to="/" style={{ fontSize: 18, fontWeight: 700, color: C.white, fontFamily: 'Georgia, serif', textDecoration: 'none' }}>C-SPAN</Link>
          </div>
        </div>
        <nav style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              background: tab === t.id ? 'rgba(255,255,255,0.15)' : 'transparent',
              border: 'none', color: C.white, padding: '8px 12px', borderRadius: 4,
              fontSize: 13, cursor: 'pointer', fontWeight: tab === t.id ? 700 : 400,
            }}>{t.label}</button>
          ))}
          <Link to="/apply" style={{ background: C.red, color: C.white, padding: '8px 14px', borderRadius: 4, fontSize: 13, fontWeight: 700, textDecoration: 'none', marginLeft: 6 }}>Apply</Link>
        </nav>
      </div>
    </header>
  )
}

/* ─── Footer ────────────────────────────────────────────────────── */
function SiteFooter() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  useEffect(() => {
    supabase.from('settings').select('*').then(({ data }) => {
      const map: Record<string, string> = {}
      data?.forEach((row: any) => { map[row.key] = row.value })
      setSettings(map)
    })
  }, [])
  return (
    <footer style={{ background: C.navyDark, color: '#d7e0f2', padding: '28px 24px', marginTop: 60, textAlign: 'center', fontSize: 12 }}>
      <div>OSFUSA C-SPAN — Cable-Satellite Public Affairs Network</div>
      <div style={{ marginTop: 6, opacity: 0.7 }}>Roleplay news network. Not affiliated with the real C-SPAN.</div>
      {settings.discord_invite && (
        <div style={{ marginTop: 10 }}>
          <a href={settings.discord_invite} target="_blank" style={{ color: C.white }}>Join the C-SPAN Discord</a>
        </div>
      )}
    </footer>
  )
}

/* ─── Post feed ─────────────────────────────────────────────────── */
function PostFeed({ category, accent }: { category: Post['category']; accent: string }) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('posts').select('*').eq('category', category)
      .order('pinned', { ascending: false }).order('created_at', { ascending: false })
      .then(({ data }) => { setPosts(data || []); setLoading(false) })
  }, [category])

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: C.gray }}>Loading…</div>
  if (posts.length === 0) return <div style={{ padding: 40, textAlign: 'center', color: C.gray }}>No posts yet.</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {posts.map(p => (
        <div key={p.id} style={{ background: C.white, border: `1px solid ${C.border}`, borderLeft: `4px solid ${accent}`, borderRadius: 6, padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            {p.pinned && <span style={{ fontSize: 10, fontWeight: 700, color: accent, border: `1px solid ${accent}`, borderRadius: 3, padding: '1px 6px' }}>PINNED</span>}
            <span style={{ fontSize: 11, color: C.gray }}>{new Date(p.created_at).toLocaleString()}</span>
            {p.source === 'discord' && <span style={{ fontSize: 10, color: C.gray, border: `1px solid ${C.border}`, borderRadius: 3, padding: '1px 6px' }}>via Discord</span>}
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 6 }}>{p.title}</div>
          {p.image_url && <img src={p.image_url} alt="" style={{ width: '100%', borderRadius: 6, marginBottom: 10 }} />}
          <div style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{p.body}</div>
        </div>
      ))}
    </div>
  )
}

/* ─── Live Stream tab ───────────────────────────────────────────── */
function LiveStreamTab() {
  const [url, setUrl] = useState<string | null>(null)
  const [status, setStatus] = useState<string>('offline')

  useEffect(() => {
    supabase.from('settings').select('*').in('key', ['livestream_embed_url', 'livestream_status']).then(({ data }) => {
      data?.forEach((row: any) => {
        if (row.key === 'livestream_embed_url') setUrl(row.value)
        if (row.key === 'livestream_status') setStatus(row.value)
      })
    })
  }, [])

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: status === 'live' ? C.red : C.gray, display: 'inline-block' }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: status === 'live' ? C.red : C.gray, textTransform: 'uppercase', letterSpacing: 1 }}>
          {status === 'live' ? 'Live now' : 'Offline'}
        </span>
      </div>
      {url ? (
        <div style={{ position: 'relative', paddingTop: '56.25%', borderRadius: 8, overflow: 'hidden', background: '#000' }}>
          <iframe src={url} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }} allow="autoplay; fullscreen" allowFullScreen />
        </div>
      ) : (
        <div style={{ padding: 60, textAlign: 'center', color: C.gray, background: C.white, border: `1px solid ${C.border}`, borderRadius: 8 }}>
          No stream configured yet. Check back soon.
        </div>
      )}
    </div>
  )
}

/* ─── About tab ─────────────────────────────────────────────────── */
function AboutTab() {
  return (
    <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: 28 }}>
      <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: C.navy, marginBottom: 12 }}>About C-SPAN</h2>
      <p style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.7, marginBottom: 12 }}>
        OSFUSA C-SPAN (Cable-Satellite Public Affairs Network) is the in-universe press and
        broadcast arm of OSFUSA, covering breaking news, foreign affairs, and official
        newsletters, alongside a live video stream of ongoing coverage.
      </p>
      <p style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.7 }}>
        Interested in joining the network as an anchor, correspondent, or production crew?
        Head to the Apply tab to submit an application.
      </p>
    </div>
  )
}

/* ─── Home tab ──────────────────────────────────────────────────── */
function HomeTab({ setTab }: { setTab: (t: TabId) => void }) {
  return (
    <div>
      <div style={{ background: `linear-gradient(135deg, ${C.navyDark}, ${C.navy})`, borderRadius: 8, padding: '36px 28px', color: C.white, marginBottom: 24 }}>
        <div style={{ fontSize: 11, letterSpacing: 2, opacity: 0.8, marginBottom: 6 }}>OSFUSA CABLE-SATELLITE PUBLIC AFFAIRS NETWORK</div>
        <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'Georgia, serif', marginBottom: 10 }}>Coverage you can trust</div>
        <div style={{ fontSize: 14, opacity: 0.85, marginBottom: 18 }}>Breaking news, foreign affairs, and official newsletters — plus live coverage.</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={() => setTab('breaking')} style={{ background: C.red, color: C.white, border: 'none', borderRadius: 4, padding: '10px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Breaking News</button>
          <button onClick={() => setTab('livestream')} style={{ background: 'rgba(255,255,255,0.15)', color: C.white, border: `1px solid rgba(255,255,255,0.3)`, borderRadius: 4, padding: '10px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Watch Live</button>
        </div>
      </div>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: C.darkGray, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Latest breaking</h3>
      <PostFeed category="breaking" accent={C.red} />
    </div>
  )
}

/* ─── Page ──────────────────────────────────────────────────────── */
function CSPANHome() {
  const [tab, setTab] = useState<TabId>('home')

  return (
    <div style={{ minHeight: '100vh', background: C.offWhite, fontFamily: 'system-ui, sans-serif' }}>
      <Header tab={tab} setTab={setTab} />
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '28px 24px' }}>
        {tab === 'home' && <HomeTab setTab={setTab} />}
        {tab === 'newsletter' && <PostFeed category="newsletter" accent={C.navy} />}
        {tab === 'breaking' && <PostFeed category="breaking" accent={C.red} />}
        {tab === 'foreign' && <PostFeed category="foreign" accent={C.green} />}
        {tab === 'livestream' && <LiveStreamTab />}
        {tab === 'about' && <AboutTab />}
      </main>
      <SiteFooter />
    </div>
  )
}
