'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { Table, Button, Image, Pagination } from 'antd';
import { useRouter, useSearchParams } from 'next/navigation';
import { IoChevronDownOutline, IoChevronUpOutline } from 'react-icons/io5';
import { LuLoader } from 'react-icons/lu';

import { Text } from '@/components';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchDiamondByIdThunk,
  setDiamondPageNumber,
  setDiamondPageSize,
  setSelectedShapesData,
} from '@/store/slices/customProducts/customProductSlice';
import { carryForwardFilterCrumb, DIAMOND_FILTER_CRUMB_PARAMS } from '@/utils/breadcrumbFilterParams';
import { formatCurrency } from '@/utils/common';

export interface CustomDiamondType {
  name: string;
  key: React.Key;
  shape: string;
  carat: string;
  color: string;
  cut: string;
  clarity: string;
  price: string;
  code: string;
  image: string;
}

const CustomJewelryDiamondListTable = ({
  selectionRoute,
  setSelectedDiamond,
  setActiveStep,
  dId,
  sId,
  isLoading,
}: {
  selectionRoute: number;
  dId: string | null;
  sId: string | null;
  isLoading: boolean;
  setSelectedDiamond: React.Dispatch<React.SetStateAction<any>>;
  setActiveStep: React.Dispatch<React.SetStateAction<'diamond' | 'setting' | 'complete'>>;
}) => {
  const dispatch = useAppDispatch();
  const diamondList = useAppSelector((s) => s.customProduct.diamondList);
  const { loading, diamondPageNumber, diamondPageSize } = useAppSelector((s) => s.customProduct);
  const masterData = useAppSelector((s) => s.master.data);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Combined label for the diamond filters currently applied (e.g. "ROUND & D-F COLOR"), carried
  // into the breadcrumb once a diamond is picked from this filtered view — mirrors the PLP metal
  // filter crumb built in ProductProfile's click handler. Read straight off the URL: Filter.tsx
  // already keeps `shapes`/`colors`/`clarity`/`cut`/`carat` query params in sync with the applied
  // filters, so there's no need to duplicate that state here.
  const diamondActiveFilterLabel = useMemo(() => {
    const groups: string[] = [];
    const shapesParam = searchParams.get('shapes');
    if (shapesParam) {
      const shapeNames = shapesParam
        .split(',')
        .map((code) => masterData?.find((m: any) => m.code === code)?.name)
        .filter(Boolean);
      if (shapeNames.length) {
        groups.push(shapeNames.join('/'));
      }
    }
    const colorsParam = searchParams.get('colors');
    if (colorsParam) {
      groups.push(`${colorsParam} COLOR`);
    }
    const clarityParam = searchParams.get('clarity');
    if (clarityParam) {
      groups.push(`${clarityParam} CLARITY`);
    }
    const cutParam = searchParams.get('cut');
    if (cutParam) {
      groups.push(`${cutParam} CUT`);
    }
    const caratParam = searchParams.get('carat');
    if (caratParam) {
      groups.push(`${caratParam} CT`);
    }
    return groups.join(' & ');
  }, [searchParams, masterData]);

  // Href back to this filtered list. Any crumb params already on the URL are stripped first —
  // a previously picked diamond's crumb would otherwise be nested inside the new one, and the
  // PLP crumb is re-attached by carryForwardFilterCrumb on the click itself.
  const diamondFilterQuery = useMemo(() => {
    if (!diamondActiveFilterLabel) {
      return '';
    }
    const listParams = new URLSearchParams(searchParams.toString());
    DIAMOND_FILTER_CRUMB_PARAMS.forEach((key) => listParams.delete(key));
    return `&diamondFilterLabel=${encodeURIComponent(diamondActiveFilterLabel)}&diamondFilterHref=${encodeURIComponent(`/custom-jewelry?${listParams.toString()}`)}`;
  }, [diamondActiveFilterLabel, searchParams]);
  const columns: any = [
    {
      title: 'SHAPE',
      dataIndex: 'shape',
      key: 'shape',
      sorter: (a: any, b: any) => {
        // Handle null/undefined values
        if (!a.shape) {
          return -1;
        }
        if (!b.shape) {
          return 1;
        }
        return a.shape.localeCompare(b.shape);
      },
      render: (shape: string) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Image
            src={masterData?.find((el: any) => el.name === shape && el.parent_code == 'SHAPE')?.image?.[0]}
            preview={false}
            className="aspect-square object-contain"
            alt="Shape"
            fallback="/images/no_images.svg"
            width={20}
          />
          <span style={{ marginLeft: 8 }}>{shape || 'N/A'}</span>
        </div>
      ),
    },
    {
      title: 'CARAT',
      dataIndex: 'carat',
      key: 'carat',
      sorter: (a: any, b: any) => {
        // Handle null/undefined values
        if (!a.carat) {
          return -1;
        }
        if (!b.carat) {
          return 1;
        }
        return parseFloat(a.carat) - parseFloat(b.carat);
      },
    },
    {
      title: 'COLOR',
      dataIndex: 'color',
      key: 'color',
      sorter: (a: any, b: any) => {
        // Handle null/undefined values
        if (!a.color) {
          return -1;
        }
        if (!b.color) {
          return 1;
        }
        return a.color.localeCompare(b.color);
      },
    },
    {
      title: 'CUT',
      dataIndex: 'cut',
      key: 'cut',
      sorter: (a: any, b: any) => {
        // Handle null/undefined values
        if (!a.cut) {
          return -1;
        }
        if (!b.cut) {
          return 1;
        }
        return a.cut.localeCompare(b.cut);
      },
    },
    {
      title: 'CLARITY',
      dataIndex: 'clarity',
      key: 'clarity',
      sorter: (a: any, b: any) => {
        // Handle null/undefined values
        if (!a.clarity) {
          return -1;
        }
        if (!b.clarity) {
          return 1;
        }
        return a.clarity.localeCompare(b.clarity);
      },
    },
    {
      title: 'PRICE',
      dataIndex: 'price',
      key: 'price',
      sorter: (a: any, b: any) => {
        // Handle null/undefined values
        if (!a.price) {
          return -1;
        }
        if (!b.price) {
          return 1;
        }
        return parseFloat(a.price) - parseFloat(b.price);
      },
      render: (price: string) => <span className="!font-castoro">{price ? formatCurrency(price) : 'N/A'}</span>,
    },
  ];
  const [data, setData] = useState<any>();
  const [pageSize, setPageSize] = useState<number>(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [isGridView, setIsGridView] = useState(false);

  const generateOneLineDetails = (item: any) => {
    const details = [];

    if (item?.color) {
      details.push(item.color);
    }
    if (item?.clarity) {
      details.push(item.clarity);
    }
    if (item?.cut) {
      details.push(item.cut);
    }

    return details.join(' - ');
  };
  useEffect(() => {
    const tempData = diamondList?.rows?.map((diamond: any) => ({
      key: diamond.id,
      shape: diamond.shape_name,
      carat: diamond.carats.toFixed(2),
      color: diamond.col,
      cut: diamond.cut,
      clarity: diamond.clr,
      price: diamond.price.toFixed(2),
      name: diamond.fullTitle,
      code: diamond.shape_code,
      image: diamond.imageFile ?? diamond.videoFile,
    }));
    setData(tempData);
  }, [diamondList, diamondPageSize]);
  return (
    <>
      {diamondList?.rows && !isLoading && (
        <>
          <div
            className={`container-xs lg:gap-8 2xl:gap-16 2xl:px-[50px] xl:px-[50px] xl:gap-10 lg:px-[30px]  md:px-5 overflow-auto sm:hidden ${isGridView == true ? 'hidden' : 'block'}`}
          >
            <Table
              columns={columns}
              dataSource={data}
              // loading={loading}
              loading={{ indicator: <LuLoader className="h-10 w-10 animate-spin" />, spinning: loading }}
              expandRowByClick
              rowClassName={(record) => `row-key-${record.key} custom-row cursor-pointer`}
              showSorterTooltip={{ target: 'sorter-icon' }}
              expandable={{
                onExpand: (expanded, record) => {
                  if (expanded) {
                    setTimeout(() => {
                      const rowElement = document.querySelector(`.row-key-${record.key}`);
                      if (rowElement) {
                        rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }
                    }, 100); // delay to wait for DOM to render expanded content
                  }
                },
                expandedRowRender: (record: any, i: number) => (
                  <div key={i} style={{ display: 'flex' }}>
                    <div className="aspect-square flex mr-4 w-[20%]">
                      <Image src={record.image} alt="Diamond" preview={false} fallback="/images/no_images.svg" className="object-contain !h-full" />
                    </div>
                    <div>
                      <Text as="p" size="text2xl" className="!font-light font-sans mb-6">
                        {record?.name ?? 'Name of the Diamond'}
                      </Text>
                      <div className="w-[300px]">
                        <div className="grid grid-cols-2 gap-y-1">
                          <Text as="p" size="textmd" className="!font-light font-sans uppercase">
                            Shape:
                          </Text>
                          <Text as="p" size="textmd" className="!font-light font-sans">
                            {record.shape}
                          </Text>
                          <Text as="p" size="textmd" className="!font-light font-sans uppercase">
                            Carats:
                          </Text>
                          <Text as="p" size="textmd" className="!font-light font-sans">
                            {record.carat}
                          </Text>
                          <Text as="p" size="textmd" className="!font-light font-sans uppercase">
                            Color:
                          </Text>
                          <Text as="p" size="textmd" className="!font-light font-sans">
                            {record.color}
                          </Text>
                          <Text as="p" size="textmd" className="!font-light font-sans uppercase">
                            Cut:
                          </Text>
                          <Text as="p" size="textmd" className="!font-light font-sans">
                            {record.cut}
                          </Text>
                          <Text as="p" size="textmd" className="!font-light font-sans uppercase">
                            Clarity:
                          </Text>
                          <Text as="p" size="textmd" className="!font-light font-sans">
                            {record.clarity}
                          </Text>
                          <Text as="p" size="textmd" className="!font-light font-sans uppercase">
                            Price:
                          </Text>
                          <Text as="p" size="textmd" className="!font-light !font-castoro">
                            {formatCurrency(record.price)}
                          </Text>
                        </div>

                        <div className="flex gap-5">
                          <div className="mt-6">
                            <Button
                              type="default"
                              className="!bg-primary !text-text_w w-[100%] flex sm:mt-2 min-h-[45px] flex-row items-center justify-center self-end text-center uppercase lg:text-[17px] sm:self-auto sm:px-4"
                              onClick={() => {
                                setSelectedDiamond(record);
                                router.push(
                                  carryForwardFilterCrumb(
                                    `custom-jewelry?type=${selectionRoute}${`&did=${record?.key}&state=d`}${sId ? `&id=${sId}` : ''}${diamondFilterQuery}`,
                                    searchParams,
                                  ),
                                );
                                dispatch(fetchDiamondByIdThunk(record.key));
                              }}
                            >
                              View Diamond
                            </Button>
                          </div>
                          <div className="mt-6">
                            <Button
                              type="default"
                              className="!bg-primary !text-text_w w-[100%] flex sm:mt-2 min-h-[45px] flex-row items-center justify-center self-end text-center uppercase lg:text-[17px] sm:self-auto sm:px-4"
                              onClick={() => {
                                const shapeId = masterData?.find((el: any) => el.name === record.shape && el.parent_code == 'SHAPE')?.id;
                                setSelectedDiamond(record);
                                dispatch(setSelectedShapesData(shapeId));
                                router.push(
                                  carryForwardFilterCrumb(
                                    selectionRoute == 1
                                      ? `custom-jewelry?type=${selectionRoute}${`&did=${record?.key}&state=s`}${sId ? `&id=${sId}` : ''}${diamondFilterQuery}`
                                      : `custom-jewelry?type=${selectionRoute}${`&did=${record?.key}&state=c`}${sId ? `&id=${sId}` : ''}${diamondFilterQuery}`,
                                    searchParams,
                                  ),
                                );
                                // dispatch(fetchDiamondByIdThunk(record.key));
                              }}
                            >
                              Choose Diamond
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ),
                expandIcon: ({ expanded, onExpand, record }) =>
                  expanded ? (
                    <IoChevronUpOutline onClick={(e: any) => onExpand(record, e)} className="w-5 h-5 cursor-pointer" />
                  ) : (
                    <IoChevronDownOutline onClick={(e: any) => onExpand(record, e)} className="w-5 h-5 cursor-pointer" />
                  ),
                rowExpandable: () => true,
              }}
              style={{ borderRadius: '0px' }}
              pagination={{
                current: diamondPageNumber,
                pageSize: diamondPageSize,
                total: diamondList?.count,
                onChange: (page: number, pageSize: number) => {
                  setCurrentPage(page);
                  setPageSize(pageSize);
                  dispatch(setDiamondPageNumber(page));
                  dispatch(setDiamondPageSize(pageSize));
                },
                showSizeChanger: true,
                pageSizeOptions: ['10', '20', '50', '100'],
                onShowSizeChange: (current: number, pageSize: number) => {
                  setCurrentPage(current);
                  setPageSize(pageSize);
                  dispatch(setDiamondPageSize(pageSize)); // Update the page size when the user selects a new page size
                },
              }}
            />
          </div>
          {loading ? (
            <div className="sm:flex hidden flex-col items-center gap-[60px] min-h-[50vh] justify-center">
              <div className="w-full flex justify-center items-center">
                <LuLoader className="h-10 w-10 animate-spin" />
              </div>
            </div>
          ) : (
            <div
              className={`container-xs lg:gap-8 2xl:gap-16 2xl:px-[160px] xl:px-28 xl:gap-10 lg:px-20  md:px-5 px-4 py-6 sm:px-3 sm:pb-3 sm:pt-0 sm:block ${isGridView == true ? 'block' : 'hidden'}`}
            >
              <div className="grid grid-cols-4 sm:grid-cols-2 gap-4 sm:gap-2">
                {data?.slice((diamondPageNumber - 1) * diamondPageSize, diamondPageNumber * diamondPageSize).map((item: any) => (
                  <div
                    key={item.key}
                    className="overflow-hidden"
                    onClick={() => {
                      setSelectedDiamond(item);
                      router.push(
                        carryForwardFilterCrumb(
                          `custom-jewelry?type=${selectionRoute}${`&did=${item?.key}&state=d`}${sId ? `&id=${sId}` : ''}${diamondFilterQuery}`,
                          searchParams,
                        ),
                      );
                      dispatch(fetchDiamondByIdThunk(item.key));
                    }}
                  >
                    <div className="relative">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fallback="/images/no_images.svg"
                        preview={false}
                        className="w-full aspect-square object-cover bg-[#f8f8f8]"
                      />
                    </div>

                    <div className="pt-2">
                      <div className="text-[13px] font-medium">{item?.name}</div>
                      <div className="text-[13px] text-secondary">{generateOneLineDetails(item)}</div>
                      <div className="text-[14px] !font-castoro">{formatCurrency(item.price)}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-center mt-6">
                <Pagination
                  current={diamondPageNumber}
                  pageSize={diamondPageSize}
                  total={diamondList?.count}
                  onChange={(page: number) => {
                    setCurrentPage(page);
                  }}
                  showSizeChanger={false}
                />
              </div>
            </div>
          )}
          <div className="h-[1px] bg-[#707070]" />
        </>
      )}
    </>
  );
};

export default CustomJewelryDiamondListTable;
