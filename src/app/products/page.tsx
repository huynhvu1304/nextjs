import { Suspense } from "react";
import ProductPage from "./ProductPage"; // file bạn paste code ở trên

export default function Page() {
  return (
    <Suspense fallback={<div>Đang tải sản phẩm...</div>}>
      <ProductPage />
    </Suspense>
  );
}
