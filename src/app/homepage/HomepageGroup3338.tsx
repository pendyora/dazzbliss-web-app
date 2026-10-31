import React, { Suspense } from 'react';

import UserProfile2 from '../../components/UserProfile2';

const data = [
  {
    userImage: '/img_ashclair_polinach_11007534.png',
    headlineText: 'Less than $500',
    path: '/less-than-five-hundred',
  },
  {
    userImage: '/img_ashclair_mathilde.png',
    headlineText: 'Less than $1000',
    path: '/less-than-thousand',
  },
  {
    userImage: '/img_ashclair_diam_630x632.png',
    headlineText: 'Less than $2000',
    path: '/less-than-two-thousand',
  },
];

export default function HomepageGroup3338() {
  return (
    <div className="self-stretch">
      <div className="container-xs flex gap-2.5 sm:gap-2  2xl:justify-between xl:flex-row xl:justify-between sm:grid sm:grid-cols-2 sm:px-3">
        <Suspense fallback={<div>Loading feed...</div>}>
          {data.map((d, index) => (
            <UserProfile2
              {...d}
              key={'group3025' + index}
              className={`${(index + 1) % 3 == 0 ? 'sm:col-span-2 sm:!h-auto overflow-hidden sm:mb-5 sm:aspect-[2/1]' : 'sm:col-span-1 sm:h-auto sm:aspect-square'}`}
            />
          ))}
        </Suspense>
      </div>
    </div>
  );
}
