'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import Footer from '@/components/Footer/Footer';
import Loading from '@/components/Loading/Loadingcomponent';
import { API_URL, IMAGE_URL } from '@/lib/api';

interface Variant {
  _id: string;
  id: string;
  image: string;
  cost_price: number;
  sale_price?: number;
  size: string;
  color: string;
  stock: number;
  productId?: string;
}

interface Brand {
  _id: string;
  id?: string;
  name: string;
  image_logo?: string;
  created_at?: string;
  updated_at?: string;
}

interface Product {
  _id: string;
  name: string;
  images_main?: string;
  status?: string;
  price?: number;
  hot?: number;
  description: string;
  variants?: Variant[];
  categoryId?: {
    _id: string;
    name: string;
  };
  brand?: Brand | string;
}

const getLowestPrice = (product: Product): number | null => {
  if (!product.variants || product.variants.length === 0) return null;

  const availableVariants = product.variants.filter(variant => variant.stock > 0);

  if (availableVariants.length === 0) return null;

  const prices = availableVariants.flatMap(variant => {
    const arr: number[] = [];
    if (variant.sale_price && variant.sale_price > 0) arr.push(variant.sale_price);
    if (variant.cost_price && variant.cost_price > 0) arr.push(variant.cost_price);
    return arr;
  });

  if (prices.length === 0) return null;

  return Math.min(...prices);
};

function normalizeText(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function Favorites() {
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Bộ lọc
  const [searchTerm, setSearchTerm] = useState('');
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<{ _id: string; name: string }[]>([]);
  const [filters, setFilters] = useState<{
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
  }>({
    price: {
      under300: false,
      from300to1M: false,
      from1Mto3M: false,
      from3Mto5M: false,
      from5Mto10M: false,
      above10M: false,
    },
    brand: {},
    category: {},
    hot: false,
  });

  // Mở/đóng các section filter
  const [openSections, setOpenSections] = useState({
    price: true,
    brand: true,
    category: true,
  });

  const [flashSalePriceMap, setFlashSalePriceMap] = useState<Map<string, { sale_price: number; original_price: number }>>(new Map());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9; // Số sản phẩm mỗi trang

  useEffect(() => {
    const fetchFavorites = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError("Bạn chưa đăng nhập");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_URL}/users/favorites`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (res.ok) {
          const data = await res.json();
          setFavorites(data);
        } else {
          const errorData = await res.json();
          setError(errorData.message || "Lỗi khi tải dữ liệu");
        }
      } catch (err: any) {
        setError("Lỗi kết nối server");
      } finally {
        setLoading(false);
      }
    };
    fetchFavorites();
  }, []);

  // Lấy brands và categories
  useEffect(() => {
    async function fetchBrands() {
      try {
        const res = await fetch(`${API_URL}/brands`);
        if (res.ok) {
          const data = await res.json();
          setBrands(data);
        }
      } catch {}
    }
    async function fetchCategories() {
      try {
        const res = await fetch(`${API_URL}/categories`);
        if (res.ok) {
          const data = await res.json();
          setCategories(data);
        }
      } catch {}
    }
    fetchBrands();
    fetchCategories();
  }, []);

  // Khởi tạo filter động cho brand/category
  useEffect(() => {
    if (brands.length > 0) {
      setFilters(prev => ({
        ...prev,
        brand: {
          ...Object.fromEntries(brands.map(b => [b._id, false])),
          ...prev.brand
        }
      }));
    }
    if (categories.length > 0) {
      setFilters(prev => ({
        ...prev,
        category: {
          ...Object.fromEntries(categories.map(c => [c._id, false])),
          ...prev.category
        }
      }));
    }
  }, [brands, categories]);

  const handleRemoveFavorite = async (productId: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error("Bạn chưa đăng nhập");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/users/favorites/${productId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Lỗi khi xóa yêu thích');
      }

      setFavorites(prev => {
        const updated = prev.filter(p => p._id !== productId);
        // Kiểm tra số trang mới
        const newTotalPages = Math.max(1, Math.ceil(updated.length / itemsPerPage));
        if (currentPage > newTotalPages) {
          setCurrentPage(newTotalPages);
        }
        return updated;
      });
      toast.success("Đã xóa khỏi danh sách yêu thích");
      window.dispatchEvent(new Event("favoriteChanged"));
    } catch (err: any) {
      toast.error("Xóa thất bại: " + err.message);
    }
  };

  // Toggle section filter
  const toggleSection = (section: 'price' | 'brand' | 'category') => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Xử lý chọn filter
  const handleFilterChange = (type: 'brand' | 'category' | 'price', key: string) => {
    setFilters(prev => {
      if (type === 'brand') {
        return {
          ...prev,
          brand: {
            ...prev.brand,
            [key]: !prev.brand[key]
          }
        };
      }
      if (type === 'category') {
        return {
          ...prev,
          category: {
            ...prev.category,
            [key]: !prev.category[key]
          }
        };
      }
      if (type === 'price') {
        return {
          ...prev,
          price: {
            ...prev.price,
            [key]: !prev.price[key as keyof typeof prev.price]
          }
        };
      }
      return prev;
    });
  };

  // Xử lý filter giá
  const checkPrice = (price: number) => {
    return {
      under300: price < 300000,
      from300to1M: price >= 300000 && price <= 1000000,
      from1Mto3M: price > 1000000 && price <= 3000000,
      from3Mto5M: price > 3000000 && price <= 5000000,
      from5Mto10M: price > 5000000 && price <= 10000000,
      above10M: price > 10000000
    };
  };

  // Lọc sản phẩm yêu thích
  const getFilteredFavorites = () => {
    let filtered = favorites;

    // Search
    if (searchTerm) {
      const normalizedSearch = normalizeText(searchTerm);
      filtered = filtered.filter(product =>
        normalizeText(product.name).includes(normalizedSearch)
      );
    }

    // Price
    const activePriceFilters = Object.entries(filters.price).filter(([_, isActive]) => isActive);
    if (activePriceFilters.length > 0) {
      filtered = filtered.filter(product => {
        const productPrice = product.variants?.[0]?.cost_price || 0;
        const priceRanges = checkPrice(productPrice);
        return activePriceFilters.some(([range]) => priceRanges[range as keyof typeof priceRanges]);
      });
    }

    // Brand
    const activeBrandFilters = Object.entries(filters.brand).filter(([_, isActive]) => isActive);
    if (activeBrandFilters.length > 0) {
      filtered = filtered.filter(product => {
        const brandId = typeof product.brand === 'object'
          ? product.brand?._id
          : product.brand;
        return activeBrandFilters.some(([id]) => brandId === id);
      });
    }

    // Category
    const activeCategoryFilters = Object.entries(filters.category).filter(([_, isActive]) => isActive);
    if (activeCategoryFilters.length > 0) {
      filtered = filtered.filter(product => {
        let categoryId: string | undefined;
        if (product.categoryId && typeof product.categoryId === 'object') {
          categoryId = product.categoryId._id;
        } else if (typeof product.categoryId === 'string') {
          categoryId = product.categoryId;
        }
        return !!categoryId && activeCategoryFilters.some(([id]) => categoryId === id);
      });
    }

    // Hot
    if (filters.hot) {
      filtered = filtered.filter(product => product.hot === 1);
    }

    return filtered;
  };

  // Phân trang sản phẩm đã lọc
  const filteredFavorites = getFilteredFavorites();
  const totalPages = Math.ceil(filteredFavorites.length / itemsPerPage);
  const paginatedFavorites = filteredFavorites.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Khi filter/search thay đổi thì về trang 1
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters]);

  // Lấy thông tin flashsale cho các sản phẩm yêu thích
  useEffect(() => {
    async function fetchFlashSale() {
      try {
        const res = await fetch(`${API_URL}/flashsales`);
        if (!res.ok) return;
        const data = await res.json();
        const active = data.filter((fs: any) => fs.status === 'Đang diễn ra');
        const map = new Map<string, { sale_price: number; original_price: number }>();
        active.forEach((fs: any) => {
          fs.products.forEach((item: any) => {
            const productId = item.product_id._id;
            // Tìm variant đúng
            const variant = item.product_id.variants?.find((v: any) => v._id === item.variant_id) || item.product_id.variants?.[0];
            if (variant) {
              let salePrice = 0;
              const originalPrice = variant.cost_price;
              const basePrice = (variant.sale_price !== undefined && variant.sale_price !== null && variant.sale_price > 0)
                ? variant.sale_price
                : variant.cost_price;
              if (typeof fs.discount_value === 'number') {
                salePrice = Math.round(basePrice * (1 - fs.discount_value / 100));
              } else {
                salePrice = basePrice;
              }
              map.set(productId, { sale_price: salePrice, original_price: originalPrice });
            }
          });
        });
        setFlashSalePriceMap(map);
      } catch {}
    }
    fetchFlashSale();
  }, [favorites]);

  // Hàm lấy giá hiển thị
  const getDisplayPrice = (product: Product): { price: number; isFlashSale: boolean; isSale: boolean } => {
    // Ưu tiên flashsale
    const flashSale = flashSalePriceMap.get(product._id);
    if (flashSale && flashSale.sale_price > 0) {
      return { price: flashSale.sale_price, isFlashSale: true, isSale: false };
    }
    // Nếu có sale_price > 0
    const variant = product.variants?.find(v => v.stock > 0) || product.variants?.[0];
    if (variant && variant.sale_price && variant.sale_price > 0) {
      return { price: variant.sale_price, isFlashSale: false, isSale: true };
    }
    // Giá gốc
    if (variant && variant.cost_price > 0) {
      return { price: variant.cost_price, isFlashSale: false, isSale: false };
    }
    return { price: 0, isFlashSale: false, isSale: false };
  };

  if (loading) return <Loading />;
  if (error) {
    if (error.includes('chưa đăng nhập') || error.includes('token')) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
          <h3 style={{ color: 'orange', fontSize: 20 }}>Hãy đăng nhập để thêm sản phẩm vào yêu thích.</h3>
        </div>
      );
    }
    return <p style={{ color: 'red' }}>Lỗi: {error}</p>;
  }

  return (
    <>
      <div className="w-full px-2 sm:px-4 lg:px-6 py-4 bg-gray-50 mt-[32px]">
        <div className="container-custom flex flex-col md:flex-row gap-4">
          {/* Bộ lọc bên trái */}
          <div className="w-full md:w-[25%] bg-white p-4 rounded-xl shadow-md md:sticky md:top-4 max-h-[100vh] md:h-[calc(100vh-2rem)] overflow-y-auto mb-6 md:mb-0">
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
            {/* Price filter */}
            <div className="mb-4">
              <button
                className="flex items-center justify-between w-full font-semibold text-base mb-2 px-3 py-2 rounded bg-gray-200"
                onClick={() => toggleSection('price')}
              >
                Giá
                <span>{openSections.price ? '▾' : '▸'}</span>
              </button>
              {openSections.price && (
                <div className="flex flex-col gap-2 pl-2">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={filters.price.under300}
                      onChange={() => handleFilterChange('price', 'under300')} />
                    Dưới 300.000đ
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={filters.price.from300to1M}
                      onChange={() => handleFilterChange('price', 'from300to1M')} />
                    300.000đ - 1.000.000đ
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={filters.price.from1Mto3M}
                      onChange={() => handleFilterChange('price', 'from1Mto3M')} />
                    1.000.000đ - 3.000.000đ
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={filters.price.from3Mto5M}
                      onChange={() => handleFilterChange('price', 'from3Mto5M')} />
                    3.000.000đ - 5.000.000đ
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={filters.price.from5Mto10M}
                      onChange={() => handleFilterChange('price', 'from5Mto10M')} />
                    5.000.000đ - 10.000.000đ
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={filters.price.above10M}
                      onChange={() => handleFilterChange('price', 'above10M')} />
                    Trên 10.000.000đ
                  </label>
                </div>
              )}
            </div>
            {/* Brand filter */}
            <div className="mb-4">
              <button
                className="flex items-center justify-between w-full font-semibold text-base mb-2 px-3 py-2 rounded bg-gray-200"
                onClick={() => toggleSection('brand')}
              >
                Thương hiệu
                <span>{openSections.brand ? '▾' : '▸'}</span>
              </button>
              {openSections.brand && (
                <div className="flex flex-col gap-2 pl-2 max-h-40 overflow-y-auto">
                  {brands.map(brand => (
                    <label key={brand._id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={filters.brand[brand._id] || false}
                        onChange={() => handleFilterChange('brand', brand._id)}
                      />
                      {brand.name}
                    </label>
                  ))}
                </div>
              )}
            </div>
            {/* Category filter */}
            <div className="mb-4">
              <button
                className="flex items-center justify-between w-full font-semibold text-base mb-2 px-3 py-2 rounded bg-gray-200"
                onClick={() => toggleSection('category')}
              >
                Danh mục
                <span>{openSections.category ? '▾' : '▸'}</span>
              </button>
              {openSections.category && (
                <div className="flex flex-col gap-2 pl-2 max-h-40 overflow-y-auto">
                  {categories.map(category => (
                    <label key={category._id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={filters.category[category._id] || false}
                        onChange={() => handleFilterChange('category', category._id)}
                      />
                      {category.name}
                    </label>
                  ))}
                </div>
              )}
            </div>
            {/* Hot filter */}
            <div className="mb-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.hot}
                  onChange={() => setFilters(prev => ({ ...prev, hot: !prev.hot }))}
                />
                Sản phẩm HOT
              </label>
            </div>
          </div>
          {/* Sản phẩm bên phải */}
          <div className="w-full md:w-[75%] bg-white rounded-xl p-4 sm:p-6 shadow-md flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">
                Sản phẩm yêu thích ({filteredFavorites.length})
              </h2>
            </div>
            <div className="flex-1">
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 w-full justify-items-center mb-10">
                {paginatedFavorites.length === 0 ? (
                  <div className="col-span-full flex flex-col items-center py-10 text-gray-500">
                    <i className="fas fa-heart-broken mb-2 text-2xl"></i>
                    <p>Chưa có sản phẩm yêu thích nào.</p>
                  </div>
                ) : (
                  paginatedFavorites.map(product => (
                    <div
                      key={product._id}
                      className="w-full max-w-[180px] xs:max-w-[200px] sm:max-w-[230px] md:max-w-[250px] flex flex-col items-center border rounded-lg p-2 sm:p-4 bg-white shadow relative"
                    >
                      {/* Icon Hot */}
                      {product.hot === 1 && (
                        <div className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-red-600 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md text-xs font-bold z-10 flex items-center gap-1">
                          <i className="fas fa-fire"></i>
                          HOT
                        </div>
                      )}

                      <img
                        src={product.images_main ? `${IMAGE_URL}/${product.images_main}` : "/img/no-image.jpg"}
                        alt={product.name}
                        className="w-full h-28 xs:h-32 sm:h-40 object-contain mb-1 sm:mb-2"
                      />

                      <div className="font-semibold text-center text-sm xs:text-lg sm:text-lg mb-1 line-clamp-2">
                        {product.name}
                      </div>

                      <p className={`font-bold mb-0 text-lg sm:text-xl
    ${getDisplayPrice(product).isFlashSale ? 'text-orange-600' : 'text-red-600'}`}>
                        {getDisplayPrice(product).price > 0
                          ? getDisplayPrice(product).price.toLocaleString() + 'đ'
                          : 'Liên hệ'}
                        {getDisplayPrice(product).isFlashSale && getDisplayPrice(product).price > 0 && (
                          <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-600 text-xs rounded">Flash Sale</span>
                        )}
                      </p>
                      {(getDisplayPrice(product).isSale || getDisplayPrice(product).isFlashSale) && (
                        <span className="text-gray-400 text-base line-through block mb-0">
                          {(() => {
                            const variant = product.variants?.find(v => v.stock > 0) || product.variants?.[0];
                            if (variant) return variant.cost_price.toLocaleString() + 'đ';
                            return '';
                          })()}
                        </span>
                      )}

                      <div className="flex flex-col lg:flex-row gap-2 mt-auto w-full">
                        <Link
                          href={`/detail/${product._id}`}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs xs:text-sm py-1.5 sm:py-2 rounded-md font-semibold text-center flex items-center justify-center"
                        >
                          Xem chi tiết
                        </Link>
                        <button
                          onClick={() => handleRemoveFavorite(product._id)}
                          className="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs xs:text-sm py-1.5 sm:py-2 rounded-md font-semibold flex items-center justify-center"
                        >
                          Xóa yêu thích
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {/* Pagination controls */}
              {filteredFavorites.length > 0 && (
                <div className="flex justify-center items-center gap-2 mb-4">
                  <button
                    className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    Trước
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i + 1}
                      className={`px-3 py-1 rounded ${currentPage === i + 1 ? 'bg-green-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Sau
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default Favorites;