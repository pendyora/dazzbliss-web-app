'use client';
import React, { useState, useEffect, MouseEvent, TouchEvent } from 'react';

import { Image as AntdImage } from 'antd';
// eslint-disable-next-line import/no-named-as-default
import styled, { keyframes } from 'styled-components';

// Types
interface ImageZoomProps {
  zoom?: string;
  alt?: string;
  width?: string;
  height?: string;
  src: string;
  id?: string;
  className?: string;
  onError?: (error: Error) => void;
  errorContent?: React.ReactNode;
}

interface ZoomPosition {
  x: number;
  y: number;
}

// Styled Components
const rotate = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const Figure = styled.figure`
  position: relative;
  display: inline-block;
  width: auto;
  min-height: 25vh;
  background-position: 50% 50%;
  background-color: #eee;
  margin: 0;
  overflow: hidden;
  cursor: zoom-in;

  img {
    opacity: 0;
    transition: opacity 0.2s ease-in-out;
  }

  &:before {
    content: '';
    background-color: transparent;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    width: 100%;
    height: 100%;
    opacity: 1;
    transition: opacity 0.2s ease-in-out;
    z-index: 1;
  }

  &:after {
    content: '';
    position: absolute;
    top: calc(50% - 25px);
    left: calc(50% - 25px);
    width: 50px;
    height: 50px;
    border-radius: 50%;
    border: 5px solid transparent;
    border-top-color: #333;
    border-right-color: #333;
    border-bottom-color: #333;
    animation: ${rotate} 2s linear infinite;
    opacity: 1;
    transition: opacity 0.2s ease-in-out;
    z-index: 2;
  }

  &.loaded {
    min-height: auto;

    img {
      opacity: 1;
      transition: opacity 0.2s ease-in-out;
    }

    &:before,
    &:after {
      opacity: 0;
    }
  }
`;

const ErrorText = styled.p`
  width: 100%;
  text-align: center;
  border: 1px solid #f8f8f8;
  padding: 8px 16px;
  border-radius: 8px;
  color: #555;
`;

const DEFAULT_IMAGE = '/images/ashclair_pdp_logo_image.svg';

const ImageZoom: React.FC<ImageZoomProps> = ({
  zoom = '200',
  alt = 'This is an imageZoom image',
  src,
  id,
  className,
  onError,
  errorContent = <ErrorText>There was a problem loading your image</ErrorText>,
}) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [position, setPosition] = useState<string>('50% 50%');
  const [imgData, setImgData] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [isOverflowHidden, setIsOverflowHidden] = useState(false);

  const calculateZoomPosition = (event: MouseEvent | TouchEvent, bounds: DOMRect): ZoomPosition => {
    const { clientX, clientY } = 'touches' in event ? event.touches[0] : (event as MouseEvent);

    const x = ((clientX - bounds.x) / bounds.width) * 100;
    const y = ((clientY - bounds.y) / bounds.height) * 100;

    return {
      x: Math.max(0, Math.min(x, 100)),
      y: Math.max(0, Math.min(y, 100)),
    };
  };

  const handleZoomPosition = (event: MouseEvent | TouchEvent) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const { x, y } = calculateZoomPosition(event, bounds);
    setPosition(`${x}% ${y}%`);

    if ('touches' in event && !isOverflowHidden) {
      setIsOverflowHidden(true);
      document.body.style.overflow = 'hidden';
    }
  };

  const handleInteraction = (event: MouseEvent | TouchEvent) => {
    if (!isZoomed) {
      setIsZoomed(true);
      handleZoomPosition(event);
    } else {
      setIsZoomed(false);
    }
  };

  const handleMove = (event: MouseEvent | TouchEvent) => {
    if (isZoomed) {
      handleZoomPosition(event);
    }
  };

  const handleLeave = () => {
    setIsZoomed(false);
    setPosition('50% 50%');

    if (isOverflowHidden) {
      setIsOverflowHidden(false);
      document.body.style.overflow = 'initial';
    }
  };

  useEffect(() => {
    setImgData(null);

    const img = new Image();
    img.addEventListener('load', () => {
      setIsZoomed(false);
      setImgData(img.src);
    });

    img.addEventListener('error', (error) => {
      setError(true);
      onError?.(error as unknown as Error);
    });

    img.src = src || DEFAULT_IMAGE;

    return () => {
      img.removeEventListener('load', () => {});
      img.removeEventListener('error', () => {});
    };
  }, [src, onError]);

  if (error) {
    return <>{errorContent}</>;
  }

  const figureClass = `${'loaded'} ${isZoomed ? 'zoomed' : 'fullView'} ${className || ''}`;

  return (
    <div className="bg-[#f8f8f8] flex justify-center items-center !aspect-square">
      <Figure
        id={id}
        className={figureClass}
        style={{
          backgroundImage: isZoomed && imgData ? `url(${imgData})` : 'none',
          backgroundSize: `${zoom}%`,
          backgroundPosition: position,
          // backgroundColor: '#f0f0f0',
          mixBlendMode: 'multiply',
        }}
        onClick={handleInteraction}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        onTouchStart={handleInteraction}
        onTouchMove={handleMove}
        onTouchEnd={handleLeave}
      >
        <AntdImage
          src={src}
          alt={alt}
          id="imageZoom"
          fallback={DEFAULT_IMAGE}
          className="w-full 2xl:h-auto h-[500px] sm:hidden object-contain xl:h-auto lg:h-auto  aspect-square "
          style={{
            opacity: isZoomed ? 0 : 1,
            cursor: 'zoom-in',
            // mixBlendMode: 'multiply',
          }}
          preview={{
            src: src,
            mask: <span>Zoom</span>,
          }}
        />
      </Figure>
    </div>
  );
};

export default ImageZoom;
