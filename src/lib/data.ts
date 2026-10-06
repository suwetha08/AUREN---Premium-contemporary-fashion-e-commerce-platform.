export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  gender: string;
  price: string;
  originalPrice: string | null;
  discountPercentage: number;
  currency: string;
  brand: string;
  images: string[];
  colors: string[];
  sizes: string[];
  material: string;
  fit: string;
  occasion: string[];
  tags: string[];
  isNew: boolean;
  isFeatured: boolean;
  isBestseller: boolean;
  createdAt: string;
  rating: number;
  reviewCount: number;
};

const rawProducts = [
  {
    id: "AUR-0001",
    name: "Yellow Cropped Hoodie & Jogger Set",
    category: "Co-ord Sets",
    subcategory: "Two-Piece Sets",
    color: "Yellow",
    price: "₹2,999",
    originalPrice: "₹3,999",
    discount: 25,
    sizes: ["XS", "S", "M", "L", "XL"],
    rating: 4.6,
    reviews: 32,
    slug: "yellow-cropped-hoodie-jogger-set",
    description: "A relaxed two-piece streetwear set featuring a cropped hoodie and matching jogger pants. Designed for comfortable everyday styling with a modern sporty silhouette."
  },
  {
    id: "AUR-0002",
    name: "Sky Blue Wrap Maxi Dress",
    category: "Dresses",
    subcategory: "Maxi Dresses",
    color: "Sky Blue",
    price: "₹2,499",
    originalPrice: "₹3,499",
    discount: 29,
    sizes: ["XS", "S", "M", "L", "XL"],
    rating: 4.8,
    reviews: 45,
    slug: "sky-blue-wrap-maxi-dress",
    description: "An elegant sky blue wrap maxi dress that flatters the silhouette. Perfect for summer days and beachside evenings, featuring a lightweight, flowing fabric."
  },
  {
    id: "AUR-0003",
    name: "Floral Print Summer Maxi Dress",
    category: "Dresses",
    subcategory: "Maxi Dresses",
    color: "Ivory Floral",
    price: "₹2,799",
    originalPrice: "₹3,999",
    discount: 30,
    sizes: ["XS", "S", "M", "L", "XL"],
    rating: 4.7,
    reviews: 38,
    slug: "floral-print-summer-maxi-dress",
    description: "A stunning ivory floral maxi dress. Designed with a fitted bodice and a sweeping skirt, it brings a romantic and effortless vibe to your summer wardrobe."
  },
  {
    id: "AUR-0004",
    name: "White Casual Summer Outfit",
    category: "Casual Wear",
    subcategory: "Summer Wear",
    color: "White / Blue / Red",
    price: "₹1,999",
    originalPrice: "₹2,799",
    discount: 29,
    sizes: ["XS", "S", "M", "L", "XL"],
    rating: 4.5,
    reviews: 27,
    slug: "white-casual-summer-outfit",
    description: "A versatile casual summer outfit. Combines a crisp white top with classic blue denim accents and a pop of red, embodying relaxed weekend style."
  },
  {
    id: "AUR-0005",
    name: "Black Oversized Essential Tee",
    category: "Tops",
    subcategory: "T-Shirts",
    color: "Black",
    price: "₹999",
    originalPrice: "₹1,399",
    discount: 29,
    sizes: ["XS", "S", "M", "L", "XL"],
    rating: 4.6,
    reviews: 41,
    slug: "black-oversized-essential-tee",
    description: "The ultimate oversized black t-shirt. Crafted from premium heavyweight cotton, it offers a relaxed, dropped-shoulder fit for everyday wear."
  },
  {
    id: "AUR-0006",
    name: "Ivory Ribbed Tank Top",
    category: "Tops",
    subcategory: "Tank Tops",
    color: "Ivory",
    price: "₹1,299",
    originalPrice: "₹1,799",
    discount: 28,
    sizes: ["XS", "S", "M", "L", "XL"],
    rating: 4.5,
    reviews: 24,
    slug: "ivory-ribbed-tank-top",
    description: "A versatile ivory ribbed tank top. Made with a stretchy, form-fitting fabric, it works perfectly as a base layer or a standalone summer staple."
  },
  {
    id: "AUR-0007",
    name: "Relaxed Blue Denim Jeans",
    category: "Bottoms",
    subcategory: "Jeans",
    color: "Blue",
    price: "₹2,199",
    originalPrice: "₹2,999",
    discount: 27,
    sizes: ["28", "30", "32", "34", "36"],
    rating: 4.7,
    reviews: 36,
    slug: "relaxed-blue-denim-jeans",
    description: "Classic blue denim jeans cut in a relaxed, comfortable fit. Finished with subtle fading and durable hardware for timeless everyday style."
  },
  {
    id: "AUR-0008",
    name: "Black Wide-Leg Trousers",
    category: "Bottoms",
    subcategory: "Trousers",
    color: "Black",
    price: "₹2,399",
    originalPrice: "₹3,299",
    discount: 27,
    sizes: ["28", "30", "32", "34", "36"],
    rating: 4.6,
    reviews: 29,
    slug: "black-wide-leg-trousers",
    description: "Sophisticated black wide-leg trousers. Featuring a high-waisted tailored fit, they seamlessly transition from office wear to evening elegance."
  },
  {
    id: "AUR-0009",
    name: "Beige Utility Jacket",
    category: "Outerwear",
    subcategory: "Jackets",
    color: "Beige",
    price: "₹3,499",
    originalPrice: "₹4,799",
    discount: 27,
    sizes: ["S", "M", "L", "XL"],
    rating: 4.7,
    reviews: 21,
    slug: "beige-utility-jacket",
    description: "A practical yet stylish beige utility jacket. Constructed with multiple patch pockets and a durable fabric blend, perfect for transitional weather."
  },
  {
    id: "AUR-0010",
    name: "Sage Green Overshirt",
    category: "Outerwear",
    subcategory: "Overshirts",
    color: "Sage Green",
    price: "₹2,899",
    originalPrice: "₹3,999",
    discount: 28,
    sizes: ["S", "M", "L", "XL"],
    rating: 4.6,
    reviews: 19,
    slug: "sage-green-overshirt",
    description: "A relaxed sage green overshirt. Crafted from a mid-weight material, it offers an ideal layering piece for a laid-back, contemporary look."
  },
  {
    id: "AUR-0011",
    name: "Cream Knit Cardigan",
    category: "Knitwear",
    subcategory: "Cardigans",
    color: "Cream",
    price: "₹2,599",
    originalPrice: "₹3,599",
    discount: 28,
    sizes: ["S", "M", "L", "XL"],
    rating: 4.8,
    reviews: 31,
    slug: "cream-knit-cardigan",
    description: "A cozy cream knit cardigan. Designed with a chunky texture and an oversized silhouette, bringing warmth and style to any casual ensemble."
  },
  {
    id: "AUR-0012",
    name: "Black Satin Evening Dress",
    category: "Dresses",
    subcategory: "Evening Dresses",
    color: "Black",
    price: "₹3,299",
    originalPrice: "₹4,499",
    discount: 27,
    sizes: ["XS", "S", "M", "L", "XL"],
    rating: 4.8,
    reviews: 34,
    slug: "black-satin-evening-dress",
    description: "A luxurious black satin evening dress. Featuring a sleek, minimalist design that drapes beautifully, ensuring you stand out at any formal occasion."
  }
];

export const products: Product[] = rawProducts.map((p, i) => ({
  id: p.id,
  slug: p.slug,
  name: p.name,
  description: p.description,
  category: p.category.toUpperCase(),
  subcategory: p.subcategory.toUpperCase(),
  gender: "Women",
  price: p.price,
  originalPrice: p.originalPrice,
  discountPercentage: p.discount,
  currency: "INR",
  brand: "AUREN",
  images: [
    `/images/products/${p.slug}/main.jpg`
  ],
  colors: [p.color],
  sizes: p.sizes,
  material: "Premium Blend",
  fit: "Regular",
  occasion: ["Casual", "Everyday"],
  tags: ["fashion", p.category.toLowerCase()],
  isNew: i < 4,
  isFeatured: i % 3 === 0,
  isBestseller: p.rating >= 4.7,
  createdAt: new Date(Date.now() - i * 86400000).toISOString(),
  rating: p.rating,
  reviewCount: p.reviews,
}));
