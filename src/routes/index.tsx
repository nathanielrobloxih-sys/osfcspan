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
  { id: 'careers',     label: 'Careers' },
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
function TickerBar() {
  const [live, setLive] = useState(false)
  useEffect(() => {
    supabase.from('settings').select('*').eq('key', 'livestream_status').single().then(({ data }) => setLive(data?.value === 'live'))
  }, [])
  return (
    <div style={{ background: C.red, color: C.white, fontSize: 12, fontWeight: 600, letterSpacing: 0.5, textAlign: 'center', padding: '6px 12px' }}>
      {live ? 'LIVE NOW - tap Live Stream to watch' : 'OSFUSA Cable-Satellite Public Affairs Network'}
    </div>
  )
}

function PersonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  )
}

function HeaderSearch({ setTab }: { setTab: (t: TabId) => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Post[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    const t = setTimeout(() => {
      supabase.from('posts').select('*').ilike('title', `%${query}%`).limit(5).then(({ data }) => setResults(data || []))
    }, 250)
    return () => clearTimeout(t)
  }, [query])

  return (
    <div style={{ position: 'relative', flex: '1 1 180px', maxWidth: 220 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: C.lightGray, border: `1px solid ${C.border}`, borderRadius: 20, padding: '6px 12px' }}>
        <span style={{ color: C.gray }}><SearchIcon /></span>
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search C-SPAN"
          style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 12, color: C.text, width: '100%' }}
        />
      </div>
      {open && results.length > 0 && (
        <div style={{ position: 'absolute', top: '110%', left: 0, right: 0, background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, boxShadow: '0 6px 20px rgba(18,58,122,0.15)', overflow: 'hidden', zIndex: 20 }}>
          {results.map(r => (
            <button key={r.id} onMouseDown={() => { setTab(r.category as TabId); setQuery(''); setOpen(false) }}
              style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '10px 14px', cursor: 'pointer', borderBottom: `1px solid ${C.lightGray}` }}>
              <div style={{ fontSize: 10, color: C.gray, textTransform: 'uppercase' }}>{r.category}</div>
              <div style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{r.title}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Header({ tab, setTab }: { tab: TabId; setTab: (t: TabId) => void }) {
  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 10 }}>
      <TickerBar />
      <header style={{ background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', borderBottom: `1px solid ${C.border}`, boxShadow: '0 2px 10px rgba(18,58,122,0.06)' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '18px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${C.navy}`, flexShrink: 0 }}>
              <img src="/cspan-emblem.png" alt="C-SPAN" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.style.display = 'none' }} />
            </div>
            <div>
              <Link to="/" style={{ fontSize: 24, fontWeight: 700, color: C.navy, fontFamily: 'Georgia, serif', textDecoration: 'none', letterSpacing: 0.3, lineHeight: 1 }}>C-SPAN</Link>
              <div style={{ fontSize: 9, letterSpacing: 1.5, color: C.gray, textTransform: 'uppercase', marginTop: 2 }}>OSFUSA Roblox RP</div>
            </div>
          </div>
          <nav style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                background: 'transparent', border: 'none',
                color: tab === t.id ? C.navy : C.textMuted, padding: '10px 10px', fontSize: 14, cursor: 'pointer',
                fontWeight: tab === t.id ? 700 : 600, whiteSpace: 'nowrap', letterSpacing: 0.3,
                textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4,
              }}>{t.label} <span style={{ fontSize: 10, opacity: 0.6 }}>▾</span></button>
            ))}
          </nav>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
            <HeaderSearch setTab={setTab} />
            <Link to="/admin" style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.navy, fontSize: 13, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>
              <PersonIcon /> Staff Login
            </Link>
            <Link to="/apply" style={{ background: C.red, color: C.white, padding: '10px 20px', borderRadius: 4, fontSize: 13, fontWeight: 700, textDecoration: 'none', boxShadow: '0 2px 8px rgba(197,48,48,0.3)', whiteSpace: 'nowrap' }}>Apply</Link>
          </div>
        </div>
      </header>
    </div>
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
      <div>OSFUSA C-SPAN - Cable-Satellite Public Affairs Network</div>
      <div style={{ marginTop: 6, opacity: 0.7 }}>Roleplay news network. Not affiliated with the real C-SPAN.</div>
      {settings.discord_invite && (
        <div style={{ marginTop: 10 }}>
          <a href={settings.discord_invite} target="_blank" style={{ color: C.white }}>Join the C-SPAN Discord</a>
        </div>
      )}
      <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.12)' }}>
        <Link to="/admin" style={{ color: 'rgba(215,224,242,0.6)', fontSize: 11, textDecoration: 'none' }}>Staff Login</Link>
        <div style={{ marginTop: 6, color: 'rgba(215,224,242,0.4)', fontSize: 10 }}>made by Greysphoric</div>
      </div>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {posts.map(p => (
        <div key={p.id} style={{
          background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
          border: `1px solid ${C.border}`, borderRadius: 10, padding: '20px 22px',
          boxShadow: '0 2px 10px rgba(18,58,122,0.06)', transition: 'transform 0.15s, box-shadow 0.15s',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 4, background: accent }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, marginLeft: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: accent, background: `${accent}18`, borderRadius: 20, padding: '3px 10px', textTransform: 'uppercase', letterSpacing: 0.5 }}>{p.category}</span>
            {p.pinned && <span style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, border: `1px solid ${C.border}`, borderRadius: 20, padding: '2px 9px' }}>Pinned</span>}
            <span style={{ fontSize: 11, color: C.gray }}>{new Date(p.created_at).toLocaleString()}</span>
            {p.source === 'discord' && <span style={{ fontSize: 10, color: C.gray, border: `1px solid ${C.border}`, borderRadius: 20, padding: '2px 9px' }}>via Discord</span>}
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 8, marginLeft: 6, fontFamily: 'Georgia, serif' }}>{p.title}</div>
          {p.image_url && <img src={p.image_url} alt="" style={{ width: '100%', borderRadius: 8, marginBottom: 10, marginLeft: 0 }} />}
          <div style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.65, whiteSpace: 'pre-wrap', marginLeft: 6 }}>{p.body}</div>
        </div>
      ))}
    </div>
  )
}

/* ─── Live Stream tab ───────────────────────────────────────────── */
function LiveStreamTab() {
  const [url, setUrl] = useState<string | null>(null)
  const [status, setStatus] = useState<string>('offline')
  const [schedule, setSchedule] = useState<any[]>([])

  useEffect(() => {
    supabase.from('settings').select('*').in('key', ['livestream_embed_url', 'livestream_status']).then(({ data }) => {
      data?.forEach((row: any) => {
        if (row.key === 'livestream_embed_url') setUrl(row.value)
        if (row.key === 'livestream_status') setStatus(row.value)
      })
    })
    supabase.from('stream_schedule').select('*').gt('scheduled_at', new Date().toISOString()).order('scheduled_at', { ascending: true }).then(({ data }) => setSchedule(data || []))
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
        <div style={{ position: 'relative', paddingTop: '56.25%', borderRadius: 10, overflow: 'hidden', background: '#000', boxShadow: '0 4px 20px rgba(18,58,122,0.15)' }}>
          <iframe src={url} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }} allow="autoplay; fullscreen" allowFullScreen />
        </div>
      ) : (
        <div style={{ padding: 60, textAlign: 'center', color: C.gray, background: C.white, border: `1px solid ${C.border}`, borderRadius: 10 }}>
          No stream configured yet. Check back soon.
        </div>
      )}

      {schedule.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: C.darkGray, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Upcoming streams</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {schedule.map(s => (
              <div key={s.id} style={{ background: 'rgba(255,255,255,0.85)', border: `1px solid ${C.border}`, borderRadius: 8, padding: '14px 18px', boxShadow: '0 2px 8px rgba(18,58,122,0.05)' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>{s.title}</div>
                <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{new Date(s.scheduled_at).toLocaleString()}</div>
                {s.notes && <div style={{ fontSize: 13, color: C.textMuted, marginTop: 6 }}>{s.notes}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Careers tab ───────────────────────────────────────────────── */
function CareersTab() {
  const [positions, setPositions] = useState<{ title: string; desc: string }[]>([])
  useEffect(() => {
    supabase.from('settings').select('*').eq('key', 'open_positions').single().then(({ data }) => {
      const raw = data?.value || ''
      const list = raw.split('\n').map((l: string) => l.trim()).filter(Boolean).map((l: string) => {
        const [title, ...rest] = l.split('|')
        return { title: title.trim(), desc: rest.join('|').trim() }
      })
      setPositions(list)
    })
  }, [])

  return (
    <div>
      <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: 28, marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: C.navy, marginBottom: 8 }}>Careers at C-SPAN</h2>
        <p style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.7 }}>
          Interested in joining the network? Check the open positions below, then head to
          the Apply tab to submit an application.
        </p>
      </div>

      {positions.length === 0 ? (
        <div style={{ padding: 30, textAlign: 'center', color: C.gray, background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, marginBottom: 20 }}>
          No open positions listed right now.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          {positions.map((p, i) => (
            <div key={i} style={{ background: C.white, border: `1px solid ${C.border}`, borderLeft: `4px solid ${C.navy}`, borderRadius: 6, padding: '16px 20px' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4 }}>{p.title}</div>
              {p.desc && <div style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.6 }}>{p.desc}</div>}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Link to="/apply" style={{ background: C.navy, color: C.white, padding: '10px 20px', borderRadius: 4, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>Apply Now</Link>
        <Link to="/applications" style={{ background: C.white, color: C.navy, border: `1px solid ${C.border}`, padding: '10px 20px', borderRadius: 4, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>Check Application Status</Link>
      </div>
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
const WHATS_ON_CARDS = [
  { id: 'newsletter' as const, label: 'Newsletters', tag: 'BULLETIN' },
  { id: 'breaking' as const, label: 'Breaking News', tag: 'ALERT' },
  { id: 'foreign' as const, label: 'Foreign / Intl', tag: 'DISPATCH' },
]

const FALLBACK_HERO_IMG = 'https://commons.wikimedia.org/wiki/Special:FilePath/Capitol_Building_Full_View.jpg?width=1200'

function DomeIcon({ color = 'rgba(255,255,255,0.85)' }: { color?: string }) {
  return (
    <svg width="30" height="30" viewBox="0 0 40 40" fill="none">
      <path d="M8 30h24M10 30V20h4v10M26 30V20h4v10M14 20V15h12v5M17 15c0-6 6-6 6 0" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="20" cy="7" r="1.6" fill={color} />
      <line x1="20" y1="9" x2="20" y2="13" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function CardThumb({ image_url, accent }: { image_url?: string | null; accent: string }) {
  if (image_url) return <img src={image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
  return (
    <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${accent}, ${C.navyDark})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <DomeIcon />
    </div>
  )
}

function WhatsOnCard({ label, tag, setTab }: { label: string; tag: string; id: TabId; setTab: (t: TabId) => void }) {
  const [latest, setLatest] = useState<Post | null>(null)
  useEffect(() => {
    supabase.from('posts').select('*').eq('category', label === 'Newsletters' ? 'newsletter' : label === 'Breaking News' ? 'breaking' : 'foreign')
      .order('created_at', { ascending: false }).limit(1).then(({ data }) => setLatest(data?.[0] || null))
  }, [])
  const accent = label === 'Breaking News' ? C.red : label === 'Foreign / Intl' ? C.green : C.navy
  const tabId: TabId = label === 'Newsletters' ? 'newsletter' : label === 'Breaking News' ? 'breaking' : 'foreign'
  return (
    <button onClick={() => setTab(tabId)} style={{ textAlign: 'left', background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 14, boxShadow: '0 3px 12px rgba(18,58,122,0.07)' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: accent, letterSpacing: 1.2 }}>{tag}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: C.darkGray, lineHeight: 1.3, minHeight: 48 }}>{latest ? latest.title : label}</div>
      <div style={{ width: '100%', height: 140, borderRadius: 8, overflow: 'hidden' }}><CardThumb image_url={latest?.image_url} accent={accent} /></div>
      <div style={{ fontSize: 13, color: accent, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>{latest ? new Date(latest.created_at).toLocaleDateString() : 'No posts yet'}</div>
    </button>
  )
}

function LiveStreamCard({ setTab }: { setTab: (t: TabId) => void }) {
  const [live, setLive] = useState(false)
  useEffect(() => {
    supabase.from('settings').select('*').eq('key', 'livestream_status').single().then(({ data }) => setLive(data?.value === 'live'))
  }, [])
  return (
    <button onClick={() => setTab('livestream')} style={{ textAlign: 'left', background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 14, boxShadow: '0 3px 12px rgba(18,58,122,0.07)' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: C.navy, letterSpacing: 1.2 }}>BROADCAST</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: C.darkGray, lineHeight: 1.3, minHeight: 48 }}>Live Stream</div>
      <div style={{ width: '100%', height: 140, borderRadius: 8, overflow: 'hidden', background: `linear-gradient(135deg, ${C.navy}, ${C.navyDark})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 0, height: 0, borderTop: '14px solid transparent', borderBottom: '14px solid transparent', borderLeft: '22px solid rgba(255,255,255,0.85)' }} />
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, color: live ? C.red : C.gray }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: live ? C.red : C.gray }} /> {live ? 'LIVE NOW' : 'Offline'}
      </div>
    </button>
  )
}

function RecentRow() {
  const [posts, setPosts] = useState<Post[]>([])
  useEffect(() => {
    supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(6).then(({ data }) => setPosts(data || []))
  }, [])
  if (posts.length === 0) return null
  const accentFor = (cat: string) => cat === 'breaking' ? C.red : cat === 'foreign' ? C.green : C.navy
  return (
    <div style={{ marginTop: 36 }}>
      <h3 style={{ fontSize: 13, fontWeight: 700, color: C.darkGray, marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1 }}>Recently posted</h3>
      <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 6 }}>
        {posts.map(p => (
          <div key={p.id} style={{ minWidth: 200, maxWidth: 200, flexShrink: 0 }}>
            <div style={{ position: 'relative', width: '100%', height: 110, borderRadius: 8, overflow: 'hidden', marginBottom: 8, boxShadow: '0 2px 8px rgba(18,58,122,0.08)' }}>
              <CardThumb image_url={p.image_url} accent={accentFor(p.category)} />
              <div style={{ position: 'absolute', top: 6, left: 6, background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20, textTransform: 'uppercase' }}>{p.category}</div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.darkGray, lineHeight: 1.35 }}>{p.title}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Stat box ──────────────────────────────────────────────────── */
function StatBox({ label, value, accent, onClick }: { label: string; value: string; accent: string; onClick?: () => void }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag onClick={onClick} style={{
      background: C.white, border: `1px solid ${C.border}`, borderTop: `3px solid ${accent}`, borderRadius: 10,
      padding: '16px 18px', textAlign: 'left', cursor: onClick ? 'pointer' : 'default',
      boxShadow: '0 2px 10px rgba(18,58,122,0.06)', fontFamily: 'inherit',
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: C.darkGray }}>{value}</div>
    </Tag>
  )
}

/* ─── Hero photo carousel ───────────────────────────────────────── */
function HeroCarousel({ featured }: { featured: Post | null }) {
  const [slides, setSlides] = useState<{ img: string; category: string; title: string }[]>([])
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    supabase.from('posts').select('*').not('image_url', 'is', null).order('created_at', { ascending: false }).limit(5).then(({ data }) => {
      const withImages = (data || []).filter((p: Post) => p.image_url)
      if (withImages.length > 0) {
        setSlides(withImages.map((p: Post) => ({ img: p.image_url!, category: p.category, title: p.title })))
      } else {
        setSlides([{ img: FALLBACK_HERO_IMG, category: 'OSFUSA', title: featured ? featured.title : 'C-SPAN Network' }])
      }
    })
  }, [featured])

  useEffect(() => {
    if (slides.length < 2) return
    const t = setInterval(() => setIdx(i => (i + 1) % slides.length), 4500)
    return () => clearInterval(t)
  }, [slides])

  if (slides.length === 0) return null
  const slide = slides[idx]

  return (
    <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', height: 260, boxShadow: '0 8px 30px rgba(18,58,122,0.18)' }}>
      {slides.map((s, i) => (
        <img key={i} src={s.img} alt="" style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
          opacity: i === idx ? 1 : 0, transition: 'opacity 0.6s ease',
        }} />
      ))}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(11,47,107,0.85))', padding: '30px 18px 14px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#fff', letterSpacing: 1, textTransform: 'uppercase', opacity: 0.85 }}>{slide.category}</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{slide.title}</div>
      </div>
      {slides.length > 1 && (
        <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', gap: 6 }}>
          {slides.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)} style={{
              width: 8, height: 8, borderRadius: '50%', border: 'none', cursor: 'pointer', padding: 0,
              background: i === idx ? '#fff' : 'rgba(255,255,255,0.45)',
            }} />
          ))}
        </div>
      )}
    </div>
  )
}

function HomeTab({ setTab }: { setTab: (t: TabId) => void }) {
  const [featured, setFeatured] = useState<Post | null>(null)
  const [live, setLive] = useState(false)

  useEffect(() => {
    supabase.from('posts').select('*').order('pinned', { ascending: false }).order('created_at', { ascending: false }).limit(1).then(({ data }) => setFeatured(data?.[0] || null))
    supabase.from('settings').select('*').eq('key', 'livestream_status').single().then(({ data }) => setLive(data?.value === 'live'))
  }, [])

  const accent = featured ? (featured.category === 'breaking' ? C.red : featured.category === 'foreign' ? C.green : C.navy) : C.navy

  return (
    <div style={{ background: `linear-gradient(135deg, #ffffff 0%, #eef2fb 45%, #dbe6f7 100%)`, margin: '-28px -24px 0', padding: '28px 24px 36px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        {/* Featured hero */}
        <div style={{ background: C.white, borderRadius: 16, padding: 24, boxShadow: '0 6px 24px rgba(18,58,122,0.10)', border: `1px solid ${C.border}`, marginBottom: 30 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, alignItems: 'center' }}>
            <div>
              <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: 1.5, marginBottom: 12, background: accent, borderRadius: 20, padding: '4px 12px' }}>{featured ? 'FEATURED' : 'OSFUSA NETWORK'}</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: C.navyDark, fontFamily: 'Georgia, serif', lineHeight: 1.15, marginBottom: 14 }}>
                {featured ? featured.title : 'Coverage you can trust'}
              </div>
              <div style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.6, marginBottom: 20 }}>
                {featured ? featured.body.slice(0, 140) + (featured.body.length > 140 ? '...' : '') : 'Breaking news, foreign affairs, and official newsletters - plus live coverage.'}
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <button onClick={() => setTab('livestream')} style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.navy, color: C.white, border: 'none', borderRadius: 6, padding: '11px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                  <span style={{ width: 0, height: 0, borderTop: '5px solid transparent', borderBottom: '5px solid transparent', borderLeft: '8px solid #fff' }} /> {live ? 'Watch Live' : 'Live Stream'}
                </button>
                <button onClick={() => setTab(featured ? (featured.category as TabId) : 'breaking')} style={{ background: 'transparent', border: 'none', color: C.navy, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                  View all →
                </button>
              </div>
            </div>
            <HeroCarousel featured={featured} />
          </div>
        </div>

        {/* Quick stat boxes */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 30 }}>
          <StatBox label="Status" value={live ? 'Live Now' : 'Offline'} accent={live ? C.red : C.gray} />
          <StatBox label="Newsletters" value="Latest updates" accent={C.navy} onClick={() => setTab('newsletter')} />
          <StatBox label="Breaking" value="Top stories" accent={C.red} onClick={() => setTab('breaking')} />
          <StatBox label="Careers" value="Open positions" accent={C.green} onClick={() => setTab('careers')} />
        </div>

        {/* What's on */}
        <h3 style={{ fontSize: 13, fontWeight: 700, color: C.darkGray, marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1 }}>What's on C-SPAN</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16 }}>
          {WHATS_ON_CARDS.map(c => <WhatsOnCard key={c.id} id={c.id} label={c.label} tag={c.tag} setTab={setTab} />)}
          <LiveStreamCard setTab={setTab} />
        </div>

        <RecentRow />
      </div>
    </div>
  )
}

/* ─── Live popup (upcoming schedule only - live goes straight to the tab) ── */
function UpcomingStreamPopup() {
  const [next, setNext] = useState<any | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem('cspan-live-popup-dismissed') === 'true') { setDismissed(true); return }
    supabase.from('stream_schedule').select('*').gt('scheduled_at', new Date().toISOString()).order('scheduled_at', { ascending: true }).limit(1)
      .then(({ data }) => setNext(data?.[0] || null))
  }, [])

  const dismiss = () => { sessionStorage.setItem('cspan-live-popup-dismissed', 'true'); setDismissed(true) }

  if (dismissed || !next) return null

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(11,47,107,0.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}>
      <div style={{ background: C.white, borderRadius: 12, padding: 28, maxWidth: 400, width: '100%', boxShadow: '0 12px 40px rgba(0,0,0,0.3)', position: 'relative' }}>
        <button onClick={dismiss} style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', fontSize: 18, color: C.gray, cursor: 'pointer' }}>✕</button>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.navy, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Upcoming stream</div>
        <div style={{ fontSize: 19, fontWeight: 700, color: C.navy, fontFamily: 'Georgia, serif', marginBottom: 4 }}>{next.title}</div>
        <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 14 }}>{new Date(next.scheduled_at).toLocaleString()}</div>
        {next.notes && <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 14 }}>{next.notes}</div>}
        <button onClick={dismiss} style={{ background: C.navy, color: C.white, border: 'none', borderRadius: 20, padding: '10px 22px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Got it</button>
      </div>
    </div>
  )
}

/* ─── Page ──────────────────────────────────────────────────────── */
function CSPANHome() {
  const [tab, setTab] = useState<TabId>('home')

  useEffect(() => {
    if (sessionStorage.getItem('cspan-auto-live-jumped') === 'true') return
    supabase.from('settings').select('*').eq('key', 'livestream_status').single().then(({ data }) => {
      if (data?.value === 'live') {
        sessionStorage.setItem('cspan-auto-live-jumped', 'true')
        setTab('livestream')
      }
    })
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: C.offWhite, fontFamily: 'system-ui, sans-serif' }}>
      <UpcomingStreamPopup />
      <Header tab={tab} setTab={setTab} />
      <main style={{ maxWidth: 1000, margin: '0 auto', padding: '28px 24px' }}>
        {tab === 'home' && <HomeTab setTab={setTab} />}
        {tab === 'newsletter' && <PostFeed category="newsletter" accent={C.navy} />}
        {tab === 'breaking' && <PostFeed category="breaking" accent={C.red} />}
        {tab === 'foreign' && <PostFeed category="foreign" accent={C.green} />}
        {tab === 'livestream' && <LiveStreamTab />}
        {tab === 'careers' && <CareersTab />}
        {tab === 'about' && <AboutTab />}
      </main>
      <SiteFooter />
    </div>
  )
}
