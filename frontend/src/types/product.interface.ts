import { Variant } from "./variant.interface";
import { Brand } from "./brand.interface";
import { Category } from "./category.interface";

export interface Product {
  _id: string;
  name: string;
  images_main?: string;
  status?: string;
  price?: number;
  hot?: number;
  purchases?: number;
  variants?: Variant[];
  categoryId?: Category;  
  brand?: Brand;
}

export interface FlashSaleProduct {
  product: Product;
  variant?: Variant;
  sale_price: number;
  original_price: number;
}
