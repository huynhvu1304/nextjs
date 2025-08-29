import Link from "next/link";
import { FaFacebook, FaInstagram, FaTiktok } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container-custom lg:px-8">
        {/* Footer Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          
          {/* Cột 1: Logo / Thanh toán */}
          <div>
            <h3 className="text-xl font-semibold mb-5 border-b border-gray-700 pb-3">Cửa hàng</h3>
            <img
              src="/img/logo.png"
              alt="Logo"
              className="h-15 sm:h-32 w-40 object-contain mx-auto sm:mx-0"
              loading="lazy"
            />
          </div>

          {/* Cột 2: Giới thiệu */}
          <div>
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-3 border-b border-gray-700 pb-2">
              <i className="fas fa-store text-blue-500"></i> Novashop
            </h3>
            <p className="text-gray-100 text-sm select-none">
              © 2025 NovaShop. All rights reserved.
            </p>
            <p className="text-gray-100 text-sm leading-relaxed mb-4">
              Cửa hàng Novashop Cung cấp giày thể thao chính hãng với giá tốt. Giao hàng toàn quốc.
            </p>
            <div className="flex gap-4">
              <a href="https://facebook.com" aria-label="Facebook" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 text-xl transition-colors">
                <FaFacebook />
              </a>
              <a href="https://instagram.com" aria-label="Instagram" target="_blank" rel="noopener noreferrer" className="hover:text-pink-500 text-xl transition-colors">
                <FaInstagram />
              </a>
              <a href="https://tiktok.com" aria-label="TikTok" target="_blank" rel="noopener noreferrer" className="hover:text-gray-300 text-xl transition-colors">
                <FaTiktok />
              </a>
            </div>
          </div>

          {/* Cột 3: Liên hệ */}
          <div>
            <h3 className="text-xl font-semibold mb-5 border-b border-gray-700 pb-3">Liên hệ</h3>
            <p className="flex items-center gap-3 mb-3 text-gray-400 hover:text-white transition">
              <i className="fas fa-map-marker-alt text-blue-500"></i>
              Ấp Bàu Bông xã Phước An, huyện Nhơn Trạch, Đồng Nai
            </p>
            <p className="flex items-center gap-3 mb-3 text-gray-400 hover:text-white transition">
              <i className="fas fa-phone-alt text-green-400"></i>
              079434699
            </p>
            <p className="flex items-center gap-3 text-gray-400 hover:text-white transition">
              <i className="fas fa-envelope text-red-400"></i>
              novashopvn12@gmail.com
            </p>
          </div>

          {/* Cột 4: Hỗ trợ */}
          <div>
            <h3 className="text-xl font-semibold mb-5 border-b border-gray-700 pb-3">Hỗ trợ khách hàng</h3>
            <ul className="space-y-3 text-sm">
              <li><a href="/about" className="text-gray-400 hover:text-white transition">Chính sách bảo hành</a></li>
              <li><a href="/about" className="text-gray-400 hover:text-white transition">Chính sách đổi trả</a></li>
              <li><a href="/about" className="text-gray-400 hover:text-white transition">Quy trình đặt hàng</a></li>
            </ul>
          </div>
        </div>

        {/* Certifications Section */}
        <div className="border-t border-gray-700 pt-8 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-5">Chứng nhận</h3>
              <div className="flex gap-6 flex-wrap">
                <img src="/img/DMCA_1.png" alt="Chứng nhận DMCA" className="h-12 object-contain" loading="lazy" />
                <img src="/img/logoSaleNoti.png" alt="Chứng nhận Sale Noti" className="h-12 object-contain" loading="lazy" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="border-t border-gray-700 pt-6 text-center">
          <p className="text-gray-100 text-sm select-none">
            © 2025 NovaShop. All rights reserved.
          </p>
        </div>
      </div>
    </footer>

  );
};

export default Footer;