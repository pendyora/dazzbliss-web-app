import React from 'react';

import { Button } from './..';

export default function YearlyArticlesNavigation(props: any) {
  return (
    <div className={`${props.className} flex flex-wrap sm:overflow-scroll sm:flex-nowrap sm:gap-2  items-center gap-3.5 flex-1`}>
      <Button size="xs" shape="round" className="w-[190px]  tracking-[0.40px] text-lg">
        ALL ARTICLES
      </Button>
      {props.list &&
        props.list.map((item: any, i: number) => (
          <Button size="xs" key={i} shape="round" className="w-[88px]  tracking-[0.40px] text-lg">
            {item}
          </Button>
        ))}
    </div>
  );
}
