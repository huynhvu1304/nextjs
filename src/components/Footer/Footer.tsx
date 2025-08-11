// components/Footer.jsx
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container-custom lg:px-8">
        {/* Footer Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          
          {/* Cột 1: Logo / Thanh toán */}
          <div>
            <h4 className="text-xl font-semibold mb-5 border-b border-gray-700 pb-3">Cửa hàng</h4>
            <img
              src="/img/logo.png"
              alt="Logo"
              className="h-15 sm:h-32 w-40 object-contain mx-auto sm:mx-0"
            />
          </div>

          {/* Cột 2: Giới thiệu */}
          <div>
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-3 border-b border-gray-700 pb-2">
              <i className="fas fa-store text-blue-500"></i> Novashop
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed mb-4">
              Cung cấp giày thể thao chính hãng với giá tốt. Giao hàng toàn quốc.
            </p>
            <div className="flex gap-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 text-xl transition-colors">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-pink-500 text-xl transition-colors">
                <i className="fab fa-instagram"></i>
              </a>
              <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-300 text-xl transition-colors">
                <i className="fab fa-tiktok"></i>
              </a>
            </div>
          </div>

          {/* Cột 3: Liên hệ */}
          <div>
            <h4 className="text-xl font-semibold mb-5 border-b border-gray-700 pb-3">Liên hệ</h4>
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
            <h4 className="text-xl font-semibold mb-5 border-b border-gray-700 pb-3">Hỗ trợ khách hàng</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="/warranty" className="text-gray-400 hover:text-white transition">Chính sách bảo hành</a></li>
              <li><a href="/returns" className="text-gray-400 hover:text-white transition">Chính sách đổi trả</a></li>
              <li><a href="/payment-methods" className="text-gray-400 hover:text-white transition">Phương thức thanh toán</a></li>
              <li><a href="/faq" className="text-gray-400 hover:text-white transition">Câu hỏi thường gặp</a></li>
            </ul>
          </div>
        </div>

        {/* Certifications Section */}
        <div className="border-t border-gray-700 pt-8 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div>
              <h4 className="text-xl font-semibold mb-5">Chứng nhận</h4>
              <div className="flex gap-6 flex-wrap">
                <img src="/img/DMCA_1.png" alt="Chứng nhận DMCA" className="h-12 object-contain" />
                <img src="/img/logoSaleNoti.png" alt="Chứng nhận Sale Noti" className="h-12 object-contain" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="border-t border-gray-700 pt-6 text-center">
          <p className="text-gray-500 text-sm select-none">
            © 2025 NovaShop. All rights reserved.
          </p>
        </div>
      </div>
    </footer>

  );
};

export default Footer;