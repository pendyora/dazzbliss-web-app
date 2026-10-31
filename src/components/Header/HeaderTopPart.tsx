import React from 'react';

import { LoadingOutlined } from '@ant-design/icons';
import { Image, Select } from 'antd';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useAppSelector } from '@/store';
import { formatCurrency } from '@/utils/common';

import { Text } from '../Text';
import YotpoBadge from '../YotpoBadge';

const HeaderTopPart = ({
  isFocused,
  handleFocus,
  handleSearch,
  handleChange,
  currencyOption,
  currency,
  setCurrency,
  data,
  handleBlur,
  value,
  setRefresh,
  searchLoading,
}: any) => {
  const { user } = useAppSelector((state) => state.auth.auth);
  const { cartProducts, wishlistProducts } = useAppSelector((state) => state?.cart);
  const router = useRouter();

  return (
    <div className="flex items-center justify-between">
      <div className="w-[30%] flex justify-start">
        <div>
          <Link href="/virtual-appointment" className="flex gap-2">
            <Image src="/images/appointment.svg" preview={false} fallback="/images/no-images.svg" alt="appointment" width={20} height={20} />
            <p className="text-[14px] font-normal  lg:text-[12px]">Virtual Appointment</p>
          </Link>
        </div>
      </div>
      <div className="w-[17%] md:w-[25%]">
        <Link href="/" className="h-[57px] w-[100%] lg:h-[50px] lg:w-full flex justify-center items-center">
          <Image
            src="/images/ashclair.svg"
            // width={180}
            preview={false}
            // height={70}
            alt="Ashclair Logo"
            className="object-contain lg:w-[60%]"
          />
        </Link>
      </div>
      <div className="flex w-[30%] md:!w-[35%] lg:w-[25%]  justify-end gap-3 md:gap-2  items-center">
        <div className="flex items-center">
          {!isFocused ? (
            <div className="flex items-center gap-2 cursor-pointer" onClick={handleFocus}>
              <Image
                src="/images/img_search.svg"
                preview={false}
                width={20}
                height={20}
                alt="Search"
                className="h-[18px] w-[18px] md:h-[20px] md:w-[20px]"
              />
              <Text size="texts" className="!text-[14px] font-extralight uppercase tracking-[0.5px] whitespace-nowrap lg:hidden">
                Search
              </Text>
            </div>
          ) : (
            <div className="">
              <Select
                showSearch
                value={undefined}
                placeholder={'Search'}
                className="w-[250px] header-search lg:w-[180px] md:w-[160px] sm:w-[140px] transition-all duration-300  transform scale-100"
                defaultActiveFirstOption={false}
                suffixIcon={searchLoading && value?.length > 0 ? <LoadingOutlined className="!text-primary text-[14px]" spin /> : null}
                filterOption={false}
                popupMatchSelectWidth={false}
                size="small"
                onSearch={handleSearch}
                onChange={handleChange}
                placement={'bottomRight'}
                onKeyDown={(value: any) => {
                  if (value.key === 'Enter') {
                    router.replace(`/search?q=${value.target.value}`);
                  }
                }}
                notFoundContent={null}
                onBlur={handleBlur}
                autoFocus
              >
                {data.length > 0 &&
                  data?.slice(0, 3)?.map((d: any) => {
                    const jewelryTypeName = d?.jewelrySubType?.parent_code;
                    const jewelryTypeData = jewelryTypeName?.toLowerCase()?.replace('_', '-');
                    return (
                      <Select.Option
                        key={
                          d?.is_customizable
                            ? `/custom-jewelry?type=2&state=s&id=${d?.jewelryDetails?.[0]?.sku_slug}`
                            : `/${jewelryTypeData}/premade?slug=${d?.jewelryDetails?.[0]?.sku_slug}`
                        }
                        style={{ width: '100%', maxWidth: '30vw', padding: '4px' }}
                        value={d?.d?.jewelryDetails?.[0]?.sku_slug}
                      >
                        <div className="flex items-center gap-3 h-[100px]">
                          <div className="h-full flex justify-center items-center aspect-square bg-[#fff]">
                            <Image
                              preview={false}
                              // width={50}
                              // height={50}
                              className="w-full h-full object-cover"
                              fallback="/images/no_images.svg"
                              src={d?.jewelryDetails[0]?.carat_images?.[0] || '/images/no_images.svg'}
                            />
                          </div>
                          <div className="flex flex-col">
                            <p className="text-wrap">{d?.fullTitle}</p>
                            <p className="!font-castoro">{formatCurrency(d?.jewelryDetails?.[0]?.selling_price)}</p>
                          </div>
                        </div>
                      </Select.Option>
                    );
                  })}
                {data.length > 0 && (
                  <Select.Option style={{ width: '100%', maxWidth: '40vw' }} value={`${process.env.NEXT_PUBLIC_BASE_URL}/search?q=${value}`}>
                    <div className="hover:underline">See more results for "{value}"</div>
                  </Select.Option>
                )}
                {value.length > 0 && data.length == 0 && !searchLoading && (
                  <Select.Option style={{ width: '100%' }} value={'no-results'}>
                    <div>No Results Found for "{value}"</div>
                  </Select.Option>
                )}
              </Select>
            </div>
          )}
        </div>

        <Link href="/wishlist" className="relative">
          <Image
            src="/images/img_fi_833300.svg"
            width={20}
            preview={false}
            height={20}
            alt="wishlist"
            className="h-[18px] w-[18px] md:h-[20px] md:w-[20px]"
          />
          {wishlistProducts?.length > 0 && (
            <p className="absolute bottom-[-7px] left-3 m-auto flex h-[16px] w-[16px] items-center justify-center !rounded-lg !bg-secondary !text-text_w text-center tracking-[1.20px] !p-2 text-[10px]">
              {wishlistProducts?.reduce((total: any, category: any) => total + category.jewelry.length, 0)}
            </p>
          )}
        </Link>

        <Link href="/cart" className="relative">
          <Image src="/images/img_bag.svg" width={20} preview={false} height={20} alt="Bag" className="h-[18px] w-[18px] md:h-[20px] md:w-[20px]" />
          {cartProducts?.length > 0 && (
            <p className="absolute bottom-[-7px] left-3 m-auto flex h-[16px] w-[16px] items-center justify-center !rounded-lg !bg-secondary !text-text_w text-center tracking-[1.20px] !p-2 text-[10px]">
              {cartProducts.length}
            </p>
          )}
        </Link>

        <Link href={user !== null && !user?.is_guest ? '/profile' : '/login'} className="w-fit flex uppercase gap-1 items-center">
          <Image
            src="/images/img_fi_4331290.svg"
            width={24}
            height={24}
            preview={false}
            alt="profile"
            className="h-[18px] w-[18px] md:h-[20px] md:w-[20px]"
          />
          {user !== null && !user?.is_guest && (
            <Text size="texts" className="!text-[14px] font-extralight">
              {window.innerWidth <= 1024 && window.innerWidth >= 768 && user?.first_name?.length > 8
                ? `${user?.first_name?.slice(0, 8)}..`
                : user?.first_name}
            </Text>
          )}
        </Link>
        {currency && (
          <Select
            className="bg-transparent !w-[70px] p-0 home-header-select border-none"
            size="small"
            defaultValue={currencyOption[0]?.value}
            value={currency}
            onChange={(e) => {
              // `e` is the country row's id, not the currency code — two countries
              // can share a code, so the id is what identifies the picked row.
              const selected = currencyOption?.find((item: any) => item?.value === e);
              if (!selected) {
                return;
              }
              localStorage.setItem('currencySymbol', selected.symbol);
              localStorage.setItem('currency', selected.code);
              localStorage.setItem('currencyCountryId', selected.value);
              setCurrency(e);
              setRefresh(true);
            }}
          >
            {currencyOption.length > 0 &&
              currencyOption.map((ele: any) => {
                return (
                  <Select.Option
                    size="small"
                    className="home-header-select !py-3 !px-1"
                    style={{
                      // padding: '1px',
                      minHeight: '12px',
                      fontSize: '14px',
                    }}
                    key={ele?.value}
                    optionPadding={10}
                    optionHeight={'10px'}
                    value={ele?.value}
                  >
                    {ele?.label}
                  </Select.Option>
                );
              })}
          </Select>
        )}
      </div>
      {/* Taken out of the icon row's flow — at its natural size it's taller than
          the search/wishlist/cart icons, so leaving it inline was inflating that
          row's height and pushing the nav-links row below it down. Floating it
          here instead keeps both rows their normal height, and `top-1/2` +
          `-translate-y-1/2` centers it across the whole header block (icon row
          + nav-links row together) regardless of their exact heights. Requires
          a positioned ancestor — see the `relative` added in Header/index.tsx
          on the wrapper around both rows. */}
      {/* Tablet (551-1024px): `right-8` above assumes the wide desktop gutter — the
          badge floats in the empty margin the container padding leaves beside the
          content. That gutter is 112-160px on desktop, but only 80px at `lg:` and
          20px at `md:`, so the 56px badge pinned 32px from the edge lands ON the
          currency selector and the nav links instead (68px of overlap below 770px).
          Pinning it flush to the edge and scaling it down shrinks its footprint: 80%
          (8-53px from the edge) clears the 80px `lg:` gutter outright, and below 770px
          70% (8-47px) is paired with a `pr-[52px]` reservation on the two header rows
          (Header/index.tsx). The extra step down matters — the nav links need 666px and
          an iPad mini portrait (744px) only has ~672px once the badge is accounted for,
          so a larger reservation there would start clipping "EDUCATION".
          `origin-right` keeps the right edge and the vertical centring fixed while it
          scales, so it stays pinned exactly where `right-2`/`top-1/2` put it. */}
      {process.env.NEXT_PUBLIC_YOTPO_APP_KEY && (
        <YotpoBadge
          width={56}
          className="absolute top-1/2 right-8 -translate-y-1/2 [@media(min-width:551px)_and_(max-width:1024px)]:right-2 [@media(min-width:551px)_and_(max-width:1024px)]:scale-[0.8] [@media(min-width:551px)_and_(max-width:1024px)]:origin-right [@media(min-width:551px)_and_(max-width:769px)]:scale-[0.7] [@media(min-width:551px)_and_(max-width:1024px)_and_(orientation:portrait)]:hidden"
        />
      )}
    </div>
  );
};

export default HeaderTopPart;
