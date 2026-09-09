import { TavilySearch } from "@langchain/tavily";

export const webSearch = new TavilySearch({
  maxResults: 5,
  topic: "general",
});
