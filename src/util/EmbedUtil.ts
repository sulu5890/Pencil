import { PagedEmbeds } from "@sulu5890/paged-embeds";

export function paginatedEmbed() {
  return new PagedEmbeds()
    .addHandler("⬅️", (i, e) => ({ index: (i - 1 + e.length) % e.length }))
    .addHandler("➡️", (i, e) => ({ index: (i + 1 + e.length) % e.length }));
}
