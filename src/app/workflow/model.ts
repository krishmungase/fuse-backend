import { ChatGroq } from "@langchain/groq";

// import env from "../../config/env.config";
// import { ChatOpenAI } from "@langchain/openai";

// const llm = new ChatOpenAI({
//   model: "gpt-5-mini",
//   temperature: 0,
//   apiKey: env.openai,
// });

export const llm = new ChatGroq({
  model: "openai/gpt-oss-120b",
  temperature: 0,
});
