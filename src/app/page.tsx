import styles from "./page.module.css";
// import Banner from "./Banner/banner";
import Index from "./Index/index";   
import Footer from "@/components/Footer/Footer";

interface Product {
  _id: string;
  name: string;
  description?: string;
  images_main?: string;
  status?: string;
  purchases?: number;
}
const API_URL = process.env.NEXT_PUBLIC_API_URL!;
async function getProducts(): Promise<Product[]> {
  const res = await fetch(`${API_URL}/products`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Failed to fetch products");
  }
  return res.json();
}

export default async function Home() {
  const products = await getProducts();

  return (
    <div>
    <Index />
    <Footer />
  </div>
  );
}
