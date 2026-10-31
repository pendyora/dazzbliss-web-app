'use client';
import React, { useEffect, useState } from 'react';

import { Button, Image, Input, Pagination } from 'antd';
import dayjs from 'dayjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { CiSearch } from 'react-icons/ci';
import { LuLoader } from 'react-icons/lu'; // Import the loader icon

import { useAppDispatch, useAppSelector } from '@/store';
import { fetchBlogList, fetchBlogFilter, fetchFeaturedViews, setPageIndex, setPageSize } from '@/store/slices/blog/blogSlice';

const BlogSidebarLayout = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get('category') || 'all';
  const { blogList, blogCounts, blogFilter, blogFeaturedViews, pageIndex, pageSize } = useAppSelector((state) => state.blog);
  const { data: masterData } = useAppSelector((state) => state.master); // assuming master slice exports data field
  const [posts, setPosts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]); // Categories from filters
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null); // Track selected category
  const [search, setSearch] = useState<string>(''); // Search input state
  const [searchQuery, setSearchQuery] = useState<string>(''); // Search query state for triggering fetch
  const [isLoading, setIsLoading] = useState<boolean>(false); // Track loading state
  const [isLoadingMain, setIsLoadingMain] = useState<boolean>(true); // Track loading state
  const [showAllCategories, setShowAllCategories] = useState<boolean>(false); // New state for "Show Less" and "Show More"

  useEffect(() => {
    // Fetch filters first
    if (!blogFilter || blogFilter?.length == 0) {
      dispatch(fetchBlogFilter());
    }
  }, [dispatch]);

  useEffect(() => {
    if (Object.keys(blogFeaturedViews).length == 0) {
      dispatch(fetchFeaturedViews());
    }
  }, [dispatch, blogFeaturedViews]);
  useEffect(() => {
    // Map categories once both blogFilter and masterData are available
    if (blogFilter?.length > 0 && masterData) {
      const categoryList = blogFilter?.map((filter: any) => {
        if (filter.type === 'all') {
          return { id: 'all', name: 'All', count: filter.count };
        }
        const categoryData = masterData.find((item: any) => item.id === filter.type);
        return {
          id: filter.type,
          name: categoryData?.name || 'Unknown',
          count: filter.count,
        };
      });
      const categoryFromSlug: any = categoryList?.find(
        (cat: any) =>
          cat.name
            .toLowerCase()
            .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special characters except hyphen
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
            .replace(/^-+|-+$/g, '') === // Remove hyphens from start and end
          currentCategory.toLowerCase(),
      );
      // console.log(categoryFromSlug, currentCategory, 'categoryFromSlug');
      if (categoryFromSlug && Object.keys(categoryFromSlug)?.length > 0) {
        setSelectedCategory(categoryFromSlug?.id as string);
        setCategories(categoryList);
      }
    }
  }, [blogFilter, masterData, currentCategory]);

  useEffect(() => {
    if (selectedCategory) {
      // Fetch blog list based on selected category, pagination, and search query
      const filterParams = {
        category: selectedCategory || null,
        page: pageIndex,
        size: pageSize,
        search: searchQuery.trim() || '', // Use searchQuery for fetching
      };
      setIsLoading(true); // Set loading to true before fetching
      dispatch(fetchBlogList(filterParams)).then((res: any) => {
        if (res.payload?.data?.rows) {
          const fetchedPosts = res.payload.data.rows.map((post: any) => {
            // Map post type to category name using masterData
            const categoryData = masterData?.find((item: any) => item.id === post.type);
            return { ...post, category: categoryData?.name || 'Uncategorized' };
          });
          setPosts(fetchedPosts);
        }
        setIsLoading(false); // Set loading to false after fetching
        setIsLoadingMain(false); // Set main loading to false after fetching
      });
    }
  }, [dispatch, selectedCategory, pageIndex, pageSize, searchQuery, masterData]); // Add searchQuery to dependencies

  const handleCategorySelect = (categoryId: string, categorySlug: string) => {
    dispatch(setPageIndex(1));
    setSelectedCategory(categoryId); // Update selected category
    const params = new URLSearchParams(searchParams);

    if (categorySlug === 'all') {
      params.delete('category');
    } else {
      params.set('category', categorySlug);
    }

    router.push(`/blog/all-blogs?${params.toString()}`);
  };

  const handlePageChange = (newPageIndex: number) => {
    dispatch(setPageIndex(newPageIndex));
  };

  const handlePageSizeChange = (newPageSize: number) => {
    dispatch(setPageSize(newPageSize));
  };

  const handleShowMoreToggle = () => {
    setShowAllCategories((prev) => !prev); // Toggle the state
  };

  const handleSearch = () => {
    setSearchQuery(search);
    dispatch(setPageIndex(1));
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return isLoadingMain ? (
    <div className="flex justify-center items-center h-40 min-h-[70vh]">
      <LuLoader className="h-10 w-10 animate-spin text-primary" />
    </div>
  ) : (
    <div className="px-40 lg:px-14 md:px-8 py-10 max-w-screen-xl mx-auto grid grid-cols-3 gap-12 md:gap-6 font-serif">
      {/* Left Content */}
      <div className="col-span-2 space-y-12">
        {isLoading ? (
          <div className="flex justify-center items-center h-40 min-h-[70vh]">
            <LuLoader className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : posts.length > 0 ? (
          posts.map((post, index) => (
            <div key={index} className="space-y-2 cursor-pointer" onClick={() => router.push(`/blog/${post?.slug}`)}>
              <p className="text-sm md:text-[12px] tracking-wide font-notosans text-gray-500 uppercase font-medium">{post.category}</p>
              <h2 className="text-[25px] md:text-[20px] font-semibold font-notosans leading-snug text-gray-900">
                {post?.title?.length > 120 ? `${post?.title?.substring(0, 120)}...` : post?.title}
              </h2>
            </div>
          ))
        ) : (
          <div className="flex justify-center items-center h-40 min-h-[70vh]">
            <p className="text-gray-500 text-lg font-notosans">No Results Found</p>
          </div>
        )}

        {/* Pagination Controls - only show if there are posts */}
        {posts.length > 0 && blogCounts > pageSize && (
          <div className="flex justify-center items-center">
            <Pagination
              current={pageIndex}
              pageSize={pageSize}
              total={blogCounts} // Assuming `blogList.total` contains the total number of posts
              onChange={(page, size) => {
                handlePageChange(page);
                handlePageSizeChange(size);
              }}
              // showSizeChanger
            />
          </div>
        )}
      </div>

      {/* Right Sidebar */}
      <div className="space-y-10 md:space-y-6 sticky top-[40px] self-start h-fit">
        <div className="">
          {/* <p className="font-semibold mb-2">Subscribe to the best creative feed.</p> */}
          <div className="flex items-center overflow-hidden">
            <Input
              type="text"
              placeholder="Search blog"
              className="flex-1 px-4 py-2 focus:outline-none"
              value={search} // Bind search state
              onChange={(e) => setSearch(e.target.value)} // Update search state
              onKeyPress={handleKeyPress}
            />
            <Button className=" text-gray-600 !h-[38px]" onClick={handleSearch}>
              <CiSearch />
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold font-notosans text-lg">Categories</h3>
          <ul className="space-y-2 pb-2">
            {categories?.map((cat: any, idx: number) => (
              <li
                key={idx}
                className={`text-sm text-gray-800 font-notosans uppercase cursor-pointer ${selectedCategory === cat.id ? 'font-extrabold' : ''}`}
                onClick={() =>
                  handleCategorySelect(
                    cat.id,
                    cat.name
                      .toLowerCase()
                      .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special characters except hyphen
                      .replace(/\s+/g, '-') // Replace spaces with hyphens
                      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
                      .replace(/^-+|-+$/g, ''), // Remove hyphens from start and end
                  )
                } // Use category name for slug
              >
                {cat.name} ({cat.count})
              </li>
            ))}
          </ul>
          {/* {categories?.length > 5 && (
            <span
              className="text-xs mt-1 hover:font-bold font-notosans underline cursor-pointer"
              onClick={handleShowMoreToggle} // Use the toggle handler
            >
              {showAllCategories ? 'Show Less' : 'Show More'}
            </span>
          )} */}
        </div>

        <div className="pt-6 border-t">
          <h3 className="font-semibold font-notosans mb-4">Feature Blogs</h3>
          {blogFeaturedViews?.slider_view?.slice(0, 4).map((post: any, idx: any) => (
            <div key={idx} className="flex gap-4 mb-6 cursor-pointer" onClick={() => router.push(`/blog/${post?.slug}`)}>
              <div className="flex justify-center w-[25%]">
                <Image
                  src={post?.thumbnail_image}
                  alt={post.title}
                  className="mb-4 bg-[#f8f8f8]"
                  fallback="/images/ashclair_pdp_logo_image.svg"
                  preview={false}
                  style={{
                    objectFit: 'cover',
                    width: '100%', // Adjust width as needed (can be a fixed value or percentage)
                    height: 'auto',
                    aspectRatio: '31/19', // Maintains the aspect ratio of 31:19
                  }}
                />
              </div>
              <div className="w-[75%]">
                <p className="text-sm md:text-[10px] font-medium font-notosans  text-gray-800 leading-snug">{post?.title}</p>
                <p className="text-xs md:text-[9px] font-notosans text-gray-500 mt-1">{dayjs(post?.createdAt).format(`MMMM DD, YYYY`)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BlogSidebarLayout;
