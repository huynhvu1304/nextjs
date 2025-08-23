"use client";
import "./about.css";

import Footer from "@/components/Footer/Footer";
import Loading from "@/components/Loading/Loadingcomponent";
import { useEffect, useState } from "react";

export default function About() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <Loading />;

  return (
    <>
      <div className="container-custom rounded-xl mt-[30px] sm:mt-[100px] font-sans text-gray-800 bg-white ">
        <h1 className="about-title text-3xl sm:text-4xl font-extrabold uppercase mb-8 text-center tracking-wide text-[#0A9300] drop-shadow">
          Giới thiệu NovaShop - Cửa hàng bán vợt cầu lông, giày cầu lông chính hãng uy tín
        </h1>

        {/* Giới thiệu về NovaShop */}
        <section className="warranty-section mb-10 bg-[#F6FFF7] rounded-lg p-6 border border-[#0A9300] shadow-sm">
          <h2 className="text-xl sm:text-2xl font-bold text-[#0A9300] mb-3 uppercase tracking-wide">
            Chính Sách Bảo Hành - NovaShop
          </h2>
          <p className="text-gray-700 text-base sm:text-lg leading-relaxed mb-2">
            <strong>NovaShop</strong> là địa chỉ mua sắm trực tuyến uy tín chuyên cung cấp{" "}
            <span className="font-semibold text-[#0A9300]">vợt cầu lông</span> và{" "}
            <span className="font-semibold text-[#0A9300]">giày thể thao</span> chính hãng. 
            Chúng tôi cam kết mang đến sản phẩm chất lượng cao cùng chính sách bảo hành rõ ràng, minh bạch.
          </p>

          <h3 className="text-lg sm:text-xl font-semibold text-[#0A9300] mt-4 mb-2">
            1. Thời gian bảo hành
          </h3>
          <ul className="list-disc list-inside text-gray-700 text-base sm:text-lg mb-2 space-y-1">
            <li>Sản phẩm chính hãng: 6 – 12 tháng tùy loại.</li>
            <li>Phụ kiện và quà tặng kèm: 1 – 3 tháng (nếu có).</li>
          </ul>

          <h3 className="text-lg sm:text-xl font-semibold text-[#0A9300] mt-4 mb-2">
            2. Điều kiện bảo hành
          </h3>
          <ul className="list-disc list-inside text-gray-700 text-base sm:text-lg mb-2 space-y-1">
            <li>Còn nguyên tem bảo hành và phiếu mua hàng từ NovaShop.</li>
            <li>Lỗi kỹ thuật từ nhà sản xuất, không do người sử dụng gây ra.</li>
            <li>Chưa bị sửa chữa hoặc thay đổi linh kiện ngoài hệ thống bảo hành của NovaShop.</li>
          </ul>

          <h3 className="text-lg sm:text-xl font-semibold text-[#0A9300] mt-4 mb-2">
            3. Trường hợp không được bảo hành
          </h3>
          <ul className="list-disc list-inside text-gray-700 text-base sm:text-lg mb-2 space-y-1">
            <li>Hư hỏng do rơi vỡ, va đập, ngấm nước, cháy nổ.</li>
            <li>Bị can thiệp sửa chữa bởi đơn vị không thuộc NovaShop.</li>
            <li>Hết thời hạn bảo hành.</li>
          </ul>

          <p className="text-gray-700 text-base sm:text-lg leading-relaxed italic mt-4">
            Mọi thắc mắc về bảo hành, vui lòng liên hệ hotline:{" "}
            <span className="font-semibold">0794346995</span> hoặc email:{" "}
            <span className="font-semibold">novashop12@gmail.com</span>.
          </p>
        </section>

        {/* Quy trình mua hàng */}
        <section className="mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold uppercase mb-4 border-l-4 border-[#0A9300] pl-4 text-[#0A9300] drop-shadow-sm">
            Quy trình mua hàng tại NovaShop
          </h2>
          <ol className="list-decimal list-inside text-gray-700 text-base sm:text-lg space-y-1">
            <li>Truy cập website, lựa chọn sản phẩm phù hợp nhu cầu.</li>
            <li>Xem thông tin chi tiết, hình ảnh thực tế và đánh giá từ khách hàng khác.</li>
            <li>Thêm sản phẩm vào giỏ hàng và tiến hành đặt mua.</li>
            <li>Nhập thông tin giao hàng, lựa chọn phương thức thanh toán an toàn.</li>
            <li>Nhận xác nhận đơn hàng và theo dõi trạng thái giao hàng trực tuyến.</li>
          </ol>
        </section>

        {/* Lợi ích khi mua hàng */}
        <section className="mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold uppercase mb-4 border-l-4 border-[#0A9300] pl-4 text-[#0A9300] drop-shadow-sm">
            Lý do nên chọn NovaShop
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="about-card bg-white rounded-lg p-5 border border-[#0A9300] shadow">
              <h3 className="font-bold text-[#0A9300] mb-2">Đảm bảo chất lượng</h3>
              <p>Sản phẩm nhập khẩu chính hãng, có hóa đơn và bảo hành đầy đủ.</p>
            </div>
            <div className="about-card bg-white rounded-lg p-5 border border-[#0A9300] shadow">
              <h3 className="font-bold text-[#0A9300] mb-2">Giá cả cạnh tranh</h3>
              <p>Giá tốt nhất thị trường, nhiều chương trình khuyến mãi hấp dẫn.</p>
            </div>
            <div className="about-card bg-white rounded-lg p-5 border border-[#0A9300] shadow">
              <h3 className="font-bold text-[#0A9300] mb-2">Hỗ trợ tận tâm</h3>
              <p>Đội ngũ tư vấn viên chuyên nghiệp, hỗ trợ 24/7 qua chat, hotline.</p>
            </div>
            <div className="about-card bg-white rounded-lg p-5 border border-[#0A9300] shadow">
              <h3 className="font-bold text-[#0A9300] mb-2">Giao hàng toàn quốc</h3>
              <p>Giao hàng nhanh, kiểm tra hàng trước khi thanh toán.</p>
            </div>
          </div>
        </section>

        {/* Thông tin liên hệ */}
        <section className="mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold uppercase mb-4 border-l-4 border-[#0A9300] pl-4 text-[#0A9300] drop-shadow-sm">
            Thông tin liên hệ
          </h2>
          <div className="text-base sm:text-lg text-gray-700 space-y-1">
            <div><span className="font-semibold">Địa chỉ:</span> Ấp Bàu Bông xã Phước An, huyện Nhơn Trạch, Đồng Nai</div>
            <div><span className="font-semibold">Hotline:</span> <a href="tel:079434699" className="text-[#0A9300] hover:underline">0794346995</a></div>
            <div><span className="font-semibold">Email:</span> <a href="mailto:novashopvn12@gmail.com" className="text-[#0A9300] hover:underline">novashopvn12@gmail.com</a></div>
            <div><span className="font-semibold">Facebook:</span> <a href="https://www.facebook.com/novashopteam" target="_blank" rel="noopener noreferrer" className="text-[#0A9300] hover:underline">facebook.com/novashop</a></div>
          </div>
        </section>

        <p className="text-center text-[#0A9300] mt-12 italic tracking-wide font-semibold">
          Cảm ơn bạn đã tin tưởng và lựa chọn cửa hàng của chúng tôi. Nếu cần tư vấn hoặc hỗ trợ, vui lòng liên hệ để được phục vụ tận tình!
        </p>
      </div>
      <Footer />
    </>
  );
}
