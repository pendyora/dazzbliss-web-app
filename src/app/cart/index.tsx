import { Suspense } from 'react';

import Cart from './cart';
import Loading from './loading';

export default function CartPage() {
  return (
    <div className="w-full bg-paper">
      <Suspense fallback={<Loading />}>
        <Cart />
      </Suspense>
    </div>
  );
}
