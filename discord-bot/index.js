// OSFUSA C-SPAN Discord bot
// Handles: Discord -> Website sync (slash command posts news into Supabase)
// The other direction (Website -> Discord) is handled by discord-relay.js,
// deployed as a Netlify Function and triggered by a Supabase Database Webhook.

const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes, EmbedBuilder } = require('discord.js')
const { createClient } = require('@supabase/supabase-js')

const DISCORD_TOKEN = process.env.DISCORD_TOKEN
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID // your C-SPAN server ID
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY // service role, NOT the anon key — keep secret

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const commands = [
  new SlashCommandBuilder()
    .setName('post')
    .setDescription('Publish a news post to the C-SPAN website')
    .addStringOption(opt => opt.setName('category').setDescription('Category').setRequired(true)
      .addChoices(
        { name: 'Breaking News', value: 'breaking' },
        { name: 'Newsletter', value: 'newsletter' },
        { name: 'Foreign / International', value: 'foreign' },
      ))
    .addStringOption(opt => opt.setName('title').setDescription('Headline').setRequired(true))
    .addStringOption(opt => opt.setName('body').setDescription('Story text').setRequired(true))
    .addStringOption(opt => opt.setName('image_url').setDescription('Optional image URL').setRequired(false)),
].map(c => c.toJSON())

async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN)
  await rest.put(
    Routes.applicationGuildCommands(DISCORD_CLIENT_ID, DISCORD_GUILD_ID),
    { body: commands },
  )
  console.log('Slash commands registered.')
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] })

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return
  if (interaction.commandName !== 'post') return

  const category = interaction.options.getString('category')
  const title = interaction.options.getString('title')
  const body = interaction.options.getString('body')
  const image_url = interaction.options.getString('image_url') || null

  const { error } = await supabase.from('posts').insert({
    category, title, body, image_url, source: 'discord',
  })

  if (error) {
    await interaction.reply({ content: `Failed to post: ${error.message}`, ephemeral: true })
    return
  }

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(body)
    .setColor(category === 'breaking' ? 0xc53030 : category === 'foreign' ? 0x276749 : 0x123a7a)
    .setFooter({ text: `Posted to osfcspan.netlify.app · ${category}` })
  if (image_url) embed.setImage(image_url)

  await interaction.reply({ content: 'Posted to the website ✅', embeds: [embed] })
})

client.once('ready', () => console.log(`C-SPAN bot logged in as ${client.user.tag}`))

registerCommands().then(() => client.login(DISCORD_TOKEN))
