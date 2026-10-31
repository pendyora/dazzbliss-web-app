import 'react-quill/dist/quill.snow.css';
import { SHELL } from '@/components/ClientCare/careInfo';
import CareLayout from '@/components/ClientCare/CareLayout';
import { decrypt } from '@/utils/enc-decy';

async function getJewelryCareData() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cms/type/3`, {
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
const JewelryCare = async () => {
  const JewelryCareData = await getJewelryCareData();
  return (
    <CareLayout title="Jewelry care" crumb="Jewelry care" intro="How to clean, store and look after your pieces so they keep their shine for years.">
      <div className={`${SHELL} pb-20 pt-[clamp(36px,5vw,64px)]`}>
        {JewelryCareData ? (
          JewelryCareData?.content && (
            <div className="mx-auto max-w-[1200px]">
              <div className="about-us-css-setup">
                <div className="ql-editor" dangerouslySetInnerHTML={{ __html: JewelryCareData?.content }} />
              </div>
            </div>
          )
        ) : (
          <p className="m-0 py-16 text-center text-ink-soft">No Data</p>
        )}
      </div>
    </CareLayout>
  );
};

export default JewelryCare;
