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
        <section className="about-section mb-10 bg-[#F6FFF7] rounded-lg p-6 border border-[#0A9300] shadow-sm">
          <h2 className="text-xl sm:text-2xl font-bold text-[#0A9300] mb-3 uppercase tracking-wide">
            NovaShop - Trang web bán hàng online vợt & giày cầu lông chính hãng
          </h2>
          <p className="text-gray-700 text-base sm:text-lg leading-relaxed mb-2">
            <strong>NovaShop</strong> là địa chỉ mua sắm trực tuyến uy tín, chuyên cung cấp các sản phẩm{" "}
            <span className="font-semibold text-[#0A9300]">vợt cầu lông</span> và{" "}
            <span className="font-semibold text-[#0A9300]">giày thể thao</span> chính hãng từ các thương hiệu hàng đầu như{" "}
            <span className="font-bold text-[#0A9300]">Yonex</span>, <span className="font-bold text-[#0A9300]">Li-Ning</span> và{" "}
            <span className="font-bold text-[#0A9300]">Kumpoo</span>. Chúng tôi cam kết mang đến trải nghiệm mua sắm hiện đại, an toàn và tiện lợi cho mọi khách hàng.
          </p>
          <ul className="list-disc list-inside text-gray-700 text-base sm:text-lg mb-2 space-y-1">
            <li>Sản phẩm chính hãng 100%, bảo hành rõ ràng.</li>
            <li>Giao diện website thân thiện, tối ưu UI/UX cho cả máy tính và điện thoại.</li>
            <li>Thông tin sản phẩm chi tiết, hình ảnh sắc nét, chuẩn SEO giúp khách hàng dễ dàng tìm kiếm.</li>
            <li>Hỗ trợ tư vấn tận tâm, giao hàng nhanh chóng toàn quốc.</li>
            <li>Chính sách đổi trả linh hoạt, bảo mật thông tin khách hàng tuyệt đối.</li>
          </ul>
          <p className="text-gray-700 text-base sm:text-lg leading-relaxed">
            NovaShop luôn đặt trải nghiệm người dùng lên hàng đầu, mang đến sự an tâm và hài lòng cho mọi khách hàng khi mua sắm online các sản phẩm cầu lông chất lượng cao.
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
            <div><span className="font-semibold">Hotline:</span> <a href="tel:079434699" className="text-[#0A9300] hover:underline">079434699</a></div>
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
