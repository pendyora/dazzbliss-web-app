/* eslint-disable import/no-unresolved */
import React, { useState } from 'react';

import { Input, Select } from 'antd';
import { FiMinus, FiPlus } from 'react-icons/fi';

import { Text } from '@/components';
import { ENGRAVING_MAX_LENGTH } from '@/constants/app.constant';
import { setSelectedEngraving, useAppDispatch, useAppSelector } from '@/store';

const fontList: string[] = ['Arial', 'Times New Roman', 'Georgia', 'Courier New', 'Verdana', 'Roboto', 'Lobster'];

const Engraving = ({ setEngravingText, engravingText }: any) => {
  const dispatch = useAppDispatch();
  const { engraving }: any = useAppSelector((state) => state?.master);

  const [isExpandedEngraving, setIsExpandedEngraving] = useState(false);

  return (
    <div className="border p-4">
      <div
        className="!cursor-pointer font-medium !text-[#707070] flex items-center justify-between"
        onClick={() => setIsExpandedEngraving(!isExpandedEngraving)}
      >
        <Text size="textxl" className="!font-light capitalize !font-sans !text-[16px]">
          CUSTOM ENGRAVING
        </Text>
        {isExpandedEngraving ? <FiMinus className="h-[18px] w-[18px] cursor-pointer" /> : <FiPlus className="h-[18px] w-[18px] cursor-pointer" />}
      </div>
      <div
        className={`transition-all duration-500 ease-in-out overflow-hidden ${isExpandedEngraving ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="mt-4 flex flex-col gap-2 !text-[#707070]">
          <Text className="!font-light !font-sans !text-[16px]">Add Engraving{` ($ ${engraving?.data?.engraving_price})`}</Text>
          <Input
            placeholder="Enter engraving text"
            maxLength={ENGRAVING_MAX_LENGTH}
            showCount
            style={{ fontFamily: engravingText.fontFamily }}
            value={engravingText.Text ? engravingText.Text : ''}
            onChange={(e: any) => {
              setEngravingText({ Text: e.target.value?.trim(), fontFamily: engravingText.fontFamily });
              if (e.target.value?.trim() !== '') {
                dispatch(setSelectedEngraving({ text: e.target.value.trim(), fontFamily: engravingText.fontFamily }));
              } else {
                dispatch(setSelectedEngraving(null));
              }
            }}
          />
          <Select
            placeholder="Select font"
            style={{ fontFamily: engravingText.fontFamily }}
            value={engravingText.fontFamily ? engravingText.fontFamily : 'Arial'}
            onChange={(value: string) => {
              setEngravingText({ fontFamily: value, Text: engravingText.Text });
              dispatch(setSelectedEngraving({ fontFamily: value, text: engravingText.Text }));
            }}
            className="w-full"
          >
            {fontList.map((font) => (
              <Select.Option key={font} value={font} style={{ fontFamily: font }}>
                {font}
              </Select.Option>
            ))}
          </Select>
        </div>
      </div>
    </div>
  );
};

export { Engraving };
