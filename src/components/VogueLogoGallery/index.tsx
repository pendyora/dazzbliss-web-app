import React from 'react';

import { Img } from './..';

interface Props {
  className?: string;
}

export default function VogueLogoGallery({ ...props }: Props) {
  return (
    <div {...props} className={`${props.className} flex sm:flex-col justify-between items-center gap-5 flex-1`}>
      <Img
        src="img_vogue_revista_logo.png"
        width={262}
        height={68}
        alt="Vogue Revista Logo"
        className="h-[68px] w-[20%] object-contain opacity-[0.29] md:w-full"
      />
      <Img
        src="img_vogue_revista_logo.png"
        width={262}
        height={68}
        alt="Vogue Revista Logo"
        className="h-[68px] w-[20%] object-contain opacity-[0.29] md:w-full"
      />
      <Img
        src="img_vogue_revista_logo.png"
        width={262}
        height={68}
        alt="Vogue Revista Logo"
        className="h-[68px] w-[20%] object-contain opacity-[0.29] md:w-full"
      />
      <Img
        src="img_vogue_revista_logo.png"
        width={262}
        height={68}
        alt="Vogue Revista Logo"
        className="h-[68px] w-[20%] object-contain opacity-[0.29] md:w-full"
      />
    </div>
  );
}
