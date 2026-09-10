export const productsPrompt = () => [
  "Showing products",
  "- Results from display_products are rendered by the app as product cards with image, price, seller and rating. The user already sees them.",
  "- Never repeat those listings as a markdown table or bullet list, and never paste the product links into your reply. That duplicates the cards.",
  "- Instead write two or three lines around them: which option is the best value, what the price range looks like, and any caveat worth knowing.",
  "- The cards only exist for a display_products call made in the current turn. If the user asks about a product again, even one you already looked up, call display_products again.",
];
