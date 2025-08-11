'use client';
import { useEffect, useState } from 'react';
import { Variant } from "@/types/variant.interface";
import { useSwipeable } from 'react-swipeable';
import { Product, FlashSaleProduct } from '@/types/product.interface';
import { toast } from 'react-toastify';
import { useDispatch } from 'react-redux';
import { addToCart } from '../../redux/slices/cartSlice';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { API_URL, IMAGE_URL } from '@/lib/api';
// Hook xác định breakpoint
function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  useEffect(() => {
    function handleResize() {
      const width = window.innerWidth;
      if (width < 640) setBreakpoint('mobile');
      else if (width < 1024) setBreakpoint('tablet');
      else setBreakpoint('desktop');
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return breakpoint;
}


// Type for flash sale product item
// interface FlashSaleProductItem {
//   product_id: { _id: string; variants?: any[] };
//   variant_id: string;
//   quantity?: number;
//   total_quantity?: number;
//   initial_quantity?: number;
//   start_quantity?: number;
//   sold_quantity?: number;
//   sold?: number;
//   [key: string]: any;
// }


interface FlashSaleProps {
  products: Product[];
  toggleFavorite: (productId: string) => Promise<void>;
  isFavorite: (productId: string) => boolean;
  onFlashSalePriceMap: (map: Map<string, { sale_price: number; original_price: number }>) => void;
}

export default function FlashSale({ products, toggleFavorite, isFavorite, onFlashSalePriceMap }: FlashSaleProps) {
  const breakpoint = useBreakpoint();
  const [flashSales, setFlashSales] = useState<any[]>([]);
  const [loadingFlashSale, setLoadingFlashSale] = useState(true);
  const [flashSaleStart, setFlashSaleStart] = useState(0);
  const [isSliding, setIsSliding] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [remainingTime, setRemainingTime] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
  const dispatch = useDispatch();
  const router = useRouter();

  useEffect(() => {
    const fetchFlashSales = async () => {
      try {
        const res = await fetch(`${API_URL}/flashsales`);
        if (!res.ok) throw new Error('Failed to fetch flash sales');
        const data = await res.json();
        const now = new Date();
        const active = data.filter((fs: any) => fs.status === 'Đang diễn ra');
        setFlashSales(active);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingFlashSale(false);
      }
    };
    fetchFlashSales();
  }, []);

  const flashSaleProductMap = new Map<string, FlashSaleProduct>();
  // Gom các variant cùng product_id và cộng dồn quantity
  const productMap = new Map<string, { product: Product, totalQuantity: number, variants: any[], sale_price: number, original_price: number }>();
flashSales.forEach((fs) => {
  fs.products.forEach((item: any) => {
    const prod = products.find((p) => p._id === item.product_id._id);
    if (!prod) return;
    let originalPrice = 0;
    let salePrice = 0;
    const variant = prod.variants?.find((v) => v._id === item.variant_id) || prod.variants?.[0];
    if (variant) {
      originalPrice = variant.cost_price;
      const basePrice = (variant.sale_price !== undefined && variant.sale_price !== null && variant.sale_price > 0)
    ? variant.sale_price
    : variant.cost_price;
  if (typeof fs.discount_value === 'number') {
    salePrice = Math.round(basePrice * (1 - fs.discount_value / 100));
  } else {
    salePrice = basePrice;
      }
    }
    if (productMap.has(prod._id)) {
      const entry = productMap.get(prod._id)!;
      entry.totalQuantity += item.quantity || 0;
      entry.variants.push(item);
    } else {
      productMap.set(prod._id, {
        product: prod,
        totalQuantity: item.quantity || 0,
        variants: [item],
        sale_price: salePrice,
        original_price: originalPrice
      });
    }
  });
});
  const flashSaleProducts = Array.from(productMap.values());

  // Create flashSalePriceMap and pass it to the parent
const flashSalePriceMap = new Map<string, { sale_price: number; original_price: number }>();
  flashSaleProducts.forEach(({ product, sale_price, original_price }) => {
    flashSalePriceMap.set(product._id, { sale_price, original_price });
  });

  useEffect(() => {
    onFlashSalePriceMap(flashSalePriceMap);
  }, [flashSales, products, onFlashSalePriceMap]);

  const handlePrev = () => {
    setIsSliding(true);
    let newIndex = flashSaleStart - 1;
    if (newIndex < 0) {
      newIndex = flashSaleProducts.length - 1;
    }
    setFlashSaleStart(newIndex);
  };

  const handleNext = () => {
    setIsSliding(true);
    let newIndex = flashSaleStart + 1;
    if (newIndex >= flashSaleProducts.length) {
      newIndex = 0;
    }
    setFlashSaleStart(newIndex);
  };

  useEffect(() => {
    const container = document.getElementById('flashsale-scroll');
    if (container) {
      const scrollAmount = breakpoint === 'mobile' ? 160 : 320;
      container.scrollTo({ left: flashSaleStart * scrollAmount, behavior: 'smooth' });
    }
    const timer = setTimeout(() => setIsSliding(false), 400);
    return () => clearTimeout(timer);
  }, [flashSaleStart, breakpoint]);

//   useEffect(() => {
//   if (flashSaleProducts.length === 0) return;
//   const autoSlide = setInterval(() => {
//     if (!isInteracting && !isHovering) {
//       setFlashSaleStart((prevIndex) => {
//         const nextIndex = prevIndex + 1;
//         if (nextIndex >= flashSaleProducts.length) {
//           setTimeout(() => setFlashSaleStart(0), 400);
//           return prevIndex;
//         }
//         return nextIndex;
//       });
//       setIsSliding(true);
//       setTimeout(() => setIsSliding(false), 400);
//     }
//   }, 4000);
//   return () => clearInterval(autoSlide);
// }, [flashSaleProducts.length, isInteracting, isHovering]);

  useEffect(() => {
    if (flashSales.length === 0) {
      setRemainingTime(null);
      return;
    }
    let interval: NodeJS.Timeout;
    const updateTimer = () => {
      const now = new Date();
      const validSales = flashSales.filter(fs => fs.end_time && new Date(fs.end_time) > now);
      if (validSales.length > 0) {
        const soonest = validSales.reduce((a, b) => new Date(a.end_time) < new Date(b.end_time) ? a : b);
        const end = new Date(soonest.end_time);
        const diff = end.getTime() - now.getTime();
        if (diff > 0) {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          setRemainingTime({ hours, minutes, seconds });
        } else {
          setRemainingTime(null);
        }
      } else {
        setRemainingTime(null);
      }
    };
    updateTimer();
    interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [flashSales]);

  const isProductOutOfStock = (product: Product) => {
    return !product.variants || product.variants.length === 0 || !product.variants.some((v) => v.stock > 0);
  };
const handleAddToCart = (product: Product) => {
    const user = localStorage.getItem('user');
    if (!user) {
      toast.warning('Vui lòng đăng nhập để thêm vào giỏ hàng');
      return;
    }
    if (isProductOutOfStock(product)) {
      toast.warning('Sản phẩm đã hết hàng');
      return;
    }
    const availableVariant = product.variants?.find((v) => v.stock > 0);
    if (!availableVariant) {
      toast.warning('Sản phẩm không có phiên bản khả dụng');
      return;
    }
    const cartItem = {
      _id: Math.random().toString(),
      productId: product._id,
      variantId: availableVariant._id,
      quantity: 1,
      note: '',
      productName: product.name,
      productImage: product.images_main || '',
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
    toast.success('Đã thêm vào giỏ hàng');
  };

  const handleBuyNow = (productId: string) => {
    router.push(`/detail/${productId}`);
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => handleNext(),
    onSwipedRight: () => handlePrev(),
    trackMouse: true,
  });

  // Xác định số lượng tối thiểu để hiện nút và cho phép scroll/swipe
  let minForScroll = 5; // desktop mặc định
  if (breakpoint === 'mobile') {
    minForScroll = 2;
  } else if (breakpoint === 'tablet') {
    minForScroll = 4;
  } else {
    minForScroll = 5;
  }

  // Nếu số lượng sản phẩm nhỏ hơn hoặc bằng minForScroll thì không cho scroll/lướt nữa và ẩn nút mũi tên
  const showNavButtons = flashSaleProducts.length > minForScroll;
  const allowScroll = flashSaleProducts.length >= minForScroll;

  if (flashSaleProducts.length === 0) return null;

  return (
    <div className="container-custom mt-6 sm:mt-[40px] px-2 sm:px-0">
      <div className="w-full flex justify-center">
        <div className="w-full max-w-7xl rounded-2xl sm:rounded-3xl bg-gradient-to-br from-green-600 via-green-400 to-green-300 border-4 sm:border-[10px] border-green-500 p-0 sm:p-1 mb-6 sm:mb-8">
          <div className="rounded-xl sm:rounded-2xl p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-3 mb-4 sm:mb-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-10">
                <motion.h2
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                  className="text-xl sm:text-2xl lg:text-3xl font-extrabold italic tracking-wider text-center sm:text-left text-white drop-shadow-md"
                >
                  FLASH SALES ĐANG DIỄN RA!
                </motion.h2>
                {remainingTime ? (
                  <span className="text-xs sm:text-[15px] font-semibold text-orange-700 bg-orange-100 rounded px-2 sm:px-3 py-1 text-center sm:text-left">
                    Kết thúc sau: {remainingTime.hours}h {remainingTime.minutes}m {remainingTime.seconds}s
                  </span>
                ) : (
                  <span className="text-xs sm:text-[15px] font-semibold text-orange-700 bg-orange-100 rounded px-2 sm:px-3 py-1 text-center sm:text-left">
                    Đã kết thúc
                  </span>
                )}
              </div>
            </div>
          <div className="relative flex items-center">
            {/* {showNavButtons && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 z-30">
                <button
                  className="bg-white border rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center shadow hover:bg-gray-100"
                  onClick={handlePrev}
                  aria-label="Trước"
                >
                  <i className="fa-solid fa-chevron-left text-sm sm:text-base"></i>
                </button>
              </div>
            )} */}
            <div
              id="flashsale-scroll"
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
              onTouchStart={() => setIsInteracting(true)}
              onTouchEnd={() => setIsInteracting(false)}
              className={`flex gap-3 sm:gap-4  ${allowScroll ? 'overflow-x-auto' : ''}`}
              style={{
                scrollSnapType: allowScroll ? 'x mandatory' : undefined,
                minHeight: breakpoint === 'mobile' ? '280px' : '320px',
                WebkitOverflowScrolling: allowScroll ? 'touch' : undefined,
                // msOverflowStyle: 'none', // IE/Edge
                // scrollbarWidth: 'none', // Firefox
              }}
              {...(allowScroll ? swipeHandlers : {})}
              // Ẩn scrollbar trên Chrome/Safari
            >
              <style>{`
                #flashsale-scroll::-webkit-scrollbar {
                  height: 8px;
                  background: transparent; /* Nền tổng thể của scrollbar */
                }
                #flashsale-scroll::-webkit-scrollbar-thumb {
                  background: rgba(0,0,0,0.18); /* Thanh kéo */
                  border-radius: 4px;
                }
                #flashsale-scroll::-webkit-scrollbar-track {
                  background: rgba(255,255,255,0.5); /* <-- Đây là phần track, chỉnh độ mờ ở đây */
                  border-radius: 4px;
                }
                #flashsale-scroll {
                  scrollbar-color: rgba(0,0,0,0.18) rgba(255,255,255,0.5); /* Firefox */
                  scrollbar-width: thin;
                }
              `}</style>
              
              {flashSaleProducts.map(({ product, variants, sale_price, original_price }, index) => {
        // Lấy variant còn hàng, nếu không có thì lấy variant đầu tiên
        const variant = variants && variants.length > 0 ? variants.find(v => v.quantity > 0) || variants[0] : undefined;

        // Tính toán sold và totalInitial cho nút "Mua"
        let totalInitial = 0;
        let remain = 0;
        const entry = productMap.get(product._id);
        if (entry) {
          entry.variants.forEach((item) => {
            if (typeof item.initial_quantity === 'number') {
              totalInitial += item.initial_quantity;
            } else if (typeof item.quantity === 'number') {
              totalInitial += item.quantity;
            }
            if (typeof item.quantity === 'number') {
              remain += item.quantity;
            }
          });
        }
        let sold = totalInitial - remain;
        if (sold < 0) sold = 0;
        const isSoldOut = totalInitial > 0 && sold >= totalInitial;

  return (
    <div
      key={product._id + '-' + (variant?._id || 'no-variant')}
      className="flex-shrink-0 basis-[140px] sm:basis-[157px] md:basis-[200px] lg:basis-[230px] xl:basis-[215px] max-w-[100%] min-w-[120px] relative border border-orange-400 rounded-lg p-2 sm:p-3 bg-white shadow-md text-center font-sans transition-transform duration-300 z-100 mb-4"
      style={{ scrollSnapAlign: 'start' }}
    >
      <div className="absolute top-1 sm:top-2 left-1 sm:left-2 z-20 flex flex-col items-start">
        <div className="bg-orange-600 text-white text-[8px] sm:text-[10px] font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-r-full shadow badge-pulse">
          FLASH SALE
        </div>
        <span className="mt-1 text-[10px] sm:text-xs font-bold text-orange-600 bg-orange-100 rounded px-1 py-0.5 mr-1 block sm:hidden">
          {(() => {
            let percent = 0;
            if (variant && flashSales.length > 0) {
              const fs = flashSales.find(fs => fs.products.some((item: any) => item.product_id._id === product._id && item.variant_id === variant._id));
              if (fs && typeof fs.discount_value === 'number') {
                percent = fs.discount_value;
              }
            }
            return percent > 0 ? `-${percent}%` : null;
          })()}
        </span>
      </div>
      <div className="absolute top-1 sm:top-2 right-1 sm:right-2 flex flex-col items-end gap-1 text-base sm:text-lg cursor-pointer z-20">
        {/* Responsive: flex-col on mobile, flex-row on sm+ */}
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1">
          {/* % badge */}
          <span className="text-[10px] sm:text-xs font-bold text-orange-600 bg-orange-100 rounded px-1 py-0.5 mr-1 hidden sm:inline order-1 sm:order-1">
            {(() => {
              let percent = 0;
              if (variant && flashSales.length > 0) {
                const fs = flashSales.find(fs => fs.products.some((item: any) => item.product_id._id === product._id && item.variant_id === variant._id));
                if (fs && typeof fs.discount_value === 'number') {
                  percent = fs.discount_value;
                }
              }
              return percent > 0 ? `-${percent}%` : null;
            })()}
          </span>
          {/* Còn badge: trước heart trên desktop, sau heart trên mobile */}
          {/* <span className="text-xs font-semibold text-yellow-800 bg-yellow-100 rounded px-1 py-0.5 mr-1 block order-3 sm:order-2">
            Còn: {(() => {
              let quantity = 0;
              const fs = flashSales.find(fs => fs.products.some((item: any) => item.product_id._id === product._id && item.variant_id === variant?._id));
              if (fs) {
                const item = fs.products.find((item: any) => item.product_id._id === product._id && item.variant_id === variant?._id);
                if (item && typeof item.quantity === 'number') {
                  quantity = item.quantity;
                }
              }
              return quantity;
            })()}
          </span> */}
          {/* Heart icon: sau 'Còn' trên desktop, trước 'Còn' trên mobile */}
          <span onClick={() => toggleFavorite(product._id)} className="order-2 sm:order-3">
            <i
              className={`fas fa-heart text-sm sm:text-base ${isFavorite(product._id) ? 'text-orange-600' : 'text-gray-300'} hover:text-orange-600`}
            ></i>
          </span>
        </div>
      </div>
      <div className="w-full h-[120px] sm:h-[140px] md:h-[200px] flex items-center justify-center bg-white overflow-hidden">
        <img
          src={`${IMAGE_URL}/${variant?.image || product.images_main}`}
          alt={product.name}
          className="max-h-[100px] sm:max-h-[120px] md:max-h-[180px] object-contain transition-transform duration-300 ease-in-out hover:-rotate-3 active:-rotate-2"
        />
      </div>
      <div className="text-left text-[13px] sm:text-[15px] md:text-[16px] leading-snug font-medium text-gray-700 line-clamp-2 h-[3.5rem] sm:h-[4rem] md:h-[3.5rem] mt-2">
        {product.name}
      </div>
      {/* Thanh progress lượt mua và còn lại */}
      {(() => {
        // Tính tổng initial_quantity và quantity còn lại cho tất cả variant cùng product_id
        const entry = productMap.get(product._id);
        if (!entry) return null;
        let totalInitial = 0;
        let remain = 0;
        entry.variants.forEach((item) => {
          // Ưu tiên lấy initial_quantity nếu có, nếu không thì lấy quantity ban đầu
          if (typeof item.initial_quantity === 'number') {
            totalInitial += item.initial_quantity;
          } else if (typeof item.quantity === 'number') {
            totalInitial += item.quantity;
          }
          if (typeof item.quantity === 'number') {
            remain += item.quantity;
          }
        });
        let sold = totalInitial - remain;
        if (sold < 0) sold = 0;
        let percent = 0;
        if (totalInitial > 0) {
          percent = Math.round((sold / totalInitial) * 100);
        }
        return (
          <div className="w-full mt-2 mb-1">
            <div className="flex justify-between text-[10px] sm:text-xs font-semibold mb-1">
              <span className="text-orange-600">Lượt mua {sold}</span>
              <span className="text-yellow-700">Còn lại {remain}</span>
            </div>
            {totalInitial > 0 ? (
              <div className="w-full h-2 sm:h-3 bg-orange-100 rounded-full relative overflow-hidden">
                <div
                  className="h-2 sm:h-3 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full transition-all duration-300"
                  style={{ width: `${percent}%` }}
                ></div>
              </div>
            ) : null}
          </div>
        );
      })()}
      <div className="text-base text-gray-700 text-left mt-2 sm:mt-3 md:mt-[20px] mb-2 sm:mb-3 md:mb-[20px] flex flex-col items-start">
        <span className="text-gray-500 line-through text-[10px] sm:text-xs md:text-base mb-0.5 sm:mb-1 md:mb-0">
          {original_price.toLocaleString()}đ
        </span>
        <span className="text-orange-600 font-bold text-sm sm:text-base md:text-xl">
          {sale_price.toLocaleString()}đ
        </span>
      </div>
      <div className="flex justify-between items-center gap-1.5 sm:gap-2">
        <button
          onClick={() => handleBuyNow(product._id)}
          className={`flex-1 text-center px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs md:text-sm rounded-md flex items-center justify-center gap-1 
            ${isSoldOut
              ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-300"
              : "text-white bg-orange-600 hover:bg-orange-700"}
          `}
          disabled={isSoldOut}
        >
          {isSoldOut ? "Hết hàng" : "Mua"}
        </button>
        {/* <button
  onClick={() => handleAddToCart(product)}
   className={`flex-1 px-2 sm:px-3 py-1.5 sm:py-2 text-[9px] sm:text-[11px] md:text-xs rounded-md flex items-center justify-center gap-[2px] whitespace-nowrap
    ${
      isProductOutOfStock(product)
        ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-300"
        : "bg-white border border-gray-300 hover:bg-gray-50"
    }`}
  disabled={isProductOutOfStock(product)}
>
  <i className="fas fa-shopping-cart text-[10px] sm:text-xs"></i>
  <span className="hidden sm:inline">
    {isProductOutOfStock(product) ? "Hết hàng" : "Thêm giỏ"}
  </span>
</button> */}
      </div>
    </div>
  );
})}
        </div>
        {/* {showNavButtons && (
          <button
            className="absolute right-0 z-10 bg-white border rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center shadow hover:bg-gray-100"
            onClick={handleNext}
            style={{ top: '50%', transform: 'translateY(-50%)' }}
            aria-label="Sau"
          >
            <i className="fa-solid fa-chevron-right text-sm sm:text-base"></i>
          </button>
        )} */}
      </div>
    </div>
    </div>
    </div>
    </div>
  );
}