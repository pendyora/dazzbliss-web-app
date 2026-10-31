// import PreloadImage from 'components/PreloadImage';

import { Image } from 'antd';
import { useRouter } from 'next/navigation';

import { useAppDispatch } from '@/store';
import { setSelectedShapesData } from '@/store/slices/customProducts/customProductSlice';

export default function DiamondsCard({ diamond }: any) {
  const dispatch = useAppDispatch();
  const router = useRouter();

  return (
    <>
      <div
        className="group flex w-[100px] cursor-pointer flex-col items-center gap-2.5 md:!aspect-square sm:!aspect-square"
        onClick={() => {
          dispatch(setSelectedShapesData(diamond?.id));
          router.push(`/custom-jewelry?type=2&state=s`);
        }}
      >
        <div className="grid place-items-center border border-transparent bg-paper p-1 transition-colors group-hover:border-ink">
          <Image
            className="aspect-square mix-blend-multiply"
            height={100}
            preview={false}
            src={diamond?.image?.[1]}
            fallback="/images/no_images.svg"
            alt={diamond?.name}
          />
        </div>
        <p className="m-0 text-wrap text-center text-[12.5px] text-ink group-hover:underline group-hover:underline-offset-4">{diamond?.name}</p>
      </div>
    </>
  );
}
