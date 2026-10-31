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
    <div className="w-full flex justify-center">
      {aboutData ? (
        <div className="flex max-w-[1200px] ">
          <div className=" w-full flex flex-col justify-center items-center gap-20 border-b py-10 sm:py-2 border-solid border-[#3b3b3b] 2xl:gap-16 xl:gap-12 lg:gap-8 md:gap-[60px] sm:gap-5 md:px-10 sm:px-5 lg:px-20 ">
            {aboutData?.content && (
              <div className="flex sm:flex-col-reverse items-center m-auto about-us-css-setup">
                <div className="ql-editor" dangerouslySetInnerHTML={{ __html: aboutData?.content }} />
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          <div>No Data</div>
        </>
      )}
    </div>
  );
}
