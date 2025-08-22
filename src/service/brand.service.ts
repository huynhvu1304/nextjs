import { Brand } from "@/types/brand.interface";
import { API_URL } from "@/lib/api"; 

export const getBrands = async (): Promise<Brand[]> => {
  try {
    const res = await fetch(`${API_URL}/brands`);
    if (!res.ok) throw new Error("Failed to fetch brands");
    const data: Brand[] = await res.json();
    return data;
  } catch (error) {
    console.error("Error fetching brands:", error);
    return [];
  }
};

