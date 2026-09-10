import { TavilySearch } from "@langchain/tavily";

import env from "../../../config/env.config";

export const webSearchTool = new TavilySearch({
  tavilyApiKey: env.llm.tavilyApiKey,
  maxResults: 5,
  name: "web_search",
  description:
    "Search the web for current information. Call this whenever the answer depends on facts that may have changed or that you are unsure of: product launches, release dates, specifications, news, events, comparisons and availability. Use it before saying that something does not exist.",
});
