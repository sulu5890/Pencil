import { CommandContext, CommandOptionType, SlashCreator } from "slash-create";
import { ExtendedSlashCommand } from "../util/ExtendedSlashCommand";
import { Client, MessageEmbed, TextChannel } from "discord.js";
import { paginatedEmbed } from "../util/EmbedUtil";
import { Colors } from "../constants/colors";
import got from "got";

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

    const channel = (await global.CLIENT.channels.fetch(
      ctx.channelID
    )) as TextChannel;

    let pages: Array<MessageEmbed> = [];

    const response: any = await got.get(
      `https://google.sulu.me/results.json?term=${ctx.options.term}`,
      {
        headers: {
          Authorization: process.env.GOOGLE_API_KEY,
          Accept: "application/json",
        },
        responseType: "json",
      }
    );

    const r = response.body;

    for (let i = 0; i < r.length; i++) {
      pages[i] = new MessageEmbed()
        .setTitle(r[i].title)
        .setAuthor(`Search Result ${i + 1} of ${r.length}`)
        .setDescription(`${r[i].url}\n\n${r[i].desc}`)
        .setURL(r[i].url)
        .setColor(Colors.INFO)
        .setThumbnail(
          `https://favicon.sulu.me/icon.png?url=${r[i].url
            .split("/")
            .splice(0, 3)
            .join("/")}`
        );
    }

    if (pages.length < 1) {
      const embed = new MessageEmbed()
        .setTitle("Search Failed")
        .setDescription(
          "An error occurred while processing your search, or no results were returned."
        )
        .setColor(Colors.ERROR);
      await channel.send(embed);
      return;
    }

    if (pages.length === 1) {
      if (pages[0].description)
        channel.send(pages[0].description).then((m) => m.delete());
      await channel.send(pages[0]);
      return;
    } else {
      await paginatedEmbed()
        .setChannel(channel)
        .setEmbeds(pages)
        .run({ idle: 20000, dispose: true });
      return;
    }
    return;
  }
}
