import React from 'react';

const H2 = 'm-0 font-cormorant text-[clamp(28px,2.6vw,40px)] font-medium leading-[1.1] text-ink';
const BODY = 'm-0 max-w-[880px] text-[15px] leading-[1.75] text-ink-soft sm:text-[14px]';

export default function CustomjewelryGroup2788() {
  return (
    <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-x-[clamp(32px,6vw,120px)] gap-y-12 px-[clamp(16px,3.2vw,56px)] md:grid-cols-1 md:gap-y-10">
      <div className="grid content-start gap-5 border-t border-line pt-8">
        <span className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-gilt">The collection</span>
        <h2 className={H2}>
          Large collection of <em className="italic text-gilt">rings</em>
        </h2>
        <p className={BODY}>
          No more hopping from one jewel store to the other; we have everything you need in one place. Whether you need a 10k, 14k, 18k gold wedding
          band or a sterling silver engagement ring, we have these and many more. Our team is highly experienced working with the most popular metals
          such as gold, diamond, sterling silver, platinum, brass, cobalt, tungsten, stainless steel among others.
        </p>
        <p className={BODY}>
          We also have in our collection high quality gemstones to accentuate your ring including black, green, red and blue diamond, blue sapphire,
          ruby, Tanzanite, Amethyst, blue topaz, quartz among others. With this wide range of rings and center stones in our store, there is no reason
          for you to buy stock jewelry.
        </p>
      </div>
      <div className="grid content-start gap-5 border-t border-line pt-8">
        <span className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-gilt">How it works</span>
        <h2 className={H2}>
          Personalized jewelry made <em className="italic text-gilt">easier</em>
        </h2>
        <p className={BODY}>
          This versatile collection makes jewelry customization easier and more affordable. You can now make your dream ring a reality through these
          easy steps:
        </p>
        <ol className="m-0 grid list-none gap-0 border-t border-line p-0">
          {[
            ['Contact us', 'We require a few details including name, email and phone number for ease of communication.'],
            [
              'Submit ring design/ sketch',
              'Provide our designers with the ring you have in mind. This also includes the preferred metal, center stone and price range. You can upload images of the ring design if you have any.',
            ],
            [
              'Presentation of rendering',
              'Our team provides a rendering of the ring based on your requirements. At this stage, you can give a go-ahead or request some modification.',
            ],
          ].map(([title, text], i) => (
            <li key={title} className="flex gap-4 border-b border-line py-4">
              <span className="grid h-[22px] w-[22px] flex-none place-items-center rounded-full border border-line-strong text-[10.5px] tabular-nums text-ink-soft">
                {i + 1}
              </span>
              <p className="m-0 text-[14px] leading-[1.65] text-ink-soft">
                <b className="font-medium text-ink">{title}:</b> {text}
              </p>
            </li>
          ))}
        </ol>
        <p className={BODY}>
          Once you have given us the approval, our team goes to work to handcraft the best piece for you. We promise 100% satisfaction and we do this
          by delivering high quality craftsmanship. You will have another chance to look at the finished piece before delivery.
        </p>
        <p className={BODY}>
          When you design your own jewelry with us, it saves you time and money and you enjoy peace of mind knowing the customized piece reflects your
          needs.
        </p>
      </div>
    </div>
  );
}
