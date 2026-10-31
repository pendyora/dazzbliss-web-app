'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { Table, Button, ConfigProvider, Image, Pagination } from 'antd';
import { useRouter, useSearchParams } from 'next/navigation';
import { IoChevronDownOutline, IoChevronUpOutline } from 'react-icons/io5';
import { LuLoader } from 'react-icons/lu';

import { plpTheme } from '@/app/[jewelryType]/FilterDrawer';
import { PRIMARY_BTN, SECONDARY_BTN } from '@/app/checkout/checkoutTheme';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchDiamondByIdThunk,
  setDiamondPageNumber,
  setDiamondPageSize,
  setSelectedShapesData,
} from '@/store/slices/customProducts/customProductSlice';
import themeColors from '@/styles/theme-colors';
import { carryForwardFilterCrumb, DIAMOND_FILTER_CRUMB_PARAMS } from '@/utils/breadcrumbFilterParams';
import { formatCurrency } from '@/utils/common';

// Presentation only: hairline results table in the listing-page language (design-mockups/plp-v3).
const diamondTableTheme = {
  ...plpTheme,
  components: {
    ...plpTheme.components,
    Table: {
      headerBg: themeColors.paper,
      headerColor: themeColors.ink.soft,
      headerSortActiveBg: themeColors.paper,
      headerSortHoverBg: themeColors.stone.DEFAULT,
      headerSplitColor: 'transparent',
      borderColor: themeColors.line.DEFAULT,
      rowHoverBg: themeColors.stone.DEFAULT,
      rowExpandedBg: themeColors.paper,
      bodySortBg: 'transparent',
      cellPaddingBlock: 14,
      fontSize: 14,
    },
    Pagination: {
      itemActiveBg: themeColors.ink.DEFAULT,
    },
  },
};
// The global stylesheet paints table headers beige with white text; override them for this table.
const TABLE_SKIN =
  '[&_.ant-table-thead>tr>th.ant-table-cell]:!bg-paper [&_.ant-table-thead>tr>th.ant-table-cell]:!text-[10.5px] [&_.ant-table-thead>tr>th.ant-table-cell]:!font-medium [&_.ant-table-thead>tr>th.ant-table-cell]:!uppercase [&_.ant-table-thead>tr>th.ant-table-cell]:!tracking-[0.16em] [&_.ant-table-thead>tr>th.ant-table-cell]:!text-ink-soft [&_.ant-table-thead>tr>th.ant-table-cell]:!border-b-ink [&_.ant-table-tbody>tr>td]:!text-ink [&_.ant-pagination-item-active]:!border-ink [&_.ant-pagination-item-active>a]:!text-paper';
const SPEC_LABEL = 'text-[10.5px] uppercase tracking-[0.16em] text-ink-soft';
const SPEC_VALUE = 'text-[14px] text-ink';
const GUTTER = 'mx-auto w-full max-w-[1440px] px-[clamp(16px,3.2vw,56px)]';

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
        <div style={{ display: 'flex', alignItems: 'center' }} className="text-ink">
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
      render: (price: string) => <span className="tabular-nums">{price ? formatCurrency(price) : 'N/A'}</span>,
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
        <ConfigProvider theme={diamondTableTheme}>
          <div className={`${GUTTER} ${TABLE_SKIN} overflow-auto font-libre sm:hidden ${isGridView == true ? 'hidden' : 'block'}`}>
            <Table
              columns={columns}
              dataSource={data}
              // loading={loading}
              loading={{ indicator: <LuLoader className="h-8 w-8 animate-spin text-ink-soft" />, spinning: loading }}
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
                  <div key={i} style={{ display: 'flex' }} className="gap-8 py-4 lg:gap-6">
                    <div className="flex aspect-square w-[22%] flex-none items-center justify-center bg-stone p-4 [&_.ant-image]:!h-full [&_.ant-image]:!w-full">
                      <Image
                        src={record.image}
                        alt="Diamond"
                        preview={false}
                        fallback="/images/no_images.svg"
                        className="!h-full object-contain mix-blend-multiply"
                      />
                    </div>
                    <div className="min-w-0 self-center">
                      <p className="m-0 mb-6 font-cormorant text-[clamp(24px,2.2vw,32px)] font-medium leading-[1.1] text-ink">
                        {record?.name ?? 'Name of the Diamond'}
                      </p>
                      <div className="w-[340px] max-w-full">
                        <div className="grid grid-cols-2 border-t border-line">
                          <p className={`m-0 border-b border-line py-2 ${SPEC_LABEL}`}>Shape:</p>
                          <p className={`m-0 border-b border-line py-2 ${SPEC_VALUE}`}>{record.shape}</p>
                          <p className={`m-0 border-b border-line py-2 ${SPEC_LABEL}`}>Carats:</p>
                          <p className={`m-0 border-b border-line py-2 ${SPEC_VALUE}`}>{record.carat}</p>
                          <p className={`m-0 border-b border-line py-2 ${SPEC_LABEL}`}>Color:</p>
                          <p className={`m-0 border-b border-line py-2 ${SPEC_VALUE}`}>{record.color}</p>
                          <p className={`m-0 border-b border-line py-2 ${SPEC_LABEL}`}>Cut:</p>
                          <p className={`m-0 border-b border-line py-2 ${SPEC_VALUE}`}>{record.cut}</p>
                          <p className={`m-0 border-b border-line py-2 ${SPEC_LABEL}`}>Clarity:</p>
                          <p className={`m-0 border-b border-line py-2 ${SPEC_VALUE}`}>{record.clarity}</p>
                          <p className={`m-0 border-b border-line py-2 ${SPEC_LABEL}`}>Price:</p>
                          <p className={`m-0 border-b border-line py-2 tabular-nums ${SPEC_VALUE}`}>{formatCurrency(record.price)}</p>
                        </div>

                        <div className="flex gap-3">
                          <div className="mt-6">
                            <Button
                              type="default"
                              className={`${SECONDARY_BTN} flex w-[100%] items-center justify-center !px-6`}
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
                              className={`${PRIMARY_BTN} flex w-[100%] items-center justify-center !px-6`}
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
                    <IoChevronUpOutline onClick={(e: any) => onExpand(record, e)} className="h-4 w-4 cursor-pointer text-ink" />
                  ) : (
                    <IoChevronDownOutline onClick={(e: any) => onExpand(record, e)} className="h-4 w-4 cursor-pointer text-ink-soft" />
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
            <div className="hidden min-h-[50vh] flex-col items-center justify-center gap-[60px] sm:flex">
              <div className="flex w-full items-center justify-center">
                <LuLoader className="h-8 w-8 animate-spin text-ink-soft" />
              </div>
            </div>
          ) : (
            <div className={`${GUTTER} py-6 font-libre sm:block sm:pb-3 sm:pt-0 ${TABLE_SKIN} ${isGridView == true ? 'block' : 'hidden'}`}>
              <div className="grid grid-cols-4 gap-x-4 gap-y-10 sm:grid-cols-2 sm:gap-x-2.5 sm:gap-y-7">
                {data?.slice((diamondPageNumber - 1) * diamondPageSize, diamondPageNumber * diamondPageSize).map((item: any) => (
                  <div
                    key={item.key}
                    className="group flex min-w-0 cursor-pointer flex-col overflow-hidden"
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
                    <div className="relative aspect-[4/5] overflow-hidden bg-stone [&_.ant-image]:!block [&_.ant-image]:!h-full [&_.ant-image]:!w-full">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fallback="/images/no_images.svg"
                        preview={false}
                        className="!h-full w-full object-contain mix-blend-multiply transition duration-700 ease-luxe group-hover:scale-[1.025]"
                      />
                    </div>

                    <div className="grid gap-[3px] pt-3">
                      <div className="line-clamp-2 text-[14px] font-medium leading-[1.35] text-ink">{item?.name}</div>
                      <div className="text-[12px] leading-[1.45] text-ink-soft">{generateOneLineDetails(item)}</div>
                      <div className="mt-0.5 text-[14px] tabular-nums text-ink">{formatCurrency(item.price)}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 flex justify-center">
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
          <div className="h-px bg-line" />
        </ConfigProvider>
      )}
    </>
  );
};

export default CustomJewelryDiamondListTable;
