import React, { useEffect, useState } from 'react';
import { TrendingDown, Plus, Search, Filter, Trash2, Edit3, X, Loader2, Wallet, Building2, Globe, Calendar, Tag, FileText, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { translations } from '../translations';
import { financeService } from '../services/financeService';
import { Expense, BankAccount, Category } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

export default function ExpensePage() {
  const { profile, user } = useAuth();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [onlineAccounts, setOnlineAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cashBalance, setCashBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    paymentMethod: 'Cash',
    accountId: '',
    otherMethod: 'Bkash',
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    note: ''
  });

  const lang = profile?.language || 'en';
  const t = translations[lang as keyof typeof translations];

  useEffect(() => {
    if (!user) return;
    const unsubExpenses = financeService.subscribeToCollection('expenses', user.uid, setExpenses);
    const unsubBanks = financeService.subscribeToCollection('banks', user.uid, setBanks);
    const unsubOnline = financeService.subscribeToCollection('onlineAccounts', user.uid, setOnlineAccounts);
    const unsubCats = financeService.subscribeToCollection('categories', user.uid, (data) => {
      setCategories(data.filter(c => c.type === 'expense'));
    });
    const unsubCash = financeService.getCashBalance(user.uid, setCashBalance);

    return () => {
      unsubExpenses();
      unsubBanks();
      unsubOnline();
      unsubCats();
      unsubCash();
    };
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || loading) return;
    
    setFormError(null);

    if (formData.paymentMethod === 'Bank' && !formData.accountId) {
      setFormError('Please select a Bank account!');
      return;
    }

    if (formData.paymentMethod === 'Other' && !formData.accountId) {
      setFormError('Please select an Online account!');
      return;
    }

    const amount = Number(formData.amount);
    if (!amount || amount <= 0) {
      setFormError('Please enter a valid amount!');
      return;
    }

    if (selectedAccountBalance() < amount) {
      setFormError('Insufficient balance in selected account!');
      return;
    }
    
    setLoading(true);
    try {
      let finalAccountId = null;
      if (formData.paymentMethod === 'Bank') finalAccountId = formData.accountId;
      if (formData.paymentMethod === 'Other') finalAccountId = formData.accountId;

      await financeService.addExpense({
        amount: Number(formData.amount),
        paymentMethod: formData.paymentMethod,
        accountId: finalAccountId,
        otherMethod: formData.paymentMethod === 'Other' ? formData.otherMethod : null,
        category: formData.category,
        date: formData.date,
        note: formData.note,
        userId: user.uid
      });
      
      setFormData({ 
        paymentMethod: 'Cash', 
        accountId: '', 
        otherMethod: 'Bkash',
        amount: '', 
        category: '', 
        date: new Date().toISOString().split('T')[0], 
        note: '' 
      });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || 'Error: Failed to save transaction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedAccountBalance = () => {
    if (formData.paymentMethod === 'Cash') return cashBalance;
    if (formData.paymentMethod === 'Bank') {
      const bank = banks.find(b => b.id === formData.accountId);
      return bank?.currentBalance || 0;
    }
    if (formData.paymentMethod === 'Other') {
      const acc = onlineAccounts.find(a => a.id === formData.accountId);
      return acc?.balance || 0;
    }
    return 0;
  };

  return (
    <div className="w-full pb-24 px-4 sm:px-10 lg:px-16">
      {/* Header */}
      <div className="mb-8">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-2"
        >
          <div className="p-2.5 bg-rose-500/10 text-rose-500 rounded-xl">
            <TrendingDown size={24} strokeWidth={3} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Create Expense</h1>
            <p className="text-slate-400 font-bold text-[10px]">Module: Cash Transaction</p>
          </div>
        </motion.div>
      </div>

      <div className="w-full">
        {/* Form Section */}
        <div className="w-full">
          <form onSubmit={handleSubmit} className="space-y-8 relative">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-12 gap-y-10 relative z-10">
              {/* Left Column: Source & Protocol */}
              <div className="space-y-10">
                {/* Payment Method Selection */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-500 ml-1">
                    <Wallet size={14} />
                    Payment Method
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    {['Cash', 'Bank', 'Other'].map(method => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, paymentMethod: method, accountId: '' }))}
                        className={cn(
                          "py-5 px-4 rounded-xl font-black text-sm transition-all border-2 flex flex-col items-center gap-2",
                          formData.paymentMethod === method 
                            ? "bg-rose-500 border-rose-400 text-white shadow-lg shadow-rose-100 scale-[1.02]" 
                            : "bg-white border-slate-100 text-slate-400 hover:bg-slate-50 hover:border-slate-200"
                        )}
                      >
                        {method === 'Cash' && <Wallet size={20} />}
                        {method === 'Bank' && <Building2 size={20} />}
                        {method === 'Other' && <Globe size={20} />}
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dynamic Fields based on Payment Method */}
                <div className="space-y-10 min-h-[100px]">
                  {formData.paymentMethod === 'Bank' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative group">
                      <label className="absolute -top-2.5 left-4 px-2 bg-white text-slate-400 font-bold text-xs z-10 transition-colors group-focus-within:text-rose-500">
                        Select Bank
                      </label>
                      <select 
                        required
                        className="w-full px-4 py-4 bg-white border border-slate-400 rounded-lg focus:border-rose-500 outline-none text-black font-black transition-all appearance-none cursor-pointer text-base font-sans"
                        value={formData.accountId}
                        onChange={(e) => setFormData(prev => ({ ...prev, accountId: e.target.value }))}
                      >
                        <option value="">Select Bank</option>
                        {banks.map(bank => (
                          <option key={bank.id} value={bank.id}>
                            {bank.accountName} ({bank.accountNumber})
                          </option>
                        ))}
                      </select>
                    </motion.div>
                  )}

                  {formData.paymentMethod === 'Other' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 p-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem]">
                      <div className="relative group">
                        <label className="absolute -top-2.5 left-4 px-2 bg-white text-slate-400 font-bold text-xs z-10 transition-colors group-focus-within:text-rose-500">
                          Platform
                        </label>
                        <select 
                          required
                          className="w-full px-4 py-4 bg-white border border-slate-400 rounded-lg focus:border-rose-500 outline-none text-black font-black transition-all appearance-none cursor-pointer text-base font-sans shadow-sm"
                          value={formData.otherMethod}
                          onChange={(e) => setFormData(prev => ({ ...prev, otherMethod: e.target.value, accountId: '' }))}
                        >
                          <option value="">Select Platform</option>
                          <option value="Bkash">Bkash</option>
                          <option value="Nagad">Nagad</option>
                          <option value="Rocket">Rocket</option>
                          <option value="Upay">Upay</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="relative group">
                        <label className="absolute -top-2.5 left-4 px-2 bg-white text-slate-400 font-bold text-xs z-10 transition-colors group-focus-within:text-rose-500">
                          Select Account
                        </label>
                        <select 
                          required
                          className="w-full px-4 py-4 bg-white border border-slate-400 rounded-lg focus:border-rose-500 outline-none text-black font-black transition-all appearance-none cursor-pointer text-base font-sans shadow-sm"
                          value={formData.accountId}
                          onChange={(e) => setFormData(prev => ({ ...prev, accountId: e.target.value }))}
                        >
                          <option value="">Choose Account</option>
                          {onlineAccounts
                            .filter(a => !formData.otherMethod || a.platform === formData.otherMethod || a.method === formData.otherMethod)
                            .map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.accountName || acc.platform} ({acc.accountNumber})</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {(formData.paymentMethod === 'Cash' || formData.accountId) && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-6 bg-rose-50 border-2 border-rose-100 rounded-3xl flex items-center justify-between shadow-sm relative overflow-hidden group"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/[0.05] blur-3xl -mr-16 -mt-16 group-hover:bg-rose-500/[0.08] transition-colors" />
                      <div className="space-y-1 relative z-10">
                        <p className="text-[11px] font-bold text-rose-600">Current Balance</p>
                        <p className="text-3xl font-black text-slate-900 tracking-tighter">
                          {selectedAccountBalance().toLocaleString()}
                        </p>
                      </div>
                      <div className="p-3 bg-white/50 text-rose-600 rounded-xl border border-rose-100/50 relative z-10 shadow-sm">
                        <TrendingDown size={24} />
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Right Column: Transaction Details */}
              <div className="space-y-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 relative z-10">
                  <FloatingInput 
                    label="Date" 
                    type="date"
                    value={formData.date} 
                    onChange={(val) => setFormData(prev => ({ ...prev, date: val }))}
                    required
                  />

                  <div className="relative group">
                    <label className="absolute -top-2.5 left-4 px-2 bg-white text-slate-400 font-bold text-xs z-10 transition-colors group-focus-within:text-rose-500">
                      Category
                    </label>
                    <select 
                      required
                      className="w-full px-4 py-4 bg-white border border-slate-400 rounded-lg focus:border-rose-500 outline-none text-black font-black transition-all appearance-none cursor-pointer text-base font-sans shadow-sm"
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                    </select>
                  </div>

                  <FloatingInput 
                    label="Amount" 
                    type="number"
                    value={formData.amount} 
                    onChange={(val) => setFormData(prev => ({ ...prev, amount: val }))}
                    required
                  />

                  <FloatingInput 
                    label="Note" 
                    value={formData.note} 
                    onChange={(val) => setFormData(prev => ({ ...prev, note: val }))}
                  />
                </div>

                <div className="pt-4 relative z-10">
                  {formError && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mb-4 px-6 py-3 bg-rose-50 text-rose-500 rounded-xl font-bold text-sm border-2 border-rose-100 text-center"
                    >
                      {formError}
                    </motion.div>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all flex items-center justify-center gap-3 text-sm active:scale-[0.98] disabled:opacity-50 whitespace-nowrap"
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : (
                      <>
                        <TrendingDown size={20} strokeWidth={2.5} />
                        Save Transaction
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Success Notification */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] px-8 py-4 bg-white text-emerald-600 rounded-2xl shadow-2xl flex items-center gap-4 border-2 border-emerald-100 min-w-[320px] justify-center"
          >
            <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white shrink-0">
              <CheckCircle2 size={18} strokeWidth={3} />
            </div>
            <span className="font-black text-lg tracking-tight whitespace-nowrap">
              Transaction Saved Successfully
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FloatingInput({ label, value, onChange, type = "text", required = false }: any) {
  const [isFocused, setIsFocused] = useState(false);
  
  return (
    <div className="relative group w-full">
      <motion.label
        initial={false}
        animate={{
          y: (isFocused || value) ? -10 : 16,
          x: (isFocused || value) ? 12 : 20,
          scale: (isFocused || value) ? 0.8 : 1,
          backgroundColor: (isFocused || value) ? '#ffffff' : 'transparent',
          color: isFocused ? '#e11d48' : '#64748b'
        }}
        className="absolute pointer-events-none z-10 px-2 font-black text-xs tracking-widest whitespace-nowrap"
      >
        {label}
      </motion.label>
      <input
        type={type}
        required={required}
        value={value}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-4 bg-white border border-slate-400 rounded-lg outline-none font-black text-black transition-all focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 text-base shadow-sm placeholder:text-slate-300"
      />
    </div>
  );
}
