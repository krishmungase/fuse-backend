import * as z from "zod";
import { tool } from "langchain";

export const productTool = tool(
  () => {
    return "NO PRODUCT FOUND";
  },
  {
    name: "diplay_products",
    description:
      "Search for real e-commerce products and display a carasual of prices and details. alwasy call this tool when the user asks for a product or a price",
    schema: z.object({
      query: z
        .string()
        .describe(
          "The product name or description to search for eg., IPhone 16, Macbook Pro, Samsung Galaxy S23, etc.",
        ),
    }),
  },
);
