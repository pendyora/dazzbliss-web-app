import Link from 'next/link';

import { SHELL } from '@/components/ClientCare/careInfo';
import { decrypt } from '@/utils/enc-decy';
import 'react-quill/dist/quill.snow.css';

async function getAboutData() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cms/type/1`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },

      next: { revalidate: 10 },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: any = await response.json();
    if (data.status === 200) {
      const resData = decrypt(data.data);

      return resData;
    }
    return null;
  } catch (error) {
    console.error('Error fetching banner data:', error);
    return null;
  }
}
export default async function AboutUs() {
  const aboutData = await getAboutData();

  return (
    <div className="bg-paper font-libre text-[14px] leading-[1.55] text-ink antialiased">
      <section className="border-b border-line bg-haze">
        <div className={`${SHELL} pb-[clamp(28px,4vw,48px)] pt-[clamp(36px,5vw,64px)]`}>
          <nav aria-label="Breadcrumb" className="mb-3.5 flex flex-wrap gap-2 text-[12px] text-ink-soft">
            <Link href="/" className="text-ink-soft hover:text-ink">
              Home
            </Link>
            <span aria-hidden className="text-line-strong">
              /
            </span>
            <span aria-current="page">About us</span>
          </nav>
          <span className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-gilt">Our story</span>
          <h1 className="m-0 mt-3 font-cormorant text-[clamp(38px,4.4vw,58px)] font-medium leading-none tracking-[-0.01em]">
            About <em className="text-gilt">us</em>
          </h1>
        </div>
      </section>

      <div className={`${SHELL} pb-20 pt-[clamp(36px,5vw,64px)]`}>
        {aboutData ? (
          aboutData?.content && (
            <div className="mx-auto max-w-[1200px]">
              <div className="about-us-css-setup">
                <div className="ql-editor" dangerouslySetInnerHTML={{ __html: aboutData?.content }} />
              </div>
            </div>
          )
        ) : (
          <p className="m-0 py-16 text-center text-ink-soft">No Data</p>
        )}
      </div>
    </div>
  );
}
