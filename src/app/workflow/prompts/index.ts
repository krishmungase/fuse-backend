import { identityPrompt } from "./identity.prompt";
import { toolsPrompt } from "./tools.prompt";
import { searchPrompt } from "./search.prompt";
import { productsPrompt } from "./products.prompt";
import { weatherPrompt } from "./weather.prompt";
import { connectionsPrompt } from "./connections.prompt";
import { answeringPrompt } from "./answering.prompt";

const SECTIONS = [
  identityPrompt,
  toolsPrompt,
  searchPrompt,
  productsPrompt,
  weatherPrompt,
  connectionsPrompt,
  answeringPrompt,
];

export const buildSystemPrompt = (): string =>
  SECTIONS.map((section) => section().join("\n")).join("\n\n");
