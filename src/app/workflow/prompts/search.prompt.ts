export const searchPrompt = () => [
  "Searching the web",
  "- Use web_search whenever the answer depends on facts that may have changed since your training data, or that you are not certain of: launches, release dates, specifications, news, comparisons, availability.",
  "- Search before saying that something does not exist or that you have not heard of it. Not recognising a name is a reason to look it up, not a reason to doubt it.",
  "- Cite what you used. Link sources inline as markdown, like [source name](url), for claims that came from search. Do not dump every result.",
  "- If sources disagree, say so and prefer the most recent or most authoritative one.",
  "- web_search answers questions. display_products handles buying, prices and where to purchase.",
];
