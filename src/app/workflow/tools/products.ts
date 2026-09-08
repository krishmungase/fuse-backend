import * as z from "zod";
import { tool } from "langchain";
import { getJson } from "serpapi";

import env from "../../../config/env.config";

const MAX_RESULTS = 5;

type ShoppingResult = {
  id?: string;
  title?: string;
  price?: string;
  extracted_price?: number;
  description?: string;
  source?: string;
  rating?: number;
  reviews?: number;
  thumbnail?: string;
  product_link?: string;
};

export const productTool = tool(
  async ({ query, location = "India" }) => {
    if (!env.llm.serpApiKey) {
      return { found: false, error: "Product search is not configured." };
    }

    try {
      const json = await getJson({
        engine: "google_shopping",
        q: query,
        gl: "in",
        hl: "en",
        location: location,
        api_key: env.llm.serpApiKey,
      });

      const results = (json.shopping_results ?? []) as ShoppingResult[];

      const products = results.slice(0, MAX_RESULTS).map((result) => ({
        id: result.id,
        title: result.title,
        description: result.description,
        price: result.price,
        source: result.source,
        product_link: result.product_link + "&utm_source=fuseai.in",
        thumbnail: result.thumbnail,
        rating: result.rating,
      }));

      return { found: products.length > 0, query, products };
    } catch {
      return {
        found: false,
        error: "Product search is unavailable right now.",
      };
    }
  },
  {
    name: "display_products",
    description:
      "Search real e-commerce listings for a product and return current prices, sellers and ratings. Call this whenever the user asks about a product, its price or where to buy it.",
    schema: z.object({
      query: z
        .string()
        .describe(
          "The product name or description to search for, e.g. iPhone 16, MacBook Pro, Samsung Galaxy S23.",
        ),
      location: z
        .string()
        .optional()
        .describe(
          "The location to search for products in, e.g. 'New York, NY'.",
        ),
    }),
  },
);
