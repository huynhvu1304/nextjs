import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface CartItem {
  _id: string;                // id biến thể
  productId: string;          // id sản phẩm
  variantId: string;          // id biến thể
  quantity: number;
  note: string;
  productName: string;
  productImage: string;
  variantDetails: {
    _id: string;
    size: string;
    color: string;
    cost_price: number;
    cost_sale: number;
    image: string;
    
  };
}

interface CartState {
  items: CartItem[];
  totalQuantity: number;
  totalAmount: number;
}

const initialState: CartState = {
  items: [],
  totalQuantity: 0,
  totalAmount: 0,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<CartItem>) => {
  console.log('Adding item:', action.payload);
  const existingItem = state.items.find(
    item => {
      console.log('Comparing:', item.productId, action.payload.productId, item.variantId, action.payload.variantId);
      return item.productId === action.payload.productId && item.variantId === action.payload.variantId;
    }
  );

      if (existingItem) {
        existingItem.quantity += action.payload.quantity;
      } else {
        state.items.push(action.payload);
      }
      // Cập nhật tổng số lượng và tổng tiền
      state.totalQuantity = state.items.reduce(
        (total, item) => total + item.quantity,
        0
      );
      state.totalAmount = state.items.reduce((total, item) => {
        const price =
          item.variantDetails.cost_sale > 0
            ? item.variantDetails.cost_sale
            : item.variantDetails.cost_price;
        return total + price * item.quantity;
      }, 0);
    },

    updateQuantity: (
      state,
      action: PayloadAction<{ itemId: string; quantity: number }>
    ) => {
      const item = state.items.find(
        (item) => item._id === action.payload.itemId
      );
      if (item) {
        item.quantity = action.payload.quantity;
        // Cập nhật lại tổng số lượng và tổng tiền
        state.totalQuantity = state.items.reduce(
          (total, item) => total + item.quantity,
          0
        );
        state.totalAmount = state.items.reduce((total, item) => {
          const price =
            item.variantDetails.cost_sale > 0
              ? item.variantDetails.cost_sale
              : item.variantDetails.cost_price;
          return total + price * item.quantity;
        }, 0);
      }
    },

    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item._id !== action.payload);
      // Cập nhật lại tổng số lượng và tổng tiền
      state.totalQuantity = state.items.reduce(
        (total, item) => total + item.quantity,
        0
      );
      state.totalAmount = state.items.reduce((total, item) => {
        const price =
          item.variantDetails.cost_sale > 0
            ? item.variantDetails.cost_sale
            : item.variantDetails.cost_price;
        return total + price * item.quantity;
      }, 0);
    },

    clearCart: (state) => {
      state.items = [];
      state.totalQuantity = 0;
      state.totalAmount = 0;
    },
  },
});

export const { addToCart, updateQuantity, removeFromCart, clearCart } =
  cartSlice.actions;
export default cartSlice.reducer;
