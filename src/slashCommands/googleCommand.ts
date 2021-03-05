import {
  CommandContext,
  CommandOptionType,
  SlashCommand,
  SlashCreator,
} from "slash-create";
import { Client, MessageEmbed, TextChannel } from "discord.js";
import { paginatedEmbed } from "../util/EmbedUtil";
import { Colors } from "../constants/colors";
import got from "got";

export type GoogleResults = [
  {
    title: string;
    url: string;
    desc: string;
  }
];

export default class GoogleCommand extends SlashCommand {
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

    const response = await got.get<GoogleResults>(
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
        .setDescription(`${r[i].url}\n\n${r[i].desc}`)
        .setURL(r[i].url)
        .setColor(Colors.INFO)
          .setFooter(
              `Requested by ${
                  ctx.member?.nick ??
                  ctx.user.username + "#" + ctx.user.discriminator
              } - result ${i+1} of ${r.length}`,
              ctx.user.avatarURL
          )
        .setThumbnail(
          `https://favicon.sulu.me/icon.png?url=${r[i].url
            .split("/")
            .splice(0, 3)
            .join("/")}`
        );
    }

    if (pages.length < 1) {
      channel
        .send(
          "An error occurred while processing your search, or no results were returned."
        )
        .then((m) => m.delete());
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
        channel.send(`<${pages[0].description}>`).then((m) => m.delete());
      await channel.send(pages[0]);
      return;
    } else {
      if (pages[0].description)
        channel.send(`<${pages[0].description}>`).then((m) => m.delete());
      await paginatedEmbed()
        .setChannel(channel)
        .setEmbeds(pages)
        .run({ dispose: true, idle: 7500 });
      return;
    }
  }
}
