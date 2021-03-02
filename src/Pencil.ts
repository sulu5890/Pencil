import * as dotenv from "dotenv";
import * as Sentry from "@sentry/node";
import { GatewayServer, SlashCreator } from "slash-create";

import { Client, Intents, WSEventType } from "discord.js";
import path from "path";
import * as fs from "fs";
dotenv.config();

const client = new Client({
  shards: "auto",
  shardCount: 1,
  messageCacheMaxSize: -1,
  messageCacheLifetime: 120,
  messageSweepInterval: 360,
  ws: {
    intents: Intents.ALL,
  },
});

Sentry.init({
  dsn: process.env.sentry_dsn,
  tracesSampleRate: 1.0,
});

const creator = new SlashCreator({
  applicationID: process.env.DISCORD_APPLICATION_ID ?? "",
  publicKey: process.env.DISCORD_PUBLIC_KEY ?? "",
  token: process.env.DISCORD_TOKEN ?? "",
});

creator
  .withServer(
    new GatewayServer((handler) =>
      client.ws.on(<WSEventType>"INTERACTION_CREATE", handler)
    )
  )
  .registerCommandsIn(path.join(__dirname, "slashCommands"))
  .syncCommands();

fs.readdirSync(path.join(__dirname, "listeners"))
  .map((mod) => {
    console.log("Loading listener: " + mod);
    return path.join(__dirname, "listeners", mod);
  })
  .map((mod) => require(mod))
  .forEach((mod) => mod(client));

client.login(process.env.DISCORD_TOKEN).then(() => {
  console.log("client ready");
});
