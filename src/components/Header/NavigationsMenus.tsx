'use client';
import { Tooltip } from 'antd';
import Link from 'next/link';

/**
 * NavigationsMenus component
 * @description This component will display the navigation menu for the header
 * @param {string} header - The class name for the header text
 * @returns {JSX.Element} - The JSX element for the navigation menu
 */
const NavigationsMenus = ({ header, onNavigate }: { header: string; onNavigate?: () => void }) => {
  // const router = useRouter();
  // const onClickHeader = (name: string) => {
  //   window.scrollTo(0, 0);
  //   switch (name) {
  //     case "customJewelry":
  //       router.push("/design-your-own");
  //       break;
  //     case "collectionPage":
  //       router.push("/all");
  //       break;
  //     case "giftGuide":
  //       router.push("/giftguide");
  //       break;
  //     default:
  //       break;
  //   }
  // };

  return (
    <div className="flex sm:hidden justify-center self-stretch bg-[#ffffff] py-[14px]">
      <div className="container-xs flex justify-center self-end px-[18px] 2xl:px-[160px] xl:px-28 lg:px-20 md:px-5">
        <div className="flex w-full justify-center">
          <ul className="flex flex-wrap gap-[158px] w-full justify-around xl:w-full xl:justify-around 2xl:gap-[120px] xl:gap-5 lg:gap-2 md:gap-5">
            <li>
              <Link href="/design-your-own" onClick={() => onNavigate?.()}>
                <p className={header}>JEWELRY</p>
              </Link>
            </li>
            <li>
              <Link href="/all" onClick={() => onNavigate?.()}>
                <p className={header}>COLLECTIONS</p>
              </Link>
            </li>
            <li>
              <Tooltip title="Coming Soon">
                <p className={header}>FOR COUPLES</p>
              </Tooltip>
            </li>
            <li>
              <Tooltip title="Coming Soon">
                <p className={header}>DIAMONDS</p>
              </Tooltip>
            </li>
            <li>
              <Tooltip title="Coming Soon">
                <p className={header}>EDUCATION</p>
              </Tooltip>
            </li>
            <li>
              <Link href="/giftguide" onClick={() => onNavigate?.()}>
                <p className={header}>GIFT GUIDE</p>
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NavigationsMenus;
