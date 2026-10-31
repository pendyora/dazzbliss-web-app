'use client';
import React, { useMemo, useState } from 'react';

import Link from 'next/link';
import { LuSearch } from 'react-icons/lu';

import { SHELL } from '@/components/ClientCare/careInfo';

interface FaqItem {
  question: string;
  answer: string;
  /** Optional; the CMS doesn't send it yet. When present, questions are grouped and a topic list appears. */
  category?: string;
}

const strip = (html: string) => html.replace(/<[^>]+>/g, ' ');

/** FAQs (design-mockups/info-pages#faqs): search, optional topic list, and fold-out answers from the CMS. */
/**
 * `variant="pdp"`: compact, contained accordion used on the product page (no search or topic list);
 * renders nothing when the product has no FAQs.
 */
const Faqs = ({ content, variant }: { content: FaqItem[] | null; variant?: 'pdp' }) => {
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState('');
  const items = useMemo(() => content ?? [], [content]);

  const groups = useMemo(() => {
    const map = new Map<string, FaqItem[]>();
    items.forEach((f) => {
      const key = f.category?.trim() || '';
      map.set(key, [...(map.get(key) ?? []), f]);
    });
    return [...map.entries()];
  }, [items]);
  const hasTopics = groups.length > 1 || (groups[0] && groups[0][0] !== '');

  const q = query.trim().toLowerCase();
  const visible = groups
    .filter(([name]) => !topic || name === topic)
    .map(([name, list]) => [name, list.filter((f) => !q || `${f.question} ${strip(f.answer)}`.toLowerCase().includes(q))] as const)
    .filter(([, list]) => list.length > 0);

  if (variant === 'pdp') {
    if (items.length === 0) {
      return null;
    }
    return (
      <section className={`${SHELL} py-16`}>
        <h2 className="m-0 mb-8 text-center font-cormorant text-[clamp(28px,3vw,36px)] font-medium">Frequently asked questions</h2>
        <div className="mx-auto max-w-[860px] border-t border-line">
          {items.map((f) => (
            <details key={f.question} className="group border-b border-line">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-5 py-5 text-[15.5px] font-medium [&::-webkit-details-marker]:hidden after:flex-none after:text-[22px] after:font-light after:text-ink-soft after:content-['+'] group-open:after:content-['–']">
                {f.question}
              </summary>
              <div
                className="ql-editor !p-0 pb-[22px] pr-10 text-[15px] leading-[1.7] text-ink/85 [&_a]:text-teal [&_a]:underline [&_p]:mb-2"
                dangerouslySetInnerHTML={{ __html: f.answer }}
              />
            </details>
          ))}
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <div className={`${SHELL} py-20 text-center`}>
        <p className="m-0 text-ink-soft">
          Our FAQs are being updated. In the meantime,{' '}
          <Link href="/contactpage" className="text-teal underline underline-offset-[3px]">
            ask us directly
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div
      className={`${SHELL} grid gap-[clamp(32px,5vw,88px)] pb-20 pt-[clamp(36px,5vw,56px)] ${hasTopics ? 'grid-cols-[240px_minmax(0,1fr)] lg:grid-cols-1' : ''}`}
    >
      {hasTopics && (
        <ul
          aria-label="Topics"
          className="sticky top-[calc(var(--header-height,108px)+78px)] m-0 grid list-none gap-1 self-start p-0 lg:static lg:flex lg:gap-1.5 lg:overflow-x-auto lg:[scrollbar-width:none]"
        >
          {[['', items.length] as const, ...groups.map(([n, l]) => [n, l.length] as const)].map(([name, count]) => (
            <li key={name || 'all'} className="lg:flex-none">
              <button
                type="button"
                aria-pressed={topic === name}
                onClick={() => setTopic(name)}
                className={`flex w-full justify-between gap-2 px-3.5 py-2.5 text-left text-[14px] lg:whitespace-nowrap lg:border lg:border-line ${
                  topic === name ? 'bg-haze font-medium text-ink' : 'text-ink-soft hover:text-ink'
                }`}
              >
                {name || 'All topics'}
                <span className="text-[12.5px] text-ink-faint">{count}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className={hasTopics ? '' : 'mx-auto w-full max-w-[760px]'}>
        <label className="mb-7 flex h-[54px] max-w-[680px] items-center gap-3 border border-line-strong px-4 focus-within:border-ink">
          <LuSearch className="h-5 w-5 flex-none text-ink-soft" strokeWidth={1.3} />
          <span className="sr-only">Search questions</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search questions, e.g. resizing"
            className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[15px] outline-none focus:ring-0"
          />
        </label>

        {visible.map(([name, list]) => (
          <section key={name || 'all'} className="mb-10 max-w-[760px]">
            {name && <h2 className="m-0 mb-2 font-cormorant text-[28px] font-medium">{name}</h2>}
            <div className="border-t border-line">
              {list.map((f) => (
                <details key={f.question} open={!!q} className="group border-b border-line">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-5 py-5 text-[15.5px] font-medium [&::-webkit-details-marker]:hidden after:flex-none after:text-[22px] after:font-light after:text-ink-soft after:content-['+'] group-open:after:content-['–']">
                    {f.question}
                  </summary>
                  <div
                    className="ql-editor !p-0 pb-[22px] pr-10 text-[15px] leading-[1.7] text-ink/85 [&_a]:text-teal [&_a]:underline [&_p]:mb-2"
                    dangerouslySetInnerHTML={{ __html: f.answer }}
                  />
                </details>
              ))}
            </div>
          </section>
        ))}

        {visible.length === 0 && (
          <p className="py-6 text-ink-soft">
            No questions match that search.{' '}
            <Link href="/contactpage" className="text-teal underline underline-offset-[3px]">
              Ask us directly
            </Link>
            .
          </p>
        )}
      </div>
    </div>
  );
};

export default Faqs;
