import { Suspense } from 'react';

import Cart from './cart';
import Loading from './loading';

export default function CartPage() {
  return (
    <div className="w-full bg-white-a700">
      <Suspense fallback={<Loading />}>
        <Cart />
      </Suspense>
    </div>
  );
}
