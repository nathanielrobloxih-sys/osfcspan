// Creates a real Supabase Auth user for a new staff login.
// Only callable by someone whose own session proves they're an Owner.
// Requires Netlify env vars: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

const { createClient } = require('@supabase/supabase-js')

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' }

  let body
  try { body = JSON.parse(event.body) } catch { return { statusCode: 400, body: 'Invalid JSON' } }
  const { email, password, role, callerToken } = body
  if (!email || !password || !role || !callerToken) {
    return { statusCode: 400, body: 'Missing email, password, role, or callerToken' }
  }

  const anonClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
  const { data: callerAuth, error: callerErr } = await anonClient.auth.getUser(callerToken)
  if (callerErr || !callerAuth?.user) return { statusCode: 401, body: 'Invalid or expired session' }

  const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

  const { data: callerProfile } = await admin.from('staff_profiles').select('role').eq('id', callerAuth.user.id).single()
  if (!callerProfile || callerProfile.role !== 'Owner') {
    return { statusCode: 403, body: 'Only an Owner can create staff logins' }
  }

  const { data: newUser, error: createErr } = await admin.auth.admin.createUser({
    email, password, email_confirm: true,
  })
  if (createErr) return { statusCode: 400, body: createErr.message }

  const { error: profileErr } = await admin.from('staff_profiles').insert({ id: newUser.user.id, email, role })
  if (profileErr) return { statusCode: 400, body: profileErr.message }

  return { statusCode: 200, body: JSON.stringify({ ok: true }) }
}
