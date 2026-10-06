import { notFound } from "next/navigation";
import { products } from "../../../lib/data";
import ProductDetailClient from "./ProductDetailClient";

// Disable static params to ensure dynamic lookup works cleanly
export const dynamic = 'force-dynamic';

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const product = products.find(p => p.slug === resolvedParams.slug);
  
  if (!product) {
    notFound();
  }

  // Find 4 related products: Same category, but not the exact same product.
  // We prioritize same subcategory if possible.
  let related = products.filter(p => p.category === product.category && p.id !== product.id);
  
  // Sort by subcategory match to put them first
  related.sort((a, b) => {
    if (a.subcategory === product.subcategory && b.subcategory !== product.subcategory) return -1;
    if (a.subcategory !== product.subcategory && b.subcategory === product.subcategory) return 1;
    return 0;
  });

  const relatedProducts = related.slice(0, 4);

  return <ProductDetailClient product={product} relatedProducts={relatedProducts} />;
}
