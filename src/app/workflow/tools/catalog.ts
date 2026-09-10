import { StructuredToolInterface } from "@langchain/core/tools";

import { productTool } from "./products";
import { webSearchTool } from "./search";
import { weatherTool } from "./weather";

export const baseTools: StructuredToolInterface[] = [
  productTool,
  webSearchTool,
  weatherTool,
];

export { productTool, webSearchTool, weatherTool };
