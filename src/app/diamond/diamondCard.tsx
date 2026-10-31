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
        className="flex flex-col gap-0.5 items-center w-[100px] md:!aspect-square sm:!aspect-square cursor-pointer"
        onClick={() => {
          dispatch(setSelectedShapesData(diamond?.id));
          router.push(`/custom-jewelry?type=2&state=s`);
        }}
      >
        <div>
          <Image
            className="aspect-square"
            height={100}
            preview={false}
            src={diamond?.image?.[1]}
            fallback="/images/no_images.svg"
            alt={diamond?.name}
          />
        </div>
        <p className="text-wrap text-center">{diamond?.name}</p>
      </div>
    </>
  );
}
