import { Product } from "@/types/product.interface";
import { API_URL } from "@/lib/api";
export async function getProducts(): Promise<Product[]> {
  const res = await fetch(`${API_URL}/products`);
  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json();
}
