// Website -> Discord relay
// Set up in Supabase: Database -> Webhooks -> New Webhook
//   Table: posts, Event: INSERT
//   Type: HTTP Request, Method: POST
//   URL: https://osfcspan.netlify.app/.netlify/functions/discord-relay
// Set DISCORD_WEBHOOK_URL as a Netlify environment variable
// (Discord server -> channel settings -> Integrations -> Webhooks -> New Webhook -> Copy URL)

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' }
  }

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL
  if (!webhookUrl) {
    return { statusCode: 500, body: 'DISCORD_WEBHOOK_URL not configured' }
  }

  let payload
  try {
    payload = JSON.parse(event.body)
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' }
  }

  const row = payload.record || payload.new || payload
  if (!row || !row.title) {
    return { statusCode: 200, body: 'Nothing to relay' }
  }

  // Avoid an echo loop: don't re-post things that came FROM Discord
  if (row.source === 'discord') {
    return { statusCode: 200, body: 'Skipped (originated from Discord)' }
  }

  const colorByCategory = { breaking: 0xc53030, foreign: 0x276749, newsletter: 0x123a7a }

  const discordPayload = {
    embeds: [{
      title: row.title,
      description: row.body,
      color: colorByCategory[row.category] || 0x123a7a,
      image: row.image_url ? { url: row.image_url } : undefined,
      footer: { text: `OSFUSA C-SPAN · ${row.category}` },
      timestamp: row.created_at || new Date().toISOString(),
    }],
  }

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(discordPayload),
  })

  if (!res.ok) {
    return { statusCode: 502, body: `Discord webhook failed: ${res.status}` }
  }

  return { statusCode: 200, body: 'Relayed to Discord' }
}
