import React from 'react';

interface Props {
  data: any;
}
const RenderText = ({ data }: Props) => {
  return (
    <div>
      <>
        <div>
          <div className="text-[16px] sm:text-[14px] text-center" dangerouslySetInnerHTML={{ __html: data.text }} />
        </div>
      </>
    </div>
  );
};

export default RenderText;
