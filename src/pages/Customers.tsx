import React, { useEffect, useState } from 'react';
import { Plus, Users, Phone, MapPin, Search, Trash2, Edit3, X, Loader2, Contact } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { translations } from '../translations';
import { financeService } from '../services/financeService';
import { Customer } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function CustomersPage() {
  const { profile, user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    type: 'customer' as 'customer' | 'borrower' | 'lender',
    notes: ''
  });

  const lang = profile?.language || 'en';
  const t = translations[lang as keyof typeof translations];

  useEffect(() => {
    if (!user) return;
    return financeService.subscribeToCollection('customers', user.uid, setCustomers);
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      await financeService.addDoc('customers', {
        ...formData,
        userId: user.uid
      });
      setIsModalOpen(false);
      setFormData({ name: '', phone: '', address: '', type: 'customer', notes: '' });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.phone.includes(search)
  );

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl font-black text-slate-900 tracking-tight"
          >
            Customers
          </motion.h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-emerald-600 font-black text-sm bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">{customers.length}</span>
            <span className="text-slate-400 font-extrabold text-[10px] tracking-[0.2em]">Identity units verified</span>
          </div>
        </div>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-[2rem] font-black shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all tracking-[0.15em] text-sm"
        >
          <Plus size={22} strokeWidth={3} />
          New entity
        </motion.button>
      </div>

      <div className="bg-white border-2 border-slate-100 rounded-[2.5rem] p-4 flex flex-col md:flex-row gap-6 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text"
            placeholder="Search database..."
            className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-[2rem] outline-none focus:border-emerald-500 text-foreground font-black transition-all placeholder:text-slate-400 text-xs tracking-widest shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {filteredCustomers.map((customer, idx) => (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: idx * 0.05 }}
              key={customer.id}
              className="bg-white border-2 border-slate-100 rounded-[2.5rem] p-8 group relative overflow-hidden flex flex-col justify-between shadow-sm hover:border-emerald-200 transition-all"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/[0.03] blur-[60px] rounded-full -mr-16 -mt-16 group-hover:bg-emerald-500/[0.05] transition-colors" />
              
              <div className="relative z-10 flex items-start justify-between mb-8">
                <div className="w-16 h-16 bg-white border border-slate-100 rounded-[1.5rem] flex items-center justify-center text-slate-400 group-hover:text-emerald-600 transition-all shadow-sm">
                  <Users size={32} strokeWidth={1.5} />
                </div>
                <div className="flex gap-2">
                  <button className="p-3 bg-slate-50 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-2xl border border-slate-100 transition-all shadow-sm">
                    <Edit3 size={18} />
                  </button>
                  <button className="p-3 bg-slate-50 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl border border-slate-100 transition-all shadow-sm">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="relative z-10 space-y-4">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 group-hover:text-emerald-700 transition-colors tracking-tighter">{customer.name}</h3>
                  <div className="inline-flex mt-2 px-4 py-1.5 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-[1rem] text-[10px] font-black tracking-widest">
                    {customer.type}
                  </div>
                </div>
                
                <div className="space-y-3 pt-4 border-t border-slate-50">
                  <div className="flex items-center gap-4 text-slate-400">
                    <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 shadow-sm">
                      <Phone size={14} className="text-indigo-500" />
                    </div>
                    <span className="text-[10px] font-black tracking-widest">{customer.phone || 'No comm link'}</span>
                  </div>
                  <div className="flex items-center gap-4 text-slate-400">
                    <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 shadow-sm">
                      <MapPin size={14} className="text-rose-500" />
                    </div>
                    <span className="text-[10px] font-black tracking-widest truncate">{customer.address || 'Surface coords unknown'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-10 pt-6 border-t border-slate-50 relative z-10">
                <button className="w-full py-4 flex items-center justify-center gap-3 text-[10px] font-black tracking-[0.2em] text-emerald-600 bg-emerald-50 hover:bg-emerald-600 hover:text-white rounded-2xl transition-all border border-emerald-100 shadow-sm">
                  <Contact size={18} strokeWidth={2} />
                  Access protocols
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredCustomers.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="col-span-full text-center py-32 bg-slate-50 border-2 border-slate-100 rounded-[3rem] relative overflow-hidden shadow-sm"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/[0.03] to-transparent blur-3xl" />
            <div className="relative z-10">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200 border border-slate-100 shadow-sm group">
                <Users size={40} strokeWidth={1} className="group-hover:scale-110 transition-transform" />
              </div>
              <p className="text-slate-400 font-black tracking-[0.3em] text-sm">Registry void</p>
              <p className="text-slate-300 font-bold text-xs mt-2 tracking-tight">Initiate personnel synchronization</p>
            </div>
          </motion.div>
        )}
      </div>

       {/* Add Modal */}
       <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-2xl"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h2 className="text-2xl font-black text-slate-900 tracking-widest font-sans"><span className="text-emerald-600">Draft</span> identity</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-10 space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="sm:col-span-2 space-y-3">
                    <label className="block text-[10px] font-black text-slate-400 tracking-[0.3em] ml-1">Entity name</label>
                    <input 
                      type="text" required
                      className="w-full px-4 py-4 bg-slate-50 border border-slate-400 rounded-lg focus:border-emerald-500 focus:bg-white outline-none text-foreground font-black transition-all placeholder:text-slate-300 text-base shadow-sm"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="block text-[10px] font-black text-slate-400 tracking-[0.3em] ml-1">Comm link</label>
                    <input 
                      type="tel"
                      placeholder="+ protocol id"
                      className="w-full px-4 py-4 bg-slate-50 border border-slate-400 rounded-lg focus:border-emerald-500 focus:bg-white outline-none text-foreground font-black transition-all placeholder:text-slate-300 text-base shadow-sm"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="block text-[10px] font-black text-slate-400 tracking-[0.3em] ml-1">Classification</label>
                    <div className="relative">
                      <select 
                        className="w-full px-4 py-4 bg-slate-50 border border-slate-400 rounded-lg focus:border-emerald-500 focus:bg-white outline-none text-foreground font-black transition-all appearance-none cursor-pointer text-base shadow-sm"
                        value={formData.type}
                        onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                      >
                        <option value="customer" className="bg-white text-slate-900">Tier a customer</option>
                        <option value="borrower" className="bg-white text-slate-900">Borrower entity</option>
                        <option value="lender" className="bg-white text-slate-900">Lender matrix</option>
                      </select>
                    </div>
                  </div>
                  <div className="sm:col-span-2 space-y-3">
                    <label className="block text-[10px] font-black text-slate-400 tracking-[0.3em] ml-1">Surface coords</label>
                    <input 
                      type="text"
                      className="w-full px-4 py-4 bg-slate-50 border border-slate-400 rounded-lg focus:border-emerald-500 focus:bg-white outline-none text-foreground font-black transition-all placeholder:text-slate-300 text-base shadow-sm"
                      placeholder="Geographical anchor"
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex gap-6 pt-6">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-6 bg-slate-50 text-slate-400 rounded-[2rem] font-black tracking-[0.2em] border border-slate-200 hover:bg-slate-100 transition-all text-xs">
                    Cancel
                  </button>
                  <button type="submit" disabled={loading} className="flex-1 py-6 bg-emerald-600 text-white rounded-[2rem] font-black tracking-[0.2em] shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 text-xs">
                    {loading ? <Loader2 className="animate-spin" size={22} /> : (
                      <>
                        <Users size={22} strokeWidth={3} />
                        Finalize sync
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
