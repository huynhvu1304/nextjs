'use client';

import Footer from '@/components/Footer/Footer';
import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './contact.css';
import Loading from '@/components/Loading/Loadingcomponent'; 
import { API_URL } from '@/lib/api';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000); 
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const loadingToastId = toast.info('Đang gửi...', { autoClose: false });

    try {
      const res = await fetch(`${API_URL}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      toast.dismiss(loadingToastId);

      if (data.success) {
        toast.success('Gửi thành công!', { autoClose: 3000 });
        setForm({ name: '', email: '', message: '' });
      } else {
        toast.error('Lỗi: ' + data.message, { autoClose: 3000 });
      }
    } catch {
      toast.dismiss(loadingToastId);
      toast.error('Có lỗi xảy ra khi gửi.', { autoClose: 3000 });
    }
  };

  if (loading) return <Loading />; // Hiển thị loading khi vào trang

  return (
    <>
      <div className="container-custom flex flex-col md:flex-row justify-center items-start gap-8 bg-white min-h-[30vh] mt-[30px] sm:mt-[60px]">
        {/* Form liên hệ bên trái */}
        <div className="w-full md:w-3/5 bg-white p-0 flex flex-col justify-center">
          <h1 className="text-2xl font-semibold text-green-700 mb-4 text-center">Gửi liên hệ cho chúng tôi</h1>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-green-800 font-semibold mb-1">Họ và tên</label>
              <input
                type="text"
                className="w-full px-3 py-2 rounded contact-input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-green-800 font-semibold mb-1">Email</label>
              <input
                type="email"
                className="w-full px-3 py-2 rounded contact-input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-green-800 font-semibold mb-1">Nội dung</label>
              <textarea
                className="w-full px-3 py-2 h-28 resize-none rounded contact-input"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full font-bold py-2 rounded contact-btn"
            >
              Gửi liên hệ
            </button>
          </form>
        </div>
        {/* Thông tin liên hệ + bản đồ bên phải */}
        <div className="w-full md:w-2/5 flex flex-col gap-6 p-0">
          <h1 className="text-2xl font-bold text-green-700 mb-2 flex items-center gap-2">
            <i className="fa-solid fa-envelope text-green-600 text-2xl"></i>
            Liên hệ
          </h1>
          <div className="flex flex-col gap-3 text-green-900 text-base">
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-location-dot text-green-500 text-lg"></i>
              <span>Địa chỉ: <b>Ấp Bàu Bông xã Phước An, huyện Nhơn Trạch, Đồng Nai</b></span>
            </div>
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-envelope-open-text text-green-500 text-lg"></i>
              <span>Email: <b>novashopvn12@gmail.com</b></span>
            </div>
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-phone text-green-500 text-lg"></i>
              <span>Hotline: <b>079434699</b></span>
            </div>
          </div>
          <div className="w-full h-56 rounded-lg overflow-hidden mt-2">
            <iframe
              title="Google Map"
              src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d3788.257513812436!2d106.93641117145364!3d10.657131132117584!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e1!3m2!1svi!2s!4v1751611489104!5m2!1svi!2s"
              width="100%"
              height="90%"
              style={{ border: 0 }}
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          toastStyle={{ backgroundColor: 'white', color: 'black' }}
        />
      </div>
      <Footer />
    </>
  );
}
