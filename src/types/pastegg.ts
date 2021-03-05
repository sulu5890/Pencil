export interface PasteggResponse {
  status: "success" | "error";
  result: PasteggResult;
}

export interface PasteggResult {
  id: string;
  name?: string;
  description?: string;
  visibility?: "public" | "unlisted" | "private";
  created_at: string;
  updated_at: string;
  expires?: string;
  files?: PasteggFile[];
  deletion_key?: string;
}

export interface PasteggFile {
  id: string;
  name: string;
  highlight_language?: string;
}
