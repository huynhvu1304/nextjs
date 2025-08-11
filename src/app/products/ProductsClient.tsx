// pages/products/ProductsClient.tsx
'use client';

import { useRouter, useSearchParams } from "next/navigation";
import { API_URL, IMAGE_URL } from "@/lib/api";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useDispatch } from 'react-redux';
import { addToCart } from '../../redux/slices/cartSlice';
import Footer from "@/components/Footer/Footer";
import Loading from "@/components/Loading/Loadingcomponent";

// Interfaces from index.tsx
interface Variant {
  _id: string;
  image: string;
  cost_price: number;
  sale_price?: number;
  size: string;
  color: string;
  stock: number;
  productId: string;
}

interface Brand {
  _id: string;
  id: string;
  name: string;
  image_logo: string;
  created_at: string;
  updated_at: string;
}

interface Product {
  _id: string;
  name: string;
  images_main?: string;
  status?: string;
  price?: number;
  hot?: number;
  variants?: Variant[];
  categoryId?: {
    _id: string;
    name: string;
  };
  brand?: Brand;
}

export default function ProductsClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useDispatch();

  const [openSections, setOpenSections] = useState({
    price: true,
    brand: true,
    category: true,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  type Filters = {
    price: {
      under300: boolean;
      from300to1M: boolean;
      from1Mto3M: boolean;
      from3Mto5M: boolean;
      from5Mto10M: boolean;
      above10M: boolean;
    };
    brand: { [key: string]: boolean };
    category: { [key: string]: boolean };
    hot: boolean;
  };

  const [filters, setFilters] = useState<Filters>({
    price: {
      under300: false,
      from300to1M: false,
      from1Mto3M: false,
      from3Mto5M: false,
      from5Mto10M: false,
      above10M: false,
    },
    brand: {
      lining: false,
      yonex: false,
      kumpoo: false,
    },
    category: {
      racket: false,
      shoes: false,
    },
    hot: false, // Khởi tạo hot là false
  });

  const [sortOption, setSortOption] = useState("newest");
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  // Đọc tham số hot từ URL và cập nhật filters.hot
  useEffect(() => {
    const hotFilter = searchParams.get("hot");
    if (hotFilter === "true" && !filters.hot) {
      setFilters((prev) => ({ ...prev, hot: true }));
    }
  }, [searchParams]);

  // Đọc tham số category từ URL và cập nhật filters.category
  useEffect(() => {
    const category = searchParams.get("category");
    if (category === "racket" && !filters.category.racket) {
      setFilters((prev) => ({
        ...prev,
        category: { ...prev.category, racket: true, shoes: false }
      }));
    }
    if (category === "shoes" && !filters.category.shoes) {
      setFilters((prev) => ({
        ...prev,
        category: { ...prev.category, shoes: true, racket: false }
      }));
    }
  }, [searchParams]);

  // Lấy dữ liệu sản phẩm
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/products`);
        if (!res.ok) throw new Error("Không thể lấy dữ liệu sản phẩm");
        const data: Product[] = await res.json();
        setProducts(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  // Lấy danh sách yêu thích
  useEffect(() => {
    const fetchFavorites = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      
      try {
        const res = await fetch(`${API_URL}/users/favorites`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setFavoriteIds(data.map((item: any) => item._id));
        }
      } catch (error) {
        console.error("Failed to fetch favorites:", error);
      }
    };
    fetchFavorites();
  }, []);

  // State cho brands và categories động
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<{ _id: string; name: string }[]>([]);

  // Lấy dữ liệu brands và categories từ API
  useEffect(() => {
    async function fetchBrands() {
      try {
        const res = await fetch(`${API_URL}/brands`);
        if (res.ok) {
          const data = await res.json();
          setBrands(data);
        }
      } catch (error) {
        console.error("Failed to fetch brands:", error);
      }
    }
    async function fetchCategories() {
      try {
        const res = await fetch(`${API_URL}/categories`);
        if (res.ok) {
          const data = await res.json();
          setCategories(data);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    }
    fetchBrands();
    fetchCategories();
  }, []);

  // State filter động cho brand và category
  useEffect(() => {
    if (brands.length > 0) {
      setFilters(prev => ({
        ...prev,
        brand: Object.fromEntries(brands.map(b => [b.name.toLowerCase(), false]))
      }));
    }
    if (categories.length > 0) {
      setFilters(prev => ({
        ...prev,
        category: Object.fromEntries(categories.map(c => [c.name.toLowerCase(), false]))
      }));
    }
     
  }, [brands, categories]);

  // Xử lý đóng/mở các phần
  const toggleSection = (section: 'price' | 'brand' | 'category') => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Hàm sắp xếp sản phẩm
  const getSortedProducts = (products: Product[]) => {
    switch (sortOption) {
      case 'price-asc':
        return [...products].sort((a, b) => {
          const priceA = a.variants?.[0]?.cost_price || 0;
          const priceB = b.variants?.[0]?.cost_price || 0;
          return priceA - priceB;
        });
      case 'price-desc':
        return [...products].sort((a, b) => {
          const priceA = a.variants?.[0]?.cost_price || 0;
          const priceB = b.variants?.[0]?.cost_price || 0;
          return priceB - priceA;
        });
      case 'newest':
      default:
        return products;
    }
  };

  // Chuẩn hóa text
  const normalizeText = (text: string) => {
    return text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  };

  // Kiểm tra giá
  const checkPrice = (price: number) => {
    const filters = {
      under300: price < 300000,
      from300to1M: price >= 300000 && price <= 1000000,
      from1Mto3M: price > 1000000 && price <= 3000000,
      from3Mto5M: price > 3000000 && price <= 5000000,
      from5Mto10M: price > 5000000 && price <= 10000000,
      above10M: price > 10000000
    };
    return filters;
  };

  // Cập nhật hàm lọc sản phẩm
  const getFilteredProducts = (products: Product[]) => {
    let filtered = products.filter(product => product.status !== "inactive");

    if (filters.hot) {
      filtered = filtered.filter(product => product.hot === 1);
    }

    if (searchTerm) {
      const normalizedSearch = normalizeText(searchTerm);
      filtered = filtered.filter(product =>
        normalizeText(product.name).includes(normalizedSearch)
      );
    }

    const activePriceFilters = Object.entries(filters.price).filter(([_, isActive]) => isActive);
    if (activePriceFilters.length > 0) {
      filtered = filtered.filter(product => {
        const productPrice = product.variants?.[0]?.cost_price || 0;
        const priceRanges = checkPrice(productPrice);
        return activePriceFilters.some(([range]) => priceRanges[range as keyof typeof priceRanges]);
      });
    }

    const activeBrandFilters = Object.entries(filters.brand).filter(([_, isActive]) => isActive);
    if (activeBrandFilters.length > 0) {
      filtered = filtered.filter(product => {
        const brandName = product.brand?.name.toLowerCase();
        return activeBrandFilters.some(([brand]) => brandName === brand);
      });
    }

    const activeCategoryFilters = Object.entries(filters.category).filter(([_, isActive]) => isActive);
    if (activeCategoryFilters.length > 0) {
      filtered = filtered.filter(product => {
        const categoryName = product.categoryId?.name.toLowerCase();
        return activeCategoryFilters.some(([category]) => categoryName === category);
      });
    }

    return getSortedProducts(filtered);
  };

  const handleBuyNow = (productId: string) => {
    router.push(`/detail/${productId}`);
  };

  const isFavorite = (productId: string) => favoriteIds.includes(productId);

  const toggleFavorite = async (productId: string) => {
    const user = localStorage.getItem("user");
    if (!user) {
      toast.warning("Bạn cần đăng nhập để sử dụng chức năng này");
      return;
    }
    
    const { id: userId } = JSON.parse(user);

    try {
      if (!isFavorite(productId)) {
        const res = await fetch(
          `${API_URL}/users/${userId}/favorites/${productId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        if (!res.ok) throw new Error("Không thể thêm vào yêu thích");
        setFavoriteIds([...favoriteIds, productId]);
        toast.success("Đã thêm vào danh sách yêu thích!");
      } else {
        const res = await fetch(
          `${API_URL}/users/favorites/${productId}`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        if (!res.ok) throw new Error("Không thể xóa khỏi yêu thích");
        setFavoriteIds(favoriteIds.filter(id => id !== productId));
        toast.success("Đã xóa khỏi danh sách yêu thích!");
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra!");
    }
  };

  const handleAddToCart = (product: Product) => {
    const user = localStorage.getItem('user');
    if (!user) {
      toast.warning('Vui lòng đăng nhập để thêm vào giỏ hàng');
      return;
    }

    if (!product.variants || product.variants.length === 0) {
      toast.warning('Sản phẩm không có phiên bản');
      return;
    }

    const defaultVariant = product.variants[0];

    const cartItem = {
      _id: Math.random().toString(),
      productId: product._id,
      variantId: defaultVariant._id,
      quantity: 1,
      note: '',
      productName: product.name,
      productImage: product.images_main || '',
      variantDetails: {
        _id: defaultVariant._id,
        size: defaultVariant.size,
        color: defaultVariant.color,
        cost_price: defaultVariant.cost_price,
        cost_sale: defaultVariant.sale_price || 0,
        image: defaultVariant.image,
      },
    };

    dispatch(addToCart(cartItem));
    toast.success('Đã thêm vào giỏ hàng');
  };

  if (loading) return <Loading />;



  return (
    <>
      <div className="w-full px-2 sm:px-4 lg:px-6 py-4 bg-gray-50 mt-[32px]">
        <div className="container-custom flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-[25%] bg-white p-4 rounded-xl shadow-md md:sticky md:top-4 max-h-[100vh] md:h-[calc(100vh-2rem)] mb-6 md:mb-0">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <i className="fas fa-filter text-green-700"></i> Bộ lọc
            </h2>

            <div className="relative mb-4">
              <input 
                type="text" 
                placeholder="Tìm kiếm từ khoá"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" 
              />
              <span className="absolute left-3 top-2.5 text-gray-500">
                <i className="fas fa-search"></i>
              </span>
            </div>

            <div className="mb-4">
              <button 
                onClick={() => toggleSection('price')}
                className="w-full text-left font-semibold bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded-md mb-2 flex justify-between items-center"
              >
                <span>Giá</span>
                <span className={`transform transition-transform duration-200 ${openSections.price ? 'rotate-180' : ''}`}>▾</span>
              </button>
              {openSections.price && (
                <div className="space-y-2 pl-2">
                  <label className="block hover:bg-gray-50 p-1 rounded cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={filters.price.from300to1M}
                      onChange={() => setFilters({
                        ...filters,
                        price: {...filters.price, from300to1M: !filters.price.from300to1M}
                      })}
                      className="mr-2 accent-green-600"
                    />
                    300.000đ - 1.000.000đ
                  </label>
                  <label className="block hover:bg-gray-50 p-1 rounded cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={filters.price.from1Mto3M}
                      onChange={() => setFilters({
                        ...filters,
                        price: {...filters.price, from1Mto3M: !filters.price.from1Mto3M}
                      })}
                      className="mr-2 accent-green-600"
                    />
                    1.000.000đ - 3.000.000đ
                  </label>
                  <label className="block hover:bg-gray-50 p-1 rounded cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={filters.price.from3Mto5M}
                      onChange={() => setFilters({
                        ...filters,
                        price: {...filters.price, from3Mto5M: !filters.price.from3Mto5M}
                      })}
                      className="mr-2 accent-green-600"
                    />
                    3.000.000đ - 5.000.000đ
                  </label>
                </div>
              )}
            </div>

            <div className="mb-4">
              <button 
                onClick={() => toggleSection('brand')}
                className="w-full text-left font-semibold bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded-md mb-2 flex justify-between items-center"
              >
                <span>Thương hiệu</span>
                <span className={`transform transition-transform duration-200 ${openSections.brand ? 'rotate-180' : ''}`}>▾</span>
              </button>
              {openSections.brand && (
                <div className="space-y-2 pl-2">
                  {brands.map(brand => (
                    <label key={brand._id} className="block hover:bg-gray-50 p-1 rounded cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={filters.brand[brand.name.toLowerCase()] || false}
                        onChange={() => setFilters({
                          ...filters,
                          brand: {
                            ...filters.brand,
                            [brand.name.toLowerCase()]: !filters.brand[brand.name.toLowerCase()]
                          }
                        })}
                        className="mr-2 accent-green-600"
                      />
                      {brand.name}
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="mb-4">
              <button 
                onClick={() => toggleSection('category')}
                className="w-full text-left font-semibold bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded-md mb-2 flex justify-between items-center"
              >
                <span>Danh mục</span>
                <span className={`transform transition-transform duration-200 ${openSections.category ? 'rotate-180' : ''}`}>▾</span>
              </button>
              {openSections.category && (
                <div className="space-y-2 pl-2">
                  {categories.map(category => (
                    <label key={category._id} className="block hover:bg-gray-50 p-1 rounded cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={filters.category[category.name.toLowerCase()] || false}
                        onChange={() => setFilters({
                          ...filters,
                          category: {
                            ...filters.category,
                            [category.name.toLowerCase()]: !filters.category[category.name.toLowerCase()]
                          }
                        })}
                        className="mr-2 accent-green-600"
                      />
                      {category.name}
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="mb-4">
              <label className="flex items-center gap-2 hover:bg-gray-50 p-2 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.hot}
                  onChange={() => setFilters(prev => ({
                    ...prev,
                    hot: !prev.hot
                  }))}
                  className="w-4 h-4 accent-red-600"
                />
                <span className="flex items-center gap-1.5 font-medium">
                  <i className="fas fa-fire text-red-600"></i>
                  Sản phẩm bán chạy
                </span>
              </label>
            </div>
          </div>

          <div className="w-full md:w-[75%] bg-white rounded-xl p-4 sm:p-6 shadow-md flex flex-col">
            <div className="w-full h-[150px] sm:h-[200px] mb-4">
              <img
                src="/img/Auraspeed_Fantome_1892x660.webp"
                alt="Ảnh đầu trang"
                className="w-full h-full object-cover rounded-md"
              />
            </div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">
                Sản phẩm ({getFilteredProducts(products).length})
              </h2>
              <select 
                className="border rounded-md px-3 py-1.5"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
              >
                <option value="newest">Mới nhất</option>
                <option value="price-asc">Giá thấp đến cao</option>
                <option value="price-desc">Giá cao đến thấp</option>
              </select>
            </div>
            
            <div className="overflow-y-auto flex-1" style={{ maxHeight: 'calc(100vh - 8rem)' }}>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-auto-fit gap-4">
                {loading ? (
                  <div className="col-span-full text-center py-10">Đang tải sản phẩm...</div>
                ) : getFilteredProducts(products).length === 0 ? (
                  <div className="col-span-full flex flex-col items-center py-10 text-gray-500">
                    <i className="fas fa-search mb-2 text-2xl"></i>
                    <p>Không có sản phẩm mà bạn tìm</p>
                  </div>
                ) : (
                  getFilteredProducts(products).slice(0, 60).map((product) => (
                    <div
                      key={product._id}
                      className="bg-white rounded-lg p-2.5 shadow-md flex flex-col justify-between h-full relative group"
                    >
                      {product.hot === 1 && (
                        <div className="absolute top-2.5 left-2.5 bg-red-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-tl rounded-bl z-20"
                          style={{
                            clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 0 100%)",
                          }}
                        >
                          <div className="flex items-center gap-1">
                            <i className="fas fa-fire"></i>
                            HOT
                          </div>
                        </div>
                      )}

                      <div 
                        className="absolute top-2.5 right-2.5 text-lg cursor-pointer z-20"
                        onClick={() => toggleFavorite(product._id)}
                      >
                        <i className={`fas fa-heart ${isFavorite(product._id) ? 'text-red-600' : 'text-gray-300'} hover:text-red-600 transition-colors`}></i>
                      </div>

                      <div className="w-full h-[200px] flex items-center justify-center mb-3">
                        <img
                          src={product.images_main ? `${IMAGE_URL}/${product.images_main}` : "./img/no-image.jpg"}
                          alt={product.name}
                          className="max-h-full w-[200px] h-[200px] max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>  

                      <div className="flex flex-col flex-grow text-start">
                        <h3
                          className="text-sm font-medium mb-2 line-clamp-2 min-h-[2.75rem]"
                          title={product.name}
                        >
                          {product.name}
                        </h3>

                        <div className="text-red-600 font-bold mb-1 text-base leading-snug">
                          {product.variants && product.variants.length > 0
                            ? product.variants[0].cost_price.toLocaleString() + "đ"
                            : "Liên hệ"}
                        </div>

                        <div className="text-xs text-gray-500 mb-3 min-h-[1rem]">
                          {product.status === "active" || product.status === "Hot"
                            ? "Còn hàng"
                            : "Hết hàng"}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 mt-auto w-full">
                        <button
                          onClick={() => handleBuyNow(product._id)}
                          className="w-full sm:w-1/2 py-2 bg-green-700 text-white rounded-md text-sm hover:bg-green-800 transition-colors"
                        >
                          Mua ngay
                        </button>
                        <button
                          onClick={() => handleAddToCart(product)}
                          className="w-full sm:w-1/2 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm hover:bg-gray-200 transition-colors flex items-center justify-center gap-1"
                        >
                          <i className="fas fa-shopping-cart"></i>
                          Thêm giỏ
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}