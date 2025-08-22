import { Suspense } from "react";
import ProductPage from "./ProductPage";

export const dynamic = "force-dynamic"; 

export default function Page() {
  return (
    <Suspense fallback={<div>Đang tải sản phẩm...</div>}>
      <ProductPage />
    </Suspense>
  );
}
