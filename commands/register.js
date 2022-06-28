require('dotenv').config();
const {SlashCommandBuilder} = require('@discordjs/builders');
const {MessageActionRow, MessageButton} = require('discord.js');
const {v4} = require('uuid');
const db = require('../db/index.js');
const {registeredTeams, positions} = require('../config.json');

const confirmationButtons = new MessageActionRow()
    .addComponents(
        new MessageButton()
            .setCustomId('accept')
            .setLabel('Yes')
            .setStyle('SUCCESS'),
        new MessageButton()
            .setCustomId('decline')
            .setLabel('No')
            .setStyle('DANGER'),
    );

module.exports = {
    data: new SlashCommandBuilder()
        .setDefaultMemberPermissions(0)
        .setName('register')
        .setDescription('Register or unregister a team or player with Panther Bot!')
        .addSubcommandGroup(group =>
            group
                .setName('add')
                .setDescription('Add a player or team!')
                .addSubcommand(command =>
                    command
                        .setName('team')
                        .setDescription('Register a team!')
                        .addStringOption(option =>
                            option
                                .setName('teamname')
                                .setDescription('The name of the team to be registered!')
                                .setRequired(true),
                        )
                        .addStringOption(option =>
                            option
                                .setName('captain')
                                .setDescription('The team captain')
                                .setRequired(true),
                        ),
                )
                .addSubcommand(command =>
                    command
                        .setName('player')
                        .setDescription('Register a player to a team!')
                        .addStringOption(option =>
                            option
                                .setName('username')
                                .setDescription('The name of the player to be registered!')
                                .setRequired(true),
                        )
                        .addStringOption(option =>
                            option
                                .setName('teamname')
                                .setDescription('The team to register the player to!')
                                .setRequired(true)
                                .addChoices(...registeredTeams),
                        )
                        .addBooleanOption(option =>
                            option
                                .setName('starter')
                                .setDescription('Is this player a starter?')
                                .setRequired(true),
                        )
                        .addStringOption(option =>
                            option
                                .setName('position')
                                .setDescription('The position the player plays.')
                                .setRequired(true)
                                .addChoices(...positions)),
                ))
        .addSubcommandGroup(group =>
            group
                .setName('remove')
                .setDescription('Remove a player or team!')
                .addSubcommand(command =>
                    command
                        .setName('team')
                        .setDescription('Remove a team!')
                        .addStringOption(option =>
                            option
                                .setName('teamname')
                                .setDescription('The team to be removed.')
                                .setRequired(true)
                                .addChoices(...registeredTeams),
                        ),
                )
                .addSubcommand(command =>
                    command
                        .setName('player')
                        .setDescription('Remove a player!')
                        .addStringOption(option =>
                            option
                                .setName('username')
                                .setDescription('The player to be removed.')
                                .setRequired(true),
                        ),
                ),
        ),
    async execute(interaction) {
        const group = interaction.options.getSubcommandGroup();
        const subcommand = interaction.options.getSubcommand();
        const filter = i => {
            return i.user.id === interaction.user.id;
        };
        const confirmation = {
            components: [confirmationButtons],
            ephemeral: true,
            fetchReply: true,
        };
        switch (group) {
            // register 'add'
            case 'add': {
                switch (subcommand) {
                    // register team subcommand
                    case 'team': {
                        // extract options
                        const teamname = interaction.options.getString('teamname');
                        const captain = interaction.options.getString('captain');
                        confirmation.content = `Registering ${teamname} with captain ${captain}?`;
                        const message = await interaction.reply(confirmation);
                        // await button input with collector
                        const button = await message.awaitMessageComponent({filter, time: 15000});
                        if (button.customId === 'accept') {
                            // Checkout client for db transaction
                            const client = await db.getClient();
                            try {
                                // begin transaction
                                await client.query('BEGIN');
                                const teamid = v4(0, null, 0);
                                const insertTeam = {
                                    text: 'INSERT INTO teams VALUES ($1, $2)',
                                    values: [teamid, captain],
                                };
                                await client.query(insertTeam);
                                const insertTeamRelation = {
                                    text: 'INSERT INTO map_teamid_teamname VALUES (DEFAULT, $1, $2) RETURNING teamname',
                                    values: [teamid, teamname],
                                };
                                const res = await client.query(insertTeamRelation);
                                const resTeamName = res.rows[0].teamname
                                // commit transaction
                                await client.query('COMMIT');
                                await interaction.editReply({
                                    content: `Team ${resTeamName} registered!`,
                                    components: [],
                                    ephemeral: true,
                                });
                            } catch (err) {
                                // rollback transaction to maintain db state
                                client.query('ROLLBACK');
                                console.log(err.stack);
                            } finally {
                                // release client back to pool
                                client.release();
                            }
                        } else {
                            // button time out
                            await interaction.editReply({
                                content: 'Registration timed out.',
                                components: [],
                                ephemeral: true,
                            });
                        }
                        break;
                    }
                    // register player subcommand
                    case 'player': {
                        // extract options
                        const playername = interaction.options.getString('username');
                        const teamid = interaction.options.getString('teamname');
                        const starter = interaction.options.getBoolean('starter');
                        const position = interaction.options.getString('position');
                        const selectTeamName = {
                            text: 'SELECT teamname FROM map_teamid_teamname WHERE teamid=$1',
                            values: [teamid],
                        };
                        const res = await db.query(selectTeamName);
                        const teamname = await res.rows[0].teamname;
                        // confirm input
                        confirmation.content = `Registering ${playername} to team ${teamname}?`;
                        const message = await interaction.reply(confirmation);
                        // await button input with collector
                        const button = await message.awaitMessageComponent({filter, time: 15000});
                        if (button.customId === 'accept') {
                            const client = await db.getClient();
                            try {
                                // begin transaction
                                await client.query('BEGIN');
                                const userid = v4(0, null, 0);
                                const insertPlayer = {
                                    text: 'INSERT INTO users VALUES ($1, $2, $3, $4)',
                                    values: [userid, teamid, starter, position],
                                };
                                await client.query(insertPlayer);
                                // insert relationship into userlookup table
                                const insertUserRelation = {
                                    text: 'INSERT INTO map_userid_username VALUES (DEFAULT, $1, $2) RETURNING username',
                                    values: [userid, playername],
                                };
                                const res = await client.query(insertUserRelation);
                                const username = await res.rows[0].username;
                                // commit transaction
                                await client.query('COMMIT');
                                await interaction.editReply({
                                    content: `Player ${username} registered for team ${teamname}!`,
                                    components: [],
                                    ephemeral: true,
                                });
                            } catch (err) {
                                // rollback transaction
                                await client.query('ROLLBACK');
                                console.log(err.stack);
                            } finally {
                                // release client back to pool
                                client.release();
                            }
                        } else if (button.customId === 'declined') {
                            await interaction.editReply({
                                content: 'Registration canceled.',
                                components: [],
                                ephemeral: true,

                            });
                        } else {
                            await interaction.editReply({
                                content: 'Registration timed out.',
                                components: [],
                                ephemeral: true,
                            });
                        }
                        break;
                    }
                    default : {
                        await interaction.editReply({
                            content: 'Registration failed, contact ruuffian.',
                            components: [],
                            ephemeral: true,
                        });
                        break;
                    }
                }
                break;
            }
            case 'remove': {
                switch (subcommand) {
                    case 'team': {
                        const teamid = interaction.options.getString('teamname');
                        const selectTeamName = {
                            text: 'SELECT teamname FROM map_teamid_teamname WHERE teamid=$1',
                            values: [teamid],
                        }
                        const teamname = await db.query(selectTeamName).rows[0].teamname;
                        confirmation.content = `Remove ${teamname} from registry?`;
                        const message = await interaction.reply(confirmation);
                        const button = await message.awaitMessageComponent({filter, time: 15000});
                        if (button.customId === 'accept') {
                            const dropTeam = {
                                text: 'DELETE FROM teams WHERE teamid=$1',
                                values: [teamid],
                            }
                            await db.query(dropTeam);
                            await interaction.editReply({
                                content: `Team ${teamname} removed from registry.`,
                                componenets: [],
                                ephemeral: true,
                            })
                        } else if (button.customId === 'decline') {
                            await interaction.editReply({
                                content: `Team removal canceled.`,
                                componenets: [],
                                ephemeral: true,
                            })
                        } else {
                            await interaction.editReply({
                                content: `Team removal timed out.`,
                                componenets: [],
                                ephemeral: true,
                            })
                        }
                        break;
                    }
                    case 'player': {
                        const playername = interaction.options.getString('username');
                        confirmation.content = `Remove ${playername} from registry?`;
                        const message = await interaction.reply(confirmation);
                        const button = await message.awaitMessageComponent({filter, time: 15000});
                        if (button.customId === 'accept') {
                            const selectUserId = {
                                text: 'SELECT userid FROM map_userid_username WHERE username=$1',
                                values: [playername],
                            }
                            const userid = db.query(selectUserId);
                            const dropPlayer = {
                                text: 'DELETE FROM users WHERE userid=$1',
                                values: [userid],
                            }
                            await db.query(dropPlayer);
                            await interaction.editReply({
                                content: `Team ${playername} removed from registry.`,
                                componenets: [],
                                ephemeral: true,
                            })
                        } else if (button.customId === 'decline') {
                            await interaction.editReply({
                                content: `Player removal canceled.`,
                                componenets: [],
                                ephemeral: true,
                            })
                        } else {
                            await interaction.editReply({
                                content: `Player removal timed out.`,
                                componenets: [],
                                ephemeral: true,
                            })
                        }
                        break;
                    }
                    default: {
                        await interaction.editReply({
                            content: `Command failed, contact ruuffian.`,
                            componenets: [],
                            ephemeral: true,
                        })
                        break;
                    }
                }
                break;
            }
            default: {
                interaction.editReply({
                    content: 'Command failed, contact ruuffian.',
                    components: [],
                    ephemeral: true,
                });
                break;
            }
        }
    },
};