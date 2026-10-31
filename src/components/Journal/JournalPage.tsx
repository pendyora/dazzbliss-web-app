'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import dayjs from 'dayjs';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { LuLoader, LuSearch } from 'react-icons/lu';

import { addSubmitSignUp } from '@/services/cartService';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchBlogFilter, fetchBlogList, fetchFeaturedViews } from '@/store/slices/blog/blogSlice';
import { isValidEmailFormat } from '@/utils/emailValidation';
import { trackSubscribe } from '@/utils/metaPixel';

// The Journal (design-mockups/blog): lead story, topic tabs + search, a 3-column grid with a wide feature card and a
// navy newsletter tile, and "Load more". Used by both /blog and /blog/all-blogs, so existing links keep working.

const PAGE_SIZE = 12;
const FALLBACK = '/images/no_images.svg';
const SHELL = 'mx-auto w-full max-w-[1440px] px-[clamp(16px,3.2vw,48px)]';

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

const dateOf = (post: any) => (post?.createdAt ? dayjs(post.createdAt).format('D MMM YYYY') : '');
const clip = (s?: string, n = 140) => (s && s.length > n ? `${s.slice(0, n).trimEnd()}…` : s);

function Cover({ src, alt, className = '' }: { src?: string; alt: string; className?: string }) {
  return (
    <img
      src={src || FALLBACK}
      alt={alt}
      loading="lazy"
      onError={(e) => {
        if (!e.currentTarget.src.endsWith(FALLBACK)) {
          e.currentTarget.src = FALLBACK;
        }
      }}
      className={`h-full w-full object-cover transition-transform duration-[1200ms] ease-luxe group-hover:scale-[1.035] ${className}`}
    />
  );
}

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <span className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-teal">{children}</span>
);

function Newsletter() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle');
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmailFormat(email)) {
      setError('Enter a valid email address');
      return;
    }
    setState('sending');
    setError('');
    try {
      const res: any = await addSubmitSignUp({ email, coupon_id: null });
      if (res.status === 201) {
        trackSubscribe();
        setState('done');
        return;
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Something went wrong. Please try again.');
    }
    setState('idle');
  };

  return (
    <div className="relative grid min-h-full content-end gap-3.5 bg-navy px-7 py-8 text-noir-on before:pointer-events-none before:absolute before:inset-3.5 before:border before:border-teal before:content-['']">
      <span className="relative text-[10.5px] font-semibold uppercase tracking-[0.16em] text-teal-soft">The Pendyora letter</span>
      <b className="relative font-cormorant text-[30px] font-medium leading-[1.1] text-paper">New stories, once a month</b>
      <p className="relative m-0 text-[14px] text-noir-on/85">Guides, new collections and private previews. No spam.</p>
      {state === 'done' ? (
        <p className="relative m-0 text-[14px] text-paper">Thank you, you&apos;re on the list.</p>
      ) : (
        <form onSubmit={submit} className="relative grid gap-2" noValidate>
          <label className="sr-only" htmlFor="journal-nl">
            Email
          </label>
          <input
            id="journal-nl"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email"
            className="h-[46px] rounded-none border border-noir-on/40 bg-transparent px-3.5 text-paper placeholder:text-noir-on/60 focus:border-paper focus:ring-0"
          />
          {error && <span className="text-[12px] text-noir-on">{error}</span>}
          <button
            type="submit"
            disabled={state === 'sending'}
            className="h-[46px] bg-teal text-[12px] font-semibold uppercase tracking-[0.14em] text-paper transition-colors hover:bg-noir-on hover:text-navy disabled:opacity-60"
          >
            {state === 'sending' ? 'Subscribing…' : 'Subscribe'}
          </button>
        </form>
      )}
    </div>
  );
}

export default function JournalPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const categorySlug = searchParams?.get('category') || 'all';
  const { blogFilter, blogFeaturedViews } = useAppSelector((state) => state.blog);
  const master = useAppSelector((state) => state.master.data);
  const masterData: any[] = useMemo(() => master ?? [], [master]);

  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [posts, setPosts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const request = useRef(0);

  useEffect(() => {
    if (!blogFilter || blogFilter.length === 0) {
      dispatch(fetchBlogFilter());
    }
    if (!blogFeaturedViews || Object.keys(blogFeaturedViews).length === 0) {
      dispatch(fetchFeaturedViews());
    }
    // Load once; the slices cache the results.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 400);
    return () => clearTimeout(t);
  }, [query]);

  const nameOf = useCallback((id: any) => masterData.find((m: any) => m.id === id)?.name, [masterData]);

  const tabs = useMemo(
    () =>
      (blogFilter ?? []).map((f: any) =>
        f.type === 'all'
          ? { id: 'all', name: 'All', slug: 'all', count: f.count }
          : { id: f.type, name: nameOf(f.type) ?? 'Other', slug: slugify(nameOf(f.type) ?? ''), count: f.count },
      ),
    [blogFilter, nameOf],
  );
  const active = tabs.find((t: any) => t.slug === categorySlug) ?? tabs.find((t: any) => t.id === 'all');
  const activeId = active?.id;

  const load = useCallback(
    async (pageNo: number) => {
      if (!activeId) {
        return;
      }
      const id = ++request.current;
      if (pageNo === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      const res: any = await dispatch(fetchBlogList({ category: activeId, page: pageNo, size: PAGE_SIZE, search: debounced }));
      if (id !== request.current) {
        return;
      }
      const rows = res?.payload?.data?.rows ?? [];
      setTotal(res?.payload?.data?.count ?? 0);
      setPosts((prev) => (pageNo === 1 ? rows : [...prev, ...rows]));
      setPage(pageNo);
      setLoading(false);
      setLoadingMore(false);
    },
    [activeId, debounced, dispatch],
  );

  useEffect(() => {
    load(1);
  }, [load]);

  const selectTab = (slug: string) => {
    const params = new URLSearchParams(searchParams?.toString());
    if (slug === 'all') {
      params.delete('category');
    } else {
      params.set('category', slug);
    }
    router.replace(`${pathname}${params.toString() ? `?${params}` : ''}`, { scroll: false });
  };

  const lead = blogFeaturedViews?.slider_view?.[0];
  const browsingAll = active?.id === 'all' && !debounced;
  const list = browsingAll && lead ? posts.filter((p) => p.slug !== lead.slug) : posts;

  const cards: React.ReactNode[] = [];
  list.forEach((post, i) => {
    const topic = nameOf(post?.type);
    const wide = browsingAll && i === 2 && list.length >= 6;
    cards.push(
      wide ? (
        <Link
          key={post.slug ?? i}
          href={`/blog/${post?.slug}`}
          className="group col-span-2 grid grid-cols-2 items-stretch gap-7 bg-mist text-ink hover:text-ink md:col-span-1 md:grid-cols-1 md:gap-0"
        >
          <figure className="m-0 min-h-[280px] overflow-hidden bg-stone md:aspect-video md:min-h-0">
            <Cover src={post?.thumbnail_image} alt={post?.title ?? ''} />
          </figure>
          <span className="grid content-center gap-3 py-7 pr-7 md:px-5 md:pb-6 md:pt-5">
            <Eyebrow>Featured{topic ? ` · ${topic}` : ''}</Eyebrow>
            <h3 className="m-0 font-cormorant text-[32px] font-medium leading-[1.1] group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4">
              {post?.title}
            </h3>
            {post?.subtitle && <p className="m-0 line-clamp-3 text-[14px] text-ink-soft">{clip(post.subtitle, 220)}</p>}
            <span className="text-[12.5px] text-ink-faint">{dateOf(post)}</span>
          </span>
        </Link>
      ) : (
        <Link key={post.slug ?? i} href={`/blog/${post?.slug}`} className="group grid content-start gap-3 text-ink hover:text-ink">
          <figure className="m-0 aspect-[4/3] overflow-hidden bg-stone">
            <Cover src={post?.thumbnail_image} alt={post?.title ?? ''} />
          </figure>
          {topic && <Eyebrow>{topic}</Eyebrow>}
          <h3 className="m-0 font-cormorant text-[25px] font-medium leading-[1.12] group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4">
            {clip(post?.title, 110)}
          </h3>
          {post?.subtitle && <p className="m-0 line-clamp-2 text-[14px] text-ink-soft">{post.subtitle}</p>}
          <span className="text-[12.5px] text-ink-faint">{dateOf(post)}</span>
        </Link>
      ),
    );
    if (browsingAll && i === 1) {
      cards.push(<Newsletter key="newsletter" />);
    }
  });

  const shown = posts.length;

  return (
    <div className="bg-paper font-libre text-[14px] leading-[1.55] text-ink antialiased">
      <div className={SHELL}>
        <div className="pb-7 pt-[clamp(32px,4vw,48px)]">
          <nav aria-label="Breadcrumb" className="mb-3 flex gap-2 text-[12px] text-ink-soft">
            <Link href="/" className="text-ink-soft hover:text-ink">
              Home
            </Link>
            <span aria-hidden className="text-line-strong">
              /
            </span>
            <span aria-current="page">Journal</span>
          </nav>
          <h1 className="m-0 font-cormorant text-[clamp(40px,4.6vw,60px)] font-medium leading-none">The Journal</h1>
          <p className="m-0 mt-2.5 max-w-[56ch] text-[15px] text-ink-soft">
            Guides to diamonds and metals, how our pieces are made, and stories from the people who wear them.
          </p>
        </div>

        {lead && (
          <Link
            href={`/blog/${lead.slug}`}
            className="group grid grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] border border-line bg-haze text-ink hover:text-ink lg:grid-cols-1"
          >
            <figure className="m-0 aspect-[16/11] overflow-hidden bg-stone">
              <Cover src={lead.thumbnail_image} alt={lead.title ?? ''} />
            </figure>
            <span className="grid content-center gap-3.5 p-[clamp(28px,4vw,56px)]">
              <Eyebrow>Editor&apos;s pick{nameOf(lead.type) ? ` · ${nameOf(lead.type)}` : ''}</Eyebrow>
              <h2 className="m-0 font-cormorant text-[clamp(30px,3vw,44px)] font-medium leading-[1.05]">{lead.title}</h2>
              {lead.subtitle && <p className="m-0 text-[15px] leading-[1.7] text-ink-soft">{clip(lead.subtitle, 220)}</p>}
              <span className="text-[12.5px] text-ink-faint">{dateOf(lead)}</span>
              <span className="mt-1.5 justify-self-start border-b border-current text-[12px] font-semibold uppercase tracking-[0.12em]">
                Read the story
              </span>
            </span>
          </Link>
        )}
      </div>

      <div className="sticky top-[var(--header-height,108px)] z-20 mt-[clamp(40px,5vw,64px)] border-b border-line bg-paper">
        <div className={`${SHELL} flex min-h-[58px] items-center gap-6 md:flex-wrap md:gap-0 md:pb-3`}>
          <div role="toolbar" aria-label="Topics" className="flex flex-1 gap-[26px] overflow-x-auto [scrollbar-width:none]">
            {tabs.map((t: any) => (
              <button
                key={t.id}
                type="button"
                aria-pressed={active?.id === t.id}
                onClick={() => selectTab(t.slug)}
                className={`flex-none border-b-[1.5px] pb-4 pt-[18px] text-[13.5px] ${
                  active?.id === t.id ? 'border-ink font-semibold text-ink' : 'border-transparent text-ink-soft hover:text-ink'
                }`}
              >
                {t.name}
                {t.id !== 'all' && <span className="ml-1 text-[12px] text-ink-faint">{t.count}</span>}
              </button>
            ))}
          </div>
          <label className="flex h-10 w-[240px] flex-none items-center gap-2.5 border border-line-strong px-3 focus-within:border-ink lg:w-[180px] md:order-first md:mt-3 md:w-full">
            <LuSearch className="h-4 w-4 text-ink-soft" strokeWidth={1.3} />
            <span className="sr-only">Search the journal</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the journal"
              className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[13.5px] outline-none focus:ring-0"
            />
          </label>
        </div>
      </div>

      <div className={SHELL}>
        {loading ? (
          <div className="grid grid-cols-3 gap-x-5 gap-y-12 pb-6 pt-9 lg:grid-cols-2 md:grid-cols-1" aria-busy="true" aria-label="Loading stories">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="grid gap-3">
                <div className="aspect-[4/3] animate-pulse bg-stone" />
                <div className="h-3 w-1/4 animate-pulse bg-stone" />
                <div className="h-6 w-3/4 animate-pulse bg-stone" />
              </div>
            ))}
          </div>
        ) : list.length === 0 ? (
          <p className="py-16 text-center text-ink-soft">
            No stories match. Try another topic or{' '}
            <button type="button" onClick={() => setQuery('')} className="text-teal underline underline-offset-[3px]">
              clear the search
            </button>
            .
          </p>
        ) : (
          <div className="grid grid-flow-row-dense grid-cols-3 gap-x-5 gap-y-12 pb-6 pt-9 lg:grid-cols-2 md:grid-cols-1 md:gap-y-9">{cards}</div>
        )}

        {!loading && total > 0 && (
          <div className="grid justify-items-center gap-3.5 pb-20 pt-6 text-[13px] text-ink-soft">
            <span>
              Showing {Math.min(shown, total)} of {total} {total === 1 ? 'story' : 'stories'}
            </span>
            <span className="relative block h-0.5 w-[220px] bg-line">
              <i className="absolute inset-y-0 left-0 bg-ink" style={{ width: `${Math.min(100, (shown / total) * 100)}%` }} />
            </span>
            {shown < total && (
              <button
                type="button"
                onClick={() => load(page + 1)}
                disabled={loadingMore}
                className="inline-flex h-12 items-center gap-2 border border-ink px-9 text-[12px] font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:bg-ink hover:text-paper disabled:opacity-60"
              >
                {loadingMore && <LuLoader className="h-4 w-4 animate-spin" />}
                Load more stories
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
