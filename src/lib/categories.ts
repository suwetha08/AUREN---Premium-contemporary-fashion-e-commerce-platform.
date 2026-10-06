export const PRODUCT_CATEGORIES = [
  { id: "all", label: "ALL", value: "ALL" },
  { id: "dresses", label: "DRESSES", value: "DRESSES" },
  { id: "tops", label: "TOPS", value: "TOPS" },
  { id: "shirts", label: "SHIRTS", value: "SHIRTS" },
  { id: "bottoms", label: "BOTTOMS", value: "BOTTOMS" },
  { id: "outerwear", label: "OUTERWEAR", value: "OUTERWEAR" },
  { id: "co-ords", label: "CO-ORDS", value: "CO-ORDS" },
  { id: "ethnic", label: "ETHNIC", value: "ETHNIC" }
];

export function filterByCategory<T extends { category: string }>(
  products: T[],
  selectedCategory: string
): T[] {
  if (!selectedCategory || selectedCategory === "ALL") {
    return products;
  }
  return products.filter(
    (product) => product.category.toUpperCase() === selectedCategory.toUpperCase()
  );
}
