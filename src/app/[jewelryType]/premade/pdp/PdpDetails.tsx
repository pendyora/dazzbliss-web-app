'use client';
import React, { useMemo } from 'react';

import Link from 'next/link';

import { useAppSelector } from '@/store';

const SUMMARY =
  "flex h-14 cursor-pointer list-none items-center justify-between text-[14px] font-medium text-ink [&::-webkit-details-marker]:hidden after:text-[20px] after:font-light after:text-ink-soft after:content-['+'] group-open:after:content-['–']";
const BODY = 'pb-5 text-[13.5px] leading-[1.7] text-ink-soft';

/** Description, attributes and policies as accordions inside the buy box (design-mockups/product-page-v4). */
export default function PdpDetails({ deliveryNote }: { deliveryNote?: React.ReactNode }) {
  // `extra_titles` comes from the API but is missing from the slice's typed shape.
  const product: any = useAppSelector((state) => state.products?.selectedProduct?.product_details);

  // Extra titles (master-named) followed by the product's attribute values (attribute-named).
  const attributes = useMemo(
    () =>
      [
        ...(product?.extra_titles ?? []).map((item: any) => ({
          id: item?.id,
          label: item?.master_name?.trim?.() ?? '',
          value: item?.value?.trim?.() ?? '',
        })),
        ...(product?.attribute_values ?? []).map((item: any) => ({
          id: item?.id,
          label: item?.attribute_name?.trim?.() ?? '',
          value: item?.value?.trim?.() ?? '',
        })),
      ].filter((item: { value: string }) => Boolean(item.value)),
    [product?.extra_titles, product?.attribute_values],
  );

  // Side (accent) diamond summary grouped by shape, shown only when the backend sends groups and a total weight.
  const sideDiamondGroups: any[] = Array.isArray(product?.sideDiamondDetails) ? product.sideDiamondDetails : [];
  const hasSideDiamond = sideDiamondGroups.length > 0 && Number(product?.totalSideDiamondCaratWeight ?? 0) > 0;

  if (!product?.jewelry_id) {
    return null;
  }

  return (
    <div id="pdp-details" className="border-t border-line">
      {(product?.description || attributes.length > 0) && (
        <details open className="group border-b border-line">
          <summary className={SUMMARY}>The piece</summary>
          <div className={BODY}>
            {product?.description && <p className="m-0 mb-3.5 whitespace-pre-line">{product.description}</p>}
            {attributes.length > 0 && (
              <dl className="m-0 grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-2">
                {attributes.map((a: { id?: string; label: string; value: string }, i: number) => (
                  <React.Fragment key={`${a.id ?? a.value}-${i}`}>
                    <dt className="text-ink-faint">{a.label || 'Detail'}</dt>
                    <dd className="m-0 tabular-nums text-ink">{a.value}</dd>
                  </React.Fragment>
                ))}
              </dl>
            )}
          </div>
        </details>
      )}
      {hasSideDiamond && (
        <details open className="group border-b border-line">
          <summary className={SUMMARY}>Side diamonds</summary>
          <div className={`${BODY} overflow-x-auto`}>
            <table className="w-full border-collapse text-left tabular-nums">
              <thead>
                <tr className="text-ink-faint">
                  <th className="border-b border-line py-2 pr-4 font-normal">Shape</th>
                  <th className="border-b border-line py-2 pr-4 font-normal">Color</th>
                  <th className="border-b border-line py-2 font-normal">Total carat weight</th>
                </tr>
              </thead>
              <tbody>
                {sideDiamondGroups.map((group: any, i: number) => (
                  <tr key={`${group?.shapeName}-${group?.colorName}-${i}`} className="text-ink">
                    <td className="border-b border-line py-2 pr-4">{group?.shapeName}</td>
                    <td className="border-b border-line py-2 pr-4">{group?.colorName}</td>
                    <td className="border-b border-line py-2">{group?.caratWeight}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
      <details className="group border-b border-line">
        <summary className={SUMMARY}>Shipping &amp; returns</summary>
        <div className={`${BODY} grid gap-2`}>
          {deliveryNote}
          <p className="m-0">
            Read the full{' '}
            <Link href="/returns-shipping" className="text-ink underline underline-offset-4 hover:text-ink">
              shipping and returns policy
            </Link>
            .
          </p>
        </div>
      </details>
      <details className="group border-b border-line">
        <summary className={SUMMARY}>Care</summary>
        <div className={BODY}>
          <p className="m-0">
            Clean with warm water and a soft brush, and store each piece on its own.{' '}
            <Link href="/jewelry-care" className="text-ink underline underline-offset-4 hover:text-ink">
              How to care for your jewelry
            </Link>
          </p>
        </div>
      </details>
    </div>
  );
}
