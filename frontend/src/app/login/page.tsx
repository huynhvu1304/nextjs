"use client";

import { useState, useEffect } from "react";
import { FcGoogle } from "react-icons/fc";
import { toast } from "react-toastify";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { auth, provider } from "@/lib/firebase"; 
import { signInWithPopup } from "firebase/auth";
import Footer from "@/components/Footer/Footer";
import { API_URL } from "@/lib/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setUserName(user.name);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Kiểm tra validation
    if (!email.trim()) {
      toast.error("Vui lòng nhập email!");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Định dạng email không hợp lệ!");
      return;
    }

    if (!password.trim()) {
      toast.error("Vui lòng nhập mật khẩu!");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      console.log("User status:", data.user?.status);
      console.log("Login response:", data);

      if (!res.ok) {
        if (res.status === 403 && data.message === "Tài khoản đã bị chặn") {
          setError("Tài khoản của bạn đã bị chặn");
          toast.error("Tài khoản đã bị chặn, vui lòng liên hệ admin!");
        } else {
          setError(data.message || "Đăng nhập thất bại");
          toast.error(data.message || "Đăng nhập thất bại");
        }
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setEmail("");
      setPassword("");
      toast.success("Đăng nhập thành công!");
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    } catch (error) {
      console.error("Login error:", error);
      setError("Sai tài khoản hoặc mật khẩu");
      toast.error("Đăng nhập thất bại, vui lòng thử lại sau");
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user; 
      const idToken = await user.getIdToken();
      console.log("Firebase ID Token:", idToken);

      // Gửi ID Token này đến backend của bạn
      const res = await fetch(`${API_URL}/users/google-login`, { 
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken }), 
      });

      const data = await res.json();

      if (!res.ok) {
        // Xử lý lỗi từ backend của bạn
        setError(data.message || "Đăng nhập Google thất bại tại server.");
        toast.error(data.message || "Đăng nhập Google thất bại!");
        return;
      }

      // Backend đã xác minh và cấp JWT riêng của bạn
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user)); 
      toast.success("Đăng nhập Google thành công!");
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    } catch (error) {
      console.error("Google login error:", error);
      // Xử lý lỗi từ Firebase Authentication (frontend)
      let errorMessage = "Đăng nhập Google thất bại!";
      if ((error as any).code === 'auth/popup-closed-by-user') {
        errorMessage = 'Đăng nhập bị hủy bởi người dùng.';
      } else if ((error as any).code === 'auth/cancelled-popup-request') {
        errorMessage = 'Yêu cầu đăng nhập bị hủy (có thể đã có một cửa sổ bật lên khác đang mở).';
      } else if ((error as any).code === 'auth/account-exists-with-different-credential') {
        // Xử lý khi email đã tồn tại với phương thức khác (ví dụ: email/mật khẩu)
        // Bạn có thể yêu cầu người dùng đăng nhập bằng mật khẩu cũ để liên kết tài khoản
        errorMessage = 'Email này đã được sử dụng với một phương thức đăng nhập khác. Vui lòng đăng nhập bằng phương thức đó.';
      }
      toast.error(errorMessage);
    }
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <div className="flex max-w-4xl w-full bg-white rounded-xl shadow-md overflow-hidden">
          {/* Ảnh bên trái */}
          <div className="hidden md:block w-1/2">
            <img
              src="/img/Auraspeed_Fantome_1892x660.webp"
              alt="Login Visual"
              className="h-full w-full object-cover"
            />
          </div>

          {/* Form bên phải */}
          <div className="w-full md:w-1/2 p-8">
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">Đăng nhập</h2>
            <p className="text-center text-gray-600 mb-6">Chào mừng bạn quay lại với NovaShop!</p>

            {/* Đăng nhập với google */}
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-2 bg-white border rounded-lg py-2 mb-4 shadow-sm hover:bg-gray-50"
            >
              <FcGoogle />
              <span className="text-sm font-medium">Đăng nhập với Google</span>
            </button>

            <div className="flex items-center mb-4">
              <hr className="flex-grow border-t" />
              <span className="mx-2 text-sm text-gray-400">Hoặc</span>
              <hr className="flex-grow border-t" />
            </div>

            {error && (
              <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 border border-red-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  placeholder="Nhập email"
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full mt-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="relative">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Mật khẩu
                </label>
                <input
                  placeholder="Nhập mật khẩu"
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full mt-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-gray-500 hover:text-gray-700 focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>

                <div className="text-right mt-1">
                  <a href="forgot-password" className="text-sm text-green-500 hover:underline">
                    Quên mật khẩu?
                  </a>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gray-800 text-white py-2 rounded-md font-medium hover:bg-gray-700 transition"
              >
                ĐĂNG NHẬP
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-4">
              Bạn chưa có tài khoản?{" "}
              <a href="/signup" className="text-green-600 font-medium hover:underline">
                Đăng ký
              </a>
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
