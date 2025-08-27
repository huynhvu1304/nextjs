import React, { useState } from "react";
import { API_URL } from "@/lib/api";
import { FaStar } from "react-icons/fa";

const ReviewForm = ({ productId, onSuccess, onError }: any) => {
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const userId = user.id || user._id;
      const res = await fetch(`${API_URL}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          product_id: productId,
          user_id: userId,
          rating,
          content,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        onSuccess(productId);
      } else {
        onError(data.message || "Đánh giá thất bại");
      }
    } catch (err) {
      onError("Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <label className="block font-medium mb-1">Chọn số sao:</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((num) => (
            <FaStar
              key={num}
              size={18}
              className={
                num <= rating
                  ? "text-yellow-400 cursor-pointer"
                  : "text-gray-300 cursor-pointer"
              }
              onClick={() => setRating(num)}
            />
          ))}
        </div>
      </div>
      <div className="mb-3">
        <label className="block font-medium mb-1">Nội dung đánh giá:</label>
        <textarea
          className="w-full border rounded p-2"
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />
      </div>
      <button
        type="submit"
        className="bg-[#0A9300] text-white px-4 py-2 rounded font-semibold w-full"
        disabled={loading}
      >
        {loading ? "Đang gửi..." : "Gửi đánh giá"}
      </button>
    </form>
  );
};

export default ReviewForm;