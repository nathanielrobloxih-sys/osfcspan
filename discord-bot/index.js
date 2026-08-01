// OSFUSA C-SPAN Discord bot
// /post submits a story for moderator approval in a dedicated channel.
// A moderator (must have MOD_ROLE_ID) clicks Approve or Deny.
// Approving sets the post live on the website; Denying discards it.

const {
  Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes, EmbedBuilder,
  ActionRowBuilder, ButtonBuilder, ButtonStyle,
} = require('discord.js')
const { createClient } = require('@supabase/supabase-js')

const DISCORD_TOKEN = process.env.DISCORD_TOKEN
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID
const MOD_CHANNEL_ID = process.env.MOD_CHANNEL_ID
const MOD_ROLE_ID = process.env.MOD_ROLE_ID
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const CATEGORY_COLOR = { breaking: 0xc53030, foreign: 0x276749, newsletter: 0x123a7a }
const CATEGORY_LABEL = { breaking: 'Breaking News', foreign: 'Washington This Week', newsletter: 'Newsletter' }

const commands = [
  new SlashCommandBuilder()
    .setName('post')
    .setDescription('Submit a news post for moderator approval')
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
  // Slash command: /post
  if (interaction.isChatInputCommand() && interaction.commandName === 'post') {
    const category = interaction.options.getString('category')
    const title = interaction.options.getString('title')
    const body = interaction.options.getString('body')
    const image_url = interaction.options.getString('image_url') || null

    const { data, error } = await supabase.from('posts').insert({
      category, title, body, image_url, source: 'discord', status: 'pending',
    }).select('id').single()

    if (error) {
      await interaction.reply({ content: `Failed to submit: ${error.message}`, ephemeral: true })
      return
    }

    await interaction.reply({ content: 'Submitted for moderator review', ephemeral: true })

    const modChannel = await client.channels.fetch(MOD_CHANNEL_ID)
    const embed = buildEmbed({
      category, title, body, image_url,
      authorTag: interaction.user.tag,
      statusLine: `Pending review - Submitted by ${interaction.user.tag}`,
    })
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`approve_${data.id}`).setLabel('Approve').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`deny_${data.id}`).setLabel('Deny').setStyle(ButtonStyle.Danger),
    )
    await modChannel.send({ content: `<@&${MOD_ROLE_ID}> new submission awaiting review`, embeds: [embed], components: [row] })
    return
  }

  // Approve / Deny buttons
  if (interaction.isButton()) {
    const [action, postId] = interaction.customId.split('_')
    if (action !== 'approve' && action !== 'deny') return

    const member = interaction.member
    if (!member.roles.cache.has(MOD_ROLE_ID)) {
      await interaction.reply({ content: "You don't have permission to review submissions.", ephemeral: true })
      return
    }

    const newStatus = action === 'approve' ? 'approved' : 'denied'
    const { data: post, error } = await supabase.from('posts').update({ status: newStatus }).eq('id', postId).select('*').single()

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
