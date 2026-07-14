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

function Header({ tab, setTab }: { tab: TabId; setTab: (t: TabId) => void }) {
  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 10 }}>
      <TickerBar />
      <header style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', borderBottom: `1px solid ${C.border}`, boxShadow: '0 2px 10px rgba(18,58,122,0.06)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${C.navy}`, flexShrink: 0 }}>
              <img src="/cspan-emblem.png" alt="C-SPAN" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.style.display = 'none' }} />
            </div>
            <div>
              <div style={{ fontSize: 9, letterSpacing: 3, color: C.gray, textTransform: 'uppercase' }}>OSFUSA ROBLOX RP</div>
              <Link to="/" style={{ fontSize: 21, fontWeight: 700, color: C.navy, fontFamily: 'Georgia, serif', textDecoration: 'none', letterSpacing: 0.3 }}>C-SPAN</Link>
            </div>
          </div>
          <Link to="/apply" style={{ background: C.red, color: C.white, padding: '9px 20px', borderRadius: 4, fontSize: 13, fontWeight: 700, textDecoration: 'none', boxShadow: '0 2px 8px rgba(197,48,48,0.3)' }}>Apply</Link>
        </div>
        <div style={{ background: C.lightGray, borderTop: `1px solid ${C.border}` }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                background: 'transparent', border: 'none', borderBottom: tab === t.id ? `2px solid ${C.navy}` : '2px solid transparent',
                color: tab === t.id ? C.navy : C.textMuted, padding: '10px 12px', fontSize: 13, cursor: 'pointer',
                fontWeight: tab === t.id ? 700 : 500,
              }}>{t.label}</button>
            ))}
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
      <div style={{
        position: 'relative', borderRadius: 14, padding: '40px 32px', marginBottom: 28, overflow: 'hidden',
        background: `linear-gradient(135deg, ${C.navyDark} 0%, ${C.navy} 50%, ${C.navyLight} 100%)`,
      }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -40, width: 260, height: 260, borderRadius: '50%', background: 'rgba(197,48,48,0.10)' }} />
        <div style={{
          position: 'relative', background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.14)', borderRadius: 10, padding: '24px 28px', maxWidth: 560,
        }}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: 'rgba(215,224,242,0.85)', marginBottom: 8 }}>OSFUSA CABLE-SATELLITE PUBLIC AFFAIRS NETWORK</div>
          <div style={{ fontSize: 30, fontWeight: 700, fontFamily: 'Georgia, serif', marginBottom: 10, color: C.white }}>Coverage you can trust</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', marginBottom: 20 }}>Breaking news, foreign affairs, and official newsletters - plus live coverage.</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={() => setTab('breaking')} style={{ background: C.red, color: C.white, border: 'none', borderRadius: 20, padding: '10px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: '0 2px 10px rgba(197,48,48,0.35)' }}>Breaking News</button>
            <button onClick={() => setTab('livestream')} style={{ background: 'rgba(255,255,255,0.12)', color: C.white, border: `1px solid rgba(255,255,255,0.35)`, borderRadius: 20, padding: '10px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Watch Live</button>
          </div>
        </div>
      </div>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: C.darkGray, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Latest breaking</h3>
      <PostFeed category="breaking" accent={C.red} />
    </div>
  )
}

/* ─── Live popup ────────────────────────────────────────────────── */
function LiveStreamPopup({ goLive }: { goLive: () => void }) {
  const [status, setStatus] = useState<string | null>(null)
  const [next, setNext] = useState<any | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem('cspan-live-popup-dismissed') === 'true') { setDismissed(true); return }
    supabase.from('settings').select('*').eq('key', 'livestream_status').single().then(({ data }) => setStatus(data?.value || 'offline'))
    supabase.from('stream_schedule').select('*').gt('scheduled_at', new Date().toISOString()).order('scheduled_at', { ascending: true }).limit(1)
      .then(({ data }) => setNext(data?.[0] || null))
  }, [])

  const dismiss = () => { sessionStorage.setItem('cspan-live-popup-dismissed', 'true'); setDismissed(true) }

  if (dismissed || (status !== 'live' && !next)) return null

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(11,47,107,0.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}>
      <div style={{ background: C.white, borderRadius: 12, padding: 28, maxWidth: 400, width: '100%', boxShadow: '0 12px 40px rgba(0,0,0,0.3)', position: 'relative' }}>
        <button onClick={dismiss} style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', fontSize: 18, color: C.gray, cursor: 'pointer' }}>✕</button>
        {status === 'live' ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: C.red }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: C.red, textTransform: 'uppercase', letterSpacing: 1 }}>Live now</span>
            </div>
            <div style={{ fontSize: 19, fontWeight: 700, color: C.navy, fontFamily: 'Georgia, serif', marginBottom: 14 }}>C-SPAN is broadcasting live</div>
            <button onClick={() => { goLive(); dismiss() }} style={{ background: C.red, color: C.white, border: 'none', borderRadius: 20, padding: '10px 22px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Watch now</button>
          </>
        ) : (
          <>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.navy, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Upcoming stream</div>
            <div style={{ fontSize: 19, fontWeight: 700, color: C.navy, fontFamily: 'Georgia, serif', marginBottom: 4 }}>{next.title}</div>
            <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 14 }}>{new Date(next.scheduled_at).toLocaleString()}</div>
            {next.notes && <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 14 }}>{next.notes}</div>}
            <button onClick={dismiss} style={{ background: C.navy, color: C.white, border: 'none', borderRadius: 20, padding: '10px 22px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Got it</button>
          </>
        )}
      </div>
    </div>
  )
}

/* ─── Page ──────────────────────────────────────────────────────── */
function CSPANHome() {
  const [tab, setTab] = useState<TabId>('home')

  return (
    <div style={{ minHeight: '100vh', background: C.offWhite, fontFamily: 'system-ui, sans-serif' }}>
      <LiveStreamPopup goLive={() => setTab('livestream')} />
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
