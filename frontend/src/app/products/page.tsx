import React from 'react';
import ProductsClient from './ProductsClient';

export default function ProductPage() {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <ProductsClient />
    </React.Suspense>
  );
}
