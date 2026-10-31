'use client';
import { useRef, useState, useEffect } from 'react';

import { Image } from 'antd';
import { motion, useScroll, useTransform, useMotionValue, useSpring, useMotionValueEvent } from 'framer-motion';
import Link from 'next/link';

type Product = {
  productImage?: string;
  productHoverImage?: string;
  productName?: React.ReactNode;
  productPrice?: React.ReactNode;
  slug?: string;
  discount_type?: string | null;
  discount_value?: string | null;
  discounted_price?: string | null;
  isWishlist?: string | null;
  sku_master_id?: string;
  jewelry_id?: string;
  estimated_delivery_days?: number | string | null;
  productVariation?: number | string | null;
  is_customizable?: boolean;
  variation_to_show?: any;
  variation_details?: any;
  jewelryDetails?: any;
  jewelryTypeData?: any;
  specialProductTitles?: { id: string; title: string }[] | null;
};

const GAP = 20;

function useBreakpoint() {
  const [state, setState] = useState({ cardWidth: 320, visible: 4 });
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w < 550) {
        setState({ cardWidth: w - 48, visible: 1 });
      } else if (w < 769) {
        setState({ cardWidth: 280, visible: 2 });
      } else if (w < 1024) {
        setState({ cardWidth: 300, visible: 3 });
      } else {
        setState({ cardWidth: 320, visible: 4 });
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return state;
}

export default function BestSellersCarousel({ products }: { products: Product[] }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { cardWidth, visible } = useBreakpoint();
  const step = cardWidth + GAP;

  // Section height — tall enough so vertical scroll drives the full horizontal pan
  const [sectionHeight, setSectionHeight] = useState('260vh');
  const maxXMV = useMotionValue(0);

  useEffect(() => {
    const compute = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const maxX = Math.max(0, products.length * step - vw + 120);
      maxXMV.set(maxX);
      // 100vh sticky content + extra scroll for the pan, minimum 200vh
      const extraVh = (maxX / vh) * 100;
      setSectionHeight(`${Math.max(200, Math.ceil(100 + extraVh + 40))}vh`);
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, [products.length, step]);

  // Progress from 0→1 across the full tall section (sticky theater pattern)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });

  // Scroll-driven horizontal pan
  const scrollX = useTransform([scrollYProgress, maxXMV], ([p, max]) => -(p as number) * (max as number));

  // Manual button offset with spring easing
  const rawManualX = useMotionValue(0);
  const manualX = useSpring(rawManualX, { stiffness: 280, damping: 32 });

  // Combined + clamped
  const x = useTransform([scrollX, manualX], ([s, m]) => {
    const minX = -maxXMV.get();
    return Math.max(minX, Math.min(0, (s as number) + (m as number)));
  });

  const [xVal, setXVal] = useState(0);
  const [maxXVal, setMaxXVal] = useState(0);
  useMotionValueEvent(x, 'change', setXVal);
  useMotionValueEvent(maxXMV, 'change', setMaxXVal);

  const canPrev = xVal < -8;
  const canNext = xVal > -maxXVal + 8;

  const prev = () => rawManualX.set(Math.min(0, rawManualX.get() + step));
  const next = () => rawManualX.set(Math.max(-maxXVal, rawManualX.get() - step));

  useEffect(() => {
    rawManualX.set(0);
  }, [cardWidth]);

  return (
    <section ref={sectionRef} className="relative bg-ivory" style={{ height: sectionHeight }}>
      {/* Sticky theater — locks to top while the tall section scrolls past */}
      <div
        className="sticky flex flex-col justify-start overflow-hidden pt-10 pb-14 lg:pt-8 lg:pb-12 sm:pt-6 sm:pb-8"
        style={{ top: 'var(--header-height)', height: 'calc(100vh - var(--header-height))' }}
      >
        {/* Header — z-10 keeps it above the will-change:transform track layer */}
        <div className="relative z-10 container-xs px-20 md:px-5 sm:px-3 pb-14 lg:pb-10 sm:pb-6">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex  items-center justify-between gap-5"
          >
            <div>
              <h2 className="font-cormorant text-[48px] uppercase tracking-[2.2px] text-primary leading-tight lg:text-[32px] sm:text-[22px]">
                Our Bestsellers Selection
              </h2>
            </div>

            <div className="flex items-center gap-6">
              {/* Prev / Next */}
              {/* <div className="flex items-center gap-3">
                <button
                  onClick={prev}
                  disabled={!canPrev}
                  aria-label="Previous"
                  className="w-10 h-10 border border-primary/30 flex items-center justify-center text-primary hover:border-luxury hover:text-luxury transition-all duration-300 disabled:opacity-20 disabled:cursor-not-allowed"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={next}
                  disabled={!canNext}
                  aria-label="Next"
                  className="w-10 h-10 border border-primary/30 flex items-center justify-center text-primary hover:border-luxury hover:text-luxury transition-all duration-300 disabled:opacity-20 disabled:cursor-not-allowed"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </div> */}

              <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
                <Link
                  href="/all"
                  className="font-libre text-sm tracking-[1.5px] uppercase text-primary hover:text-luxury transition-colors duration-300 flex items-center gap-2 sm:hidden"
                >
                  Discover All
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Horizontal track */}
        <div className="relative flex-1 min-h-0">
          <motion.div
            style={{ x }}
            className="absolute left-0 top-0 h-full flex items-center gap-5 will-change-transform
              2xl:pl-[calc((100vw-1400px)/2+100px)] xl:pl-24 lg:pl-20 md:pl-5 sm:pl-3 pl-[calc((100vw-1400px)/2+100px)]"
          >
            {products.map((product, index) => (
              <ProductCard key={index} product={product} index={index} cardWidth={cardWidth} />
            ))}
            {/* trailing spacer so last card doesn't sit at the hard right edge */}
            <div className="shrink-0 w-[10vw]" />
          </motion.div>

          {/* Edge fades */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-ivory to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-ivory to-transparent z-10" />
        </div>

        {/* Mobile CTA */}
        <div className="container-xs md:px-5 sm:px-3 mt-6 hidden sm:flex justify-center">
          <Link href="/all">
            <button className="font-libre text-sm tracking-[1.5px] uppercase bg-primary text-text_w px-10 h-[45px] hover:bg-mocha transition-colors duration-300">
              Discover All
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Product Card (unchanged) ─────────────────────────────────────────────────

function ProductCard({ product, index, cardWidth }: { product: Product; index: number; cardWidth: number }) {
  const [hovered, setHovered] = useState(false);
  const hasDiscount = product.discount_type && product.discounted_price && product.discounted_price !== 'null';
  const specialTitle = product.specialProductTitles?.[0]?.title;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.05 }}
      whileHover={{ y: -10 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="flex-shrink-0 cursor-pointer group"
      style={{ width: cardWidth }}
    >
      {/* Image */}
      <div className="relative overflow-hidden mb-4" style={{ aspectRatio: '1/1' }}>
        <motion.div transition={{ duration: 0.6 }} animate={{ scale: hovered ? 1.05 : 1 }} className="w-full h-full">
          <Image
            src={hovered && product.productHoverImage ? product.productHoverImage : (product.productImage ?? '/images/no_images.svg')}
            alt={typeof product.productName === 'string' ? product.productName : 'Product'}
            width="100%"
            height="100%"
            preview={false}
            className="!object-cover"
          />
        </motion.div>

        {specialTitle && (
          <div className="absolute top-4 left-4 z-10 px-3 py-1.5 bg-luxury text-text_w font-libre text-[10px] tracking-widest uppercase">
            {specialTitle}
          </div>
        )}

        {hasDiscount && (
          <div className="absolute top-4 right-4 z-10 px-3 py-1.5 bg-primary text-text_w font-libre text-[10px] tracking-widest uppercase">
            {product.discount_type === 'percentage' ? `${product.discount_value}% OFF` : `$${product.discount_value} OFF`}
          </div>
        )}

        {/* Quick view — slides up on hover */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={hovered ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-black/80 to-transparent"
        >
          <Link href={product.slug ? `/${product.slug}` : '#'}>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="w-full bg-text_w text-primary font-libre text-xs tracking-[1.5px] uppercase py-3 hover:bg-luxury hover:text-text_w transition-colors duration-300"
            >
              Quick View
            </motion.button>
          </Link>
        </motion.div>
      </div>

      {/* Info */}
      <div className="space-y-1">
        <h3 className="font-cormorant text-xl text-primary group-hover:text-luxury transition-colors duration-300 leading-snug line-clamp-1">
          {product.productName}
        </h3>
        <div className="flex items-center gap-2">
          {hasDiscount ? (
            <>
              <span className="font-libre text-sm text-luxury">${Math.ceil(Number(product.discounted_price))}</span>
              <span className="font-libre text-xs text-mocha/60 line-through">${Math.ceil(Number(product.productPrice))}</span>
            </>
          ) : (
            <span className="font-libre text-sm text-primary">${Math.ceil(Number(product.productPrice))}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
