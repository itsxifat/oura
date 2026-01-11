'use client';
import { loginAction } from '@/app/actions';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData) {
    setLoading(true);
    const res = await loginAction(formData);
    if (res.success) {
      router.refresh();
    } else {
      alert(res.error);
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <form action={handleSubmit} className="p-8 md:p-10 bg-white rounded-2xl shadow-xl w-full max-w-sm border border-gray-100">
        <div className="mb-8 text-center">
          <h1 className="font-classic text-3xl font-bold text-gray-900">ANAQA</h1>
          <p className="text-sm text-gray-500 uppercase tracking-widest mt-2">Admin Portal</p>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Password</label>
            <input 
              type="password" 
              name="password" 
              placeholder="••••••" 
              className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-black transition-all"
              required 
            />
          </div>
          
          <button 
            disabled={loading}
            className="w-full bg-black text-white p-3 rounded-xl font-bold uppercase text-sm tracking-wide hover:bg-gray-800 transition-all flex justify-center items-center gap-2 disabled:opacity-70"
          >
            {loading && <Loader2 className="animate-spin" size={16} />}
            {loading ? 'Verifying...' : 'Access Dashboard'}
          </button>
        </div>
      </form>
    </div>
  )
}