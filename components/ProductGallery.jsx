'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';

export default function ProductGallery({ images }) {
  const [currentImage, setCurrentImage] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Handle Mouse Move for Zoom Lens
  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setMousePos({ x, y });
  };

  return (
    <div className="flex flex-col-reverse lg:flex-row gap-4 lg:gap-8 sticky top-32 self-start">
      
      {/* --- THUMBNAILS (Left on Desktop, Bottom on Mobile) --- */}
      <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 scrollbar-hide">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => setCurrentImage(i)}
            className={`relative w-20 h-20 lg:w-24 lg:h-32 flex-shrink-0 border transition-all duration-300 ${
              currentImage === i 
                ? 'border-black opacity-100' 
                : 'border-transparent opacity-60 hover:opacity-100'
            }`}
          >
            <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>

      {/* --- MAIN IMAGE WITH ADVANCED ZOOM --- */}
      <div 
        className="relative flex-1 aspect-[3/4] bg-gray-50 overflow-hidden cursor-crosshair group"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onMouseMove={handleMouseMove}
      >
        {/* Normal Image */}
        <img 
          src={images[currentImage]} 
          alt="Product Main" 
          className="w-full h-full object-cover transition-opacity duration-300"
        />

        {/* Zoom Lens Overlay (High-Res Effect) */}
        <AnimatePresence>
          {isHovering && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 pointer-events-none hidden lg:block"
              style={{
                backgroundImage: `url(${images[currentImage]})`,
                backgroundPosition: `${mousePos.x}% ${mousePos.y}%`,
                backgroundSize: '250%', // 2.5x Zoom level
              }}
            />
          )}
        </AnimatePresence>

        {/* Mobile/Tablet Hint */}
        <div className="absolute top-4 right-4 z-10 lg:hidden">
          <div className="bg-white/80 p-2 rounded-full shadow-sm backdrop-blur-sm">
            <Maximize2 size={16} />
          </div>
        </div>
      </div>

    </div>
  );
}