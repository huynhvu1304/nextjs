"use client";
import { API_URL, IMAGE_URL, IMAGE_USER_URL } from "@/lib/api";
import Link from "next/link";
import { useEffect, useState, useRef, useMemo } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useRouter } from "next/navigation";
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import SpinWheel from '../Spin-wheel/SpinWheel';
import { AnimatePresence, motion } from "framer-motion";

import Fuse from "fuse.js";
import debounce from 'lodash.debounce';

import './Header.css';

interface Product {
  _id: string;
  name: string;
  images_main?: string;
  status?: string;
  price?: number;
  hot?: number;
  categoryId?: {
    _id: string;
    name: string;
  };
}

const Header = () => { 
  const [menuOpen, setMenuOpen] = useState(false);
  const [productDropdown, setProductDropdown] = useState(false);
  const [userName, setUserName] = useState("");
  const [userImg, setUserImg] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [mobileSearchVisible, setMobileSearchVisible] = useState(false);
  const [userImgSrc, setUserImgSrc] = useState("/img/default.png");
  // Spin Wheel states
  const [showSpinWheel, setShowSpinWheel] = useState(false);
  const [hasCheckedSpinToday, setHasCheckedSpinToday] = useState(false);

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  useEffect(() => {
  fetch(`${API_URL}/products`)

      .then(res => res.json())
      .then(data => {
        const active = data.filter((p: Product) => p.status !== "inactive");
        setAllProducts(active);
      })
      .catch(err => {
        console.error("Lỗi tải sản phẩm:", err);
        toast.error("Không thể tải danh sách sản phẩm");
      });
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Gọi Fuse và debounce kết hợp thêm nút load
  const performSearch = useMemo(
    () =>
      debounce((query: string) => {
        const fuse = new Fuse<Product>(allProducts, {
          keys: ["name"],
          threshold: 0.4,
        });

        const fuzzyResult = fuse.search(query);
        const filtered = fuzzyResult.map((r) => r.item);

        setSuggestions(filtered);
        setShowSuggestions(true);
        setIsLoading(false); 
      }, 400),
    [allProducts]
  );


  // Gọi fuzzy search mỗi khi searchQuery thay đổi
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true); 

    performSearch(searchQuery);

    return () => {
      performSearch.cancel();
    };
  }, [searchQuery, performSearch]);

  // Kiểm tra và hiển thị Spin Wheel khi user đã đăng nhập
  useEffect(() => {
    const checkAndShowSpinWheel = () => {
      const token = localStorage.getItem("token");
      const user = localStorage.getItem("user");
      
      if (token && user && !hasCheckedSpinToday) {
        const today = new Date().toDateString();
        const lastCheck = localStorage.getItem("lastSpinCheck");
        
        if (lastCheck !== today) {
          // Chỉ hiển thị một lần mỗi ngày
          setShowSpinWheel(true);
          setHasCheckedSpinToday(true);
          localStorage.setItem("lastSpinCheck", today);
        }
      }
    };

    // Delay một chút để đảm bảo user đã load xong
    const timer = setTimeout(checkAndShowSpinWheel, 2000);
    
    return () => clearTimeout(timer);
  }, [hasCheckedSpinToday]);

  useEffect(() => {
    const updateUserInfo = () => {
        const userData = localStorage.getItem("user");
        if (userData) {
            const parsedUser = JSON.parse(userData);
            setUserName(parsedUser.name || "");
            
            // Xử lý logic để có URL ảnh đầy đủ
            let imgUrl = "/img/default.png";
            if (parsedUser.img) {
                if (parsedUser.img.startsWith("http://") || parsedUser.img.startsWith("https://")) {
                    imgUrl = parsedUser.img;
                } else {
                     imgUrl = `${IMAGE_USER_URL}/${parsedUser.img}`;
                }
            }
            setUserImg(parsedUser.img || ""); 
            setUserImgSrc(imgUrl); 
        } else {
            setUserName("");
            setUserImg("");
            setUserImgSrc("/img/default.png"); 
        }
    };
    
    updateUserInfo();
    window.addEventListener("userInfoChanged", updateUserInfo);
    return () => window.removeEventListener("userInfoChanged", updateUserInfo);
}, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("lastSpinCheck");
    setUserName("");
    setMenuOpen(false);
    toast.success("Đăng xuất thành công!");
    setTimeout(() => {
      window.location.href = "/";
    }, 1500);
  };

  // Lấy state từ Redux store
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  const [favoriteCount, setFavoriteCount] = useState(0);

  useEffect(() => {
    const fetchFavorites = async () => {
      const token = localStorage.getItem("token");
      if (!token) return setFavoriteCount(0);
      const res = await fetch(`${API_URL}/users/favorites`, {
  headers: { Authorization: `Bearer ${token}` },
});

      if (res.ok) {
        const data = await res.json();
        setFavoriteCount(data.length);
      }
    };
    fetchFavorites();

    // Có thể lắng nghe event custom để cập nhật khi thêm/xóa yêu thích
    window.addEventListener("favoriteChanged", fetchFavorites);
    return () => window.removeEventListener("favoriteChanged", fetchFavorites);
  }, []);
  const handleImageError = () => {
    setUserImgSrc("/img/default.png");
  };
  return (
    <>
      {/* Spin Wheel Modal */}
      <SpinWheel 
        isOpen={showSpinWheel} 
        onClose={() => setShowSpinWheel(false)} 
      />

      {/* Thay đổi div banner thông báo */}
      <div className="fixed top-0 left-0 right-0 z-[1000] bg-[#0A9300] text-white flex justify-center items-center text-sm sm:text-base font-semibold select-none overflow-x-hidden whitespace-nowrap py-1 px-4">
        <p className="inline-block pl-[50%] animate-marquee m-0">
          Chào mừng đến với NovaShop – Nơi bạn thỏa sức đam mê, sáng tạo không giới hạn và khẳng định phong cách riêng!
        </p>
      </div>

      {/* Thay đổi header */}
      <header className="fixed top-[25px] left-0 right-0 z-[999] bg-white shadow-md transition-all duration-300 ease-in-out">
        <div className="container-custom flex flex-wrap items-center justify-between gap-4 box-border">
          <div className="lg:hidden">
            {/* Mobile Logo */}
            <Link href="/">
              <img
                src="/img/logo.png"
                alt="Nova Shop Logo"
                className="h-[50px] w-auto"
              />
            </Link>
            </div>

          <div className="lg:hidden flex items-center gap-4">
            <button
              onClick={() => setMobileSearchVisible(prev => !prev)}
              className="text-2xl text-[#1a7a00]"
              aria-label="Tìm kiếm"
            >
              <i className="fas fa-search"></i>
            </button>


            <button
              onClick={() => setMobileMenuOpen(true)}
              className="text-2xl text-[#1a7a00]"
              aria-label="Mở menu"
            >
              <i className="fas fa-bars"></i>
            </button>
          </div>

          {/* thanh tìm kiếm mobile */}
          <AnimatePresence>
            {mobileSearchVisible && (
              <motion.div
                key="mobileSearch"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.25 }}
                className="lg:hidden px-4 mt-2 w-full"
              >
            <div className="lg:hidden px-4 mt-2 w-full">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
                  onFocus={() => {
                    if (suggestions.length > 0) setShowSuggestions(true);
                  }}
                />
                {/* Nút X để đóng search */}
                <button
                  onClick={() => {
                    setMobileSearchVisible(false);
                    setSearchQuery('');
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  aria-label="Đóng tìm kiếm"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

                {/* Gợi ý sản phẩm (dùng lại từ desktop) */}
                {showSuggestions && (
                  <ul className="absolute z-20 left-4 right-4 mt-2 bg-white border border-gray-300 rounded-lg max-h-64 overflow-y-auto shadow-lg">
                    {isLoading ? (
                      <li className="flex flex-col justify-center items-center py-6 gap-2">
                        <div className="loader scale-75">
                          <div className="bar1"></div>
                          <div className="bar2"></div>
                          <div className="bar3"></div>
                          <div className="bar4"></div>
                          <div className="bar5"></div>
                          <div className="bar6"></div>
                          <div className="bar7"></div>
                          <div className="bar8"></div>
                          <div className="bar9"></div>
                          <div className="bar10"></div>
                          <div className="bar11"></div>
                          <div className="bar12"></div>
                        </div>
                        <span className="text-xs text-gray-500">Đang tìm kiếm sản phẩm...</span>
                      </li>
                    ) : suggestions.length > 0 ? (
                      suggestions.map((product) => (
                        <li
                          key={product._id}
                          className="flex items-center px-4 py-3 hover:bg-blue-50 cursor-pointer transition"
                          onMouseDown={() => {
                            setSearchQuery(product.name);
                            setShowSuggestions(false);
                            router.push(`/detail/${product._id}`);
                            setTimeout(() => setSearchQuery(""), 1000);
                          }}
                        >
                          <img
                           src={`${IMAGE_URL}/${product.images_main}`}
                            alt={product.name}
                            className="w-10 h-10 rounded-md object-contain bg-white mr-4"
                          />
                          <span className="text-gray-800 font-medium">{product.name}</span>
                        </li>
                      ))
                    ) : (
                      <li className="px-4 py-3 text-gray-500 text-sm text-center">
                        Không có sản phẩm phù hợp
                      </li>
                    )}
                  </ul>
                )}
              </div>
              </motion.div>
            )}
          </AnimatePresence>


          {/* Main content: Menu + Search + Icons + Auth */}
          <div className="hidden lg:grid w-full grid-cols-[auto_1fr_auto] items-center gap-10 min-w-0">
            {/* Menu */}
            <nav className="flex items-center gap-6 flex-wrap">
              {/* Logo */}
              <div className="logo flex-shrink-0">
                {/* Desktop Logo */}
                <Link href="/">
                  <img
                    src="/img/logo.png"
                    alt="Nova Shop Logo"
                    className="h-[30px] sm:h-[40px] lg:h-[70px] w-auto"
                  />
                </Link>
              </div>
              <Link
                href="/"
                className="font-semibold text-black border-b-[3px] border-transparent hover:border-[#1a7a00] hover:text-[#1a7a00] transition-all duration-200 pb-1"
              >
                Trang chủ
              </Link>

              <Link
                href="/products"
                className="font-semibold text-black border-b-[3px] border-transparent hover:border-[#1a7a00] hover:text-[#1a7a00] transition-all duration-200 pb-1 flex items-center gap-1"
              >
                Sản phẩm
              </Link>
              <Link
                href="/about"
                className="font-semibold text-black border-b-[3px] border-transparent hover:border-[#1a7a00] hover:text-[#1a7a00] transition-all duration-200 pb-1"
              >
                Giới thiệu
              </Link>
               <Link
                href="/contact"
                className="font-semibold text-black border-b-[3px] border-transparent hover:border-[#1a7a00] hover:text-[#1a7a00] transition-all duration-200 pb-1"
              >
                Liên hệ
              </Link>
            </nav>

            {/* Thanh tìm kiếm */}
            <div className="relative w-full max-w-[400px]">
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
                className="w-full pr-11 pl-4 py-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 placeholder:text-gray-400"
              />
              <i className="fas fa-search absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />

              {showSuggestions && (
              <ul className="absolute z-20 left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-64 overflow-y-auto custom-scrollbar">
                {isLoading ? (
                  <li className="flex flex-col justify-center items-center py-6 gap-2">
                    <div className="loader scale-75">
                      <div className="bar1"></div>
                      <div className="bar2"></div>
                      <div className="bar3"></div>
                      <div className="bar4"></div>
                      <div className="bar5"></div>
                      <div className="bar6"></div>
                      <div className="bar7"></div>
                      <div className="bar8"></div>
                      <div className="bar9"></div>
                      <div className="bar10"></div>
                      <div className="bar11"></div>
                      <div className="bar12"></div>
                    </div>
                    <span className="text-xs text-gray-500">Đang tìm kiếm sản phẩm...</span>
                  </li>
                ) : suggestions.length > 0 ? (
                  suggestions.map((product) => (
                    <li
                      key={product._id}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-blue-100/30 transition-all duration-200 cursor-pointer"
                      onMouseDown={() => {
                        setSearchQuery(product.name);
                        setShowSuggestions(false);
                        router.push(`/detail/${product._id}`);
                        setTimeout(() => setSearchQuery(""), 1000);
                      }}
                    >
                      <img
                       src={`${IMAGE_URL}/${product.images_main}`}
                        alt={product.name}
                        className="w-10 h-10 rounded-lg object-contain bg-white border border-gray-100"
                      />
                      <span className="text-gray-800 text-sm font-medium truncate">
                        {product.name}
                      </span>
                    </li>
                  ))
                ) : (
                  <li className="px-4 py-3 text-gray-500 text-xs text-center">
                    Không có sản phẩm phù hợp
                  </li>
                )}
              </ul>
            )}

            </div>

            {/* Icons + Auth */}
            <div className="flex items-center gap-4 flex-nowrap">
              {/* Favorite + Cart */}
              <div className="flex gap-4">
                {/* Nút Vòng quay */}
                {userName && (
                      <button
                        onClick={() => setShowSpinWheel(true)}
                        className="relative w-10 h-10 border-2 border-[#1a7a00] rounded-full flex items-center justify-center text-[#1a7a00] text-xl tooltip"
                        data-tooltip="Vòng quay may mắn"
                      >
                        <i className="fa-solid fa-gamepad"></i> {/* Icon vòng quay */}
                      </button>
                    )}

                <Link href="/favorite" className="relative w-10 h-10 border-2 border-[#1a7a00] rounded-full flex items-center justify-center text-[#1a7a00] text-xl" >
                  <i className="fas fa-heart"></i>
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] h-5 min-w-[20px] px-1 rounded-full flex items-center justify-center">
                    {favoriteCount}
                  </span>
                </Link>

                <Link href="/cart" className="relative w-10 h-10 border-2 border-[#1a7a00] rounded-full flex items-center justify-center text-[#1a7a00] text-xl" >
                  <i className="fas fa-shopping-cart"></i>
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] h-5 min-w-[20px] px-1 rounded-full flex items-center justify-center">
                    {cartItemCount}
                  </span>
                </Link>
              </div>

              {/* Auth / User Info */}
              <div className="flex items-center gap-4 relative" ref={menuRef}>
                {userName ? (
                  <>
                    <div className="text-[#1a7a00] font-semibold">Xin chào! {userName}</div>
                    <button onClick={() => setMenuOpen(!menuOpen)} className="w-10 h-10 bg-[#e7e3e3] text-white rounded-full hover:bg-green-600 transition flex items-center justify-center" > 
               
                      {userImgSrc ? (
                    <img
                      src={userImgSrc} // Sử dụng state mới
                      alt="User Avatar"
                      className="w-8 h-8 rounded-full object-cover"
                      onError={handleImageError} 
                    />
                      ) : (
                        <i className="fa-solid fa-user text-[18px]"></i>
                      )}
                      
                      </button>
                    {menuOpen && (                                                                                                                                                     
                      <div className="absolute top-full right-0 mt-2 w-40 bg-white border border-gray-200 rounded shadow-md z-50">
                        <Link href="/user" className="flex items-center justify-between px-4 py-2 hover:bg-gray-100" 
                          onClick={() => setMenuOpen(false)} > 
                          <span>Thông tin</span> 
                          <i className="fa-solid fa-gear ml-2"></i> 
                        </Link>
                        
                        <Link href="/orders" className="flex items-center justify-between px-4 py-2 hover:bg-gray-100" 
                          onClick={() => setMenuOpen(false)} > 
                          <span>Đơn hàng</span> 
                          <i className="fa-solid fa-box ml-2"></i> 
                        </Link>

                        <button onClick={handleLogout} className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-100" > <span>Đăng xuất</span> <i className="fa-solid fa-arrow-right-from-bracket ml-2"></i> </button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <Link href="/login" className="px-4 py-2 rounded font-bold text-[#1a7a00] border-2 border-[#1a7a00] hover:bg-[#1a7a00] hover:text-white transition" > Đăng nhập </Link>
                    {/* <Link href="/signup" className="px-6 py-2 rounded font-bold text-white bg-[#1a7a00] hover:bg-[#145500] transition" > Đăng ký </Link> */}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* menu trên điện thoại */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              {/* Backdrop mờ phía sau */}
              <motion.div
                key="overlay"
                className="fixed inset-0 bg-black bg-opacity-40 z-[999]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
              />

              {/* Sidebar menu trượt vào */}
              <motion.div
                key="mobileMenu"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed inset-0 bg-white z-[1000] p-6 flex flex-col gap-4 text-[#1a7a00] sm:hidden overflow-y-auto"
              >
                {/* Logo + Nút đóng */}
                <div className="flex justify-between items-center">
                  <Link href="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-4">
                    <img
                      src="/img/logo.png"
                      alt="NovaShop"
                      className="h-[50px] w-auto mt-6"
                    />
                  </Link>

                  <button onClick={() => setMobileMenuOpen(false)} className="text-2xl" aria-label="Đóng menu">
                    <i className="fas fa-times"></i>
                  </button>
                </div>

                {/* Xin chào user */}
                <div className="text-base font-semibold">
                  Xin chào! {userName || "Khách"}
                </div>

                {/* Các mục menu */}
                <Link href="/" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium hover:bg-green-100 px-2 rounded-md transition">
                  Trang chủ
                </Link>
                <Link href="/products" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium hover:bg-green-100 px-2 rounded-md transition">
                  Sản phẩm
                </Link>
                <Link href="/contact" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium hover:bg-green-100 px-2 rounded-md transition">
                  Liên hệ
                </Link>
                <Link href="/about" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium hover:bg-green-100 px-2 rounded-md transition">
                  Giới thiệu
                </Link>

                <div className="flex gap-4 mt-4">
                  {/* Nút Vòng quay */}
                    {userName && (
                          <button
                            onClick={() => setShowSpinWheel(true)}
                            className="relative w-10 h-10 border-2 border-[#1a7a00] rounded-full flex items-center justify-center text-[#1a7a00] text-xl tooltip"
                            data-tooltip="Vòng quay may mắn"
                          >
                            <i className="fa-solid fa-gamepad"></i> {/* Icon vòng quay */}
                          </button>
                        )}
                  <Link href="/favorite" onClick={() => setMobileMenuOpen(false)} className="relative w-10 h-10 border-2 border-[#1a7a00] rounded-full flex items-center justify-center text-xl">
                    <i className="fas fa-heart text-[#1a7a00]"></i>
                    <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] h-5 min-w-[20px] px-1 rounded-full flex items-center justify-center">
                      {favoriteCount}
                    </span>
                  </Link>
                  <Link href="/cart" onClick={() => setMobileMenuOpen(false)} className="relative w-10 h-10 border-2 border-[#1a7a00] rounded-full flex items-center justify-center text-xl">
                    <i className="fas fa-shopping-cart text-[#1a7a00]"></i>
                    <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] h-5 min-w-[20px] px-1 rounded-full flex items-center justify-center">
                      {cartItemCount}
                    </span>
                  </Link>
                </div>

                {userName ? (
                  <>
                    <Link
                      href="/user"
                      onClick={() => setMobileMenuOpen(false)}
                      className="mt-4 block bg-[#0A9300] text-white py-2 rounded font-semibold text-center"
                    >
                      Thông tin người dùng
                    </Link>
                    <Link
                      href="/orders"
                      onClick={() => setMobileMenuOpen(false)}
                      className="mt-2 block bg-[#0A9300] text-white py-2 rounded font-semibold text-center"
                    >
                      Đơn hàng của tôi
                    </Link>
                    <button onClick={handleLogout} className="mt-2 bg-[#0A9300] text-white py-2 rounded font-semibold">
                      Đăng xuất
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block border-2 border-[#1a7a00] text-[#1a7a00] rounded px-4 py-2 text-center font-semibold"
                    >
                      Đăng nhập
                    </Link>
                    <Link
                      href="/signup"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block bg-[#1a7a00] text-white rounded px-4 py-2 text-center font-semibold"
                    >
                      Đăng ký
                    </Link>
                  </>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </header>
      {/* Thêm div để tạo khoảng trống cho fixed header */}
      <div className="h-[90px]"></div>
    </>
  );
};

export default Header;

