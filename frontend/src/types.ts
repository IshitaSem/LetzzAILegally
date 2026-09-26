import { ChatResponse } from "./api";

export type Page = "home" | "chat" | "documents" | "doc-analysis" | "history" | "saved" | "settings";

export type ChatStage = "idle" | "typing" | "done" | "error";

export interface ChatMessageItem {
  id: string;
  sender: "user" | "ai";
  text: string;
  data?: ChatResponse;
  error?: string;
}

export type ATab = "summary" | "clauses" | "dates" | "concerns" | "checklist";
