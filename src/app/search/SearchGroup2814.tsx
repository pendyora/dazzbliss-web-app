/* eslint-disable react-hooks/exhaustive-deps */
'use client';
import React, { Suspense, useEffect, useRef, useState } from 'react';

import { Button, Input } from 'antd';
import { useRouter, useSearchParams } from 'next/navigation';
import { MdSearch } from 'react-icons/md';

import ProductProfile from '@/components/ProductProfile';
import { getJewelrySearch } from '@/services/productService';
import { useAppDispatch, useAppSelector } from '@/store';
import { setSearchList, setSearchQuery } from '@/store/slices/SearchProduct/searchProductSlice';
import { trackSearch } from '@/utils/metaPixel';

import { Text } from '../../components';
// import ProductDetails from '../../components/ProductDetails';

// const data = [
//   {
//     productImage: 'img_group_1259_2.png',
//     productName: 'NAME OF THE PRODUCT',
//     productDescription: 'Silver Sterling – Yellow Gold',
//     productPrice: '$50',
//   },
//   {
//     productImage: 'img_group_1259_2.png',
//     productName: 'NAME OF THE PRODUCT',
//     productDescription: 'Silver Sterling – Yellow Gold',
//     productPrice: '$50',
//   },
//   {
//     productImage: 'img_group_1259_2.png',
//     productName: 'NAME OF THE PRODUCT',
//     productDescription: 'Silver Sterling – Yellow Gold',
//     productPrice: '$50',
//   },
//   {
//     productImage: 'img_group_1259_2.png',
//     productName: 'NAME OF THE PROD',
//     productDescription: 'Silver Sterling – Yello',
//     productPrice: '$50',
//   },
// ];

// Wait this long after the user stops typing before searching, so we don't fire a
// request/navigation on every keystroke. Pressing Enter or the search icon still
// searches immediately.
const SEARCH_DEBOUNCE_MS = 500;

export default function SearchGroup2814() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const selectedQuery = useSearchParams();
  const searchQuery = selectedQuery.get('q');
  // const [data, setData] = useState<any>([]);
  const [searchValue, setSearchValue] = useState<string>('');
  const [isSuggested, setIsSuggested] = useState<any>(false);
  // The API returns the whole result set. Rendering all of it at once meant hundreds of
  // ProductProfile cards (each with its own swipers and images) before anything was usable,
  // so the grid grows as the user scrolls instead.
  const PAGE_SIZE = 24;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  // const [count, setCount] = useState<any>(0);
  const { query, searchList } = useAppSelector((state) => state.searchProduct);

  // Search as the user types, debounced. Skipped when the box is empty or already
  // shows the current query's results (e.g. on load, where searchValue is seeded
  // from the URL) so we don't re-navigate to the same search.
  useEffect(() => {
    const trimmed = searchValue.trim();
    if (!trimmed || trimmed === (searchQuery ?? '')) {
      return;
    }
    const timer = setTimeout(() => {
      router.replace(`/search?q=${encodeURIComponent(trimmed)}`);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchValue, searchQuery]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchQuery]);

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((current) => Math.min(current + PAGE_SIZE, searchList?.length ?? 0));
        }
      },
      // Start loading before the sentinel is on screen so scrolling stays smooth.
      { rootMargin: '600px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
    // Deliberately not keyed on visibleCount: re-creating the observer on every growth made
    // it re-fire immediately and batch every increment into a single render, defeating the
    // point. One observer stays attached and fires again when the sentinel re-enters view.
  }, [searchList?.length]);

  useEffect(() => {
    const fetchData = async (value: string) => {
      const res: any = await getJewelrySearch(value);
      if (res.data.data) {
        setIsSuggested(res.data.data?.isSuggested);
        // setCount(res.data.data?.count);
        const newData = await res.data.data?.rows?.map((item: any) => {
          const carat_image = item?.jewelryDetails?.[0]?.carat_images || [];
          const jewelryCode = item?.jewelrySubType?.parent_code;
          const jewelryType = jewelryCode?.toLowerCase()?.replace('_', '-');
          const jewelryDetails = item?.jewelryDetails?.[0];
          return {
            estimated_delivery_days: item?.estimated_delivery_days,
            // productVariation: item?.image_folder_info.length,
            productImage: carat_image[0] ? `${carat_image[0]}` : '/images/no_images.svg',
            productHoverImage: carat_image[1] ? `${carat_image[1]}` : '/images/no_images.svg',
            is_customizable: item?.is_customizable,
            variation_to_show: item?.variation_to_show,
            variation_details: item?.variation_details,
            jewelryDetails,
            jewelryTypeData: jewelryType,
            productName: item?.fullTitle,
            // Yotpo keys reviews by this product-level code — the card's star rating needs it.
            code: item?.code,
            productPrice: Math.ceil(item?.jewelryDetails?.[0]?.selling_price),
            // slug: `${jewelryType}/${item?.slug}`,
            slug: item?.is_customizable ? item?.jewelryDetails?.[0]?.sku_slug : `${jewelryType}/premade?slug=${item.jewelryDetails?.[0]?.sku_slug}`,
            sku_master_id: item?.jewelryDetails?.[0]?.id,
            jewelry_id: item?.jewelryDetails?.[0]?.jewelry_id,
            jewelry_type: item?.jewelrySubType?.parent_code,
            isWishlist: item?.jewelryDetails?.[0]?.wishlist_id,
            discount_type: item?.jewelryDetails?.[0]?.discount_type,
            discount_value: item?.jewelryDetails?.[0]?.discount_value == 0 ? null : item?.jewelryDetails?.[0]?.discount_value,
            discounted_price: item?.jewelryDetails?.[0]?.discounted_price,
            specialProductTitles: item?.specialProductTitles || [],
          };
        });
        // setData(newData);
        dispatch(setSearchList(newData));
      }
    };
    if (searchQuery) {
      // Fetch data from API or local state
      if (query !== searchQuery) {
        fetchData(searchQuery).then(() => {
          trackSearch({ search_string: searchQuery });
        });
      }

      dispatch(setSearchQuery(searchQuery));
      setSearchValue(searchQuery);
    }
  }, [searchQuery]);

  return (
    <div className="mb-[22px] flex flex-col items-center">
      <div className="container-xs flex flex-col gap-8 2xl:px-[160px] xl:px-28 lg:px-20 md:px-5">
        <div className="flex items-start justify-between gap-5 sm:flex-col">
          <Text size="text5xl" as="p" className="self-center !text-[#757575] md:text-[34px] sm:text-[32px]">
            SEARCH IN STORE
          </Text>
        </div>
        <div className="flex max-w-[600px] gap-5">
          <Input
            placeholder="Search"
            onPressEnter={(value: any) => {
              router.replace(`/search?q=${value.target.value}`);
            }}
            size="small"
            value={searchValue}
            onChange={(value: any) => setSearchValue(value.target.value)}
          />
          <Button
            shape="circle"
            size="small"
            icon={
              <MdSearch
                className="h-5 w-5"
                onClick={() => {
                  router.replace(`/search?q=${searchValue}`);
                }}
              />
            }
          />
        </div>
        <div className="flex flex-col items-start gap-10">
          <Text size="textxl" as="p" className="uppercase tracking-[1.20px]">
            {searchQuery}
          </Text>
          {isSuggested && (
            <div className="w-full flex flex-col pb-2 items-start justify-center gap-[16px] lg:ml-0 md:ml-0 sm:gap-[20px] sm:text-[12px]">
              <div className="w-full bg-[#c5ccb432] text-center py-1 sm:text-[16px]">0 Results</div>
              <p className="m-0">
                Sorry, your search did not return any results. Please try another term or contact us at{' '}
                <a href="mailto:service@ashclair.com" className="text-inherit no-underline border-b border-current pb-[1px]">
                  service@ashclair.com
                </a>{' '}
                for assistance.
              </p>
            </div>
          )}
          {isSuggested && (
            <Text size="textxl" as="p" className="uppercase tracking-[1.20px]">
              DISCOVER SOMETHING NEW
            </Text>
          )}
          <div className="grid grid-cols-4 sm:grid-cols-2 gap-3 self-stretch">
            <Suspense fallback={<div>Loading feed...</div>}>
              {searchList?.slice(0, visibleCount)?.map((d: any, index: number) => (
                // <Link href={'/strong-forever-stardust-diamond-pendant'} key={'frame1340' + index} className="w-[100%]">
                <ProductProfile {...d} key={'frame1340' + index} className="w-[100%]" />
                // </Link>
              ))}
            </Suspense>
          </div>
          {visibleCount < (searchList?.length ?? 0) && <div ref={loadMoreRef} className="h-8 w-full self-stretch" />}
        </div>
      </div>
    </div>
  );
}
