const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const DiscordBot = require('../../client/DiscordBot');
const ApplicationCommand = require('../../structure/ApplicationCommand');

module.exports = new ApplicationCommand({
    command: {
        name: 'kick',
        description: 'Kick a member from the server',
        type: 1,
        options: [
            {
                name: 'user',
                description: 'The user to kick',
                type: ApplicationCommandOptionType.User,
                required: true
            },
            {
                name: 'reason',
                description: 'Reason for kick',
                type: ApplicationCommandOptionType.String,
                required: false
            }
        ]
    },
    options: {
        // add repo-specific options here if necessary
    },

    /**
     * @param {DiscordBot} client
     * @param {import('discord.js').ChatInputCommandInteraction} interaction
     */
    run: async (client, interaction) => {
        await interaction.deferReply({ ephemeral: true });

        const target = interaction.options.getMember('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        if (!target) return interaction.editReply({ content: 'Could not find that member.' });
        if (target.id === interaction.user.id) return interaction.editReply({ content: "You can't kick yourself." });
        if (target.id === interaction.client.user.id) return interaction.editReply({ content: "I can't kick myself." });

        if (target.id === interaction.guild.ownerId) return interaction.editReply({ content: 'You cannot kick the server owner.' });

        if (interaction.member.roles.highest.position <= target.roles.highest.position && interaction.guild.ownerId !== interaction.user.id) {
            return interaction.editReply({ content: 'You cannot kick a member with an equal or higher role.' });
        }

        if (!target.kickable) return interaction.editReply({ content: 'I cannot kick that user — they may have a higher role than me or be the server owner.' });

        try {
            await target.kick(`${interaction.user.tag}: ${reason}`);

            const embed = new EmbedBuilder()
                .setTitle('Member Kicked')
                .setColor('Red')
                .addFields(
                    { name: 'User', value: `${target.user.tag} (${target.id})`, inline: true },
                    { name: 'By', value: `${interaction.user.tag}`, inline: true },
                    { name: 'Reason', value: reason, inline: false }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Failed to kick member:', error);
            await interaction.editReply({ content: 'Failed to kick the member. Ensure my role is high enough and I have Kick Members permission.' });
        }
    }
}).toJSON();
