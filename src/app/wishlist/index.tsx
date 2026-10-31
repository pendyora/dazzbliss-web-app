/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import 'react-tabs/style/react-tabs.css';
import React, { Suspense, useEffect, useState } from 'react';

import { FaRegHeart } from 'react-icons/fa6';
import { TabPanel, Tabs } from 'react-tabs';

import ProductProfile from '@/components/ProductProfile';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchWishListProducts, setWishlistProducts } from '@/store/slices/Cart/cartSlice';

import WishListSection from './WishListSection';
import { Text } from '../../components/Text';
import OurBestSellers from '../homepage/OurBestSellers';

export default function WishlistPage() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth.auth);
  const [tabIndex, setTabIndex] = useState(0);
  const [tabTitles, setTabTitles] = useState<any>([]);
  // const [selectedTab, setSelectedTab] = useState([]);

  const { wishlistProducts } = useAppSelector((state) => state?.cart);

  // const { wishlistProducts } = useAppSelector((state) => state?.cart);
  useEffect(() => {
    if (wishlistProducts) {
      const titles: any = new Set(wishlistProducts.map((item: any) => item?.name));

      setTabTitles(['ALL', ...titles]);
    }
  }, [wishlistProducts]);
  // console.log(selectedTab);

  const handleLocalWishlist = () => {
    const wishlistData = localStorage.getItem('wishListItems');
    const wishList = wishlistData ? JSON.parse(wishlistData) : [];

    // localStorage.removeItem("cartItems");
    if (wishList?.length > 0) {
      dispatch(setWishlistProducts(wishList));
    }
  };
  useEffect(() => {
    if (user) {
      dispatch(fetchWishListProducts('all'));
    } else {
      handleLocalWishlist();
    }
  }, []);
  const groupedData = wishlistProducts.reduce((acc: any, item: any) => {
    if (!acc[item.jewelry_type]) {
      acc[item.jewelry_type] = [];
    }
    acc[item.jewelry_type].push(item);
    return acc;
  }, {});

  return (
    <div className="w-full bg-white-a700">
      {/* <Header /> */}
      <Tabs
        selectedIndex={tabIndex}
        onSelect={(index) => setTabIndex(index)}
        className="flex flex-col 2pl:px-[160px] items-center gap-14 border-b border-solid border-gray-800 py-14 md:py-5 sm:gap-3 sm:py-4"
        selectedTabClassName="bg-black text-white"
        selectedTabPanelClassName="!relative tab-panel--selected "
      >
        {/* wish list section */}
        {wishlistProducts?.length > 0 ? (
          <WishListSection
            selectedIndex={tabIndex}
            tabTitles={tabTitles}
            // selectedTab={selectedTab}
            // setSelectedTab={setSelectedTab}
            groupedData={groupedData}
            setTabIndex={setTabIndex}
          />
        ) : (
          // <div className="flex justify-center items-center w-full pt-10 min-h-[50vh]">Empty WishList!!!</div>
          <>
            <div className="w-full mx-auto text-center">
              {/* <div className="relative h-48 w-48 mx-auto mb-5">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div>
                    <FaRegHeart
                      className="h-24 w-24 text-muted-foreground/50 text-gray-500/50"
                      strokeWidth={1.5}
                      // onMouseEnter={() => setIsHovering(true)}
                      // onMouseLeave={() => setIsHovering(false)}
                    />
                  </div>
                </div>
              </div> */}

              <div className="mb-8 mt-5">
                <h1 className="text-3xl font-serif font-medium mb-3 text-gray-800">Your WishList is Empty</h1>
                <p className="text-gray-500 text-[14px] font-notosans mb-8 max-w-sm mx-auto ">
                  It seems you haven't added any precious jewelry to your collection yet. Discover our exquisite pieces and find something that speaks
                  to you.
                </p>
              </div>
              {/* Product Suggestions Section */}
              <div>
                <OurBestSellers />
              </div>
            </div>
          </>
        )}
        <div className="container-xs mb-[22px] 2xl:px-[160px] xl:px-28 lg:px-20 md:px-5 sm:px-3">
          {[...tabTitles].map((item, index) => (
            <TabPanel key={`${index}`} className="absolute items-center">
              <div className="w-full">
                <div className="flex flex-col gap-9 sm:gap-3">
                  <div className="flex flex-col items-start gap-8 sm:gap-3">
                    {item != 'ALL' && (
                      <Text as="p" size="text5xl" className="text-[36px] font-normal text-black-900_01 lg:text-[30px] md:text-[24px] sm:!text-[18px]">
                        {item?.replace('_', ' ').toUpperCase()}
                      </Text>
                    )}
                    {item === 'ALL' ? (
                      wishlistProducts?.map((d: any, index: any) => (
                        <div className="flex flex-col w-full items-start gap-8 sm:gap-3" key={index}>
                          <Text
                            as="p"
                            size="text5xl"
                            className="text-[36px] font-normal text-black-900_01 lg:text-[30px] md:text-[24px] sm:!text-[18px]"
                          >
                            {d.name?.replace('_', ' ').toUpperCase()}
                          </Text>
                          <div className="grid w-full grid-cols-4 gap-8 sm:gap-2 self-stretch sm:grid-cols-2 md:grid md:grid-cols-3">
                            {d?.jewelry?.map((pro: any) => {
                              const variationKey = `${pro?.jewelry_id}-${pro?.sku_master_id ?? pro?.slug}`;
                              return (
                                <Suspense key={variationKey} fallback={<div>Loading feed...</div>}>
                                  <ProductProfile {...pro} isStatic={false} key={variationKey} className="w-[100%] col-span-1 md:w-full" />
                                </Suspense>
                              );
                            })}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="w-full gap-8 sm:gap-2 grid grid-cols-4 sm:grid-cols-2 md:grid md:grid-cols-3">
                        <Suspense fallback={<div>Loading feed...</div>}>
                          {wishlistProducts
                            .find((el: any) => el?.name?.replace('_', ' ').toUpperCase() == item?.replace('_', ' ').toUpperCase())
                            ?.jewelry?.map((pro: any) => {
                              const variationKey = `${pro?.jewelry_id}-${pro?.sku_master_id ?? pro?.slug}`;
                              return <ProductProfile {...pro} isStatic={false} key={variationKey} className="w-[100%] col-span-1 md:w-full" />;
                            })}
                        </Suspense>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabPanel>
          ))}
        </div>
      </Tabs>
      {/* <Footer /> */}
    </div>
  );
}
