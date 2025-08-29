import React, { useState } from "react";
import { IMAGE_URL } from "@/lib/api"; 

interface BuyAgainModalProps {
  open: boolean;
  onClose: () => void;
  product: {
    image: string;
    images_main?: string; 
    name: string;
    price: number;
    colors: string[];
    sizes: string[];
    variants: Array<{
      _id: string;
      image: string;
      color: string;
      size: string;
      cost_price: number;
      sale_price?: number;
      stock?: number;
    }>;
  };
  onBuyAgain: (selected: { color: string; size: string; quantity: number }) => void;
}

const BuyAgainModal: React.FC<BuyAgainModalProps> = ({
  open,
  onClose,
  product,
  onBuyAgain,
}) => {
  const [color, setColor] = useState(product.colors[0] || "");
  const [size, setSize] = useState(product.sizes[0] || "");
  const [quantity, setQuantity] = useState(1);

  if (!open) return null;

  const selectedVariant = product.variants.find(
    (v) => v.color === color && v.size === size
  );

  const displayImage = selectedVariant?.image
    ? `${IMAGE_URL}/${selectedVariant.image}`
    : (product.images_main ? `${IMAGE_URL}/${product.images_main}` : product.image);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 mt-2 sm:mt-4 md:mt-[150px]">
        {/* Hình ảnh bên trái, tên và giá bên phải */}
        <div className="flex items-center mb-4">
          <img
            src={displayImage}
            alt={product.name}
            className="w-24 h-24 object-cover rounded mr-4"
          />
          <div>
            <h2 className="text-lg font-bold">{product.name}</h2>
            <p className="text-red-600 font-semibold mt-2">{product.price.toLocaleString()}₫</p>
          </div>
        </div>
        {/* Chọn màu sắc */}
        <div className="mb-3">
          <label className="block font-medium mb-1">Màu sắc:</label>
          <div className="flex gap-2 flex-wrap">
            {product.colors.map((c) => (
              <button
                key={c}
                type="button"
                className={`px-3 py-1 rounded border ${color === c ? "bg-[#0A9300] text-white" : "bg-gray-100"}`}
                onClick={() => setColor(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        {/* Chọn size */}
        <div className="mb-3">
          <label className="block font-medium mb-1">Size:</label>
          <div className="flex gap-2 flex-wrap">
            {product.sizes.map((s) => (
              <button
                key={s}
                type="button"
                className={`px-3 py-1 rounded border ${size === s ? "bg-[#0A9300] text-white" : "bg-gray-100"}`}
                onClick={() => setSize(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        {/* Số lượng */}
        <div className="mb-3">
          <label className="block font-medium mb-1">Số lượng:</label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-2 py-1 border rounded"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            >
              -
            </button>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
              className="w-16 text-center border rounded"
            />
            <button
              type="button"
              className="px-2 py-1 border rounded"
              onClick={() => setQuantity((q) => q + 1)}
            >
              +
            </button>
          </div>
        </div>
        {/* Nút */}
        <div className="flex gap-2 mt-6">
          <button
            className="bg-[#0A9300] text-white px-4 py-2 rounded font-semibold flex-1"
            onClick={() => onBuyAgain({ color, size, quantity })}
          >
            Mua lại
          </button>
          <button
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded font-semibold flex-1"
            onClick={onClose}
          >
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
};

export default BuyAgainModal;