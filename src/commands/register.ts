import { REST, Routes, SlashCommandBuilder, ChannelType } from 'discord.js';
import { env } from '../config/env';
import { logger } from '../utils/logger';

/**
 * Register slash commands with Discord
 */
async function registerCommands() {
  const commands = [
    new SlashCommandBuilder()
      .setName('setup')
      .setDescription('セットアップコマンド')
      .addSubcommand((subcommand) =>
        subcommand
          .setName('invite')
          .setDescription('募集作成ボタンを設置')
          .addChannelOption((option) =>
            option
              .setName('channel')
              .setDescription('ボタンを設置するチャンネル')
              .addChannelTypes(ChannelType.GuildText)
              .setRequired(true)
          )
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName('ticket')
          .setDescription('チケット作成ボタンを設置')
          .addChannelOption((option) =>
            option
              .setName('channel')
              .setDescription('ボタンを設置するチャンネル')
              .addChannelTypes(ChannelType.GuildText)
              .setRequired(true)
          )
      )
      .setDefaultMemberPermissions(0) // Administrator only
      .setDMPermission(false),
  ].map((command) => command.toJSON());

  const rest = new REST({ version: '10' }).setToken(env.DISCORD_BOT_TOKEN);

  try {
    logger.info('Started refreshing application (/) commands.');

    await rest.put(Routes.applicationGuildCommands(env.DISCORD_CLIENT_ID, env.DISCORD_GUILD_ID), {
      body: commands,
    });

    logger.info('Successfully reloaded application (/) commands.');
  } catch (error) {
    logger.error('Failed to register commands', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  registerCommands()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { registerCommands };
