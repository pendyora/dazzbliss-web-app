import React, { useEffect, useRef, useState } from 'react';

import { LoadingOutlined } from '@ant-design/icons';
import { Button, Image, Input, Modal, Select } from 'antd';
import Hamburger from 'hamburger-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GoArrowUpRight } from 'react-icons/go';
import { IoIosLaptop, IoMdArrowBack } from 'react-icons/io';
import { MdChevronRight, MdSearch } from 'react-icons/md';
import { PiHandbagLight } from 'react-icons/pi';

import { useAppDispatch, useAppSelector } from '@/store';
import { formatCurrency } from '@/utils/common';

import { Text, Img } from './..';
import NavigationsMenus from './NavigationsMenus';

const HeaderMobileView = ({
  jewelryData,
  header,
  currency,
  currencyOption,
  setCurrency,
  setRefresh,
  handleSearch,
  handleChange,
  value,
  handleBlur,
  megaHeader,
  searchLoading,
}: any) => {
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth.auth);

  const { data } = useAppSelector((state) => state.master);
  const { cartProducts, wishlistProducts } = useAppSelector((state) => state?.cart);
  const menuColumnList = ['menu_column_one', 'menu_column_two', 'menu_column_three', 'menu_column_four'];
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState(currency || currencyOption[0]?.value);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isJewelryOpen, setIsJewelryOpen] = useState(false);
  const [isCollectionsOpen, setIsCollectionsOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  // Submenus the visitor has opened at least once. Their icons only mount from then on —
  // the drawer is hidden with CSS, not unmounted, so rendering every icon up front made the
  // browser download all of them on every page load, desktop included.
  const [openedMenus, setOpenedMenus] = useState<string[]>([]);
  const [isForCouplesOpen, setIsForCouplesOpen] = useState(false);
  const [searchValue, setSearchValue] = useState<string>('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchBarRef = useRef<HTMLDivElement | null>(null);
  const searchIconRef = useRef<HTMLDivElement | null>(null);

  // Tapping anywhere outside the search (input, suggestion list, or the icon that toggles it)
  // closes it.
  useEffect(() => {
    if (!isSearchFocused) {
      return;
    }
    const closeOnOutsideTap = (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (!target || searchBarRef.current?.contains(target) || searchIconRef.current?.contains(target) || target.closest('.header-search-dropdown')) {
        return;
      }
      handleBlur();
      setIsSearchFocused(false);
    };
    document.addEventListener('pointerdown', closeOnOutsideTap);
    return () => document.removeEventListener('pointerdown', closeOnOutsideTap);
  }, [isSearchFocused]);
  const [searchListHeight, setSearchListHeight] = useState(220);

  // Size the suggestion list to the space actually left between the search input and the
  // on-screen keyboard. A taller list doesn't fit, so the popup got shifted up over the
  // input and the shopper could no longer see what they were typing.
  useEffect(() => {
    if (!isSearchFocused) {
      return;
    }
    const viewport = window.visualViewport;
    const updateListHeight = () => {
      const bar = searchBarRef.current;
      if (!bar) {
        return;
      }
      const visibleHeight = viewport?.height ?? window.innerHeight;
      const barBottom = bar.getBoundingClientRect().bottom - (viewport?.offsetTop ?? 0);
      setSearchListHeight(Math.max(120, Math.min(360, Math.floor(visibleHeight - barBottom - 24))));
    };
    updateListHeight();
    viewport?.addEventListener('resize', updateListHeight);
    viewport?.addEventListener('scroll', updateListHeight);
    return () => {
      viewport?.removeEventListener('resize', updateListHeight);
      viewport?.removeEventListener('scroll', updateListHeight);
    };
  }, [isSearchFocused, value]);

  // `currency` is empty on the first render and only arrives once the master
  // list has loaded, so the initial useState value above misses it — without
  // this the modal opens with nothing ticked and Save writes an empty value.
  useEffect(() => {
    if (currency) {
      setSelectedCurrency(currency);
    }
  }, [currency]);

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousOverscroll = document.body.style.overscrollBehavior;
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.overscrollBehavior = 'contain';
    } else {
      document.body.style.overflow = previousOverflow || '';
      document.body.style.overscrollBehavior = previousOverscroll || '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.overscrollBehavior = '';
    };
  }, [isMenuOpen]);

  const handleSearchFocus = () => {
    setIsSearchFocused(!isSearchFocused);
  };

  const handleCollectionsToggle = () => {
    setIsCollectionsOpen(!isCollectionsOpen);
  };

  const handleMegaMenuOpen = (title: string | null) => {
    setActiveMenu(title);
    if (title) {
      setOpenedMenus((prev) => (prev.includes(title) ? prev : [...prev, title]));
    }
  };

  const reloadPage = () => {
    // window.location.reload();
    setActiveMenu(null);
    setIsMenuOpen(false);
  };

  const handleCurrencySelect = (value: string) => {
    // `value` is the country row's id — two countries can share a currency code,
    // so the id is what identifies the picked row. Persist the code and symbol
    // alongside it for formatCurrency and the rest of the app.
    const selected = currencyOption?.find((item: any) => item?.value === value);
    if (!selected) {
      return;
    }
    setSelectedCurrency(selected.value);
    setCurrency(selected.value);
    localStorage.setItem('currency', selected.code);
    localStorage.setItem('currencySymbol', selected.symbol);
    localStorage.setItem('currencyCountryId', selected.value);
    setRefresh(true);
    setIsCurrencyModalOpen(false);
  };

  const renderMenuTitleWithArrow = (title: string) => {
    const trimmedTitle = (title ?? '').trim();
    if (!trimmedTitle) {
      return null;
    }

    const words = trimmedTitle.split(/\s+/);
    if (words.length === 1) {
      return (
        <>
          {words[0]}
          <span className="inline-flex items-center whitespace-nowrap">
            &nbsp;
            <GoArrowUpRight className="inline-block w-[18px] h-[18px]" />
          </span>
        </>
      );
    }

    const leadingText = words.slice(0, -1).join(' ');
    const lastWord = words[words.length - 1];

    return (
      <>
        {leadingText}{' '}
        <span className="inline-flex items-center whitespace-nowrap">
          {lastWord}
          <span>&nbsp;</span>
          <GoArrowUpRight className="inline-block w-[18px] h-[18px]" />
        </span>
      </>
    );
  };

  return (
    <div className="sm:flex flex-col items-center gap-2 lg:gap-0 self-stretch relative hidden">
      <div className="w-full relative">
        <div className="container-xs px-4 ">
          <div className="flex items-center justify-between">
            <div className="w-[35%] flex gap-1 justify-start items-center -ml-4 ">
              <Hamburger toggled={isMenuOpen} toggle={handleMenuToggle} size={20} distance="sm" color="#18381d" />
              <Link href="/virtual-appointment" className="flex gap-2" onClick={reloadPage}>
                <IoIosLaptop className="h-[25px] w-[25px] text-primary" />
              </Link>
            </div>
            <div className="w-[45%]">
              <Link href="/" className="h-[40px] lg:w-full flex justify-center items-center " onClick={reloadPage}>
                <Image src="/images/ashclair.svg" alt="Ashclair Logo" preview={false} className="object-contain w-[50%] h-[100%] " />
              </Link>
            </div>
            <div className="flex w-[30%] justify-end  gap-[9px] items-center ">
              <div className="relative" ref={searchIconRef}>
                <Image
                  src="/images/img_search.svg"
                  preview={false}
                  width={22}
                  height={22}
                  alt="Search"
                  className="h-[18px] cursor-pointer w-[18px] md:h-[20px] md:w-[20px]"
                  onClick={handleSearchFocus}
                />
              </div>
              <Link href="/wishlist" className="relative" onClick={reloadPage}>
                <Image
                  src="/images/img_fi_833300.svg"
                  width={24}
                  height={24}
                  preview={false}
                  alt="wishlist"
                  className="h-[24px] w-[24px] text-primary"
                />
                {wishlistProducts?.length > 0 && (
                  <p className="absolute bottom-[-7px] left-3 m-auto flex h-[16px] w-[16px] items-center justify-center !rounded-lg bg-[#c5ccb4] text-center tracking-[1.20px] !p-2 text-[10px]">
                    {wishlistProducts?.reduce((total: any, category: any) => total + category.jewelry.length, 0)}
                  </p>
                )}
              </Link>
              <div className="relative h-[20px] w-[20px]  self-center flex items-center">
                <Link href="/cart" onClick={reloadPage}>
                  <PiHandbagLight className="relative left-0 right-0 top-0 m-auto h-[24px] w-[24px]  text-primary" />
                  {cartProducts?.length > 0 && (
                    <p className="absolute bottom-[-7px] left-3 m-auto flex h-[16px] w-[16px] items-center justify-center !rounded-lg bg-[#c5ccb4] text-center tracking-[1.20px] !p-2 text-[10px]">
                      {cartProducts.length}
                    </p>
                  )}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* search bar  moved to side navigation */}
        {!isMenuOpen && isSearchFocused && (
          <div ref={searchBarRef} className="sticky top-0 self-stretch px-0 !pt-1">
            <Select
              showSearch
              value={undefined}
              placeholder={'Search'}
              className="w-full border-black"
              popupClassName="header-search-dropdown"
              // Render the list inside the search bar so it moves with the header. In <body> it
              // was re-positioned on every page scroll, which made it lag behind and flicker.
              getPopupContainer={() => searchBarRef.current || document.body}
              // The virtual list assumes fixed-height rows and its touch scrolling is unreliable
              // on phones; these rows wrap to several lines, so render a plain scrollable list.
              virtual={false}
              listHeight={searchListHeight}
              dropdownAlign={{
                points: ['tl', 'bl'],
                offset: [0, -1], // Negative vertical offset
                // Always open below the input — never flip or shift up over it.
                overflow: { adjustX: false, adjustY: false },
              }}
              defaultActiveFirstOption={false}
              suffixIcon={searchLoading && value?.length > 0 ? <LoadingOutlined className="!text-primary text-[14px]" spin /> : null}
              filterOption={false}
              // suffixIcon={<Image src="/images/img_search.svg" preview={false} width={15} height={15} />}
              // popupMatchSelectWidth={false}
              size="small"
              onSearch={handleSearch}
              onChange={(newValue: string) => {
                handleChange(newValue);
                setIsSearchFocused(false);
              }}
              notFoundContent={null}
              onBlur={handleBlur}
              onKeyDown={(e: any) => {
                if (e.key === 'Enter') {
                  // use the current input value to navigate to search page
                  const query = e.target?.value || value || '';
                  router.replace(`/search?q=${encodeURIComponent(query)}`);
                  setIsSearchFocused(false);
                }
              }}
              autoFocus
            >
              {jewelryData.length > 0 &&
                jewelryData.slice(0, 5).map((d: any) => {
                  // Same route the desktop dropdown and the product cards use. The value used to
                  // be the bare sku slug, which the router resolved to `/<slug>` — the collection page.
                  const jewelryTypeName = d?.jewelrySubType?.parent_code;
                  const jewelryTypeData = jewelryTypeName?.toLowerCase()?.replace('_', '-');
                  const productHref = d?.is_customizable
                    ? `/custom-jewelry?type=2&state=s&id=${d?.jewelryDetails?.[0]?.sku_slug}`
                    : `/${jewelryTypeData}/premade?slug=${d?.jewelryDetails?.[0]?.sku_slug}`;
                  return (
                    <Select.Option key={productHref} style={{ color: 'black' }} value={productHref}>
                      <div className="flex items-center gap-2 !text-black">
                        <div className="h-[48px] w-[48px] shrink-0 bg-[#f8f8f8]">
                          <Image
                            preview={false}
                            width={48}
                            height={48}
                            className="object-contain"
                            fallback="/images/no_images.svg"
                            src={d?.jewelryDetails?.[0]?.carat_images?.[0] || '/images/no_images.svg'}
                          />
                        </div>
                        <div className="flex min-w-0 flex-col">
                          <p className="!whitespace-break-spaces">{d?.fullTitle}</p>
                          <p className="!whitespace-break-spaces">{formatCurrency(d?.jewelryDetails?.[0]?.selling_price)}</p>
                        </div>
                      </div>
                    </Select.Option>
                  );
                })}
              {jewelryData.length > 0 && (
                <Select.Option style={{ width: '100%' }} value={`/search?q=${value}`}>
                  <div className="hover:underline">See more results for "{value}"</div>
                </Select.Option>
              )}
              {value.length > 0 && jewelryData.length == 0 && !searchLoading && (
                <Select.Option style={{ width: '100%' }} value={'no-results'} disabled>
                  <div>No Results Found</div>
                </Select.Option>
              )}
            </Select>
          </div>
        )}

        {/* tap-outside backdrop: fills the right-side gap and closes the menu on tap */}
        {isMenuOpen && (
          <div
            className="absolute top-12 left-0 right-0 z-40 bg-black/50 transition-opacity duration-500 ease-in-out"
            style={{ height: 'calc(100dvh - 40px)' }}
            aria-hidden="true"
            onClick={() => {
              setActiveMenu(null);
              setIsMenuOpen(false);
            }}
          />
        )}

        {/* mobile navigation lists */}
        <div
          className={`absolute top-12 border left-0 inset-0 bg-white z-50 overflow-x-hidden transition-all duration-500 ease-in-out ${
            isMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          style={{ width: 'calc(100% - 4rem)', height: 'calc(100dvh - 40px)' }}
        >
          <div
            className="relative modal-content bg-white h-full p-5 pt-2 overflow-x-hidden overflow-y-auto overscroll-contain"
            style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
          >
            <ul className="px-0">
              {/* start here Mega Header Menu */}
              {megaHeader?.length > 0 &&
                megaHeader?.map((mainHeader: any, i: number) => {
                  const isMenuOpened = openedMenus.includes(mainHeader?.main_menu_title);
                  return (
                    mainHeader?.is_web_visible && (
                      <div key={i}>
                        <li>
                          <div
                            className="flex justify-between items-center p-2 border-b"
                            onClick={() => handleMegaMenuOpen(mainHeader?.main_menu_title)}
                          >
                            <Text
                              size="text3xl"
                              as="p"
                              onClick={handleCollectionsToggle}
                              className={`${header} !font-sans !font-light tracking-[2px] uppercase `}
                            >
                              {mainHeader?.main_menu_title}
                            </Text>
                            <MdChevronRight className="w-5 h-5" />
                          </div>
                          <div
                            className={`absolute top-0 left-0 inset-0 bg-white z-50 overflow-x-hidden transition-all duration-500 ease-in-out ${
                              activeMenu === mainHeader?.main_menu_title ? '-translate-x-0' : ' translate-x-[120%]'
                            }`}
                            style={{ width: '100%', maxHeight: 'calc(100dvh - 70px)' }}
                          >
                            <div className="relative  bg-white h-full flex flex-col">
                              <div className="flex justify-between mb-3 -mt-2 px-5 pt-5 flex-shrink-0">
                                {mainHeader?.main_menu_title_link ? (
                                  <Link href={mainHeader?.main_menu_title_link} className="inline-block">
                                    <Text size="text3xl" as="p" onClick={reloadPage} className="!font-sans !font-extralight tracking-[2px] uppercase">
                                      {renderMenuTitleWithArrow(mainHeader?.main_menu_title)}
                                    </Text>
                                  </Link>
                                ) : (
                                  <Text size="text3xl" as="p" className="!font-sans !font-extralight tracking-[2px] uppercase">
                                    {mainHeader?.main_menu_title}
                                  </Text>
                                )}

                                <p onClick={() => handleMegaMenuOpen(null)} className="text-[14px] flex p-1 justify-end ">
                                  <IoMdArrowBack className="h-5 w-5" />
                                  BACK
                                </p>
                              </div>
                              <div
                                className="flex flex-col gap-[20px] overflow-y-auto overscroll-contain flex-1 min-h-0"
                                style={{ paddingBottom: 'env(safe-area-inset-bottom)', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
                              >
                                <div className="w-full flex flex-row justify-between gap-5">
                                  <div className="grid grid-cols-1 gap-5 pb-10 w-full min-w-0">
                                    {menuColumnList?.map((item: string, index: number) => {
                                      if (mainHeader[item]?.length > 0) {
                                        return (
                                          <div key={index} className={`flex gap-4 border-b pb-2 mx-5 flex-col`}>
                                            {mainHeader?.[item]?.map((item: any, i: number, arr: any[]) => {
                                              const hasContent = item?.sub_menu?.length > 0 || item?.master?.length > 0;
                                              const showDivider = !hasContent && i < arr.length - 1;
                                              return (
                                                <div key={i} className={`flex flex-col gap-0 ${showDivider ? 'border-b pb-3' : ''}`}>
                                                  <div
                                                    // item?.sub_menu?.length !== 0 && item?.master?.length !== 0 &&
                                                    className={`${item?.link ? 'cursor-pointer hover:text-[#256030]' : ''} uppercase font-semibold text-[14px] tracking-[1px] flex items-center gap-0.5`}
                                                    onClick={() => {
                                                      // item?.sub_menu?.length === 0 && item?.master?.length === 0 &&
                                                      if (item?.link) {
                                                        router.push(item.link);
                                                        reloadPage();
                                                      }
                                                    }}
                                                  >
                                                    {item?.title}
                                                    {item?.link && <GoArrowUpRight className="inline-block w-[16px] h-[16px]" />}
                                                  </div>
                                                  {(item?.sub_menu?.length || item?.master?.length > 0) && (
                                                    <div className="w-full">
                                                      {item?.master?.length > 0 && (
                                                        <div
                                                          className={
                                                            item?.is_multiple_column
                                                              ? 'flex py-2 w-full flex-wrap gap-2'
                                                              : 'flex flex-col py-2 w-full gap-2'
                                                          }
                                                        >
                                                          {item?.master?.map((masterItem: any, masterIndex: number) => {
                                                            const findData = data?.find((el: any) => el.id === masterItem?.id);
                                                            return (
                                                              <div
                                                                key={masterIndex}
                                                                onClick={() => {
                                                                  // if (masterItem.link) {
                                                                  router.push(masterItem.value);
                                                                  reloadPage();
                                                                  // }
                                                                }}
                                                                className={`flex items-center h-[25px] cursor-pointer ${item?.is_multiple_column ? 'min-w-[48%] lg:w-full' : 'w-full'} flex-row gap-1.5`}
                                                              >
                                                                {isMenuOpened && masterItem && (
                                                                  <Image
                                                                    src={findData?.image?.[0]}
                                                                    alt={findData?.name}
                                                                    className="w-[10px] h-[10px] p-[1px] object-contain"
                                                                    preview={false}
                                                                    width={20}
                                                                    height={20}
                                                                  />
                                                                )}
                                                                <div
                                                                  className={`cursor-pointer capitalize font-normal  text-[13px] tracking-[1.8px] `}
                                                                >
                                                                  {findData?.name}
                                                                </div>
                                                              </div>
                                                            );
                                                          })}
                                                        </div>
                                                      )}
                                                      {item.is_master === false && item?.sub_menu?.length > 0 && item?.is_multiple_column ? (
                                                        <div className="flex w-full flex-wrap py-3 gap-1">
                                                          {item?.sub_menu?.map((subItem: any, subIndex: number) => (
                                                            <div
                                                              key={subIndex}
                                                              onClick={() => {
                                                                router.push(subItem?.link);
                                                                reloadPage();
                                                              }}
                                                              className="flex gap-1.5 hover:text-[#256030] grayscale hover:grayscale-0 cursor-pointer min-w-[48%] flex-row  h-[25px] items-center"
                                                            >
                                                              {isMenuOpened && subItem.image && (
                                                                <Image
                                                                  preview={false}
                                                                  src={subItem.image}
                                                                  className="object-contain w-[10px] h-[10px] p-[1px] "
                                                                  alt={subItem.title}
                                                                  width={20}
                                                                  height={25}
                                                                />
                                                              )}
                                                              <div className={` capitalize font-normal text-[13px] tracking-[1.8px]`}>
                                                                {subItem?.title}
                                                              </div>
                                                            </div>
                                                          ))}
                                                        </div>
                                                      ) : (
                                                        <div className="flex flex-col py-1 gap-0">
                                                          {item.is_master === false &&
                                                            item?.sub_menu?.map((subItem: any, subIndex: number) => (
                                                              <div
                                                                key={subIndex}
                                                                onClick={() => {
                                                                  router.push(subItem?.link);
                                                                  reloadPage();
                                                                }}
                                                                className="flex gap-1.5 cursor-pointer hover:text-[#256030] h-[25px] items-center md:w-full flex-row"
                                                              >
                                                                {isMenuOpened && subItem.image && (
                                                                  <Image
                                                                    preview={false}
                                                                    src={subItem.image}
                                                                    className="object-contain w-[10px] h-[10px] p-[1px]"
                                                                    alt={subItem.title}
                                                                    width={20}
                                                                    height={20}
                                                                  />
                                                                )}
                                                                <div className={` capitalize font-normal text-[13px] tracking-[1.8px]`}>
                                                                  {subItem?.title}
                                                                </div>
                                                              </div>
                                                            ))}
                                                        </div>
                                                      )}
                                                    </div>
                                                  )}
                                                </div>
                                              );
                                            })}
                                          </div>
                                        );
                                      }
                                    })}
                                  </div>
                                  {/* No menu banner column here: this view only shows at `sm` (≤550px) and the
                                      column was `lg:hidden` (≤1024px), so it never displayed — but its banner
                                      images (500–900KB each) still downloaded on every page load. */}
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      </div>
                    )
                  );
                })}
              {/* ends here Mega Header Menu */}

              {/* <li>
                <div className="relative h-[20px] sm:pb-0 px-2  !font-sans !font-light tracking-[2px] uppercase w-full self-center flex items-center">
                  <Select
                    className=" p-2 border-b bg-transparent  w-full  home-header-select border-none"
                    size="small"
                    defaultValue={currencyOption[0]?.value}
                    value={currency}
                    onChange={(e) => {
                      setCurrency(e);
                      localStorage.setItem('currency', e);
                      setRefresh(true);
                    }}
                  >
                    {currencyOption.length > 0 &&
                      currencyOption.map((ele: any) => {
                        return (
                          <Select.Option
                            size="small"
                            className=""
                            style={{
                              // padding: '1px',
                              minHeight: '12px',
                              fontSize: '14px',
                            }}
                            key={ele?.value}
                            value={ele?.value}
                          >
                            {ele?.label}
                          </Select.Option>
                        );
                      })}
                  </Select>
                </div>
              </li> */}
              <li>
                <div className="relative sm:pb-0 px-2  !font-sans !font-light tracking-[2px] uppercase w-full self-center flex items-center">
                  <button
                    onClick={() => setIsCurrencyModalOpen(true)}
                    className="relative sm:pb-2 py-2 !font-sans !font-light tracking-[2px] uppercase w-full self-center flex items-center justify-between"
                  >
                    <span className="!text-[12px]">{currencyOption?.find((el: any) => el.value == currency)?.label}</span>
                  </button>

                  {/* Currency Selection Modal */}
                  <Modal
                    open={isCurrencyModalOpen}
                    onCancel={() => setIsCurrencyModalOpen(false)}
                    footer={null}
                    width={400}
                    className="currency-selection-modal !p-0 !z-[2000]"
                    closable={true}
                    closeIcon={
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-6 h-6"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    }
                  >
                    <div className="flex flex-col items-center p-4">
                      <h2 className="text-lg mb-4">Select your country for shipping and currency</h2>

                      <div className="w-full mb-6">
                        {currencyOption.map((option: any) => (
                          <button
                            key={option.value}
                            onClick={() => handleCurrencySelect(option.value)}
                            className={`w-full p-3 text-left border-b border-gray-200 hover:bg-gray-50 flex items-center justify-between ${
                              selectedCurrency === option.value ? 'bg-gray-50' : ''
                            }`}
                          >
                            <span>{option.label}</span>
                            {selectedCurrency === option.value && (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="w-6 h-6 text-green-600"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                              </svg>
                            )}
                          </button>
                        ))}
                      </div>

                      <div className="flex gap-3 w-full">
                        {/* <button
                          onClick={() => setIsCurrencyModalOpen(false)}
                          className="w-1/2 p-2 text-center border border-gray-300 rounded hover:bg-gray-50"
                        >
                          Cancel
                        </button> */}
                        <button
                          onClick={() => handleCurrencySelect(selectedCurrency)}
                          className="w-full p-2 text-center bg-[#17381d] text-white rounded hover:bg-[#0f2614]"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </Modal>
                </div>
              </li>
              <li>
                <div className="h-[20px] py-2 border-t">
                  <div
                    className="flex gap-2 items-center"
                    onClick={() => {
                      router.push(user !== null && !user?.is_guest ? '/profile' : '/login');
                      reloadPage();
                    }}
                  >
                    <Image src="/images/img_fi_4331290.svg" width={24} height={24} preview={false} alt="profile" className="h-[20px] w-[20px]" />
                    <span className="!font-light !font-sans uppercase text-[14px] tracking-[2px]">
                      {user !== null && !user?.is_guest ? user?.first_name : 'sign in'}
                    </span>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
        <NavigationsMenus header={header} onNavigate={reloadPage} />
      </div>
    </div>
  );
};

export default HeaderMobileView;
