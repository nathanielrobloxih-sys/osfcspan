import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export const Route = createFileRoute('/apply')({ component: ApplyPage })

const C = {
  navy: '#123a7a', navyDark: '#0b2f6b', red: '#c53030',
  white: '#ffffff', offWhite: '#f7f9fc', lightGray: '#e8edf5',
  gray: '#718096', darkGray: '#2d3748', border: '#d1dce8',
  text: '#1a202c', textMuted: '#4a5568',
  green: '#2f855a', greenLight: '#f0fff4', greenBorder: '#9ae6b4',
  redLight: '#fff5f5', redBorder: '#feb2b2',
}

const inp: React.CSSProperties = {
  width: '100%', border: `1px solid ${C.border}`, borderRadius: 6,
  padding: '10px 12px', fontSize: 14, color: C.text, background: C.white,
  outline: 'none', boxSizing: 'border-box',
}

const POSITIONS = ['Anchor / Host', 'Correspondent', 'Foreign Correspondent', 'Camera Operator', 'Producer']

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.darkGray, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: hint ? 2 : 6 }}>
        {label}{required && <span style={{ color: C.red, marginLeft: 3 }}>*</span>}
      </label>
      {hint && <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 6 }}>{hint}</div>}
      {children}
    </div>
  )
}

function RadioGroup({ name, options, value, onChange }: { name: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {options.map(opt => (
        <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 6, border: `2px solid ${value === opt ? C.navy : C.border}`, background: value === opt ? 'rgba(18,58,122,0.06)' : C.white, cursor: 'pointer' }}>
          <input type="radio" name={name} value={opt} checked={value === opt} onChange={() => onChange(opt)} style={{ accentColor: C.navy }} />
          <span style={{ fontSize: 14, color: C.text }}>{opt}</span>
        </label>
      ))}
    </div>
  )
}

function AckRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 13, color: C.text, marginBottom: 8, lineHeight: 1.5 }}>{label}</div>
      <div style={{ display: 'flex', gap: 10 }}>
        {['Yes', 'No'].map(opt => (
          <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 5, border: `1px solid ${value === opt ? C.navy : C.border}`, background: value === opt ? 'rgba(18,58,122,0.08)' : C.white, cursor: 'pointer', fontSize: 13 }}>
            <input type="radio" name={label.slice(0, 20)} value={opt} checked={value === opt} onChange={() => onChange(opt)} style={{ accentColor: C.navy }} />
            {opt}
          </label>
        ))}
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 style={{ fontSize: 12, fontWeight: 700, color: C.navy, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 18, paddingBottom: 10, borderBottom: `1px solid ${C.lightGray}` }}>{children}</h3>
}

function Card({ children }: { children: React.ReactNode }) {
  return <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: 24, marginBottom: 20 }}>{children}</div>
}

function Header() {
  return (
    <header style={{ background: `linear-gradient(180deg, ${C.navyDark} 0%, ${C.navy} 100%)`, borderBottom: `4px solid ${C.red}` }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${C.white}`, flexShrink: 0 }}>
            <img src="/cspan-emblem.png" alt="C-SPAN" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.style.display = 'none' }} />
          </div>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 3, color: '#d7e0f2', textTransform: 'uppercase' }}>OSFUSA ROBLOX RP</div>
            <Link to="/" style={{ fontSize: 18, fontWeight: 700, color: C.white, fontFamily: 'Georgia, serif', textDecoration: 'none' }}>C-SPAN</Link>
          </div>
        </div>
        <Link to="/" style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>← Back to Site</Link>
      </div>
    </header>
  )
}

function ApplyPage() {
  const [page, setPage] = useState<1 | 2>(1)
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [appId, setAppId] = useState('')
  const [appClosed, setAppClosed] = useState(false)
  const [closedMsg, setClosedMsg] = useState('Applications are currently closed. Check back soon.')

  useEffect(() => {
    supabase.from('settings').select('*').in('key', ['app_status', 'app_closed_message']).then(({ data }) => {
      for (const s of data || []) {
        if (s.key === 'app_status' && s.value === 'closed') setAppClosed(true)
        if (s.key === 'app_closed_message') setClosedMsg(s.value)
      }
    })
  }, [])

  const [roblox_username, setRobloxUsername] = useState('')
  const [discord, setDiscord] = useState('')
  const [roblox_profile_link, setProfileLink] = useState('')
  const [timezone, setTimezone] = useState('')
  const [has_mic, setHasMic] = useState('')
  const [position, setPosition] = useState('')

  const [broadcast_experience, setBroadcastExperience] = useState('')
  const [strength_weakness, setStrengthWeakness] = useState('')
  const [why_hire, setWhyHire] = useState('')
  const [ack_no_contact, setAckNoContact] = useState('')
  const [ack_denied_anytime, setAckDeniedAnytime] = useState('')
  const [ack_no_reason, setAckNoReason] = useState('')

  const validatePage1 = () => {
    if (!roblox_username.trim()) return 'Roblox Username is required.'
    if (!discord.trim()) return 'Discord is required.'
    if (!roblox_profile_link.trim()) return 'Roblox Profile Link is required.'
    if (!timezone.trim()) return 'Timezone is required.'
    if (!has_mic) return 'Please select your mic status.'
    if (!position) return 'Please select a position.'
    return ''
  }

  const validatePage2 = () => {
    if (!broadcast_experience.trim()) return 'Broadcast/media experience field is required.'
    if (!strength_weakness.trim()) return 'Strength & weakness field is required.'
    if (!why_hire.trim()) return 'Please answer why you should be hired.'
    if (!ack_no_contact) return 'Please acknowledge the no-contact policy.'
    if (!ack_denied_anytime) return 'Please acknowledge the denial policy.'
    if (!ack_no_reason) return 'Please acknowledge the no-reason policy.'
    return ''
  }

  const goToPage2 = () => {
    const err = validatePage1()
    if (err) { setError(err); return }
    setError(''); setPage(2); window.scrollTo(0, 0)
  }

  const submit = async () => {
    const err = validatePage2()
    if (err) { setError(err); return }
    setError(''); setSubmitting(true)
    const { data, error: dbErr } = await supabase.from('applications').insert({
      roblox_username: roblox_username.trim(),
      discord_username: discord.trim(),
      roblox_profile_link: roblox_profile_link.trim(),
      timezone: timezone.trim(),
      has_mic,
      position,
      broadcast_experience: broadcast_experience.trim(),
      strength_weakness: strength_weakness.trim(),
      why_hire: why_hire.trim(),
      ack_no_contact,
      ack_denied_anytime,
      ack_no_reason,
      status: 'Submitted',
    }).select('id').single()
    setSubmitting(false)
    if (dbErr || !data) { setError('Submission failed: ' + (dbErr?.message || 'Unknown error. Please check your connection and try again.')); return }
    setAppId(data.id); setDone(true)
  }

  if (appClosed) return (
    <div style={{ minHeight: '100vh', background: C.offWhite, fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 24px' }}>
        <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: C.navy, fontFamily: 'Georgia, serif', marginBottom: 12 }}>Applications Closed</h2>
          <p style={{ color: C.textMuted, fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>{closedMsg}</p>
          <Link to="/" style={{ padding: '10px 24px', borderRadius: 6, background: C.navy, color: C.white, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>Return to Site</Link>
        </div>
      </main>
    </div>
  )

  if (done) return (
    <div style={{ minHeight: '100vh', background: C.offWhite, fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 24px' }}>
        <div style={{ maxWidth: 520, width: '100%', textAlign: 'center' }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: C.navy, fontFamily: 'Georgia, serif', marginBottom: 12 }}>Application Submitted</h2>
          <p style={{ color: C.textMuted, fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
            Thank you for applying to OSFUSA C-SPAN. Your application is now under review. Do <strong>not</strong> contact C-SPAN staff regarding your application status.
          </p>
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: 20, marginBottom: 24 }}>
            <div style={{ fontSize: 11, color: C.gray, letterSpacing: 1, marginBottom: 6 }}>YOUR APPLICATION ID</div>
            <div style={{ fontFamily: 'monospace', fontSize: 13, color: C.navy, wordBreak: 'break-all', fontWeight: 600 }}>{appId}</div>
            <div style={{ fontSize: 12, color: C.textMuted, marginTop: 8 }}>Save this ID to check your application status.</div>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/applications" style={{ padding: '10px 24px', borderRadius: 6, background: C.navy, color: C.white, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>Check Status</Link>
            <Link to="/" style={{ padding: '10px 24px', borderRadius: 6, background: C.white, color: C.textMuted, fontSize: 14, textDecoration: 'none', border: `1px solid ${C.border}` }}>Return Home</Link>
          </div>
        </div>
      </main>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: C.offWhite, fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <main style={{ flex: 1, maxWidth: 740, margin: '0 auto', width: '100%', padding: '40px 24px' }}>
        <div style={{ marginBottom: 28, paddingBottom: 16, borderBottom: `2px solid ${C.red}` }}>
          <h2 style={{ fontSize: 26, fontWeight: 700, color: C.navy, fontFamily: 'Georgia, serif', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            C-SPAN — Application
          </h2>
          <p style={{ fontSize: 13, color: C.textMuted, margin: '8px 0 0' }}>
            Please fill out this application to the best of your ability. Do not message any C-SPAN staff about your application.
          </p>
        </div>

        {page === 1 && (
          <>
            <Card>
              <SectionTitle>Personal Information</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
                <Field label="Roblox Username" required>
                  <input style={inp} value={roblox_username} onChange={e => setRobloxUsername(e.target.value)} placeholder="YourRobloxName" />
                </Field>
                <Field label="Discord" required>
                  <input style={inp} value={discord} onChange={e => setDiscord(e.target.value)} placeholder="username" />
                </Field>
              </div>
              <Field label="Roblox Profile Link" required>
                <input style={inp} value={roblox_profile_link} onChange={e => setProfileLink(e.target.value)} placeholder="https://www.roblox.com/users/..." />
              </Field>
              <Field label="What is your timezone?" required>
                <input style={inp} value={timezone} onChange={e => setTimezone(e.target.value)} placeholder="e.g. EST, PST, GMT+1" />
              </Field>
              <Field label="Do you have / use a mic?" required>
                <RadioGroup name="has_mic" options={['Yes', 'No', "I have a mic but I don't use it"]} value={has_mic} onChange={setHasMic} />
              </Field>
            </Card>

            <Card>
              <SectionTitle>Position Selection</SectionTitle>
              <Field label="Which position are you applying for?" required>
                <RadioGroup name="position" options={POSITIONS} value={position} onChange={setPosition} />
              </Field>
            </Card>
          </>
        )}

        {page === 2 && (
          <Card>
            <SectionTitle>Application Questions</SectionTitle>
            <Field label="Broadcast, media, or on-air experience (if any)?" required>
              <textarea style={{ ...inp, minHeight: 90, resize: 'vertical' }} value={broadcast_experience} onChange={e => setBroadcastExperience(e.target.value)} placeholder="List any related experience. If none, write N/A." />
            </Field>
            <Field label="List one of your strengths and one of your weaknesses." required>
              <textarea style={{ ...inp, minHeight: 90, resize: 'vertical' }} value={strength_weakness} onChange={e => setStrengthWeakness(e.target.value)} placeholder={'Strength: ...\nWeakness: ...'} />
            </Field>
            <Field label="Why should you be hired over other applicants?" required>
              <textarea style={{ ...inp, minHeight: 110, resize: 'vertical' }} value={why_hire} onChange={e => setWhyHire(e.target.value)} placeholder="Make your case..." />
            </Field>
            <AckRow label="Do you agree to not contact C-SPAN officials regarding the status of your application?" value={ack_no_contact} onChange={setAckNoContact} />
            <AckRow label="Do you acknowledge that your application can be denied at any time?" value={ack_denied_anytime} onChange={setAckDeniedAnytime} />
            <AckRow label="Do you acknowledge that C-SPAN is not obligated to provide a reason for denying your application?" value={ack_no_reason} onChange={setAckNoReason} />
          </Card>
        )}

        {error && (
          <div style={{ background: C.redLight, border: `1px solid ${C.redBorder}`, borderRadius: 6, padding: '12px 16px', marginBottom: 20, fontSize: 14, color: C.red }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {page === 1 ? (
            <button onClick={goToPage2} style={{ padding: '12px 32px', borderRadius: 6, background: C.navy, color: C.white, fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
              Next: Application Questions →
            </button>
          ) : (
            <>
              <button onClick={() => { setPage(1); setError(''); window.scrollTo(0, 0) }} style={{ padding: '12px 20px', borderRadius: 6, background: C.white, color: C.textMuted, fontSize: 14, border: `1px solid ${C.border}`, cursor: 'pointer' }}>
                ← Back
              </button>
              <button onClick={submit} disabled={submitting} style={{ padding: '12px 32px', borderRadius: 6, background: submitting ? C.gray : C.navy, color: C.white, fontSize: 14, fontWeight: 700, border: 'none', cursor: submitting ? 'not-allowed' : 'pointer' }}>
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </>
          )}
          <Link to="/" style={{ fontSize: 13, color: C.textMuted, textDecoration: 'none' }}>Cancel</Link>
        </div>
      </main>
    </div>
  )
}
