"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { motion } from 'framer-motion';
import { addToCart } from "../../redux/slices/cartSlice"; 
import "./index.css";
import ChatbotPopup from "@/components/chatbot/ChatbotPopup";
import { API_URL, IMAGE_URL, IMAGE_USER_URL } from "@/lib/api";
import FlashSale from '../Flash-sale/FlashSale';
import Loading from "@/components/Loading/Loadingcomponent";

import ChatbotButton from "@/components/chatbot/components/chatbutton";

import Banner from "@/app/Banner/banner";

import { getProducts } from "@/service/product.service";
import { getCategories } from "@/service/category.service";
import { getBrands } from "@/service/brand.service";

import { Product } from "@/types/product.interface";
import { Variant } from "@/types/variant.interface";
import { Category } from "@/types/category.interface";
import { Brand } from "@/types/brand.interface";
import Link from "next/link";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';

export default function HomePageSection() {
  const [isLoading, setIsLoading] = useState(true);

  const dispatch = useDispatch();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [fadeIn, setFadeIn] = useState(false);

  const [categoryIdVot, setCategoryIdVot] = useState<string | null>(null);
  const [categoryIdGiay, setCategoryIdGiay] = useState<string | null>(null);

  const [selectedBrandVot, setSelectedBrandVot] = useState<string | null>(null);
  const [selectedBrandGiay, setSelectedBrandGiay] = useState<string | null>(null);

  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [showChat, setShowChat] = useState(false);
  const [flashSalePriceMap, setFlashSalePriceMap] = useState<Map<string, { sale_price: number; original_price: number }>>(new Map());

  //sản phẩm
  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getProducts();
        setProducts(data);
      } catch (error) {
        console.error("Lỗi khi tải sản phẩm:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (!loading) {
      setFadeIn(true);
    }
  }, [loading]);

    useEffect(() => {
    // Lấy danh sách yêu thích từ backend khi load trang (nếu đã đăng nhập)
    const fetchFavorites = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch(`${API_URL}/users/favorites`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setFavoriteIds(data.map((item: any) => item._id));
      }
    };
    fetchFavorites();
  }, []);

  const isFavorite = (productId: string) => favoriteIds.includes(productId);

  const toggleFavorite = async (productId: string) => {
    const user = localStorage.getItem("user");
    if (!user) {
      toast.warning("Bạn cần đăng nhập để sử dụng chức năng này");
      return;
    }
    const userObj = JSON.parse(user);
    const userId = userObj._id || userObj.id;

    if (!userId) {
      toast.error("Không tìm thấy thông tin người dùng!");
      return;
    }

    try {
      if (!isFavorite(productId)) {
        // Thêm vào yêu thích
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
        // Xóa khỏi yêu thích
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
        setFavoriteIds(favoriteIds.filter((id) => id !== productId));
        toast.success("Đã xóa khỏi danh sách yêu thích!");
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra!");
    } finally {
      window.dispatchEvent(new Event("favoriteChanged"));
    }
  };
  

  // Update the product filters
  const hotProducts = products.filter(
    (p) => p.hot === 1 && p.status !== "inactive"
  );

  const filteredProductsVot = products.filter(
    (p) =>
      p.categoryId?._id === categoryIdVot &&
      p.status !== "inactive" &&
      (selectedBrandVot ? p.brand?._id === selectedBrandVot : true)
  );

  const filteredProductsGiay = products.filter(
    (p) =>
      p.categoryId?._id === categoryIdGiay &&
      p.status !== "inactive" &&
      (selectedBrandGiay ? p.brand?._id === selectedBrandGiay : true)
  );

  // const LIMIT = 8;

  const handleBrandClickVot = (brandId: string | null) => {
    setSelectedBrandVot(brandId);
  };
  const handleBrandClickGiay = (brandId: string | null) => {
    setSelectedBrandGiay(brandId);
  };

  // Thêm hàm xử lý chuyển hướng
  const handleBuyNow = (productId: string) => {
    router.push(`/detail/${productId}`);
  };

  // Thêm helper function để kiểm tra stock của variant
  const isProductOutOfStock = (product: Product) => {
    return (
      !product.variants ||
      product.variants.length === 0 ||
      !product.variants.some((v) => v.stock > 0)
    );
  };

  // Helper: lấy giá hiển thị (ưu tiên flash sale > sale_price > cost_price)
  const getDisplayPriceFromVariants = (product: Product): string => {
    if (!product.variants || product.variants.length === 0) return "Liên hệ";
    
    // 1. Kiểm tra flash sale trước
    const flashSale = flashSalePriceMap.get(product._id);
    if (flashSale && flashSale.sale_price > 0) {
      return `${flashSale.sale_price.toLocaleString()}đ`;
    }
    
    // 2. Nếu không có flash sale, kiểm tra sale_price của variant
    const variant = product.variants[0];
    if (variant.sale_price && variant.sale_price > 0) {
      return `${variant.sale_price.toLocaleString()}đ`;
    }
    
    // 3. Cuối cùng lấy cost_price
    return `${variant.cost_price.toLocaleString()}đ`;
  };

  const handleAddToCart = (product: Product) => {
    // Kiểm tra đăng nhập
    const user = localStorage.getItem("user");
    if (!user) {
      toast.warning("Vui lòng đăng nhập để thêm vào giỏ hàng");
      return;
    }

    // Kiểm tra sản phẩm có variant không và có còn hàng không
    if (isProductOutOfStock(product)) {
      toast.warning("Sản phẩm đã hết hàng");
      return;
    }

    // Lấy variant đầu tiên còn hàng
    const availableVariant = product.variants?.find((v) => v.stock > 0);
    if (!availableVariant) {
      toast.warning("Sản phẩm không có phiên bản khả dụng");
      return;
    }

    const cartItem = {
      _id: Math.random().toString(),
      productId: product._id,
      variantId: availableVariant._id,
      quantity: 1,
      note: "",
      productName: product.name,
      productImage: product.images_main || "",
      variantDetails: {
        _id: availableVariant._id,
        size: availableVariant.size,
        color: availableVariant.color,
        cost_price: availableVariant.cost_price,
        cost_sale: availableVariant.sale_price || 0,
        image: availableVariant.image,
      },
    };

    dispatch(addToCart(cartItem));
    toast.success("Đã thêm vào giỏ hàng");
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000); 
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const data = await getCategories();
        setCategories(data);
        // Giả sử tên category là "Vợt" và "Giày"
        const vot = data.find((c) => c.name.toLowerCase().includes("vợt"));
        const giay = data.find((c) => c.name.toLowerCase().includes("giày"));
        setCategoryIdVot(vot?._id || null);
        setCategoryIdGiay(giay?._id || null);
      } catch (error) {
        console.error("Lỗi khi tải category:", error);
      }
    }
    fetchCategories();
  }, []);

  useEffect(() => {
    getBrands().then(setBrands);
  }, []);

  if (isLoading) return <Loading />;

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  } as const;

  const productFadeIn = {
    hidden: { opacity: 0, x: -50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  } as const;

  const slideInRight = {
    hidden: {
      opacity: 0,
      x: 100, 
    },
    visible: {
      opacity: 1,
      x: 0,
    },
  };

  const ProductSkeleton = () => (
    <div className="border border-gray-300 rounded-lg p-3 bg-white shadow-md animate-pulse">
      <div className="w-full h-[140px] sm:h-[200px] bg-gray-200 rounded-md"></div>
      <div className="mt-2 h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="mt-1 h-4 bg-gray-200 rounded w-1/2"></div>
      <div className="mt-3 h-10 bg-gray-200 rounded"></div>
    </div>
  );
  
  const handleViewAll = (category: string) => {
    router.push(`/products?category=${category}`);
  };

  return (
    <>
      <Banner />
      <main className="pt-10">
        {/* Container 3 đảm bảo */}
        <div className="px-4 sm:px-6 lg:px-10 bg-gray-50 py-4 sm:py-6">
          <div className="container-custom max-w-7xl mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 py-4">
              {/* Box 1 */}
              <motion.div
                variants={fadeInUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                className="flex items-center gap-2 bg-white rounded-2xl border border-green-200 p-3 sm:p-5 shadow-lg shadow-green-50/50 hover:shadow-green-100/70 transition-all duration-300 text-gray-700 w-full break-words min-h-[80px] sm:min-h-[100px]"
              >
                <div className="flex items-center justify-center w-9 h-9 sm:w-12 sm:h-12 sm:bg-green-100 rounded-full text-green-700">
                  <i className="fa-solid fa-truck text-base sm:text-xl"></i>
                </div>
                <div className="text-xs sm:text-sm">
                  <strong className="text-green-700 font-semibold text-sm sm:text-base">Toàn quốc</strong>
                  <div className="sm:hidden text-[9px] text-gray-500 font-normal leading-tight mt-0.5">
                    Giao hàng tận nơi, thanh toán khi nhận hàng
                  </div>
                  {/* Hiển thị trên Desktop, ẩn trên iPad và mobile */}
                  <div className="hidden sm:block md:hidden lg:block text-sm text-gray-600 mt-1 leading-snug">
                    Vận chuyển <span className="text-green-700 font-semibold">Toàn quốc</span>
                    <br />
                    Thanh toán khi nhận hàng
                  </div>
                </div>
              </motion.div>

              {/* Box 2 */}
              <motion.div
                variants={fadeInUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                className="flex items-center gap-2 bg-white rounded-2xl border border-green-200 p-3 sm:p-5 shadow-lg shadow-green-50/50 hover:shadow-green-100/70 transition-all duration-300 text-gray-700 w-full break-words min-h-[80px] sm:min-h-[100px]"
              >
                <div className="flex items-center justify-center w-9 h-9 sm:w-12 sm:h-12 sm:bg-green-100 rounded-full text-green-700">
                  <i className="fa-solid fa-circle-check text-base sm:text-xl"></i>
                </div>
                <div className="text-xs sm:text-sm">
                  <strong className="text-green-700 font-semibold text-sm sm:text-base">Chính hãng</strong>
                  <div className="sm:hidden text-[9px] text-gray-500 font-normal leading-tight mt-0.5">
                    Sản phẩm cam kết chính hãng, chất lượng
                  </div>
                  <div className="hidden sm:block md:hidden lg:block text-sm text-gray-600 mt-1 leading-snug">
                    Bảo đảm <span className="text-green-700 font-semibold">Chất lượng</span>
                    <br />
                    Sản phẩm chính hãng
                  </div>
                </div>
              </motion.div>

              {/* Box 3 */}
              <motion.div
                variants={fadeInUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                className="flex items-center gap-2 bg-white rounded-2xl border border-green-200 p-3 sm:p-5 shadow-lg shadow-green-50/50 hover:shadow-green-100/70 transition-all duration-300 text-gray-700 w-full break-words min-h-[80px] sm:min-h-[100px]"
              >
                <div className="flex items-center justify-center w-9 h-9 sm:w-12 sm:h-12 sm:bg-green-100 rounded-full text-green-700">
                  <i className="fa-solid fa-credit-card text-base sm:text-xl"></i>
                </div>
                <div className="text-xs sm:text-sm">
                  <strong className="text-green-700 font-semibold text-sm sm:text-base">Thanh toán</strong>
                  <div className="sm:hidden text-[9px] text-gray-500 font-normal leading-tight mt-0.5">
                    Nhiều hình thức thanh toán tiện lợi
                  </div>
                  <div className="hidden sm:block md:hidden lg:block text-sm text-gray-600 mt-1 leading-snug">
                    Nhiều <span className="text-green-700 font-semibold">Phương thức</span>
                    <br />
                    Thanh toán tiện lợi
                  </div>
                </div>
              </motion.div>

              {/* Box 4 */}
              <motion.div
                variants={fadeInUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                className="flex items-center gap-2 bg-white rounded-2xl border border-green-200 p-3 sm:p-5 shadow-lg shadow-green-50/50 hover:shadow-green-100/70 transition-all duration-300 text-gray-700 w-full break-words min-h-[80px] sm:min-h-[100px]"
              >
                <div className="flex items-center justify-center w-9 h-9 sm:w-12 sm:h-12 sm:bg-green-100 rounded-full text-green-700">
                  <i className="fa-solid fa-headset text-base sm:text-xl"></i>
                </div>
                <div className="text-xs sm:text-sm">
                  <strong className="text-green-700 font-semibold text-sm sm:text-base">Đổi trả</strong>
                  <div className="sm:hidden text-[9px] text-gray-500 font-normal leading-tight mt-0.5">
                    Đổi sản phẩm mới nếu lỗi từ nhà sản xuất
                  </div>
                  <div className="hidden sm:block md:hidden lg:block text-sm text-gray-600 mt-1 leading-snug">
                    Đổi <span className="text-green-700 font-semibold">Sản phẩm</span>
                    <br />
                    Nếu lỗi từ nhà sản xuất
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        <FlashSale
          products={products}
          toggleFavorite={toggleFavorite}
          isFavorite={isFavorite}
          onFlashSalePriceMap={setFlashSalePriceMap}
        />

        {/* Sản phẩm hot */}
        <div className="container-custom relative">
          <div className="flex justify-center items-center my-12">
            <div className="text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-green-700">
                Sản phẩm hot nhất
              </h2>
              <p className="text-sm sm:text-base text-gray-500 mt-2 italic max-w-xl mx-auto">
                “Khám phá những mẫu giày và vợt cầu lông đang được yêu thích và lựa chọn nhiều nhất hiện nay.”
              </p>
            </div>
          </div>
          {loading && <p>Đang tải sản phẩm...</p>}
          {!loading && hotProducts.length === 0 && (
            <p>Không có sản phẩm hot nào.</p>
          )}
          {!loading && hotProducts.length > 0 && (
            <div className="relative">
              <Swiper
                modules={[Navigation]}
                slidesPerView={5}
                slidesPerGroup={2}
                spaceBetween={20}
                navigation={{
                  nextEl: '.custom-swiper-button-next',
                  prevEl: '.custom-swiper-button-prev',
                }}
                loop={hotProducts.length > 7 && hotProducts.length % 2 === 0} 
                className="!pb-10"
                breakpoints={{
                  320: { slidesPerView: 2, slidesPerGroup: 2 },
                  640: { slidesPerView: 2, slidesPerGroup: 2 },
                  768: { slidesPerView: 3, slidesPerGroup: 2 },
                  1024: { slidesPerView: 4, slidesPerGroup: 2 },
                  1280: { slidesPerView: 5, slidesPerGroup: 2 },
                }}
              >
                {hotProducts.map((product, index) => (
                  <SwiperSlide key={product._id}>
                    <motion.div
                      variants={productFadeIn}
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true, amount: 0.2 }}
                      transition={{ delay: index * 0.15, duration: 0.5, ease: "easeOut" }}
                      className="relative border border-gray-300 rounded-lg p-3 bg-white shadow-md text-center font-sans z-10 h-full flex flex-col"
                    >
                      {/* HOT badge */}
                      {product.hot === 1 && (
                        <div className="absolute top-2 left-2 z-20">
                          <div className="bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-r-full shadow badge-pulse">
                            <i className="fas fa-fire text-[10px] mr-1"></i>
                            HOT
                          </div>
                        </div>
                      )}
                      {/* Nút yêu thích */}
                      <div
                        className="absolute top-2 right-2 text-lg cursor-pointer z-20"
                        onClick={() => toggleFavorite(product._id)}
                      >
                        <i
                          className={`fas fa-heart ${
                            isFavorite(product._id) ? "text-red-600" : "text-gray-300"
                          } hover:text-red-600`}
                        ></i>
                      </div>
                      {/* Hình ảnh */}
                      <div className="w-full h-[140px] sm:h-[200px] flex items-center justify-center bg-white overflow-hidden">
                        <img
                          src={
                            product.images_main
                              ? `${IMAGE_URL}/${product.images_main}`
                              : "./img/no-image.jpg"
                          }
                          alt={product.name}
                          className="max-h-[120px] sm:max-h-[180px] object-contain transition-transform duration-300 ease-in-out hover:-rotate-12 hover:scale-105 active:-rotate-6"
                        />
                      </div>
                      {/* Tên sản phẩm */}
                      <div className="text-left text-[15px] sm:text-[16px] leading-snug font-medium text-gray-700 line-clamp-2 h-[4rem] sm:h-[3.5rem] mt-2">
                        {product.name}
                      </div>
                      {/* Giá & trạng thái */}
                      <div className="text-base text-gray-700 text-left mt-3 sm:mt-[20px] mb-3 sm:mb-[20px]">
                        <span className="text-red-600 font-bold">{getDisplayPriceFromVariants(product)}</span>
                        <span className="text-gray-600 ml-1">
                          {product.status === "active" || product.status === "Hot"}
                        </span>
                      </div>
                      {/* Nút hành động */}
                      <div className="flex justify-between items-center gap-2 mt-auto">
                        <button
                          onClick={() => handleBuyNow(product._id)}
                          className={`flex-1 py-2 px-2 text-xs sm:text-sm rounded-md border-2 border-green-700 bg-green-700 text-white whitespace-nowrap
                            ${isProductOutOfStock(product) ? "bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed" : "hover:bg-green-800"}
                            transition-all duration-200`}
                          disabled={isProductOutOfStock(product)}
                        >
                          {isProductOutOfStock(product) ? "Hết hàng" : "Mua"}
                        </button>
                        <button
                          onClick={() => handleAddToCart(product)}
                          className="w-full sm:w-1/2 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm hover:bg-gray-200 transition-colors flex items-center justify-center gap-1"
                          disabled={isProductOutOfStock(product)}
                        >
                          <i className="fas fa-shopping-cart"></i>
                          <span className="hidden sm:inline">
                            {isProductOutOfStock(product) ? "Hết hàng" : "Thêm giỏ"}
                          </span>
                        </button>
                      </div>
                    </motion.div>
                  </SwiperSlide>
                ))}
              </Swiper>
              {hotProducts.length > 5 && (
                <>
                  <div className="custom-swiper-button-prev absolute top-1/2 sm:top-[45%] top-[40%] left-0 z-30 -translate-y-1/2 border-2 border-green-700 bg-white/30 backdrop-blur-md text-green-700 w-10 h-10 rounded-full flex items-center justify-center shadow-lg cursor-pointer transition hover:bg-green-50 hover:text-green-900">
                    <i className="fa-solid fa-angle-left text-xl"></i>
                  </div>
                  <div className="custom-swiper-button-next absolute top-1/2 sm:top-[45%] top-[40%] right-0 z-30 -translate-y-1/2 border-2 border-green-700 bg-white/30 backdrop-blur-md text-green-700 w-10 h-10 rounded-full flex items-center justify-center shadow-lg cursor-pointer transition hover:bg-green-50 hover:text-green-900">
                    <i className="fa-solid fa-angle-right text-xl"></i>
                  </div>
                </>
              )}
            </div>
          )}
          <div className="mt-6 flex justify-center">
            <button
              className="group border border-green-700 text-green-700 px-4 py-2 rounded-md text-sm sm:text-base hover:bg-green-700 hover:text-white transition-all duration-300 ease-in-out transform hover:scale-105 flex items-center gap-1 justify-center w-[40%] sm:w-auto"
              onClick={() => router.push('/products?hot=true')}
            >
              Xem thêm
              <i className="fa-solid fa-angles-right transform transition-transform duration-300 group-hover:translate-x-1"></i>
            </button>
          </div>
        </div>

      {/* Banner nhỏ */}
        <div className="my-5">
          <div className="container-custom">
            <Link href="/products">
              <motion.img
                src="img/banner-sale.png"
                alt="Banner Sale"
                className="w-full rounded-lg shadow-md"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                viewport={{ once: true }}
              />
            </Link>
          </div>
        </div>

        {/* Show sản phẩm vợt */}
        <div className="container-custom md:mt-[80px]">
          {loading && <p>Đang tải sản phẩm...</p>}
          {!loading && filteredProductsVot.length === 0 && (
            <p>Không có sản phẩm trong danh mục Vợt.</p>
          )}
          <div className="flex gap-5 flex-col md:flex-row">
            {/* box trái */}
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              className="w-full md:w-1/4 bg-white rounded-lg overflow-hidden text-center shadow-md relative group z-10"
            >
              <div className="absolute inset-0 bg-black bg-opacity-30 z-0"></div>
              <img
                src="img/banner_cate.jpg"
                alt="Cầu lông player"
                className="w-full h-full object-cover transition-transform duration-400 group-hover:scale-105 group-hover:opacity-90"
              />
              <Link
                href={`/products?category=vợt cầu lông`}
                className="absolute top-3/4 left-1/2 -translate-x-1/2 bg-green-700 text-white px-7 py-2.5 min-w-[140px] rounded-md font-bold z-20 shadow-lg cursor-pointer text-center text-sm whitespace-nowrap"
              >
                Xem tất cả Vợt
              </Link>
            </motion.div>

            {/* box phải */}
            <motion.div
              variants={productFadeIn}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              className="w-full md:w-3/4"
            >
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
                <h2 className="text-xl sm:text-2xl font-semibold text-center sm:text-left">
                  Sản phẩm Vợt
                </h2>
                <div className="flex flex-wrap justify-center sm:justify-end gap-2.5">
                  {brands.map((brand) => (
                    <button
                      key={brand._id}
                      className={`px-4 py-1.5 border-2 border-green-700 rounded-md font-bold ${
                        selectedBrandVot === brand._id
                          ? "bg-green-700 text-white"
                          : "bg-white text-gray-700"
                      }`}
                      onClick={() => handleBrandClickVot(brand._id)}
                    >
                      {brand.name}
                    </button>
                  ))}
                </div>
              </div>
              <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {filteredProductsVot.slice(0, 8).map((product, index) => (
                  <motion.div
                    key={product._id}
                    variants={slideInRight}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ delay: index * 0.1, duration: 0.5, ease: "easeOut" }}
                    className="bg-white rounded-lg p-2.5 shadow-md flex flex-col justify-between h-full relative group border border-gray-300"
                  >
                    {/* Hot Icon */}
                    {product.hot === 1 && (
                      <div className="absolute top-2 left-2 z-20">
                        <div className="bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-r-full shadow badge-pulse">
                          <i className="fas fa-fire text-[10px] mr-1"></i>
                          HOT
                        </div>
                      </div>
                    )}
                    <div
                      className="absolute top-2 right-2 text-lg cursor-pointer z-20"
                      onClick={() => toggleFavorite(product._id)}
                    >
                      <i
                        className={`fas fa-heart ${
                          isFavorite(product._id)
                            ? "text-red-600"
                            : "text-gray-300"
                        } hover:text-red-600`}
                      ></i>
                    </div>
                    {/* Hình ảnh */}
                    <div className="w-full h-[140px] sm:h-[200px] flex items-center justify-center bg-white overflow-hidden">
                      <img
                        src={
                          product.images_main
                            ? `${IMAGE_URL}/${product.images_main}`
                            : "./img/no-image.jpg"
                        }
                        alt={product.name}
                        className="max-h-[120px] sm:max-h-[180px] object-contain transition-transform duration-300 ease-in-out hover:-rotate-12 hover:scale-105 active:-rotate-6"
                      />
                    </div>
                    {/* Tên sản phẩm */}
                    <div className="text-left text-[15px] sm:text-[16px] leading-snug font-medium text-gray-700 line-clamp-2 h-[4rem] sm:h-[3.5rem] mt-2">
                      {product.name}
                    </div>
                    {/* Giá & trạng thái */}
                    <div className="text-base text-gray-700 text-left mt-3 sm:mt-[20px] mb-3 sm:mb-[20px]">
                      <span className="text-red-600 font-bold">{getDisplayPriceFromVariants(product)}</span>
                      <span className="text-gray-600 ml-1">
                        {product.status === "active" || product.status === "Hot"}
                      </span>
                    </div>
                    {/* Nút hành động */}
                    <div className="flex justify-between items-center gap-2 mt-auto">
                      <button
                        onClick={() => handleBuyNow(product._id)}
                        className={`flex-1 py-2 px-2 text-xs sm:text-sm rounded-md border-2 border-green-700 bg-green-700 text-white whitespace-nowrap
                          ${isProductOutOfStock(product) ? "bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed" : "hover:bg-green-800"}
                          transition-all duration-200`}
                        disabled={isProductOutOfStock(product)}
                      >
                        {isProductOutOfStock(product) ? "Hết hàng" : "Mua"}
                      </button>
                      <button
                        onClick={() => handleAddToCart(product)}
                        className="w-full sm:w-1/2 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm hover:bg-gray-200 transition-colors flex items-center justify-center gap-1"
                        disabled={isProductOutOfStock(product)}
                      >
                        <i className="fas fa-shopping-cart"></i>
                        <span className="hidden sm:inline">
                          {isProductOutOfStock(product) ? "Hết hàng" : "Thêm giỏ"}
                        </span>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Banner nhỏ */}
        <div className="container-custom md:mt-[80px]">
          <img
            src="img/banner_small_21.png"
            alt=""
            className="w-full max-w-[1400px] rounded-lg"
          />
        </div>

        {/* Show sản phẩm giày */}
        <div className="container-custom md:mt-[80px] md:mb-[80px]">
          {loading && <p>Đang tải sản phẩm...</p>}
          {!loading && filteredProductsGiay.length === 0 && (
            <p>Không có sản phẩm trong danh mục Giày.</p>
          )}
          <div className="flex gap-5 flex-col md:flex-row">
            {/* box phải */}
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              className="w-full md:w-3/4"
            >
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2 sm:gap-0 text-center sm:text-left">
                <h2 className="text-2xl font-semibold">Sản phẩm Giày</h2>
                <div className="flex flex-wrap justify-center sm:justify-end gap-2.5">
                  {brands.map((brand) => (
                    <button
                      key={brand._id}
                      className={`px-4 py-1.5 border-2 border-green-700 rounded-md font-bold ${
                        selectedBrandGiay === brand._id
                          ? "bg-green-700 text-white"
                          : "bg-white text-gray-700"
                      }`}
                      onClick={() => handleBrandClickGiay(brand._id)}
                    >
                      {brand.name}
                    </button>
                  ))}
                </div>
              </div>
              <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {filteredProductsGiay.slice(0, 8).map((product, index) => (
                  <motion.div
                    key={product._id}
                    variants={productFadeIn}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ delay: index * 0.1, duration: 0.5, ease: "easeOut" }}
                    className="bg-white rounded-lg p-2.5 shadow-md flex flex-col justify-between h-full relative group border border-gray-300"
                  >
                    {/* Hot Icon */}
                    {product.hot === 1 && (
                      <div className="absolute top-2 left-2 z-20">
                        <div className="bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-r-full shadow badge-pulse">
                          <i className="fas fa-fire text-[10px] mr-1"></i>
                          HOT
                        </div>
                      </div>
                    )}
                    <div
                      className="absolute top-2 right-2 text-lg cursor-pointer z-20"
                      onClick={() => toggleFavorite(product._id)}
                    >
                      <i
                        className={`fas fa-heart ${
                          isFavorite(product._id)
                            ? "text-red-600"
                            : "text-gray-300"
                        } hover:text-red-600`}
                      ></i>
                    </div>
                    {/* Hình ảnh */}
                    <div className="w-full h-[140px] sm:h-[200px] flex items-center justify-center bg-white overflow-hidden">
                      <img
                        src={
                          product.images_main
                            ? `${IMAGE_URL}/${product.images_main}`
                            : "./img/no-image.jpg"
                        }
                        alt={product.name}
                        className="max-h-[120px] sm:max-h-[180px] object-contain transition-transform duration-300 ease-in-out hover:-rotate-12 hover:scale-105 active:-rotate-6"
                      />
                    </div>
                    {/* Tên sản phẩm */}
                    <div className="text-left text-[15px] sm:text-[16px] leading-snug font-medium text-gray-700 line-clamp-2 h-[4rem] sm:h-[3.5rem] mt-2">
                      {product.name}
                    </div>
                    {/* Giá & trạng thái */}
                    <div className="text-base text-gray-700 text-left mt-3 sm:mt-[20px] mb-3 sm:mb-[20px]">
                      <span className="text-red-600 font-bold">{getDisplayPriceFromVariants(product)}</span>
                      <span className="text-gray-600 ml-1">
                        {product.status === "active" || product.status === "Hot"}
                      </span>
                    </div>
                    {/* Nút hành động */}
                    <div className="flex justify-between items-center gap-2 mt-auto">
                      <button
                        onClick={() => handleBuyNow(product._id)}
                        className={`flex-1 py-2 px-2 text-xs sm:text-sm rounded-md border-2 border-green-700 bg-green-700 text-white whitespace-nowrap
                          ${isProductOutOfStock(product) ? "bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed" : "hover:bg-green-800"}
                          transition-all duration-200`}
                        disabled={isProductOutOfStock(product)}
                      >
                        {isProductOutOfStock(product) ? "Hết hàng" : "Mua"}
                      </button>
                      <button
                        onClick={() => handleAddToCart(product)}
                        className="w-full sm:w-1/2 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm hover:bg-gray-200 transition-colors flex items-center justify-center gap-1"
                        disabled={isProductOutOfStock(product)}
                      >
                        <i className="fas fa-shopping-cart"></i>
                        <span className="hidden sm:inline">
                          {isProductOutOfStock(product) ? "Hết hàng" : "Thêm giỏ"}
                        </span>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* box trái */}
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              className="w-full md:w-1/4 bg-white rounded-lg overflow-hidden text-center shadow-md relative group z-10"
            >
              <div className="absolute inset-0 bg-black bg-opacity-30 z-0"></div>
              <img
                src="img/banner_cate_2.png"
                alt="Giày thể thao player"
                className="w-full h-full object-cover transition-transform duration-400 group-hover:scale-105 group-hover:opacity-90"
              />
              <Link
                href={`/products?category=giày thể thao`}
                className="absolute top-3/4 left-1/2 -translate-x-1/2 bg-green-700 text-white px-7 py-2.5 min-w-[140px] rounded-md font-bold z-20 shadow-lg cursor-pointer text-center text-sm whitespace-nowrap"
              >
                Xem tất cả Giày
              </Link>
            </motion.div>
          </div>
        </div>
    
    {/* Nút Chatbot mới: Sử dụng component ChatbotButton */}
      <ChatbotButton setShowChat={setShowChat} />

      {/* Giao diện Chatbot Popup vẫn giữ nguyên */}
      <ChatbotPopup showChat={showChat} setShowChat={setShowChat} />

      </main>
    </>
  );
}