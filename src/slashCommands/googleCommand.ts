import { CommandContext, CommandOptionType, SlashCreator } from "slash-create";
import { ExtendedSlashCommand } from "../util/ExtendedSlashCommand";
import googleIt from "google-it";
import { Client } from "discord.js";

export default class GoogleCommand extends ExtendedSlashCommand {
  client: Client;
  constructor(client: Client, creator: SlashCreator) {
    super(creator, {
      name: "google",
      description: "Searches the web",
      options: [
        {
          type: CommandOptionType.STRING,
          name: "term",
          description: "Your search term",
          required: true,
        },
      ],
      throttling: {
        duration: 20,
        usages: 2,
      },
    });

    this.client = client;
  }

  async run(ctx: CommandContext) {
    await ctx.acknowledge(true);

    const results = await googleIt({
      query: ctx.options.term,
      "no-display": true,
      limit: 1,
    });

    console.log(results);
    await ctx.send(results[0].link);
    return;
  }
}
