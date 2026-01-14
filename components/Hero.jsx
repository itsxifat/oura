"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, ArrowUpRight } from "lucide-react"; 
import Link from 'next/link';

// ==========================================
// CONFIGURATION
// ==========================================
const AUTOPLAY_DELAY = 7000;
const SWIPE_CONFIDENCE_THRESHOLD = 10000;

// ==========================================
// HELPER: CALCULATE SWIPE POWER
// ==========================================
const swipePower = (offset, velocity) => {
  return Math.abs(offset) * velocity;
};

// ==========================================
// SUB-COMPONENT: MODERN BUTTON
// ==========================================
const ModernButton = ({ children, link }) => {
  if (!children) return null;

  return (
    <Link href={link || '/product'} className="inline-block relative z-30">
      <button className="group relative px-8 py-4 md:px-10 md:py-4 overflow-hidden rounded-md transition-all duration-300 hover:w-auto bg-white/10 backdrop-blur-md border border-white/20 hover:bg-[#B91C1C] hover:border-[#B91C1C]">
        <span className="relative z-10 flex items-center gap-3 font-sans text-xs font-bold uppercase tracking-[0.2em] text-white transition-colors duration-500">
          {children}
          <ArrowUpRight size={16} className="transition-transform duration-500 group-hover:rotate-45" />
        </span>
      </button>
    </Link>
  );
};

// ==========================================
// MAIN HERO COMPONENT
// ==========================================
const Hero = ({ heroData }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  // --- AUTOPLAY ENGINE ---
  useEffect(() => {
    if (!heroData?.length) return;
    const timer = setInterval(() => paginate(1), AUTOPLAY_DELAY);
    return () => clearInterval(timer);
  }, [currentIndex, heroData]);

  if (!heroData || heroData.length === 0) return null;

  const slide = heroData[currentIndex];
  const totalSlides = heroData.length;

  const paginate = (newDirection) => {
    setDirection(newDirection);
    setCurrentIndex((prev) => {
      let next = prev + newDirection;
      if (next < 0) next = totalSlides - 1;
      if (next >= totalSlides) next = 0;
      return next;
    });
  };

  // --- ANIMATION VARIANTS ---
  const slideVariants = {
    enter: (dir) => ({
      x: dir > 0 ? 10 : -10,
      opacity: 0,
      scale: 1.1,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.8 },
        scale: { duration: 6, ease: "linear" }
      }
    },
    exit: (dir) => ({
      zIndex: 0,
      x: dir < 0 ? 10 : -10,
      opacity: 0,
      scale: 1,
      transition: { duration: 0.6, ease: "easeInOut" }
    })
  };

  const textVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (delay = 0) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, delay: 0.2 + delay, ease: "easeOut" }
    })
  };

  const targetLink = slide.buttonLayer?.link?.trim() ? slide.buttonLayer.link : '/product';

  return (
    // OUTER CONTAINER
    <section className="w-full bg-white pb-0 md:pb-6 px-0 md:px-6 pt-0 mt-0 flex justify-center">
      
      <div className="relative w-full max-w-[2400px] aspect-[4/5] md:aspect-[21/8] mx-auto rounded-none md:rounded-md overflow-hidden bg-neutral-900 isolate transform transition-all md:mt-3.5 group/card touch-pan-y">
        
        {/* =============================================
            LAYER 0 & 1: DRAGGABLE CAROUSEL & LINK
           ============================================= */}
        <div className="absolute inset-0 z-0">
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              // DRAG PROPERTIES
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={1}
              onDragEnd={(e, { offset, velocity }) => {
                const swipe = swipePower(offset.x, velocity.x);
                if (swipe < -SWIPE_CONFIDENCE_THRESHOLD) {
                  paginate(1);
                } else if (swipe > SWIPE_CONFIDENCE_THRESHOLD) {
                  paginate(-1);
                }
              }}
              className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
            >
               <div className="relative w-full h-full">
                 
                 {/* ✅ REMOVED THE BLACK GRADIENT OVERLAY HERE */}
                 
                 {/* Images */}
                 <img 
                   src={slide.imageDesktop || slide.image} 
                   alt={slide.title || "Hero Image"} 
                   className={`w-full h-full object-cover select-none pointer-events-none ${slide.imageMobile || slide.mobileImage ? 'hidden md:block' : 'block'}`}
                   draggable="false"
                 />
                 
                 {(slide.imageMobile || slide.mobileImage) && (
                   <img 
                     src={slide.imageMobile || slide.mobileImage} 
                     alt={slide.title || "Hero Mobile"} 
                     className="w-full h-full object-cover md:hidden select-none pointer-events-none" 
                     draggable="false"
                   />
                 )}

                 {/* Link Overlay */}
                 <Link 
                   href={targetLink} 
                   className="absolute inset-0 z-10 w-full h-full"
                   draggable="false"
                   aria-label="Go to product"
                 />
               </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* =============================================
            LAYER 2: CONTENT (Z-20)
           ============================================= */}
        <div className="absolute inset-0 z-20 flex flex-col justify-end p-6 md:p-12 lg:p-16 pointer-events-none">
          <AnimatePresence mode="wait">
             <div key={currentIndex} className="max-w-7xl w-full">
                  
                  {/* Title & Subtitle Group */}
                  <div className="flex flex-col gap-2 md:gap-4 mb-6 md:mb-8">
                    
                    {slide.subtitle && (
                      <motion.div 
                          variants={textVariants} custom={0} initial="hidden" animate="visible" exit="hidden"
                          className="flex items-center gap-3"
                      >
                          {/* RED SHADE ACCENT: Subtitle Dash */}
                          <span className="w-8 h-[2px] bg-[#B91C1C]" />
                          <span className="font-sans text-white/90 text-[10px] md:text-xs font-bold uppercase tracking-[0.25em] drop-shadow-md">
                             {slide.subtitle}
                          </span>
                      </motion.div>
                    )}

                    {slide.title && (
                      <motion.h1 
                          variants={textVariants} custom={0.1} initial="hidden" animate="visible" exit="hidden"
                          className="font-heading font-black text-4xl md:text-6xl lg:text-8xl text-white uppercase tracking-tighter leading-[0.9] drop-shadow-lg"
                      >
                          {slide.title}
                      </motion.h1>
                    )}
                  </div>

                  {/* Button & Description */}
                  {(slide.description || (slide.buttonLayer && slide.buttonLayer.text)) && (
                    <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 md:gap-6 border-t border-white/20 pt-4 md:pt-6">
                        
                        {slide.description ? (
                          <motion.p 
                            variants={textVariants} custom={0.2} initial="hidden" animate="visible" exit="hidden"
                            className="text-white/90 text-xs md:text-sm max-w-lg leading-relaxed font-sans hidden md:block drop-shadow-md font-medium"
                          >
                             {slide.description}
                          </motion.p>
                        ) : <div />}

                        {slide.buttonLayer?.text && (
                          <motion.div 
                            variants={textVariants} custom={0.3} initial="hidden" animate="visible" exit="hidden"
                            className="pointer-events-auto"
                          >
                             <ModernButton link={targetLink}>
                                {slide.buttonLayer.text}
                             </ModernButton>
                          </motion.div>
                        )}
                    </div>
                  )}

             </div>
          </AnimatePresence>
        </div>

        {/* =============================================
            LAYER 3: NAVIGATION (Desktop Only)
           ============================================= */}
        <div className="absolute bottom-8 right-8 z-30 hidden md:flex gap-2 pointer-events-auto">
            <button 
               onClick={() => paginate(-1)}
               className="w-12 h-12 rounded-md border border-white/20 bg-black/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-[#B91C1C] hover:border-[#B91C1C] transition-all duration-300 group shadow-lg"
            >
               <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            </button>
            <button 
               onClick={() => paginate(1)}
               className="w-12 h-12 rounded-md border border-white/20 bg-black/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-[#B91C1C] hover:border-[#B91C1C] transition-all duration-300 group shadow-lg"
            >
               <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
        </div>

        {/* RED SHADE ACCENT: Progress Bar (Visible Mobile & Desktop) */}
        <div className="absolute bottom-0 left-0 w-full h-[3px] z-30 bg-white/10">
              <motion.div 
                key={currentIndex}
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: AUTOPLAY_DELAY / 1000, ease: "linear" }}
                className="h-full bg-[#B91C1C]"
              />
        </div>

      </div>
    </section>
  );
};

export default Hero;