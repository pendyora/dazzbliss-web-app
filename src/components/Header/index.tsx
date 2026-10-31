/* eslint-disable react-hooks/exhaustive-deps */

'use client';

import React, { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { HeaderProps } from '@/@types/header.type';
import { getJewelrySearch } from '@/services/productService';
import { clearSelectedProduct, setShouldLoadFilter, useAppDispatch, useAppSelector } from '@/store';
import { fetchCartProductsList, fetchLocalCartProductsList, fetchWishListProducts, setWishlistProducts } from '@/store/slices/Cart/cartSlice';
import { setSelectedSettingStore } from '@/store/slices/customProducts/customProductSlice';
import {
  fetchCurrencyCountry,
  fetchHeaderData,
  fetchMasterData,
  fetchRingSizePriceList,
  getEngraving,
  getFastDeliveryDay,
  otherPriceData,
} from '@/store/slices/Master/masterSlice';

import HeaderViewDynamic from './components/HeaderViewDynamic';
import OfferModel from './components/OfferModel';
import PromotionalStrip from './components/promotionalStrip';
import HeaderMobileView from './HeaderMobileView';
import HeaderTopPart from './HeaderTopPart';

let timeout: ReturnType<typeof setTimeout> | null;
let currentValue: string;

// Wait this long after the user stops typing before hitting the search API, so we
// don't fire a request on every keystroke.
const SEARCH_DEBOUNCE_MS = 500;

const Header: React.FC<HeaderProps> = ({ className, headerMetaData, promoStripData }) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth.auth);
  const [isFocused, setIsFocused] = useState(false);
  const [currency, setCurrency] = useState<any>('');
  const [refresh, setRefresh] = useState<any>(false);
  const [currencyOption, setCurrencyOption] = useState<any>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [OfferModelOpen, setOfferModelOpen] = useState<string>('false');

  const handleLocalCartProducts = () => {
    const cartData = localStorage.getItem('cartItems');
    const cartList = cartData ? JSON.parse(cartData) : [];
    if (cartList?.length > 0) {
      dispatch(fetchLocalCartProductsList({ data: cartList }));
    }
  };
  const { currencyList } = useAppSelector((state) => state?.master);

  useEffect(() => {
    if (currencyList?.length > 0) {
      // Several active countries can share one currency code (Belgium and Spain
      // are both EUR), so the code is not a unique identifier for a row — using
      // it as the option key gave React duplicate keys and made the dropdown
      // render the same EUR entry twice, dropping another country, as soon as the
      // list was scrolled. Key each option by the row's own id instead, and carry
      // the code and symbol alongside for the things that still need them.
      const currency = currencyList
        ?.filter((item: any) => item?.is_active === true)
        .map((item: any) => {
          return {
            label: (
              <div className="w-full h-fit flex gap-1 items-center">
                {item?.currency_code} <span className="text-[20px]">{item?.country_flags}</span>
              </div>
            ),
            value: String(item?.id),
            code: item?.currency_code,
            symbol: item?.currency_symbol,
          };
        });

      // `currencyCountryId` pins the exact country row; `currency` (the code) is
      // the older key and everything downstream — formatCurrency, the backend's
      // currency lookups — still reads it, so fall back to it for visitors who
      // picked a currency before the id was stored, and keep both written.
      const storedCountryId = localStorage.getItem('currencyCountryId');
      const storedCurrencyCode = localStorage.getItem('currency');
      const selected =
        currency?.find((item: any) => item?.value === storedCountryId) ||
        currency?.find((item: any) => item?.code === storedCurrencyCode) ||
        currency?.[0];

      if (selected) {
        setCurrency(selected.value);
        localStorage.setItem('currency', selected.code);
        localStorage.setItem('currencySymbol', selected.symbol);
        localStorage.setItem('currencyCountryId', selected.value);
      }
      setCurrencyOption(currency);
    }
  }, [currencyList]);

  useEffect(() => {
    if (refresh == true) {
      setRefresh(!refresh);
      window.location.reload();
    }
  }, [refresh]);

  const handleLocalWishlist = () => {
    const wishlistData = localStorage.getItem('wishListItems');
    const wishList = wishlistData ? JSON.parse(wishlistData) : [];

    if (wishList?.length > 0) {
      dispatch(setWishlistProducts(wishList));
    }
  };

  const handleOfferModel = () => {
    const subscribeOffer = localStorage.getItem('OfferModelSubscribe');
    if (subscribeOffer == null) {
      localStorage.setItem('OfferModelSubscribe', 'false');
    }
    if (subscribeOffer == 'true') {
      setOfferModelOpen(subscribeOffer);
    } else {
      setOfferModelOpen(subscribeOffer || 'false');
    }
  };

  useEffect(() => {
    dispatch(fetchMasterData());
    dispatch(fetchCurrencyCountry());
    dispatch(getFastDeliveryDay('1'));
    dispatch(otherPriceData('2'));
    dispatch(getEngraving('3'));
    dispatch(fetchHeaderData());
    dispatch(fetchRingSizePriceList());
    dispatch(setShouldLoadFilter(false));
    if (user) {
      dispatch(fetchCartProductsList());
      dispatch(fetchWishListProducts('all'));
    } else {
      handleLocalCartProducts();
      handleLocalWishlist();
    }
    handleOfferModel();
  }, []);

  const headerClass = 'tracking-[2.00px]  font-sans text-center font-thin xl:text-base lg:text-sm md:text-[12px] leading-normal pb-[14px] sm:pb-0';

  const [data, setData] = useState<any>([]);
  const [value, setValue] = useState<string>('');

  const fetch = (value: string, callback: (data: { value: string; text: string }[]) => void) => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
    currentValue = value;
    if (!value?.trim()) {
      setSearchLoading(false);
      callback([]);
      return;
    }
    setSearchLoading(true);
    const fake = async () => {
      try {
        const res: any = await getJewelrySearch(value);
        if (currentValue === value) {
          const { rows } = res.data.data;
          callback(rows);
        }
      } catch {
        if (currentValue === value) {
          callback([]);
        }
      } finally {
        if (currentValue === value) {
          setSearchLoading(false);
        }
      }
    };
    timeout = setTimeout(fake, SEARCH_DEBOUNCE_MS);
  };
  const handleSearch = (newValue: string) => {
    fetch(newValue, setData);
    setValue(newValue);
  };
  const handleChange = (newValue: string) => {
    setValue(newValue);
    handleBlur();
    router.push(newValue);
    dispatch(clearSelectedProduct());
    dispatch(setSelectedSettingStore(null));
  };
  const handleFocus = () => {
    setIsFocused(true); // Show search input on focus
  };

  const handleBlur = () => {
    setValue('');
    setData([]);
    setSearchLoading(false);
    setIsFocused(false); // Hide search input when focus is lost
  };

  return (
    <header className={`${className} flex flex-col shadow z-[51]`}>
      <PromotionalStrip data={promoStripData} />

      {/* The Yotpo badge in HeaderTopPart is positioned against this wrapper (hence
          `relative`), floating in the gutter to the right of both rows. Below 770px
          the rows' own padding drops to 20px, which is narrower than the badge, so
          each row reserves `pr-[52px]` to keep its content clear of it — sized to the
          badge's scaled-down footprint (47px). Landscape only: portrait tablets follow
          the mobile treatment and drop the badge from the header entirely (see
          HeaderTopPart), so there is nothing to reserve and the nav row keeps the room.
          Above 769px the existing `lg:px-20` gutter is already wide enough. */}
      <div className="relative flex flex-col items-center gap-2 lg:gap-0 self-stretch sm:hidden">
        <div className="container-xs 2xl:px-[160px] xl:px-28 lg:px-20 md:px-5 [@media(min-width:551px)_and_(max-width:769px)_and_(orientation:landscape)]:pr-[52px]">
          <HeaderTopPart
            isFocused={isFocused}
            handleFocus={handleFocus}
            handleSearch={handleSearch}
            handleChange={handleChange}
            currencyOption={currencyOption}
            currency={currency}
            setCurrency={setCurrency}
            handleBlur={handleBlur}
            data={data}
            value={value}
            setRefresh={setRefresh}
            searchLoading={searchLoading}
          />
        </div>
        {/* 770-999px: with `lg:px-20` here and `lg:px-6` on every link (HeaderViewDynamic), the nav
            needs 826px but only gets 610-760px, so EDUCATION was cut off at 800 landscape and
            820/834 portrait. Tighter padding in that band brings it to ~626px; from 1000px up the
            original padding already fits. 48px still clears the landscape review badge (53px). */}
        <div className="flex justify-center self-stretch bg-text_w pt-[14px] border-b 2xl:px-[80px] xl:px-28 lg:px-20 md:px-5 [@media(min-width:551px)_and_(max-width:769px)_and_(orientation:landscape)]:pr-[52px] [@media(min-width:770px)_and_(max-width:999px)]:px-12 [@media(min-width:551px)_and_(max-width:719px)]:px-3">
          <div className="container-xs flex justify-center">
            <HeaderViewDynamic headerData={headerMetaData} />
          </div>
        </div>
      </div>
      <HeaderMobileView
        header={headerClass}
        currency={currency}
        value={value}
        currencyOption={currencyOption}
        setCurrency={setCurrency}
        setRefresh={setRefresh}
        jewelryData={data}
        handleSearch={handleSearch}
        handleChange={handleChange}
        handleBlur={handleBlur}
        megaHeader={headerMetaData}
        searchLoading={searchLoading}
      />
      {OfferModelOpen == 'false' && <OfferModel />}
    </header>
  );
};

export default Header;
