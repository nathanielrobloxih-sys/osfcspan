// Deletes a staff login's Supabase Auth account. Only callable by an Owner.
// Requires Netlify env vars: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

const { createClient } = require('@supabase/supabase-js')

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' }

  let body
  try { body = JSON.parse(event.body) } catch { return { statusCode: 400, body: 'Invalid JSON' } }
  const { userId, callerToken } = body
  if (!userId || !callerToken) return { statusCode: 400, body: 'Missing userId or callerToken' }

  const anonClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
  const { data: callerAuth, error: callerErr } = await anonClient.auth.getUser(callerToken)
  if (callerErr || !callerAuth?.user) return { statusCode: 401, body: 'Invalid or expired session' }

  const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

  const { data: callerProfile } = await admin.from('staff_profiles').select('role').eq('id', callerAuth.user.id).single()
  if (!callerProfile || callerProfile.role !== 'Owner') {
    return { statusCode: 403, body: 'Only an Owner can remove staff logins' }
  }

  await admin.from('staff_profiles').delete().eq('id', userId)
  const { error: deleteErr } = await admin.auth.admin.deleteUser(userId)
  if (deleteErr) return { statusCode: 400, body: deleteErr.message }

  return { statusCode: 200, body: JSON.stringify({ ok: true }) }
}
