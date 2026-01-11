'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Instagram, Facebook, Linkedin, ArrowUpRight, Users } from 'lucide-react';

// --- SOCIAL BUTTON ---
const SocialButton = ({ icon: Icon, href }) => (
  <motion.a 
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    whileHover={{ scale: 1.1, backgroundColor: '#B91C1C', borderColor: '#B91C1C', color: '#ffffff' }}
    className="w-8 h-8 2xl:w-10 2xl:h-10 border border-white/10 flex items-center justify-center text-white/70 hover:text-white cursor-pointer transition-colors duration-300 rounded-sm"
  >
    <Icon size={14} className="2xl:w-5 2xl:h-5" strokeWidth={1.5} />
  </motion.a>
);

// --- FOOTER LINKS COLUMN ---
const FooterColumn = ({ title, links }) => (
  <div className="flex flex-col space-y-4 2xl:space-y-6">
    <h4 className="text-[10px] 2xl:text-xs font-black uppercase tracking-[0.2em] text-white/50 flex items-center gap-2">
        <span className="w-1.5 h-1.5 bg-[#B91C1C]"></span>
        {title}
    </h4>
    <ul className="space-y-2 2xl:space-y-3">
      {links.map((link, i) => (
        <li key={i}>
          <Link href={link.href} className="text-[11px] 2xl:text-sm font-bold uppercase tracking-wider text-white/80 hover:text-[#B91C1C] transition-all flex items-center gap-2 group">
            <ArrowUpRight size={10} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-[#B91C1C]" />
            {link.label} 
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

// --- MAIN FOOTER ---
export default function Footer() {
  const currentYear = new Date().getFullYear();

  const columns = {
    brand: [{ label: 'Our Story', href: '/about' }, { label: 'Lookbook', href: '/lookbook' }],
    support: [{ label: 'Contact', href: '/support' }, { label: 'Shipping', href: '/shipping' }],
    legal: [{ label: 'Privacy', href: '/policies/privacy' }, { label: 'Terms', href: '/policies/terms' }]
  };

  return (
    // Background: Deep Maroon (#1A0404) | Border: Red tint
    <footer className="bg-[#1A0404] text-white pt-12 pb-0 font-sans relative overflow-hidden border-t border-[#B91C1C]/20 z-10">
      
      {/* Noise Texture */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none -z-10 mix-blend-overlay" 
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")` }}
      />
      
      <div className="max-w-[1920px] mx-auto px-6 md:px-12 relative z-20">
        
        {/* --- COMPACT COMMUNITY SECTION --- */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-8 pb-10 border-b border-white/5 mb-10">
          
          {/* Text Side */}
          <div className="text-center lg:text-left">
            <h2 className="text-3xl md:text-4xl 2xl:text-6xl font-heading font-black text-white uppercase tracking-tight leading-none mb-2">
              Join The <span className="text-[#B91C1C]">Inner Circle.</span>
            </h2>
            <p className="text-white/50 text-[10px] 2xl:text-sm font-medium uppercase tracking-widest">
              Exclusive drops. Member-only events. Behind the scenes.
            </p>
          </div>
          
          {/* Button Side */}
          <div>
            <a 
              href="https://facebook.com/groups/oura-dummy-link" 
              target="_blank"
              rel="noopener noreferrer"
              className="group relative px-8 py-4 2xl:px-10 2xl:py-5 bg-white text-black text-[10px] 2xl:text-xs font-black uppercase tracking-[0.25em] overflow-hidden hover:text-white transition-colors duration-500 inline-flex"
            >
              <span className="absolute inset-0 bg-[#0866FF] translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out"></span>
              <span className="relative flex items-center gap-3">
                Join Community <Users size={14} />
              </span>
            </a>
          </div>
        </div>

        {/* --- COMPACT LINKS GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-y-10 lg:gap-8 mb-12">
          
          {/* LOGO & SOCIALS (Left Side) */}
          <div className="lg:col-span-5 flex flex-col justify-between h-full space-y-6 lg:space-y-0">
             <div className="space-y-4">
                {/* Logo Image */}
                <div className="relative w-32 h-10 2xl:w-48 2xl:h-14">
                    <Image 
                        src="/logo.png" 
                        alt="OURA" 
                        fill 
                        className="object-contain object-left filter brightness-0 invert" 
                    />
                </div>
             </div>
          </div>

          {/* Spacer (Desktop) */}
          <div className="hidden lg:block lg:col-span-1"></div>

          {/* Navigation Columns */}
          <div className="lg:col-span-2"><FooterColumn title="Brand" links={columns.brand} /></div>
          <div className="lg:col-span-2"><FooterColumn title="Help" links={columns.support} /></div>
          <div className="lg:col-span-2"><FooterColumn title="Legal" links={columns.legal} /></div>
        </div>

        {/* --- BOTTOM BAR --- */}
        <div className="relative border-t border-white/5 pt-6 overflow-hidden">
           <div className="flex flex-col md:flex-row justify-between items-center gap-4 pb-20 2xl:pb-32 relative z-20">
             
             {/* Copyright */}
             <div className="flex items-center gap-4 text-[9px] 2xl:text-[11px] font-bold text-white/40 uppercase tracking-[0.2em]">
                 <p>&copy; {currentYear} OURA.</p>
                 <span className="text-[#B91C1C] opacity-50">|</span>
                 <p>Site by <span className="text-white hover:text-[#B91C1C] transition-colors cursor-pointer">Enfinito</span></p>
             </div>

             {/* Tagline */}
             <div className="text-[9px] 2xl:text-[11px] font-bold text-white/20 uppercase tracking-widest hidden md:block">
                 Engineered for the Modern Aesthetic.
             </div>
           </div>
           
           {/* GIANT TEXT (Behind everything) */}
           <h1 className="font-heading text-[18vw] leading-[0.7] text-center text-[#B91C1C] opacity-[0.03] font-black absolute bottom-[-10%] left-1/2 -translate-x-1/2 w-full select-none pointer-events-none -z-10">
             OURA
           </h1>
        </div>
      </div>
    </footer>
  );
}