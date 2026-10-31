/* eslint-disable react-hooks/exhaustive-deps */

'use client';

import React, { useEffect, useRef, useState } from 'react';

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

import OfferModel from './components/OfferModel';
import AnnouncementBar from './mega/AnnouncementBar';
import SiteHeader from './mega/SiteHeader';

let timeout: ReturnType<typeof setTimeout> | null;
let currentValue: string;

// Wait this long after the user stops typing before hitting the search API, so we
// don't fire a request on every keystroke.
const SEARCH_DEBOUNCE_MS = 500;

const Header: React.FC<HeaderProps> = ({ className, headerMetaData, promoStripData }) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const headerRef = useRef<HTMLElement>(null);
  const { user } = useAppSelector((state) => state.auth.auth);
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
    const el = headerRef.current;
    if (!el) {
      return;
    }
    const updateHeight = () => {
      document.documentElement.style.setProperty('--header-height', `${el.offsetHeight}px`);
    };
    updateHeight();
    const ro = new ResizeObserver(updateHeight);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

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
  const handleBlur = () => {
    setValue('');
    setData([]);
    setSearchLoading(false);
  };

  const currencyProps = { currency, currencyOption, setCurrency, setRefresh, tone: 'dark' as const };

  return (
    <header ref={headerRef} className={`${className} z-[51] flex flex-col overflow-x-clip overflow-y-visible`}>
      <AnnouncementBar promoStripData={promoStripData} currencyProps={currencyProps} />
      <SiteHeader
        headerMetaData={headerMetaData}
        currencyProps={currencyProps}
        search={{ value, results: data, loading: searchLoading, onSearch: handleSearch, onPick: handleChange, onReset: handleBlur }}
      />
      {OfferModelOpen == 'false' && <OfferModel />}
    </header>
  );
};

export default Header;
