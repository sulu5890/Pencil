import { Client, MessageEmbed } from "discord.js";
import { logger } from "../util/logger";
import { lookup } from "mime-types";
import got from "got";
import gunzip from "gunzip-maybe";
import getStream from "get-stream";
import * as Sentry from "@sentry/node";
import { Colors } from "../constants/colors";

const allowedMimeTypes: Array<string> = [
  "application/json",
  "application/gzip",
  "application/x-sh",
];

const mimeIncludes: Array<string> = ["text"];

const allowedFileTypes: Array<string> = ["properties", "bat"];

module.exports = (client: Client) => {
  client.on("message", async (msg) => {
    // ignore dms, bot users, and messages without attachments
    if (!msg.attachments || msg.author.bot || !msg.guild) return;

    for (const atc of msg.attachments.values()) {
      logger.getLogger().debug(`Started processing of ${msg.url}`);

      const mimeType = lookup(atc.url);
      const fileType = atc.url.slice(
        (Math.max(0, atc.url.lastIndexOf(".")) || Infinity) + 1
      );

      if (!mimeIncludes.some((type) => mimeType.toString().includes(type))) {
        if (!allowedMimeTypes.some((type) => mimeType === type)) {
          if (!allowedFileTypes.some((type) => fileType === type)) continue;
        }
      }

      try {
        logger.getLogger().debug(`File passed checks, uploading ${msg.url}`);
        getStream(await got.stream(atc.url).pipe(gunzip(1)))
          .then((data) => {
            if (Buffer.byteLength(data) > 1331200) {
              if (Buffer.byteLength(data) < 94371840) {
                got
                  .post("https://p.sulu.me/post", {
                    body: data,
                  })
                  .then((response) => {
                    msg.channel
                      .send(
                        `https://p.sulu.me/${
                          JSON.parse(response.body).key
                        }. Your message was too large for paste.gg so it has been uploaded to an alternate pastebin.`
                      )
                      .then((msg) => msg.delete());

                    const embed = new MessageEmbed()
                      .setAuthor(atc.name ?? "Pastebin")
                      .setColor(Colors.INFO)
                      .setDescription(
                        `https://p.sulu.me/${
                          JSON.parse(response.body).key
                        }\nYour message was too large for paste.gg so it has been uploaded to an alternate pastebin.`
                      )
                      .setFooter(
                        `Requested by ${
                          msg.member?.nickname ??
                          msg.author.username + "#" + msg.author.discriminator
                        }`,
                        msg.author.displayAvatarURL({ dynamic: true })
                      )
                      .setTimestamp();

                    return msg.channel.send(embed);
                  });
              } else {
                msg.channel
                  .send(
                    "In the future, please use [a pastebin](https://paste.gg). Unfortunately, your file was too big for me to upload automatically."
                  )
                  .then((msg) => msg.delete());

                const embed = new MessageEmbed()
                  .setAuthor("Please use a pastebin")
                  .setColor(Colors.BAD_INFO)
                  .setDescription(
                    `In the future, please use [a pastebin](https://paste.gg). Unfortunately, your file was too big for me to upload automatically.`
                  )
                  .setFooter(
                    `Requested by ${
                      msg.member?.nickname ??
                      msg.author.username + "#" + msg.author.discriminator
                    }`,
                    msg.author.displayAvatarURL({ dynamic: true })
                  )
                  .setTimestamp();
                return msg.channel.send(embed);
              }
            } else {
              got
                .post("https://api.paste.gg/v1/pastes", {
                  json: {
                    name: `${atc.name ?? "Uploaded file"} by ${msg.author.tag}`,
                    description: `Automatically generated paste from uploaded content sent by ${
                      msg.author.tag
                    } (${msg.author.id}) in ${
                      msg.guild?.name ?? "a direct message"
                    }.`,
                    files: [
                      {
                        name: atc.name ?? "message.txt",
                        content: {
                          format: "text",
                          value: data,
                        },
                      },
                    ],
                  },
                  responseType: "json",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Key ${process.env.PASTE_GG_API_KEY}`,
                    "User-Agent": "Pencil <sulu@sulu.me>",
                    Accept: "application/json",
                  },
                })
                .then((response) => {
                  msg.channel
                    .send(
                      // @ts-ignore
                      `https://paste.gg/PasteBot/${response.body.result.id}`
                    )
                    .then((msg) => msg.delete());

                  const embed = new MessageEmbed()
                    .setAuthor(atc.name ?? "Pastebin")
                    .setColor(Colors.INFO)
                    .setDescription(
                      // @ts-ignore
                      `https://paste.gg/PasteBot/${response.body.result.id}`
                    )
                    .setFooter(
                      `Requested by ${
                        msg.member?.nickname ??
                        msg.author.username + "#" + msg.author.discriminator
                      }`,
                      msg.author.displayAvatarURL({ dynamic: true })
                    )
                    .setTimestamp();

                  return msg.channel.send(embed);
                });
            }
          })
          .catch((e) => Sentry.captureException(e));
      } catch (e) {
        Sentry.captureException(e);
      }
    }
  });
};
