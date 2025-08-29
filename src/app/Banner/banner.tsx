"use client";
import React, { useState, useEffect } from "react";
import { motion } from 'framer-motion';
import { FaArrowRight, FaLocationArrow } from "react-icons/fa";
import Link from "next/link";
import "./banner.css"
import {Brand} from "@/types/brand.interface"
import { getBrands } from "@/service/brand.service";

import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/autoplay";
import { Autoplay } from "swiper/modules";
import { API_URL } from "@/lib/api";
import Image from "next/image";

const Banner = () => {
  const images = [
    { src: "/img/banner_img_call_1.jpg", alt: "Banner Vợt cầu lông chính hãng" },
    { src: "/img/banner_main_6.png", alt: "Banner Giày cầu lông chất lượng" },
    { src: "/img/banner_main_4.png", alt: "Banner Cửa hàng cầu lông uy tín" },
  ];

  const [currentSlide, setCurrentSlide] = useState(0);
  const [brands, setBrands] = useState<Brand[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [images.length]);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getBrands();
      setBrands(data);
    };
    fetchData();
  }, []);

  const slideVariants = {
    hidden: { x: -100, opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { duration: 0.8, ease: "easeOut" as const } },
  };
  const textVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.2, duration: 0.6, ease: "easeOut" as const },
    }),
  };
  const rightVariants = {
    hidden: { x: 100, opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { duration: 0.8, ease: "easeOut" as const } },
  };

  return (
    <header className="w-full overflow-hidden mt-0 md:mt-[20px] pb-0 md:pb-[40px]" aria-label="Hero Section">
      <div className="w-full container-custom mt-0 md:mt-[50px] mx-auto p-6 flex flex-col md:flex-row items-center justify-between">
        {/* Left Box - Desktop only */}
        <motion.section
          className="w-full md:w-[55%] hidden md:block"
          variants={slideVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.h1
            className="text-4xl font-bold text-black my-6"
            custom={0}
            variants={textVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            Vợt & Giày Cầu Lông Chính Hãng
          </motion.h1>
          <motion.h2
            className="text-xl text-gray-700 my-4 font-semibold"
            custom={1}
            variants={textVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            NovaShop phân phối vợt và giày Yonex, Lining, Kumpoo chính hãng
          </motion.h2>
          <motion.p
            className="text-base text-gray-700 my-2"
            custom={2}
            variants={textVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            Cam kết chất lượng – Giao hàng toàn quốc – Giá cạnh tranh.
          </motion.p>
          <motion.div
            className="flex space-x-4 my-6"
            custom={3}
            variants={textVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <Link href="/signup" aria-label="Đăng ký tài khoản">
              <motion.button
                className="bg-green-600 text-white px-4 py-2 text-base rounded inline-flex items-center gap-2 transition-all duration-300 shadow-md signup-button"
              >
                Đăng ký <FaArrowRight size={16} />
              </motion.button>
            </Link>
            <Link href="/about" aria-label="Giới thiệu cửa hàng">
              <motion.button
                className="border border-green-500 bg-white text-green-500 px-4 py-2 text-base rounded inline-flex items-center gap-2 transition-all duration-300 hover:bg-green-600 hover:text-white"
              >
                Giới thiệu <FaLocationArrow size={16} />
              </motion.button>
            </Link>
          </motion.div>

          <div className="my-10" aria-label="Thương hiệu nổi bật">
          <Swiper
            modules={[Autoplay]}
            spaceBetween={24}
            slidesPerView={3}
            slidesPerGroup={1}
            autoplay={{
              delay: 2000,
              disableOnInteraction: false,
            }}
            loop={true}
            grabCursor={true}
            className="px-4"
          >
            {brands.map((brand) => (
              <SwiperSlide key={brand.id || brand.name}>
                <div className="bg-white border border-gray-300 rounded shadow-md flex items-center justify-center py-2">
                  <Image
                    src={`${API_URL}/images/${brand.image_logo}`}
                    alt={`Logo thương hiệu ${brand.name}`}
                    width={192}
                    height={96}
                    className="w-48 h-24 object-contain brand-logo mx-auto"
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
        </motion.section>

        {/* Spacer */}
        <div className="hidden md:block md:w-[5%]" />

        {/* Right Box (Banner & Caption) */}
        <motion.section
          className="w-full md:w-[40%] mt-0 md:mt-0 relative h-[220px] sm:h-[280px] md:h-[300px] lg:h-[350px]"
          variants={rightVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div className="relative w-full h-full overflow-hidden md:rounded-tl-[40%] md:rounded-tr-[8px] md:rounded-br-[8px] md:rounded-bl-[8px] shadow-lg">
            {images.map((img, index) => (
              <Image
                key={index}
                src={img.src}
                alt={img.alt}
                fill
                sizes="(max-width: 768px) 100vw, 40vw"
                className="absolute w-full h-full object-cover object-center transition-all duration-1000 ease-[cubic-bezier(0.4, 0, 0.2, 1)]"
                style={{
                  opacity: index === currentSlide ? 1 : 0,
                  transform: index === currentSlide ? 'translateX(0)' : index > currentSlide ? 'translateX(100%)' : 'translateX(-100%)',
                  zIndex: index === currentSlide ? 10 : 0,
                }}
                priority={index === 0}
                {...(index === 0 ? { fetchPriority: "high" } : {})}
              />
            ))}
            {/* Xóa lớp phủ đen */}
            {/* <div className="absolute inset-0 bg-black bg-opacity-30 z-[15]" /> */}

            {/* Caption (Text) trên Banner - Mobile only */}
            <div className="absolute inset-0 z-20 flex flex-col justify-center items-center text-center p-4 md:hidden">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 leading-tight">
                <span className="text-green-300">Vợt, giày cầu lông</span> – Cửa hàng uy tín
              </h1>
              <p className="text-sm text-gray-100 hidden sm:block leading-snug">
                Chuyên cung cấp vợt, giày cầu lông chính hãng, giá tốt.
              </p>
              <p className="text-xs text-gray-100 sm:hidden leading-snug">
                Vợt, giày chính hãng.
              </p>
              <div className="flex space-x-2 mt-4">
                <Link href="/signup" aria-label="Đăng ký tài khoản">
                  <motion.button
                    className="bg-green-600 text-white px-3 py-1 text-sm rounded inline-flex items-center gap-1 transition-all duration-300 shadow-md signup-button"
                  >
                    Đăng ký <FaArrowRight size={12} />
                  </motion.button>
                </Link>
                <Link href="/about" aria-label="Giới thiệu cửa hàng">
                  <motion.button
                    className="border border-green-500 bg-white text-green-500 px-3 py-1 text-sm rounded inline-flex items-center gap-1 transition-all duration-300 hover:bg-green-600 hover:text-white"
                  >
                    Giới thiệu <FaLocationArrow size={12} />
                  </motion.button>
                </Link>
              </div>
            </div>
          </div>
        </motion.section>
      </div>
    </header>
  );
};

export default Banner;