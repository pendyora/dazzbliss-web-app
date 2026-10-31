'use client';

import React, { useEffect, useState } from 'react';

import Link from 'next/link';
import { LuInfo } from 'react-icons/lu';

import { CARE, SHELL } from './careInfo';

export interface PolicySection {
  id: string;
  title: string;
  body: React.ReactNode;
}

interface Props {
  sections: PolicySection[];
  /** Short help box under the "On this page" list. */
  help: { title: string; text: string };
  /** Optional block above the document (the shipping "at a glance" cards). */
  lead?: React.ReactNode;
}

// Long-form typography for the reading column; children stay plain HTML.
const PROSE =
  'max-w-[68ch] text-[15.5px] leading-[1.75] text-ink/85 md:text-[15px] [&_a]:text-teal [&_a]:underline [&_a]:underline-offset-[3px] [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-[15.5px] [&_h3]:font-semibold [&_h3]:text-ink [&_li::marker]:text-teal [&_li]:mb-1.5 [&_ol]:mb-3.5 [&_ol]:pl-5 [&_p]:mb-3.5 [&_p]:mt-0 [&_strong]:font-semibold [&_strong]:text-ink [&_ul]:mb-3.5 [&_ul]:list-disc [&_ul]:pl-5';

/** Policy page body: sticky "On this page" rail (a select on small screens) and a readable column of sections. */
export default function PolicyDoc({ sections, help, lead }: Props) {
  const [active, setActive] = useState(sections[0]?.id);

  useEffect(() => {
    const io = new IntersectionObserver((entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)), {
      rootMargin: '-30% 0px -60% 0px',
    });
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) {
        io.observe(el);
      }
    });
    return () => io.disconnect();
  }, [sections]);

  const jump = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className={SHELL}>
      {lead}
      <div className="grid grid-cols-[240px_minmax(0,1fr)] gap-[clamp(32px,5vw,88px)] pb-20 pt-[clamp(36px,5vw,64px)] lg:grid-cols-1">
        <aside aria-label="On this page" className="sticky top-[calc(var(--header-height,108px)+78px)] grid gap-[22px] self-start lg:static">
          <h2 className="m-0 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-ink-faint lg:hidden">On this page</h2>
          <ol className="m-0 grid list-none border-l border-line p-0 lg:hidden">
            {sections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    jump(s.id);
                  }}
                  className={`-ml-px block border-l-[1.5px] py-[7px] pl-4 text-[13.5px] ${
                    active === s.id ? 'border-ink font-medium text-ink' : 'border-transparent text-ink-soft hover:text-ink'
                  }`}
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
          <label className="hidden lg:block">
            <span className="sr-only">Jump to section</span>
            <select
              value={active}
              onChange={(e) => jump(e.target.value)}
              className="h-[50px] w-full rounded-none border border-line-strong bg-paper px-3.5 text-[14px] focus:border-ink focus:ring-0"
            >
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-1.5 bg-mist px-[18px] py-4 text-[13px] text-ink-soft lg:hidden">
            <b className="font-cormorant text-[19px] font-medium text-ink">{help.title}</b>
            {help.text}
            <Link href="/contactpage" className="font-medium text-teal hover:text-navy">
              Contact us →
            </Link>
          </div>
        </aside>

        <article className={PROSE}>
          {sections.map((s, i) => (
            <section
              key={s.id}
              id={s.id}
              className={`scroll-mt-[calc(var(--header-height,108px)+72px)] ${i > 0 ? 'mt-11 border-t border-line pt-10' : 'pt-2'}`}
            >
              <h2 className="m-0 mb-3.5 font-cormorant text-[30px] font-medium leading-[1.1] text-ink">{s.title}</h2>
              {s.body}
            </section>
          ))}
        </article>
      </div>
    </div>
  );
}

export function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-[18px] flex gap-3.5 bg-mist px-[18px] py-4 text-[14.5px]">
      <LuInfo className="mt-[3px] h-5 w-5 flex-none text-navy" strokeWidth={1.3} />
      <span>{children}</span>
    </div>
  );
}

/** Numbered steps: first child of each item is the bold title. */
export function StepList({ steps }: { steps: { title: string; text: React.ReactNode }[] }) {
  return (
    <ol className="!m-0 !mb-3.5 grid list-none gap-3.5 !p-0">
      {steps.map((s, i) => (
        <li key={s.title} className="!m-0 grid grid-cols-[36px_1fr] items-start gap-3.5">
          <span className="grid h-8 w-8 place-items-center rounded-full border border-navy text-[13px] font-semibold text-navy">{i + 1}</span>
          <span>
            <b className="block font-semibold text-ink">{s.title}</b>
            {s.text}
          </span>
        </li>
      ))}
    </ol>
  );
}

export function PlainTable({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <table className="mb-[18px] mt-1.5 w-full border-collapse text-[14px]">
      <thead>
        <tr>
          {head.map((h) => (
            <th key={h} className="border-b border-line bg-haze px-3.5 py-3 text-left text-[12.5px] font-semibold tracking-[0.04em] text-ink">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            {r.map((c, j) => (
              <td key={j} className="border-b border-line px-3.5 py-3 align-top">
                {c}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** "email … or call …" using the shared client-care details; the phone part is skipped while no number is set. */
export function CareContact() {
  return (
    <>
      email us at <a href={`mailto:${CARE.email}`}>{CARE.email}</a>
      {CARE.phone && (
        <>
          {' '}
          or call <a href={CARE.phoneHref}>{CARE.phone}</a>
        </>
      )}
    </>
  );
}
