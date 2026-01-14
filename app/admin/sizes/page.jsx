'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Loader2, Table as TableIcon, X, Check, AlertCircle, Ruler, Settings2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSizesData, updateMasterSizes, upsertSizeGuide, removeSizeGuide } from '@/actions/sizes';

// --- TOAST NOTIFICATION COMPONENT ---
const Toast = ({ message, type, onClose }) => (
  <motion.div 
    initial={{ opacity: 0, y: 50 }} 
    animate={{ opacity: 1, y: 0 }} 
    exit={{ opacity: 0, y: 20 }}
    className={`fixed bottom-8 right-8 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-50 border ${
      type === 'success' 
        ? 'bg-[#800000] text-white border-[#D4AF37]' 
        : 'bg-red-50 text-red-600 border-red-200'
    }`}
  >
    {type === 'success' ? <Check size={16} className="text-[#D4AF37]" /> : <AlertCircle size={16} />}
    <span className="text-xs font-bold uppercase tracking-widest">{message}</span>
  </motion.div>
);

export default function AdminSizeManager() {
  const [activeTab, setActiveTab] = useState('guides');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // Data
  const [masterSizes, setMasterSizes] = useState([]);
  const [guides, setGuides] = useState([]);
  
  // Inputs
  const [newSizeInput, setNewSizeInput] = useState('');
  const [editingGuide, setEditingGuide] = useState(null); 
  const [editorData, setEditorData] = useState({ name: '', columns: [], rows: [] });

  // --- INITIAL LOAD ---
  const refreshData = async () => {
    const data = await getSizesData();
    if (data.success) {
      setGuides(data.guides);
      setMasterSizes(data.masterSizes);
    }
    setLoading(false);
  };

  useEffect(() => { refreshData(); }, []);

  // --- TOAST HELPER ---
  const showToast = (msg, type = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // --- MASTER SIZES LOGIC ---
  const handleAddMasterSize = async () => {
    if (!newSizeInput.trim()) return;
    const val = newSizeInput.toUpperCase().trim();
    if (masterSizes.includes(val)) return showToast("Size already exists", "error");

    const updated = [...masterSizes, val];
    setMasterSizes(updated); // Optimistic
    setNewSizeInput('');
    
    const res = await updateMasterSizes(updated);
    if (!res.success) {
        showToast("Failed to save", "error");
        refreshData(); // Revert
    } else {
        showToast("Size Added");
    }
  };

  const handleDeleteMasterSize = async (sizeToDelete) => {
    const updated = masterSizes.filter(s => s !== sizeToDelete);
    setMasterSizes(updated); // Optimistic
    await updateMasterSizes(updated);
    showToast("Size Removed");
  };

  // --- GUIDE LOGIC ---
  const openEditor = (guide) => {
    if (guide === 'new') {
        setEditorData({ name: '', columns: ['Size', 'Chest', 'Length'], rows: [{ values: ['S', '', ''] }] });
        setEditingGuide('new');
    } else {
        setEditorData(JSON.parse(JSON.stringify(guide)));
        setEditingGuide(guide._id);
    }
  };

  const handleSaveGuide = async () => {
    if (!editorData.name) return showToast("Chart name is required", "error");
    setSaving(true);
    
    const result = await upsertSizeGuide({ 
        ...editorData, 
        _id: editingGuide === 'new' ? null : editingGuide 
    });

    if (result.success) {
        showToast("Chart Saved Successfully");
        await refreshData();
        setEditingGuide(null);
    } else {
        showToast("Failed to save chart", "error");
    }
    setSaving(false);
  };

  const handleDeleteGuide = async (id, e) => {
      e.stopPropagation();
      if(!confirm("Delete this chart permanently?")) return;
      setGuides(guides.filter(g => g._id !== id)); // Optimistic
      await removeSizeGuide(id);
      showToast("Chart Deleted");
  };

  // --- TABLE MANIPULATION ---
  const updateColumnName = (idx, val) => {
      const newCols = [...editorData.columns];
      newCols[idx] = val;
      setEditorData({ ...editorData, columns: newCols });
  };

  const updateCellValue = (rIdx, cIdx, val) => {
      const newRows = [...editorData.rows];
      newRows[rIdx].values[cIdx] = val;
      setEditorData({ ...editorData, rows: newRows });
  };

  const addColumn = () => {
      setEditorData(prev => ({
          ...prev,
          columns: [...prev.columns, 'NEW'],
          rows: prev.rows.map(r => ({ values: [...r.values, ''] }))
      }));
  };

  const removeColumn = (idx) => {
      setEditorData(prev => ({
          ...prev,
          columns: prev.columns.filter((_, i) => i !== idx),
          rows: prev.rows.map(r => ({ values: r.values.filter((_, i) => i !== idx) }))
      }));
  };

  const addRow = () => {
      setEditorData(prev => ({
          ...prev,
          rows: [...prev.rows, { values: Array(prev.columns.length).fill('') }]
      }));
  };

  const removeRow = (idx) => {
      setEditorData(prev => ({
          ...prev,
          rows: prev.rows.filter((_, i) => i !== idx)
      }));
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#faf9f6] text-[#800000]">
        <Loader2 className="animate-spin mb-4" size={40}/>
        <span className="text-xs uppercase tracking-widest font-bold text-gray-400">Loading Configuration...</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#faf9f6] p-4 md:p-8 pt-24 lg:pt-8 font-manrope text-gray-900">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 border-b border-gray-200 pb-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#800000] block mb-2">Inventory Settings</span>
            <h1 className="text-4xl font-bodoni text-black">Size Management</h1>
            <p className="text-gray-400 text-xs mt-2 font-medium tracking-wide">Configure global sizes and measurement charts.</p>
          </div>
          
          {/* TABS */}
          <div className="flex bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm mt-6 md:mt-0">
            {['guides', 'sizes'].map(tab => (
                <button 
                    key={tab}
                    onClick={() => { setActiveTab(tab); setEditingGuide(null); }}
                    className={`px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all rounded-lg flex items-center gap-2 ${
                        activeTab === tab 
                        ? 'bg-[#800000] text-white shadow-lg' 
                        : 'text-gray-400 hover:text-[#800000] hover:bg-red-50'
                    }`}
                >
                    {tab === 'guides' ? <Ruler size={14}/> : <Settings2 size={14}/>}
                    {tab === 'guides' ? 'Charts' : 'Global Sizes'}
                </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode='wait'>
            
            {/* === TAB: MASTER SIZES === */}
            {activeTab === 'sizes' && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-white p-8 md:p-10 border border-gray-200 shadow-sm rounded-2xl max-w-4xl"
                >
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h3 className="font-bodoni text-2xl mb-2 text-black">Global Size List</h3>
                            <p className="text-xs text-gray-400">These sizes will be available in the "Stock" dropdown when adding products.</p>
                        </div>
                        <span className="bg-[#800000]/5 px-3 py-1 text-[10px] font-bold text-[#800000] rounded border border-[#800000]/20">{masterSizes.length} Active</span>
                    </div>
                    
                    {/* Input Area */}
                    <div className="flex gap-3 mb-10">
                        <input 
                            value={newSizeInput}
                            onChange={(e) => setNewSizeInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddMasterSize()}
                            placeholder="Type Size (e.g. XL)" 
                            className="flex-1 bg-gray-50 border border-transparent focus:border-[#800000] focus:bg-white px-6 py-4 text-sm font-bold tracking-wider outline-none uppercase transition-all rounded-xl"
                        />
                        <button onClick={handleAddMasterSize} className="bg-[#800000] text-white px-8 rounded-xl uppercase font-bold text-[10px] tracking-widest hover:bg-black transition-colors shadow-lg shadow-[#800000]/20">
                            Add Size
                        </button>
                    </div>

                    {/* Chips Grid */}
                    {masterSizes.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-xl">
                            <span className="text-gray-300 text-xs font-bold uppercase tracking-widest">No sizes configured</span>
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-3">
                            {masterSizes.map(size => (
                                <div key={size} className="group relative bg-white border border-gray-200 px-6 py-3 min-w-[80px] text-center hover:border-[#800000] hover:shadow-md transition-all cursor-default rounded-xl">
                                    <span className="font-bold text-sm text-gray-800 group-hover:text-[#800000]">{size}</span>
                                    <button 
                                        onClick={() => handleDeleteMasterSize(size)}
                                        className="absolute -top-2 -right-2 bg-white text-gray-400 hover:text-red-600 border border-gray-100 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all shadow-sm hover:scale-110 hover:border-red-200"
                                    >
                                        <X size={10} strokeWidth={3}/>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            )}

            {/* === TAB: SIZE GUIDES === */}
            {activeTab === 'guides' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* SIDEBAR LIST */}
                    <div className="lg:col-span-3 space-y-4">
                        <button 
                            onClick={() => openEditor('new')}
                            className="w-full py-4 bg-white border border-gray-200 text-gray-600 text-[10px] font-bold uppercase tracking-widest hover:border-[#800000] hover:text-[#800000] transition-all rounded-xl shadow-sm flex items-center justify-center gap-2 group"
                        >
                            <Plus size={14} className="group-hover:rotate-90 transition-transform text-[#800000]"/> Create New Chart
                        </button>
                        
                        <div className="space-y-3 h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                            {guides.map(g => (
                                <div 
                                    key={g._id} 
                                    onClick={() => openEditor(g)}
                                    className={`p-5 bg-white border cursor-pointer transition-all group relative rounded-xl ${
                                        editingGuide === g._id 
                                        ? 'border-[#800000] shadow-md ring-1 ring-[#800000]/10' 
                                        : 'border-gray-100 hover:border-gray-300'
                                    }`}
                                >
                                    <h4 className={`font-bold text-sm mb-1 line-clamp-1 ${editingGuide === g._id ? 'text-[#800000]' : 'text-gray-800'}`}>{g.name}</h4>
                                    <div className="flex justify-between items-center mt-3">
                                        <span className="text-[9px] text-gray-400 font-mono bg-gray-50 px-2 py-1 rounded border border-gray-100 group-hover:bg-white">{g.columns.length} Cols • {g.rows.length} Rows</span>
                                        <button 
                                            onClick={(e) => handleDeleteGuide(g._id, e)}
                                            className="text-gray-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all bg-white rounded-full p-1.5 shadow-sm border border-transparent hover:border-red-100"
                                        >
                                            <Trash2 size={12}/>
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {guides.length === 0 && (
                                <div className="text-center py-8 text-gray-300 text-xs uppercase tracking-widest border-2 border-dashed border-gray-100 rounded-xl">No charts found</div>
                            )}
                        </div>
                    </div>

                    {/* EDITOR AREA */}
                    <div className="lg:col-span-9">
                        {editingGuide ? (
                            <motion.div 
                                key="editor" 
                                initial={{ opacity: 0, x: 20 }} 
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-white border border-gray-200 shadow-sm p-8 rounded-2xl relative h-full flex flex-col"
                            >
                                <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-6 border-b border-gray-50 pb-6">
                                    <div className="w-full md:w-1/2">
                                        <label className="text-[9px] font-bold uppercase tracking-widest text-[#800000] mb-2 block">Chart Name</label>
                                        <input 
                                            value={editorData.name}
                                            onChange={(e) => setEditorData({...editorData, name: e.target.value})}
                                            className="text-3xl font-bodoni w-full border-b border-gray-200 pb-2 focus:border-[#800000] outline-none placeholder:text-gray-200 bg-transparent transition-colors text-black"
                                            placeholder="e.g. Panjabi Regular Fit"
                                        />
                                    </div>
                                    <div className="flex gap-3 self-end">
                                        <button onClick={() => setEditingGuide(null)} className="px-6 py-3 border border-gray-200 text-[10px] font-bold uppercase tracking-widest hover:border-black text-gray-500 hover:text-black transition-all rounded-lg">Cancel</button>
                                        <button 
                                            onClick={handleSaveGuide} 
                                            disabled={saving} 
                                            className="px-8 py-3 bg-[#800000] text-white text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50 flex items-center gap-2 rounded-lg shadow-xl shadow-[#800000]/20"
                                        >
                                            {saving ? <Loader2 className="animate-spin" size={14}/> : <Save size={14}/>} 
                                            Save Changes
                                        </button>
                                    </div>
                                </div>

                                {/* Matrix Editor */}
                                <div className="flex-1 overflow-x-auto border border-gray-100 rounded-xl custom-scrollbar shadow-inner bg-gray-50/50">
                                    <table className="w-full text-sm border-collapse">
                                        <thead>
                                            <tr className="bg-[#800000] text-white">
                                                {editorData.columns.map((col, i) => (
                                                    <th key={i} className="p-3 border-r border-white/10 min-w-[140px] relative group first:rounded-tl-lg last:rounded-tr-lg">
                                                        <div className="flex items-center gap-2 justify-center">
                                                            <input 
                                                                value={col} 
                                                                onChange={(e) => updateColumnName(i, e.target.value)}
                                                                className="bg-transparent font-bold uppercase text-[10px] tracking-widest w-full outline-none text-center placeholder:text-white/30 focus:text-[#D4AF37] selection:bg-[#D4AF37]/30"
                                                                placeholder="LABEL"
                                                            />
                                                            <button onClick={() => removeColumn(i)} className="text-white/20 hover:text-red-200 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2"><X size={10}/></button>
                                                        </div>
                                                    </th>
                                                ))}
                                                <th className="w-12 text-center p-2 cursor-pointer hover:bg-black transition-colors" onClick={addColumn} title="Add Column">
                                                    <Plus size={16} className="mx-auto text-white"/>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {editorData.rows.map((row, rIdx) => (
                                                <tr key={rIdx} className="border-b border-gray-100 last:border-0 hover:bg-white transition-colors group bg-white">
                                                    {row.values.map((val, cIdx) => (
                                                        <td key={cIdx} className="p-0 border-r border-gray-50 relative">
                                                            <input 
                                                                value={val}
                                                                onChange={(e) => updateCellValue(rIdx, cIdx, e.target.value)}
                                                                className={`w-full h-full py-4 text-center outline-none focus:bg-[#fffdf5] focus:text-[#800000] transition-colors font-medium bg-transparent ${cIdx === 0 ? 'font-bold text-black' : 'text-gray-600'}`}
                                                            />
                                                        </td>
                                                    ))}
                                                    <td className="text-center w-12 bg-gray-50 group-hover:bg-white transition-colors">
                                                        <button onClick={() => removeRow(rIdx)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                                            <Trash2 size={14}/>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <button onClick={addRow} className="mt-4 w-full py-4 border-2 border-dashed border-gray-200 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:border-[#800000] hover:text-[#800000] hover:bg-[#800000]/5 transition-all rounded-xl bg-white">
                                    + Add Measurement Row
                                </button>

                            </motion.div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl bg-white text-gray-300 p-20 shadow-sm">
                                <TableIcon size={64} strokeWidth={1} className="mb-4 text-gray-200 opacity-50"/>
                                <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Select a chart from the left to edit</span>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* TOAST RENDERER */}
        <AnimatePresence>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </AnimatePresence>

      </div>
    </div>
  );
}