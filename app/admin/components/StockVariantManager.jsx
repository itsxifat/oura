'use client';
import { useState, useEffect, useRef } from 'react';
import { RefreshCcw, PackageOpen, Layers, Archive, Box } from 'lucide-react';

export default function StockVariantManager({ masterSizes = [], value = [], onChange }) {
  
  // Local state
  const [variants, setVariants] = useState(value || []);
  
  // Refs
  const debounceTimer = useRef(null);
  const isTyping = useRef(false);

  useEffect(() => {
    if (!isTyping.current) {
        setVariants(value || []);
    }
  }, [value]);

  const handleStockChange = (size, qty) => {
    isTyping.current = true;

    const inputValue = qty === '' ? '' : parseInt(qty);
    const newStock = inputValue === '' ? 0 : Math.max(0, inputValue);
    
    const existingIndex = variants.findIndex(v => v.size === size);
    let newVariants = [...variants];

    if (existingIndex > -1) {
      if (newStock === 0 && inputValue === '') {
         newVariants[existingIndex].stock = 0;
      } else {
         newVariants[existingIndex].stock = newStock;
      }
    } else if (newStock > 0) {
      newVariants.push({ size, stock: newStock });
    }
    
    setVariants(newVariants);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
        onChange(newVariants);
        isTyping.current = false;
    }, 300);
  };

  const handleReset = (e) => {
    e.preventDefault();
    if(confirm('Clear all inventory?')) {
        setVariants([]);
        onChange([]);
    }
  };

  const preventScroll = (e) => e.target.blur();

  const totalStock = variants.reduce((a, b) => a + (b.stock || 0), 0);

  return (
    <div className="w-full bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-5 border-b border-gray-50 pb-4">
        <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#B91C1C] text-white rounded">
                <Layers size={14} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">Stock</span>
        </div>
        
        <div className="flex items-center gap-3">
            {totalStock > 0 && (
                <button 
                    onClick={handleReset}
                    className="text-[9px] font-bold uppercase text-gray-300 hover:text-red-500 transition-colors"
                    type="button"
                >
                    Clear
                </button>
            )}
            <div className="bg-[#fff5f5] border border-[#B91C1C]/20 px-3 py-1 rounded-full flex items-center gap-2">
                <Archive size={12} className="text-[#B91C1C]"/>
                <span className="text-xs font-bold font-mono text-black">{totalStock}</span>
            </div>
        </div>
      </div>
      
      {/* LAYOUT: 2 Columns on Mobile, 1 Column on Desktop (Vertical List) */}
      <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
        {masterSizes.length > 0 ? (
            masterSizes.map((size) => {
            const variant = variants.find(v => v.size === size);
            const stock = variant ? variant.stock : '';
            const hasStock = stock > 0;

            return (
                <div 
                    key={size} 
                    className={`
                        flex items-center justify-between p-1 pr-1 border rounded-lg transition-all duration-200 group
                        ${hasStock 
                            ? 'border-black shadow-sm bg-white' 
                            : 'border-gray-100 bg-white hover:border-gray-300'
                        }
                    `}
                >
                    {/* LEFT: Label */}
                    <div className={`
                        w-10 h-10 flex items-center justify-center rounded-md font-bold text-xs transition-colors
                        ${hasStock ? 'bg-black text-white' : 'bg-gray-50 text-gray-400'}
                    `}>
                        {size}
                    </div>

                    {/* RIGHT: Input */}
                    <div className="flex-1 ml-2 relative">
                        <input 
                            type="number" 
                            min="0"
                            inputMode="numeric"
                            placeholder="0"
                            value={stock === 0 ? '' : stock} 
                            onChange={(e) => handleStockChange(size, e.target.value)}
                            onWheel={preventScroll}
                            className={`
                                w-full h-10 text-right pr-3 bg-transparent outline-none font-manrope font-bold text-lg transition-all
                                placeholder:text-gray-200 
                                ${hasStock ? 'text-black' : 'text-gray-300'}
                            `}
                        />
                        {/* Status Dot */}
                        {hasStock && (
                            <div className="absolute top-1/2 left-0 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#B91C1C]" />
                        )}
                    </div>
                </div>
            );
            })
        ) : (
            <div className="col-span-full py-8 flex flex-col items-center justify-center text-gray-300 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/20">
                <Box size={20} className="mb-2 opacity-40"/>
                <span className="text-[9px] font-bold uppercase tracking-widest">No sizes</span>
            </div>
        )}
      </div>

      <style jsx global>{`
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button { 
          -webkit-appearance: none; 
          margin: 0; 
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  );
}