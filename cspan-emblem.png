import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { supabase } from '../lib/supabase'

export const Route = createFileRoute('/applications')({ component: ApplicationStatusPage })

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; icon: string; label: string; description: string }> = {
  Submitted:  { color: '#2b6cb0', bg: '#ebf8ff', border: '#bee3f8', icon: '📋', label: 'Submitted',  description: 'Your application has been received and is queued for review.' },
  Processing: { color: '#6b46c1', bg: '#faf5ff', border: '#d6bcfa', icon: '⚙️', label: 'Processing', description: 'A recruiter is currently reviewing your application.' },
  Waitlisted: { color: '#b7791f', bg: '#fffff0', border: '#faf089', icon: '⏳', label: 'Waitlisted', description: "You're on the waitlist. We'll reach out when a spot opens up." },
  Accepted:   { color: '#276749', bg: '#f0fff4', border: '#9ae6b4', icon: '✅', label: 'Accepted',   description: 'Congratulations! Your application has been accepted. Check Discord for next steps.' },
  Denied:     { color: '#c53030', bg: '#fff5f5', border: '#feb2b2', icon: '❌', label: 'Denied',     description: 'Your application was not accepted at this time. You may reapply in the future.' },
  Suspended:  { color: '#744210', bg: '#fffaf0', border: '#fbd38d', icon: '🚫', label: 'Suspended',  description: 'Your application has been suspended. Please contact staff for more information.' },
}

const C = {
  navy: '#123a7a', navyDark: '#0b2f6b', red: '#c53030',
  white: '#ffffff', offWhite: '#f7f9fc', lightGray: '#e8edf5',
  gray: '#718096', darkGray: '#2d3748', border: '#d1dce8',
  text: '#1a202c', textMuted: '#4a5568', redLight: '#fff5f5', redBorder: '#feb2b2',
}

const inp: React.CSSProperties = {
  width: '100%', border: `1px solid ${C.border}`, borderRadius: 6,
  padding: '10px 12px', fontSize: 14, color: C.text, background: C.white,
  outline: 'none', boxSizing: 'border-box',
}

function Header() {
  return (
    <header style={{ background: `linear-gradient(180deg, ${C.navyDark} 0%, ${C.navy} 100%)`, borderBottom: `4px solid ${C.red}` }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${C.white}`, flexShrink: 0 }}>
            <img src="/cspan-emblem.png" alt="C-SPAN" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.style.display = 'none' }} />
          </div>
          <Link to="/" style={{ fontSize: 18, fontWeight: 700, color: C.white, fontFamily: 'Georgia, serif', textDecoration: 'none' }}>C-SPAN</Link>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <Link to="/" style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>← Back to Site</Link>
          <Link to="/apply" style={{ fontSize: 13, color: C.white, textDecoration: 'none', padding: '6px 14px', border: `1px solid ${C.white}`, borderRadius: 4 }}>Apply Now</Link>
        </div>
      </div>
    </header>
  )
}

function ApplicationStatusPage() {
  const [searchType, setSearchType] = useState<'id' | 'username'>('username')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any[] | null>(null)
  const [error, setError] = useState('')

  const search = async () => {
    setError(''); setResults(null)
    if (!query.trim()) { setError('Please enter a value to search.'); return }
    setLoading(true)
    let q = supabase.from('applications').select('id, roblox_username, discord_username, position, status, notes, submitted_at, updated_at')
    q = searchType === 'id' ? q.eq('id', query.trim()) : q.ilike('roblox_username', query.trim())
    const { data, error: err } = await q.order('submitted_at', { ascending: false })
    setLoading(false)
    if (err) { setError('Search failed. Please try again.'); return }
    setResults(data || [])
    if ((data || []).length === 0) setError('No application found. Check your spelling or use your Application ID.')
  }

  return (
    <div style={{ minHeight: '100vh', background: C.offWhite, fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <main style={{ flex: 1, maxWidth: 700, margin: '0 auto', width: '100%', padding: '40px 24px' }}>
        <div style={{ marginBottom: 32, paddingBottom: 16, borderBottom: `2px solid ${C.red}` }}>
          <h2 style={{ fontSize: 26, fontWeight: 700, color: C.navy, fontFamily: 'Georgia, serif', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Application Status
          </h2>
          <p style={{ fontSize: 14, color: C.textMuted, margin: '4px 0 0' }}>Look up the status of your C-SPAN application</p>
        </div>

        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            {(['username', 'id'] as const).map(t => (
              <button key={t} onClick={() => { setSearchType(t); setResults(null); setError('') }}
                style={{ padding: '7px 18px', borderRadius: 5, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: `1px solid ${searchType === t ? C.navy : C.border}`, background: searchType === t ? C.navy : C.white, color: searchType === t ? C.white : C.textMuted }}>
                {t === 'username' ? 'Roblox Username' : 'Application ID'}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <input style={{ ...inp, flex: 1 }} value={query} onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && search()}
              placeholder={searchType === 'username' ? 'Enter your Roblox username...' : 'Paste your Application ID...'} />
            <button onClick={search} disabled={loading}
              style={{ padding: '10px 22px', borderRadius: 6, background: C.navy, color: C.white, fontSize: 14, fontWeight: 600, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', flexShrink: 0, opacity: loading ? 0.7 : 1 }}>
              {loading ? '...' : 'Search'}
            </button>
          </div>
          {error && (
            <div style={{ marginTop: 12, padding: '10px 14px', background: C.redLight, border: `1px solid ${C.redBorder}`, borderRadius: 6, fontSize: 13, color: C.red }}>{error}</div>
          )}
        </div>

        {results && results.length > 0 && results.map(app => {
          const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG['Submitted']
          return (
            <div key={app.id} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}>
              <div style={{ background: cfg.bg, borderBottom: `1px solid ${cfg.border}`, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 24 }}>{cfg.icon}</span>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: cfg.color }}>{cfg.label}</div>
                  <div style={{ fontSize: 13, color: cfg.color, opacity: 0.8 }}>{cfg.description}</div>
                </div>
              </div>
              <div style={{ padding: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 24px' }}>
                  {[
                    { label: 'Roblox Username', value: app.roblox_username },
                    { label: 'Discord', value: app.discord_username },
                    { label: 'Position', value: app.position },
                    { label: 'Submitted', value: app.submitted_at ? new Date(app.submitted_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—' },
                    { label: 'Last Updated', value: app.updated_at ? new Date(app.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—' },
                    { label: 'Application ID', value: app.id },
                  ].map(row => (
                    <div key={row.label}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: C.gray, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 3 }}>{row.label}</div>
                      <div style={{ fontSize: 13, color: C.darkGray, wordBreak: 'break-all' }}>{row.value}</div>
                    </div>
                  ))}
                </div>
                {app.notes && (
                  <div style={{ marginTop: 16, padding: '12px 16px', background: '#fffff0', border: `1px solid #faf089`, borderRadius: 6 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#b7791f', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Note from Staff</div>
                    <div style={{ fontSize: 13, color: C.darkGray, lineHeight: 1.6 }}>{app.notes}</div>
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {results && results.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 24px', background: C.white, border: `1px solid ${C.border}`, borderRadius: 8 }}>
            <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 16 }}>Don't have an application yet?</div>
            <Link to="/apply" style={{ padding: '10px 28px', borderRadius: 6, background: C.navy, color: C.white, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>Apply Now</Link>
          </div>
        )}
      </main>
    </div>
  )
}
