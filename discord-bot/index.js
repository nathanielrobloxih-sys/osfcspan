
const {
  Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes, EmbedBuilder,
  ActionRowBuilder, ButtonBuilder, ButtonStyle,
} = require('discord.js')
const { createClient } = require('@supabase/supabase-js')
const crypto = require('crypto')

const DISCORD_TOKEN = process.env.DISCORD_TOKEN
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID
const MOD_CHANNEL_ID = process.env.MOD_CHANNEL_ID
const MOD_ROLE_ID = process.env.MOD_ROLE_ID
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

console.log('DEBUG - SUPABASE_URL value is:', JSON.stringify(SUPABASE_URL))
console.log('DEBUG - SUPABASE_URL length:', SUPABASE_URL ? SUPABASE_URL.length : 'undefined')
console.log('DEBUG - SUPABASE_SERVICE_ROLE_KEY is set:', !!SUPABASE_SERVICE_ROLE_KEY)
console.log('DEBUG - MOD_CHANNEL_ID value is:', JSON.stringify(MOD_CHANNEL_ID))

const CATEGORY_COLOR = { breaking: 0xc53030, foreign: 0x276749, newsletter: 0x123a7a }
const CATEGORY_LABEL = { breaking: 'Breaking News', foreign: 'Washington This Week', newsletter: 'Newsletter' }

// In-memory holding area for drafts between /post and the Accept/Decline click.
// Keyed by a short random id since Discord button custom IDs have a length limit.
const drafts = new Map()
const DRAFT_TTL_MS = 10 * 60 * 1000 // 10 minutes

const commands = [
  new SlashCommandBuilder()
    .setName('post')
    .setDescription('Preview a news post before sending it for moderator approval')
    .addStringOption(opt => opt.setName('category').setDescription('Category').setRequired(true)
      .addChoices(
        { name: 'Breaking News', value: 'breaking' },
        { name: 'Newsletter', value: 'newsletter' },
        { name: 'Washington This Week', value: 'foreign' },
      ))
    .addStringOption(opt => opt.setName('title').setDescription('Headline').setRequired(true))
    .addStringOption(opt => opt.setName('body').setDescription('Story text').setRequired(true))
    .addStringOption(opt => opt.setName('image_url').setDescription('Optional image URL').setRequired(false)),
].map(c => c.toJSON())

async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN)
  await rest.put(Routes.applicationGuildCommands(DISCORD_CLIENT_ID, DISCORD_GUILD_ID), { body: commands })
  console.log('Slash commands registered.')
}

function buildEmbed({ category, title, body, image_url, authorTag, statusLine }) {
  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(body)
    .setColor(CATEGORY_COLOR[category] || 0x123a7a)
    .setAuthor({ name: 'C-SPAN', iconURL: 'https://osfcspan.netlify.app/cspan-emblem.png' })
    .setFooter({ text: statusLine || `Submitted by ${authorTag} - ${CATEGORY_LABEL[category] || category}` })
    .setTimestamp()
  if (image_url) embed.setImage(image_url)
  return embed
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] })

client.on('interactionCreate', async interaction => {
  // Slash command: /post -> show a private preview first
  if (interaction.isChatInputCommand() && interaction.commandName === 'post') {
    const category = interaction.options.getString('category')
    const title = interaction.options.getString('title')
    const body = interaction.options.getString('body')
    const image_url = interaction.options.getString('image_url') || null

    const draftId = crypto.randomBytes(6).toString('hex')
    drafts.set(draftId, { category, title, body, image_url, authorId: interaction.user.id, authorTag: interaction.user.tag })
    setTimeout(() => drafts.delete(draftId), DRAFT_TTL_MS)

    const previewEmbed = buildEmbed({
      category, title, body, image_url,
      authorTag: interaction.user.tag,
      statusLine: `Preview only - not yet submitted - ${CATEGORY_LABEL[category] || category}`,
    })
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`previewAccept_${draftId}`).setLabel('Accept Preview').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`previewDecline_${draftId}`).setLabel('Decline Preview').setStyle(ButtonStyle.Danger),
    )
    await interaction.reply({ embeds: [previewEmbed], components: [row], ephemeral: true })
    return
  }

  if (!interaction.isButton()) return
  const [action, id] = interaction.customId.split('_')

  // Author previewing their own draft
  if (action === 'previewAccept' || action === 'previewDecline') {
    const draft = drafts.get(id)
    if (!draft) {
      await interaction.update({ content: 'This preview expired. Run /post again.', embeds: [], components: [] })
      return
    }
    if (interaction.user.id !== draft.authorId) {
      await interaction.reply({ content: 'Only the person who ran /post can accept or decline this preview.', ephemeral: true })
      return
    }

    if (action === 'previewDecline') {
      drafts.delete(id)
      await interaction.update({ content: 'Submission cancelled.', embeds: [], components: [] })
      return
    }

    // Accepted: insert as pending and send to the mod channel
    drafts.delete(id)
    const { category, title, body, image_url, authorTag } = draft
    const { data, error } = await supabase.from('posts').insert({
      category, title, body, image_url, source: 'discord', status: 'pending',
    }).select('id').single()

    if (error) {
      await interaction.update({ content: `Failed to submit: ${error.message}`, embeds: [], components: [] })
      return
    }

    try {
      const modChannel = await client.channels.fetch(MOD_CHANNEL_ID)
      const modEmbed = buildEmbed({
        category, title, body, image_url, authorTag,
        statusLine: `Pending review - Submitted by ${authorTag}`,
      })
      const modRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`approve_${data.id}`).setLabel('Approve').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`deny_${data.id}`).setLabel('Deny').setStyle(ButtonStyle.Danger),
      )
      await modChannel.send({ content: `<@&${MOD_ROLE_ID}> new submission awaiting review`, embeds: [modEmbed], components: [modRow] })
      await interaction.update({ content: 'Submitted for moderator review.', embeds: [], components: [] })
    } catch (err) {
      console.error('Failed to post to mod channel:', err)
      await interaction.update({ content: `Saved, but failed to notify mod channel: ${err.message}`, embeds: [], components: [] })
    }
    return
  }

  // Moderator approving/denying a submitted post
  if (action === 'approve' || action === 'deny') {
    const member = interaction.member
    if (!member.roles.cache.has(MOD_ROLE_ID)) {
      await interaction.reply({ content: "You don't have permission to review submissions.", ephemeral: true })
      return
    }

    const newStatus = action === 'approve' ? 'approved' : 'denied'
    const { data: post, error } = await supabase.from('posts').update({ status: newStatus }).eq('id', id).select('*').single()

    if (error || !post) {
      await interaction.reply({ content: `Failed to update: ${error ? error.message : 'post not found'}`, ephemeral: true })
      return
    }

    const resultEmbed = buildEmbed({
      category: post.category, title: post.title, body: post.body, image_url: post.image_url,
      authorTag: interaction.user.tag,
      statusLine: (newStatus === 'approved' ? 'Approved' : 'Denied') + ' by ' + interaction.user.tag,
    })

    await interaction.update({ embeds: [resultEmbed], components: [] })
    return
  }
})

client.once('ready', () => console.log(`C-SPAN bot logged in as ${client.user.tag}`))

registerCommands().then(() => client.login(DISCORD_TOKEN))
