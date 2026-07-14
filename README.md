import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export const Route = createFileRoute('/admin')({ component: AdminPanel })

type Tab = 'posts' | 'livestream' | 'applications' | 'settings'

const C = {
  navy: '#123a7a', navyDark: '#0b2f6b', red: '#c53030',
  green: '#1a4a2a', greenLight: '#c8f0c8',
  redBorder: '#6a2020', redText: '#f08080',
  card: '#0d1a2d', cardBorder: '#2a3a5a',
  input: '#071020', text: '#c8d8f0', muted: '#6a8aaa',
}

const inp: React.CSSProperties = {
  width: '100%', background: C.input, border: `1px solid ${C.cardBorder}`, borderRadius: 6,
  padding: '9px 12px', fontSize: 13, color: C.text, outline: 'none', boxSizing: 'border-box',
}
const btn = (bg: string): React.CSSProperties => ({
  background: bg, color: '#fff', border: 'none', borderRadius: 6, padding: '9px 16px',
  fontSize: 13, fontWeight: 600, cursor: 'pointer',
})

async function hashPassword(password: string): Promise<string> {
  const buf = new TextEncoder().encode(password)
  const hashBuf = await crypto.subtle.digest('SHA-256', buf)
  return Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

/* ─── Login ─────────────────────────────────────────────────────── */
function LoginScreen({ onAuthed }: { onAuthed: (role: string) => void }) {
  const [username, setUsername] = useState('')
  const [pw, setPw] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const login = async () => {
    if (!username || !pw) { setError('Please enter username and password.'); return }
    const lockedUntil = Number(sessionStorage.getItem('cspan-admin-locked-until') || 0)
    if (Date.now() < lockedUntil) {
      setError('Too many failed attempts. Try again in ' + Math.ceil((lockedUntil - Date.now()) / 1000) + 's.'); return
    }
    setLoading(true); setError('')
    const hash = await hashPassword(pw)
    const { data } = await supabase.from('admin_users').select('*').eq('email', username).eq('password_hash', hash).single()
    setLoading(false)
    if (data) {
      sessionStorage.removeItem('cspan-admin-attempts')
      sessionStorage.setItem('cspan-admin', 'true')
      sessionStorage.setItem('cspan-admin-role', data.role)
      onAuthed(data.role)
    } else {
      const attempts = Number(sessionStorage.getItem('cspan-admin-attempts') || 0) + 1
      sessionStorage.setItem('cspan-admin-attempts', String(attempts))
      if (attempts >= 5) {
        sessionStorage.setItem('cspan-admin-locked-until', String(Date.now() + 5 * 60 * 1000))
        setError('Too many failed attempts. Locked for 5 minutes.')
      } else {
        setError(`Incorrect username or password. (${5 - attempts} attempts remaining)`)
      }
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: C.navyDark, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
      <div style={{ width: 340, background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 10, padding: 28 }}>
        <div style={{ fontSize: 11, letterSpacing: 2, color: C.muted, marginBottom: 4, textAlign: 'center' }}>OSFUSA</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', textAlign: 'center', marginBottom: 20 }}>C-SPAN Admin</div>
        <input style={{ ...inp, marginBottom: 10 }} placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
        <input style={{ ...inp, marginBottom: 14 }} placeholder="Password" type="password" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === 'Enter' && login()} />
        {error && <div style={{ color: C.redText, fontSize: 12, marginBottom: 12 }}>{error}</div>}
        <button style={{ ...btn(C.navy), width: '100%' }} onClick={login} disabled={loading}>{loading ? 'Checking...' : 'Log In'}</button>
      </div>
    </div>
  )
}

/* ─── Posts tab ─────────────────────────────────────────────────── */
function PostsTab() {
  const [posts, setPosts] = useState<any[]>([])
  const [filter, setFilter] = useState<'all' | 'newsletter' | 'breaking' | 'foreign'>('all')
  const [editing, setEditing] = useState<any | null>(null)
  const blank = { category: 'breaking', title: '', body: '', image_url: '', pinned: false }

  const load = () => {
    let q = supabase.from('posts').select('*').order('created_at', { ascending: false })
    supabase.from('posts').select('*').order('pinned', { ascending: false }).order('created_at', { ascending: false }).then(({ data }) => setPosts(data || []))
  }
  useEffect(load, [])

  const save = async () => {
    if (!editing.title.trim() || !editing.body.trim()) return
    if (editing.id) await supabase.from('posts').update({ category: editing.category, title: editing.title, body: editing.body, image_url: editing.image_url || null, pinned: editing.pinned }).eq('id', editing.id)
    else await supabase.from('posts').insert({ ...editing, image_url: editing.image_url || null, source: 'web' })
    setEditing(null); load()
  }
  const del = async (id: string) => { if (confirm('Delete this post?')) { await supabase.from('posts').delete().eq('id', id); load() } }

  const shown = filter === 'all' ? posts : posts.filter(p => p.category === filter)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['all', 'newsletter', 'breaking', 'foreign'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ ...btn(filter === f ? C.navy : '#1a2740'), padding: '6px 14px' }}>{f}</button>
          ))}
        </div>
        <button style={btn(C.green)} onClick={() => setEditing({ ...blank })}>+ New Post</button>
      </div>

      {editing && (
        <div style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 8, padding: 18, marginBottom: 18 }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            <select style={inp} value={editing.category} onChange={e => setEditing({ ...editing, category: e.target.value })}>
              <option value="breaking">Breaking News</option>
              <option value="newsletter">Newsletter</option>
              <option value="foreign">Foreign / Intl</option>
            </select>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.text, fontSize: 13 }}>
              <input type="checkbox" checked={editing.pinned} onChange={e => setEditing({ ...editing, pinned: e.target.checked })} /> Pinned
            </label>
          </div>
          <input style={{ ...inp, marginBottom: 10 }} placeholder="Title" value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })} />
          <textarea style={{ ...inp, minHeight: 100, marginBottom: 10, resize: 'vertical' }} placeholder="Body" value={editing.body} onChange={e => setEditing({ ...editing, body: e.target.value })} />
          <input style={{ ...inp, marginBottom: 10 }} placeholder="Image URL (optional)" value={editing.image_url} onChange={e => setEditing({ ...editing, image_url: e.target.value })} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={btn(C.navy)} onClick={save}>Save</button>
            <button style={btn('#333')} onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {shown.map(p => (
          <div key={p.id} style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 8, padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <div>
              <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 }}>{p.category} {p.pinned && '· pinned'} {p.source === 'discord' && '· via discord'}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: '4px 0' }}>{p.title}</div>
              <div style={{ fontSize: 12, color: C.muted }}>{new Date(p.created_at).toLocaleString()}</div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <button style={btn('#2a3a5a')} onClick={() => setEditing(p)}>Edit</button>
              <button style={btn(C.red)} onClick={() => del(p.id)}>Delete</button>
            </div>
          </div>
        ))}
        {shown.length === 0 && <div style={{ color: C.muted, textAlign: 'center', padding: 30 }}>No posts.</div>}
      </div>
    </div>
  )
}

/* ─── Live Stream tab ───────────────────────────────────────────── */
function LivestreamTab() {
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState('offline')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    supabase.from('settings').select('*').in('key', ['livestream_embed_url', 'livestream_status']).then(({ data }) => {
      data?.forEach((row: any) => {
        if (row.key === 'livestream_embed_url') setUrl(row.value)
        if (row.key === 'livestream_status') setStatus(row.value)
      })
    })
  }, [])

  const save = async () => {
    await supabase.from('settings').upsert({ key: 'livestream_embed_url', value: url }, { onConflict: 'key' })
    await supabase.from('settings').upsert({ key: 'livestream_status', value: status }, { onConflict: 'key' })
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{ maxWidth: 480 }}>
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 6 }}>YouTube embed URL (e.g. https://www.youtube.com/embed/live_stream?channel=...)</label>
        <input style={inp} value={url} onChange={e => setUrl(e.target.value)} placeholder="https://www.youtube.com/embed/..." />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 6 }}>Status</label>
        <select style={inp} value={status} onChange={e => setStatus(e.target.value)}>
          <option value="offline">Offline</option>
          <option value="live">Live</option>
        </select>
      </div>
      <button style={btn(C.navy)} onClick={save}>Save</button>
      {saved && <span style={{ color: '#9ae6b4', marginLeft: 12, fontSize: 13 }}>Saved ✓</span>}
    </div>
  )
}

/* ─── Applications tab ──────────────────────────────────────────── */
function ApplicationsTab() {
  const [apps, setApps] = useState<any[]>([])
  const load = () => supabase.from('applications').select('*').order('submitted_at', { ascending: false }).then(({ data }) => setApps(data || []))
  useEffect(load, [])

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('applications').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    load()
  }
  const saveNotes = async (id: string, notes: string) => {
    await supabase.from('applications').update({ notes, updated_at: new Date().toISOString() }).eq('id', id)
    load()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {apps.map(a => (
        <div key={a.id} style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 8, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>{a.roblox_username} <span style={{ color: C.muted, fontWeight: 400, fontSize: 12 }}>· {a.discord_username}</span></div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{a.position} · {new Date(a.submitted_at).toLocaleDateString()}</div>
            </div>
            <select style={{ ...inp, width: 150 }} value={a.status} onChange={e => updateStatus(a.id, e.target.value)}>
              {['Submitted', 'Processing', 'Waitlisted', 'Accepted', 'Denied', 'Suspended'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <details style={{ marginTop: 10 }}>
            <summary style={{ fontSize: 12, color: C.muted, cursor: 'pointer' }}>View full application</summary>
            <div style={{ fontSize: 12, color: C.text, marginTop: 8, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              <div><strong>Broadcast experience:</strong> {a.broadcast_experience}</div>
              <div><strong>Strength / weakness:</strong> {a.strength_weakness}</div>
              <div><strong>Why hire:</strong> {a.why_hire}</div>
            </div>
          </details>
          <textarea style={{ ...inp, marginTop: 10, minHeight: 50 }} placeholder="Staff notes..." defaultValue={a.notes || ''} onBlur={e => saveNotes(a.id, e.target.value)} />
        </div>
      ))}
      {apps.length === 0 && <div style={{ color: C.muted, textAlign: 'center', padding: 30 }}>No applications yet.</div>}
    </div>
  )
}

/* ─── Settings tab ──────────────────────────────────────────────── */
function SettingsTab() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)
  const keys = ['app_status', 'app_closed_message', 'discord_invite']

  useEffect(() => {
    supabase.from('settings').select('*').in('key', keys).then(({ data }) => {
      const map: Record<string, string> = {}
      data?.forEach((row: any) => { map[row.key] = row.value })
      setSettings(map)
    })
  }, [])

  const set = (k: string, v: string) => setSettings(s => ({ ...s, [k]: v }))
  const save = async () => {
    for (const k of keys) await supabase.from('settings').upsert({ key: k, value: settings[k] || '' }, { onConflict: 'key' })
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{ maxWidth: 480 }}>
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 6 }}>Applications</label>
        <select style={inp} value={settings.app_status || 'open'} onChange={e => set('app_status', e.target.value)}>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
        </select>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 6 }}>Closed message</label>
        <textarea style={{ ...inp, minHeight: 60 }} value={settings.app_closed_message || ''} onChange={e => set('app_closed_message', e.target.value)} />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 6 }}>Discord invite link (shown in footer)</label>
        <input style={inp} value={settings.discord_invite || ''} onChange={e => set('discord_invite', e.target.value)} placeholder="https://discord.gg/..." />
      </div>
      <div style={{ background: '#1a2740', border: `1px solid ${C.cardBorder}`, borderRadius: 6, padding: 12, fontSize: 12, color: C.muted, marginBottom: 14 }}>
        The Discord webhook URL (for website → Discord posting) and bot service-role key
        (for Discord → website posting) live outside this panel as environment
        variables — see the Discord bot README for setup.
      </div>
      <button style={btn(C.navy)} onClick={save}>Save</button>
      {saved && <span style={{ color: '#9ae6b4', marginLeft: 12, fontSize: 13 }}>Saved ✓</span>}
    </div>
  )
}

/* ─── Panel ─────────────────────────────────────────────────────── */
function AdminPanel() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('cspan-admin') === 'true')
  const [tab, setTab] = useState<Tab>('posts')

  if (!authed) return <LoginScreen onAuthed={() => setAuthed(true)} />

  const TABS: { id: Tab; label: string }[] = [
    { id: 'posts', label: 'Posts' },
    { id: 'livestream', label: 'Live Stream' },
    { id: 'applications', label: 'Applications' },
    { id: 'settings', label: 'Settings' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: C.navyDark, fontFamily: 'sans-serif' }}>
      <header style={{ background: C.card, borderBottom: `1px solid ${C.cardBorder}`, padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ color: '#fff', fontWeight: 700 }}>C-SPAN Admin</div>
        <button style={btn('#333')} onClick={() => { sessionStorage.removeItem('cspan-admin'); setAuthed(false) }}>Log Out</button>
      </header>
      <div style={{ display: 'flex', gap: 8, padding: '16px 24px 0' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ ...btn(tab === t.id ? C.navy : '#1a2740'), padding: '8px 16px' }}>{t.label}</button>
        ))}
      </div>
      <main style={{ padding: 24 }}>
        {tab === 'posts' && <PostsTab />}
        {tab === 'livestream' && <LivestreamTab />}
        {tab === 'applications' && <ApplicationsTab />}
        {tab === 'settings' && <SettingsTab />}
      </main>
    </div>
  )
}
