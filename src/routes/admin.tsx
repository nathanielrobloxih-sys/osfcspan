import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export const Route = createFileRoute('/admin')({ component: AdminPanel })

type Tab = 'posts' | 'livestream' | 'careers' | 'applications' | 'settings' | 'roles' | 'staff'

const ALL_TABS: { id: Tab; label: string; ownerOnly?: boolean }[] = [
  { id: 'posts', label: 'Posts' },
  { id: 'livestream', label: 'Live Stream' },
  { id: 'careers', label: 'Careers' },
  { id: 'applications', label: 'Applications' },
  { id: 'settings', label: 'Settings' },
  { id: 'roles', label: 'Roles', ownerOnly: true },
  { id: 'staff', label: 'Staff', ownerOnly: true },
]

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
    <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${C.navyDark} 0%, #14275a 55%, #1c1030 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
      <div style={{ width: 340, background: 'rgba(13,26,45,0.85)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', border: `1px solid ${C.cardBorder}`, borderRadius: 12, padding: 28, boxShadow: '0 12px 40px rgba(0,0,0,0.35)' }}>
        <div style={{ fontSize: 11, letterSpacing: 2, color: C.muted, marginBottom: 4, textAlign: 'center' }}>OSFUSA</div>
        <img src="/cspan-outline-logo.png" alt="" style={{ width: 90, margin: '0 auto 10px', display: 'block', opacity: 0.8 }} />
        <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', textAlign: 'center', marginBottom: 20 }}>C-SPAN Admin</div>
        <input style={{ ...inp, marginBottom: 10 }} placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
        <input style={{ ...inp, marginBottom: 14 }} placeholder="Password" type="password" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === 'Enter' && login()} />
        {error && <div style={{ color: C.redText, fontSize: 12, marginBottom: 12 }}>{error}</div>}
        <button style={{ ...btn(C.navy), width: '100%' }} onClick={login} disabled={loading}>{loading ? 'Checking...' : 'Log In'}</button>
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Link to="/" style={{ fontSize: 12, color: C.muted, textDecoration: 'none' }}>← Back to site</Link>
        </div>
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
  const [schedule, setSchedule] = useState<any[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [newTime, setNewTime] = useState('')
  const [newNotes, setNewNotes] = useState('')

  const loadSchedule = () => supabase.from('stream_schedule').select('*').order('scheduled_at', { ascending: true }).then(({ data }) => setSchedule(data || []))

  useEffect(() => {
    supabase.from('settings').select('*').in('key', ['livestream_embed_url', 'livestream_status']).then(({ data }) => {
      data?.forEach((row: any) => {
        if (row.key === 'livestream_embed_url') setUrl(row.value)
        if (row.key === 'livestream_status') setStatus(row.value)
      })
    })
    loadSchedule()
  }, [])

  const save = async () => {
    await supabase.from('settings').upsert({ key: 'livestream_embed_url', value: url }, { onConflict: 'key' })
    await supabase.from('settings').upsert({ key: 'livestream_status', value: status }, { onConflict: 'key' })
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  const addScheduled = async () => {
    if (!newTitle.trim() || !newTime) return
    await supabase.from('stream_schedule').insert({ title: newTitle.trim(), scheduled_at: new Date(newTime).toISOString(), notes: newNotes.trim() || null })
    setNewTitle(''); setNewTime(''); setNewNotes(''); loadSchedule()
  }
  const delScheduled = async (id: string) => { await supabase.from('stream_schedule').delete().eq('id', id); loadSchedule() }

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

      <div style={{ marginTop: 30, paddingTop: 20, borderTop: `1px solid ${C.cardBorder}` }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 12 }}>Scheduled streams</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
          <input style={inp} placeholder="Title (e.g. Weekly Briefing)" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
          <input style={inp} type="datetime-local" value={newTime} onChange={e => setNewTime(e.target.value)} />
          <input style={inp} placeholder="Notes (optional)" value={newNotes} onChange={e => setNewNotes(e.target.value)} />
          <button style={btn(C.green)} onClick={addScheduled}>+ Add scheduled stream</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {schedule.map(s => (
            <div key={s.id} style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 6, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{s.title}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{new Date(s.scheduled_at).toLocaleString()}</div>
              </div>
              <button style={btn(C.red)} onClick={() => delScheduled(s.id)}>Delete</button>
            </div>
          ))}
          {schedule.length === 0 && <div style={{ color: C.muted, fontSize: 12 }}>No scheduled streams.</div>}
        </div>
      </div>
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

/* ─── Careers tab ───────────────────────────────────────────────── */
function CareersTab() {
  const [text, setText] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    supabase.from('settings').select('*').eq('key', 'open_positions').single().then(({ data }) => setText(data?.value || ''))
  }, [])

  const save = async () => {
    await supabase.from('settings').upsert({ key: 'open_positions', value: text }, { onConflict: 'key' })
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Open positions</div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 10, lineHeight: 1.6 }}>
        One position per line, formatted as: <code>Title | short description</code><br />
        Example: <code>Anchor / Host | Deliver live coverage and interviews</code>
      </div>
      <textarea style={{ ...inp, minHeight: 160, resize: 'vertical' }} value={text} onChange={e => setText(e.target.value)}
        placeholder={'Anchor / Host | Deliver live coverage and interviews\nCorrespondent | Field reporting on domestic stories'} />
      <div style={{ marginTop: 10 }}>
        <button style={btn(C.navy)} onClick={save}>Save</button>
        {saved && <span style={{ color: '#9ae6b4', marginLeft: 12, fontSize: 13 }}>Saved ✓</span>}
      </div>

      <div style={{ marginTop: 30, paddingTop: 20, borderTop: `1px solid ${C.cardBorder}` }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 10 }}>Applications</div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>
          Review and update submitted applications in the Applications tab above.
        </div>
      </div>
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
        variables - see the Discord bot README for setup.
      </div>
      <button style={btn(C.navy)} onClick={save}>Save</button>
      {saved && <span style={{ color: '#9ae6b4', marginLeft: 12, fontSize: 13 }}>Saved ✓</span>}
    </div>
  )
}

/* ─── Roles tab (Owner only) ────────────────────────────────────── */
const PERMISSION_TABS = ALL_TABS.filter(t => !t.ownerOnly)

function RolesTab() {
  const [roles, setRoles] = useState<any[]>([])
  const [newName, setNewName] = useState('')
  const [newPerms, setNewPerms] = useState<string[]>([])

  const load = () => supabase.from('admin_roles').select('*').order('name').then(({ data }) => setRoles(data || []))
  useEffect(load, [])

  const togglePerm = (perms: string[], id: string, set: (p: string[]) => void) => {
    set(perms.includes(id) ? perms.filter(p => p !== id) : [...perms, id])
  }

  const createRole = async () => {
    if (!newName.trim()) return
    await supabase.from('admin_roles').insert({ name: newName.trim(), permissions: newPerms })
    setNewName(''); setNewPerms([]); load()
  }

  const updateRolePerms = async (role: any, perms: string[]) => {
    await supabase.from('admin_roles').update({ permissions: perms }).eq('id', role.id)
    load()
  }

  const deleteRole = async (id: string) => {
    if (confirm('Delete this role? Staff logins using it will lose admin access until reassigned.')) {
      await supabase.from('admin_roles').delete().eq('id', id); load()
    }
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 10 }}>Create a new role</div>
      <input style={{ ...inp, marginBottom: 10 }} placeholder="Role name (e.g. Anchor, Producer)" value={newName} onChange={e => setNewName(e.target.value)} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        {PERMISSION_TABS.map(t => (
          <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: newPerms.includes(t.id) ? C.navy : '#1a2740', border: `1px solid ${C.cardBorder}`, borderRadius: 6, padding: '6px 12px', fontSize: 12, color: '#fff', cursor: 'pointer' }}>
            <input type="checkbox" checked={newPerms.includes(t.id)} onChange={() => togglePerm(newPerms, t.id, setNewPerms)} /> {t.label}
          </label>
        ))}
      </div>
      <button style={btn(C.green)} onClick={createRole}>+ Create role</button>

      <div style={{ marginTop: 30, paddingTop: 20, borderTop: `1px solid ${C.cardBorder}` }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 12 }}>Existing roles</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {roles.map(r => (
            <div key={r.id} style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 8, padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{r.name}</div>
                <button style={btn(C.red)} onClick={() => deleteRole(r.id)}>Delete</button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {PERMISSION_TABS.map(t => (
                  <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: (r.permissions || []).includes(t.id) ? C.navy : '#1a2740', border: `1px solid ${C.cardBorder}`, borderRadius: 6, padding: '5px 10px', fontSize: 11, color: '#fff', cursor: 'pointer' }}>
                    <input type="checkbox" checked={(r.permissions || []).includes(t.id)} onChange={() => updateRolePerms(r, togglePermArr(r.permissions || [], t.id))} /> {t.label}
                  </label>
                ))}
              </div>
            </div>
          ))}
          {roles.length === 0 && <div style={{ color: C.muted, fontSize: 12 }}>No custom roles yet. Owner always has full access.</div>}
        </div>
      </div>
    </div>
  )
}

function togglePermArr(perms: string[], id: string) {
  return perms.includes(id) ? perms.filter(p => p !== id) : [...perms, id]
}

/* ─── Staff tab (Owner only) ────────────────────────────────────── */
function StaffTab() {
  const [users, setUsers] = useState<any[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const load = () => {
    supabase.from('admin_users').select('id, email, role').then(({ data }) => setUsers(data || []))
    supabase.from('admin_roles').select('*').order('name').then(({ data }) => setRoles(data || []))
  }
  useEffect(load, [])

  const createStaff = async () => {
    setError('')
    if (!username.trim() || !password.trim() || !role) { setError('Fill in username, password, and role.'); return }
    const existing = users.find(u => u.email.toLowerCase() === username.trim().toLowerCase())
    if (existing) { setError('That username already exists.'); return }
    const hash = await hashPassword(password)
    const { error: dbErr } = await supabase.from('admin_users').insert({ email: username.trim(), password_hash: hash, role })
    if (dbErr) { setError(dbErr.message); return }
    setUsername(''); setPassword(''); setRole(''); setSaved(true); setTimeout(() => setSaved(false), 2000); load()
  }

  const deleteStaff = async (id: string, email: string) => {
    if (email === 'Greysphoric') { alert("Can't delete the primary owner account."); return }
    if (confirm(`Remove login for ${email}?`)) { await supabase.from('admin_users').delete().eq('id', id); load() }
  }

  return (
    <div style={{ maxWidth: 480 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 10 }}>Create a staff login</div>
      <input style={{ ...inp, marginBottom: 10 }} placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
      <input style={{ ...inp, marginBottom: 10 }} placeholder="Password" type="text" value={password} onChange={e => setPassword(e.target.value)} />
      <select style={{ ...inp, marginBottom: 10 }} value={role} onChange={e => setRole(e.target.value)}>
        <option value="">Select a role...</option>
        <option value="Owner">Owner (full access)</option>
        {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
      </select>
      {error && <div style={{ color: C.redText, fontSize: 12, marginBottom: 10 }}>{error}</div>}
      <button style={btn(C.green)} onClick={createStaff}>+ Create login</button>
      {saved && <span style={{ color: '#9ae6b4', marginLeft: 12, fontSize: 13 }}>Created ✓</span>}
      {roles.length === 0 && <div style={{ color: C.muted, fontSize: 12, marginTop: 10 }}>Tip: create a role first in the Roles tab so you have something other than "Owner" to assign.</div>}

      <div style={{ marginTop: 30, paddingTop: 20, borderTop: `1px solid ${C.cardBorder}` }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 12 }}>Existing logins</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {users.map(u => (
            <div key={u.id} style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 6, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{u.email}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{u.role}</div>
              </div>
              <button style={btn(C.red)} onClick={() => deleteStaff(u.id, u.email)}>Remove</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── Panel ─────────────────────────────────────────────────────── */
function AdminPanel() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('cspan-admin') === 'true')
  const [role, setRole] = useState(() => sessionStorage.getItem('cspan-admin-role') || 'Owner')
  const [permTabs, setPermTabs] = useState<Tab[] | null>(role === 'Owner' ? null : [])
  const [tab, setTab] = useState<Tab | null>(null)

  useEffect(() => {
    if (!authed) return
    if (role === 'Owner') { setPermTabs(null); return }
    supabase.from('admin_roles').select('*').eq('name', role).single().then(({ data }) => {
      setPermTabs((data?.permissions || []) as Tab[])
    })
  }, [authed, role])

  const visibleTabs = role === 'Owner' ? ALL_TABS : ALL_TABS.filter(t => !t.ownerOnly && permTabs?.includes(t.id))

  useEffect(() => {
    if (tab === null && visibleTabs.length > 0) setTab(visibleTabs[0].id)
  }, [visibleTabs, tab])

  if (!authed) return <LoginScreen onAuthed={r => { setRole(r); setAuthed(true) }} />

  if (permTabs === null && role !== 'Owner') {
    return <div style={{ minHeight: '100vh', background: C.navyDark, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>
  }

  if (visibleTabs.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: C.navyDark, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, textAlign: 'center', padding: 24 }}>
        <div>Your role ({role}) doesn't have access to any admin sections yet.</div>
        <div style={{ fontSize: 13, color: C.muted }}>Ask an Owner to grant permissions in the Roles tab.</div>
        <Link to="/" style={{ color: '#9ae6b4', fontSize: 13, marginTop: 8 }}>← Back to site</Link>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(160deg, ${C.navyDark} 0%, #14275a 50%, #1c1030 100%)`, fontFamily: 'sans-serif' }}>
      <header style={{ background: 'rgba(13,26,45,0.75)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', borderBottom: `1px solid ${C.cardBorder}`, padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ color: '#fff', fontWeight: 700 }}>C-SPAN Admin</div>
          <div style={{ fontSize: 11, color: C.muted, background: '#1a2740', border: `1px solid ${C.cardBorder}`, borderRadius: 20, padding: '2px 10px' }}>{role}</div>
          <Link to="/" style={{ fontSize: 12, color: C.muted, textDecoration: 'none' }}>← Back to site</Link>
        </div>
        <button style={btn('#333')} onClick={() => { sessionStorage.removeItem('cspan-admin'); sessionStorage.removeItem('cspan-admin-role'); setAuthed(false); setTab(null) }}>Log Out</button>
      </header>
      <div style={{ display: 'flex', gap: 8, padding: '16px 24px 0', flexWrap: 'wrap' }}>
        {visibleTabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ ...btn(tab === t.id ? C.navy : 'rgba(255,255,255,0.06)'), padding: '8px 16px', border: tab === t.id ? 'none' : `1px solid ${C.cardBorder}` }}>{t.label}</button>
        ))}
      </div>
      <main style={{ padding: 24 }}>
        {tab === 'posts' && <PostsTab />}
        {tab === 'livestream' && <LivestreamTab />}
        {tab === 'careers' && <CareersTab />}
        {tab === 'applications' && <ApplicationsTab />}
        {tab === 'settings' && <SettingsTab />}
        {tab === 'roles' && <RolesTab />}
        {tab === 'staff' && <StaffTab />}
      </main>
    </div>
  )
}
