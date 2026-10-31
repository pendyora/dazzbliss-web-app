'use client';

/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState } from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import MenuPreview from './MenuPreview';

const HeaderViewDynamic = ({ headerData }: any) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [timeoutId, setTimeoutId] = useState<any>(null);
  const path = usePathname();
  const handleMouseEnter = (title: string) => {
    const id = setTimeout(() => {
      setActiveMenu(title);
    }, 100);
    setTimeoutId(id);
  };
  const handleMouseLeave = () => {
    clearTimeout(timeoutId);
    setActiveMenu(null);
  };
  // Touch tablets have no hover, and every top-level label is also a link, so a tap used to navigate
  // straight away and the mega menu could never be seen. On hover-less devices the first tap opens
  // the menu and a second tap on the same label follows the link. Mouse users are unaffected.
  const handleTopLinkClick = (e: React.MouseEvent, id: string) => {
    if (window.matchMedia('(hover: none)').matches && activeMenu !== id) {
      e.preventDefault();
      clearTimeout(timeoutId);
      setActiveMenu(id);
    }
  };
  const generatePath = (title: string) => {
    return `${title.trim().replace(/\s+/g, '-').toLowerCase()}`;
  };
  return (
    <ul className="flex justify-around w-full text-[13px] ">
      {headerData?.length > 0 &&
        headerData?.map((item: any, index: number) => {
          const formattedPath = `${generatePath(item.main_menu_title)}`;
          let isActive = false;
          if (typeof window !== 'undefined') {
            isActive = path.includes(formattedPath)
              ? path.includes(formattedPath)
              : path.includes(window.location.pathname)
                ? path.includes(window.location.pathname)
                : false;
          }
          if (item?.is_web_visible == true) {
            return (
              <li key={index} className="lg:mx-0 md:mx-0">
                <div
                  className="px-12 xl:px-8 xls:px-5 lg:px-6 md:px-2 [@media(min-width:770px)_and_(max-width:999px)]:px-1 [@media(min-width:551px)_and_(max-width:719px)]:px-1 pt-[22px] -mt-[22px]"
                  onMouseEnter={() => handleMouseEnter(item.id)}
                  onMouseLeave={() => handleMouseLeave()}
                >
                  {/* 551-719px (small tablets): at 12px the five labels need 666px; 10px with tighter tracking
                      keeps the full menu on one row down to 551px instead of falling back to the mobile header. */}
                  <p
                    className={`tracking-[1.00px] uppercase  lg:text-[12px]  leading-normal pb-[14px] whitespace-nowrap [@media(min-width:551px)_and_(max-width:719px)]:text-[10px] [@media(min-width:551px)_and_(max-width:719px)]:tracking-[0.5px]`}
                  >
                    {item?.main_menu_title_link ? (
                      <Link href={item?.main_menu_title_link} onClick={(e) => handleTopLinkClick(e, item.id)}>
                        <span className={`${activeMenu === item.id ? '!font-normal border-b border-black' : ''}`}>{item.main_menu_title}</span>
                      </Link>
                    ) : (
                      <span className={`${activeMenu === item.id ? '!font-normal border-b border-black' : ''}`}>{item.main_menu_title}</span>
                    )}
                  </p>
                  {activeMenu == item.id && (
                    <div
                      className={`absolute left-0 w-[100%] bg-white shadow-lg z-50 transition-opacity duration-300 ease-in-out transform ${
                        activeMenu ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                      }`}
                    >
                      <MenuPreview Details={item} setActiveMenu={setActiveMenu} />
                    </div>
                  )}
                </div>
              </li>
            );
          }
        })}
    </ul>
  );
};

export default HeaderViewDynamic;
