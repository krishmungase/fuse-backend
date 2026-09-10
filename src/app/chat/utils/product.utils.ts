import { ProductGroup } from "../schema/chat.schema";

export const PRODUCT_TOOL_NAME = "display_products";

type RawProduct = {
  id?: string;
  title?: string;
  description?: string;
  price?: string;
  source?: string;
  product_link?: string;
  thumbnail?: string;
  rating?: number;
};

type RawToolResult = {
  found?: boolean;
  query?: string;
  products?: RawProduct[];
};

const parseToolContent = (content: unknown): RawToolResult | undefined => {
  if (typeof content === "object" && content !== null) {
    return content as RawToolResult;
  }

  if (typeof content !== "string") {
    return undefined;
  }

  try {
    return JSON.parse(content) as RawToolResult;
  } catch {
    return undefined;
  }
};

export const toProductGroup = (content: unknown): ProductGroup | undefined => {
  const parsed = parseToolContent(content);

  if (!parsed?.found || !parsed.products?.length) {
    return undefined;
  }

  const products = parsed.products
    .filter((product) => product?.title)
    .map((product) => ({
      id: product.id,
      title: product.title,
      description: product.description,
      price: product.price,
      source: product.source,
      productLink: product.product_link,
      thumbnail: product.thumbnail,
      rating: product.rating,
    }));

  if (!products.length) {
    return undefined;
  }

  return { query: parsed.query ?? "", products };
};
