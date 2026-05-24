import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Search, 
  Store, 
  User, 
  Phone, 
  MapPin, 
  Trash2, 
  Edit2, 
  PlusCircle, 
  TrendingDown, 
  LayoutDashboard,
  CreditCard,
  Building2,
  Calendar,
  Wallet,
  Receipt,
  HandCoins,
  History,
  X,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Filter
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { translations } from '../translations';
import { financeService } from '../services/financeService';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useBackButton } from '../components/BackButtonProvider';

const FloatingInput = ({ label, type = "text", value, onChange, required = false }: any) => {
  const [isFocused, setIsFocused] = useState(false);
  
  return (
    <div className="relative group/field w-full">
      <motion.label
        initial={false}
        animate={{
          y: (isFocused || value) ? -10 : 16,
          x: (isFocused || value) ? 12 : 20,
          scale: (isFocused || value) ? 0.8 : 1,
          backgroundColor: (isFocused || value) ? '#ffffff' : 'transparent',
          color: isFocused ? '#2563eb' : '#94a3b8'
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
        className="w-full px-4 py-4 bg-white border border-slate-400 rounded-lg outline-none font-black text-black transition-all focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 text-base shadow-sm"
      />
    </div>
  );
};

export default function CreditSystem() {
  const { profile, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { registerHandler } = useBackButton();
  const lang = profile?.language || 'en';
  const t = translations[lang as keyof typeof translations];

  const [shops, setShops] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [banks, setBanks] = useState<any[]>([]);
  const [onlineAccounts, setOnlineAccounts] = useState<any[]>([]);
  const [cashBalance, setCashBalance] = useState(0);

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [shopSearch, setShopSearch] = useState('');

  // Form States
  const [shopFormData, setShopFormData] = useState({
    shopName: '',
    shopkeeperName: '',
    mobileNumber: '',
    address: ''
  });

  const [purchaseFormData, setPurchaseFormData] = useState({
    shopId: '',
    date: new Date().toISOString().split('T')[0],
    amount: '',
    productDetails: ''
  });

  const [paymentFormData, setPaymentFormData] = useState({
    shopId: '',
    date: new Date().toISOString().split('T')[0],
    amount: '',
    note: '',
    method: 'Cash',
    accountId: '',
    otherMethod: 'Bkash'
  });

  const [editingShopId, setEditingShopId] = useState<string | null>(null);

  const [isDropdownPurchaseOpen, setIsDropdownPurchaseOpen] = useState(false);
  const [searchTermPurchase, setSearchTermPurchase] = useState('');
  const dropdownPurchaseRef = useRef<HTMLDivElement>(null);

  const [isDropdownPaymentOpen, setIsDropdownPaymentOpen] = useState(false);
  const [searchTermPayment, setSearchTermPayment] = useState('');
  const dropdownPaymentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownPurchaseRef.current && !dropdownPurchaseRef.current.contains(event.target as Node)) {
        setIsDropdownPurchaseOpen(false);
      }
      if (dropdownPaymentRef.current && !dropdownPaymentRef.current.contains(event.target as Node)) {
        setIsDropdownPaymentOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const filteredShopsPurchase = shops.filter(shop =>
    (shop.shopName || '').toLowerCase().includes(searchTermPurchase.toLowerCase()) ||
    (shop.shopkeeperName || '').toLowerCase().includes(searchTermPurchase.toLowerCase())
  );

  const filteredShopsPayment = shops.filter(shop =>
    (shop.shopName || '').toLowerCase().includes(searchTermPayment.toLowerCase()) ||
    (shop.shopkeeperName || '').toLowerCase().includes(searchTermPayment.toLowerCase())
  );

  useEffect(() => {
    if (!user) return;
    const unsubShops = financeService.subscribeToCollection('shops', user.uid, setShops);
    const unsubCredit = financeService.subscribeToCollection('creditTransactions', user.uid, setTransactions);
    const unsubBanks = financeService.subscribeToCollection('banks', user.uid, setBanks);
    const unsubOnline = financeService.subscribeToCollection('onlineAccounts', user.uid, setOnlineAccounts);
    const unsubCash = financeService.getCashBalance(user.uid, setCashBalance);

    return () => {
      unsubShops();
      unsubCredit();
      unsubBanks();
      unsubOnline();
      unsubCash();
    };
  }, [user]);

  const activeTab = 
    searchParams.get('addShop') ? 'add' :
    searchParams.get('purchase') ? 'purchase' :
    searchParams.get('payment') ? 'payment' :
    searchParams.get('list') ? 'list' : 
    searchParams.get('editShop') ? 'edit' : null;

  useEffect(() => {
    if (activeTab) {
      const unregister = registerHandler(() => {
        navigate('/?menu=true', { replace: true });
        return true;
      });
      return unregister;
    }
  }, [activeTab, registerHandler, navigate]);

  const handleShopSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!user) return;

    setLoading(true);
    try {
      if (activeTab === 'edit' && editingShopId) {
        await financeService.updateDoc('shops', editingShopId, shopFormData);
        setSuccessMessage('Shop Updated Successfully');
        // If editing, maybe go back to list
        setTimeout(() => setSearchParams({ list: 'true' }), 1500);
      } else {
        await financeService.addDoc('shops', {
          ...shopFormData,
          creditBalance: 0,
          userId: user.uid
        });
        setSuccessMessage('Shop Added Successfully');
        // Keep adding shops - don't clear or redirect, just show success
        setShopFormData({ shopName: '', shopkeeperName: '', mobileNumber: '', address: '' });
      }

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err: any) {
      setFormError(err.message || 'Error processing shop');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!user) return;

    if (!purchaseFormData.shopId) {
      setFormError('Please select a shop!');
      return;
    }

    const amount = Number(purchaseFormData.amount);
    if (!amount || amount <= 0) {
      setFormError('Please enter a valid amount!');
      return;
    }

    const selectedShop = shops.find(s => s.id === purchaseFormData.shopId);
    if (!selectedShop) return;

    setLoading(true);
    try {
      await financeService.addCreditTransaction({
        productName: purchaseFormData.productDetails || 'Credit Purchase',
        quantity: 1,
        price: amount,
        totalPrice: amount,
        paidAmount: 0,
        dueAmount: amount,
        customerName: selectedShop.shopName,
        type: 'purchase',
        date: purchaseFormData.date,
        notes: '',
        userId: user.uid
      });

      const currentBalance = selectedShop.creditBalance || 0;
      await financeService.updateDoc('shops', purchaseFormData.shopId, {
        creditBalance: currentBalance + amount
      });

      setPurchaseFormData({
        shopId: '',
        date: new Date().toISOString().split('T')[0],
        amount: '',
        productDetails: ''
      });
      setSuccessMessage('Transaction Saved Successfully');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err: any) {
      setFormError(err.message || 'Error saving purchase');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!user) return;

    if (!paymentFormData.shopId) {
      setFormError('Please select a shop!');
      return;
    }

    if (paymentFormData.method !== 'Cash' && !paymentFormData.accountId) {
      setFormError('Please select an account!');
      return;
    }

    const amount = Number(paymentFormData.amount);
    if (!amount || amount <= 0) {
      setFormError('Please enter a valid amount!');
      return;
    }

    const selectedShop = shops.find(s => s.id === paymentFormData.shopId);
    if (!selectedShop) return;

    if ((selectedShop.creditBalance || 0) < amount) {
      setFormError('Payment amount exceeds shop due balance!');
      return;
    }

    let availableMethodBalance = 0;
    if (paymentFormData.method === 'Cash') {
      availableMethodBalance = cashBalance;
    } else if (paymentFormData.method === 'Bank') {
      const selectedBank = banks.find(b => b.id === paymentFormData.accountId);
      availableMethodBalance = selectedBank?.currentBalance || 0;
    } else if (paymentFormData.method === 'Other') {
      const selectedOnline = onlineAccounts.find(o => o.id === paymentFormData.accountId);
      availableMethodBalance = selectedOnline?.balance || 0;
    }

    if (availableMethodBalance < amount) {
      setFormError('Insufficient balance in selected payment method!');
      return;
    }

    setLoading(true);
    try {
      await financeService.addCreditTransaction({
        productName: 'Supplier Payment',
        quantity: 1,
        price: 0,
        totalPrice: 0,
        paidAmount: amount,
        dueAmount: -amount,
        customerName: selectedShop.shopName,
        type: 'purchase',
        date: paymentFormData.date,
        notes: paymentFormData.note,
        method: paymentFormData.method === 'Other' ? paymentFormData.otherMethod : paymentFormData.method,
        accountId: paymentFormData.accountId,
        userId: user.uid
      });

      const currentBalance = selectedShop.creditBalance || 0;
      await financeService.updateDoc('shops', paymentFormData.shopId, {
        creditBalance: currentBalance - amount
      });

      let method = 'Bank';
      if (paymentFormData.method === 'Cash') method = 'Cash';
      else if (paymentFormData.method === 'Other') method = 'Other';

      await financeService.updateBalance(
        user.uid,
        method,
        paymentFormData.accountId || null,
        -amount
      );

      setPaymentFormData({
        shopId: '',
        date: new Date().toISOString().split('T')[0],
        amount: '',
        note: '',
        method: 'Cash',
        accountId: '',
        otherMethod: 'Bkash'
      });
      setSuccessMessage('Transaction Saved Successfully');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err: any) {
      setFormError(err.message || 'Error saving payment');
    } finally {
      setLoading(false);
    }
  };

  const handleEditShop = (shop: any) => {
    setEditingShopId(shop.id);
    setShopFormData({
      shopName: shop.shopName,
      shopkeeperName: shop.shopkeeperName,
      mobileNumber: shop.mobileNumber,
      address: shop.address || ''
    });
    setSearchParams({ editShop: 'true' });
  };

  const handleDeleteShop = async (shopId: string) => {
    if (confirm('Are you sure you want to delete this shop? All history will be kept.')) {
      try {
        await financeService.deleteDoc('shops', shopId);
      } catch (err) {
        alert('Error deleting shop');
      }
    }
  };

  const filteredShops = shops.filter(s => 
    s.shopName.toLowerCase().includes(shopSearch.toLowerCase()) ||
    s.shopkeeperName.toLowerCase().includes(shopSearch.toLowerCase())
  );

  return (
    <div className="relative w-full h-[calc(100vh-64px)] lg:h-screen overflow-hidden bg-white">
      {/* Container for animated transitions */}
      <AnimatePresence mode="wait">
        
        {!activeTab && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-slate-300">
             <Store size={64} strokeWidth={1} className="mb-4 opacity-20" />
             <p className="font-bold tracking-[0.2em] text-sm">Select an option from the menu</p>
          </div>
        )}

        {/* ADD SHOP / EDIT SHOP VIEW */}
        {(activeTab === 'add' || activeTab === 'edit') && (
          <motion.div 
            key="add-shop"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 overflow-y-auto px-6 pt-10 pb-40 bg-white"
          >
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col items-center justify-center text-center mb-8 px-4">
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
                  {activeTab === 'edit' ? 'Update supplier' : 'Add new supplier'}
                </h2>
              </div>

              <form onSubmit={handleShopSubmit} className="space-y-8 group">
                {formError && <p className="text-rose-500 font-bold text-center bg-rose-50 p-4 rounded-xl">{formError}</p>}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FloatingInput label="Shop Name" value={shopFormData.shopName} onChange={(val: string) => setShopFormData(prev => ({ ...prev, shopName: val }))} required />
                  <FloatingInput label="Shopkeeper Name" value={shopFormData.shopkeeperName} onChange={(val: string) => setShopFormData(prev => ({ ...prev, shopkeeperName: val }))} required />
                  <FloatingInput label="Mobile Number" type="number" value={shopFormData.mobileNumber} onChange={(val: string) => setShopFormData(prev => ({ ...prev, mobileNumber: val }))} required />
                  <div className="md:col-span-2">
                    <FloatingInput label="Address" value={shopFormData.address} onChange={(val: string) => setShopFormData(prev => ({ ...prev, address: val }))} required />
                  </div>
                </div>

                <div className="pt-4">
                  {formError && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mb-4 px-6 py-3 bg-rose-50 text-rose-500 rounded-xl font-bold text-sm border-2 border-rose-100 text-center"
                    >
                      {formError}
                    </motion.div>
                  )}
                  <motion.button 
                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    type="submit" disabled={loading} 
                    className="w-full py-4 bg-slate-900 text-white rounded-xl font-black text-lg hover:bg-black transition-all flex items-center justify-center gap-4"
                  >
                    {loading ? <Loader2 className="animate-spin" size={24} /> : <><Plus size={24} strokeWidth={3} /> {activeTab === 'edit' ? 'Update Info' : 'Save Supplier'}</>}
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {/* PURCHASE VIEW */}
        {activeTab === 'purchase' && (
          <motion.div 
            key="purchase"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 overflow-y-auto px-6 pt-10 pb-40 bg-white"
          >
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col items-center justify-center text-center mb-8 px-4">
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
                  Credit purchase
                </h2>
              </div>

              <form onSubmit={handlePurchaseSubmit} className="space-y-8 text-left">
                {formError && <p className="text-rose-500 font-bold text-center bg-rose-50 p-4 rounded-xl">{formError}</p>}
                
                <div className="relative" ref={dropdownPurchaseRef}>
                  <label className="absolute -top-2.5 left-4 px-2 bg-white text-blue-600 font-bold text-xs z-15 tracking-widest transition-colors group-focus-within:text-indigo-600">
                    Select shop to record purchase
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsDropdownPurchaseOpen(!isDropdownPurchaseOpen)}
                    className="w-full flex items-center justify-between px-4 py-4 bg-white border border-slate-400 rounded-lg outline-none font-black text-black transition-all focus:ring-4 focus:ring-indigo-50 text-base text-left shadow-sm hover:border-slate-500"
                  >
                    <span className="font-bold text-[15px] text-[#000000]">
                      {purchaseFormData.shopId ? (
                        (() => {
                          const shop = shops.find(s => s.id === purchaseFormData.shopId);
                          return shop ? `${shop.shopName} (${shop.shopkeeperName})` : 'Choose Supplier';
                        })()
                      ) : 'Choose Supplier'}
                    </span>
                    <span className="text-slate-400 text-xs ml-2 select-none">▼</span>
                  </button>

                  {isDropdownPurchaseOpen && (
                    <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-300 rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-100">
                      {/* Search Box */}
                      <div className="px-4 py-2.5 bg-slate-50">
                        <input
                          type="text"
                          value={searchTermPurchase}
                          onChange={(e) => setSearchTermPurchase(e.target.value)}
                          placeholder="Search Supplier"
                          className="w-full bg-transparent border-0 outline-none text-slate-800 placeholder-slate-400 font-bold text-[14px] py-1"
                        />
                      </div>
                      
                      {/* Scrollable List */}
                      <div className="max-h-60 overflow-y-auto">
                        {filteredShopsPurchase.length === 0 ? (
                          <div className="px-4 py-3 text-sm text-slate-400 italic">No supplier found</div>
                        ) : (
                          filteredShopsPurchase.map(shop => (
                            <button
                              key={shop.id}
                              type="button"
                              onClick={() => {
                                setPurchaseFormData(prev => ({ ...prev, shopId: shop.id }));
                                setIsDropdownPurchaseOpen(false);
                                setSearchTermPurchase('');
                              }}
                              className="w-full px-4 py-2.5 text-left font-bold text-[14px] hover:bg-slate-100 text-black transition-colors border-b border-slate-100 last:border-0 flex items-center justify-between"
                            >
                              <span>{shop.shopName} ({shop.shopkeeperName})</span>
                              {shop.mobileNumber && (
                                <span className="text-xs text-slate-400 font-normal">
                                  {shop.mobileNumber}
                                </span>
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FloatingInput label="Date" type="date" value={purchaseFormData.date} onChange={(val: string) => setPurchaseFormData(prev => ({ ...prev, date: val }))} required />
                  <FloatingInput label="Purchase Amount" type="number" value={purchaseFormData.amount} onChange={(val: string) => setPurchaseFormData(prev => ({ ...prev, amount: val }))} required />
                  <div className="md:col-span-2">
                    <FloatingInput label="Product Description" value={purchaseFormData.productDetails} onChange={(val: string) => setPurchaseFormData(prev => ({ ...prev, productDetails: val }))} required />
                  </div>
                </div>

                <div className="pt-4">
                  {formError && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mb-4 px-6 py-3 bg-rose-50 text-rose-500 rounded-xl font-bold text-sm border-2 border-rose-100 text-center"
                    >
                      {formError}
                    </motion.div>
                  )}
                  <motion.button 
                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    type="submit" disabled={loading} 
                    className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-4"
                  >
                    {loading ? <Loader2 className="animate-spin" size={24} /> : <><Receipt size={24} strokeWidth={3} /> Save Purchase</>}
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {/* PAYMENT VIEW */}
        {activeTab === 'payment' && (
          <motion.div 
            key="payment"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 overflow-y-auto px-6 pt-10 pb-40 bg-white"
          >
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col items-center justify-center text-center mb-8 px-4">
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
                  Supplier payment
                </h2>
              </div>

              <form onSubmit={handlePaymentSubmit} className="space-y-10 text-left">
                {formError && <p className="text-rose-500 font-bold text-center bg-rose-50 p-4 rounded-xl">{formError}</p>}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="relative group md:col-span-2">
                    <label className="absolute -top-2.5 left-4 px-2 bg-white font-bold text-xs text-slate-400 tracking-widest z-10 transition-colors group-focus-within:text-blue-600 uppercase">Payment mode</label>
                    <select
                      required
                      value={paymentFormData.method}
                      onChange={(e) => setPaymentFormData(prev => ({ ...prev, method: e.target.value, accountId: '', otherMethod: 'Bkash' }))}
                      className="w-full px-4 py-4 bg-white border border-slate-400 rounded-lg outline-none font-black text-black appearance-none cursor-pointer text-base shadow-sm focus:ring-4 focus:ring-slate-100"
                    >
                      <option value="Cash">Cash</option>
                      <option value="Bank">Bank</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {paymentFormData.method === 'Bank' && (
                    <div className="relative group md:col-span-2">
                      <label className="absolute -top-2.5 left-4 px-2 bg-white font-bold text-xs text-slate-400 tracking-widest z-10 transition-colors group-focus-within:text-blue-600 uppercase">Select bank account</label>
                      <select
                        required
                        value={paymentFormData.accountId}
                        onChange={(e) => setPaymentFormData(prev => ({ ...prev, accountId: e.target.value }))}
                        className="w-full px-4 py-4 bg-white border border-slate-400 rounded-lg outline-none font-black text-black appearance-none cursor-pointer text-base shadow-sm focus:ring-4 focus:ring-slate-100"
                      >
                        <option value="">Choose Account</option>
                        {banks.map(b => (
                          <option key={b.id} value={b.id}>{b.bankName} - {b.accountNumber}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {paymentFormData.method === 'Other' && (
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="relative group">
                        <label className="absolute -top-2.5 left-4 px-2 bg-white font-bold text-xs text-slate-400 tracking-widest z-10 transition-colors group-focus-within:text-blue-600 uppercase">Platform</label>
                        <select
                          required
                          value={paymentFormData.otherMethod}
                          onChange={(e) => setPaymentFormData(prev => ({ ...prev, otherMethod: e.target.value, accountId: '' }))}
                          className="w-full px-4 py-4 bg-white border border-slate-400 rounded-lg outline-none font-black text-black appearance-none cursor-pointer text-base shadow-sm focus:ring-4 focus:ring-slate-100"
                        >
                          {['Bkash', 'Nagad', 'Rocket', 'Upay', 'Other'].map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                      <div className="relative group">
                        <label className="absolute -top-2.5 left-4 px-2 bg-white font-bold text-xs text-slate-400 tracking-widest z-10 transition-colors group-focus-within:text-blue-600 uppercase">Select account</label>
                        <select
                          required
                          value={paymentFormData.accountId}
                          onChange={(e) => setPaymentFormData(prev => ({ ...prev, accountId: e.target.value }))}
                          className="w-full px-4 py-4 bg-white border border-slate-400 rounded-lg outline-none font-black text-black appearance-none cursor-pointer text-base shadow-sm focus:ring-4 focus:ring-slate-100"
                        >
                          <option value="">Choose Account</option>
                          {onlineAccounts.filter(o => (o.method || o.platform) === paymentFormData.otherMethod).map(o => (
                            <option key={o.id} value={o.id}>{o.accountName || o.method || o.platform} ({o.accountNumber})</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="md:col-span-2 relative" ref={dropdownPaymentRef}>
                    <label className="absolute -top-2.5 left-4 px-2 bg-white font-bold text-xs text-slate-400 tracking-widest z-15 transition-colors group-focus-within:text-blue-600 uppercase">Select supplier to pay</label>
                    <button
                      type="button"
                      onClick={() => setIsDropdownPaymentOpen(!isDropdownPaymentOpen)}
                      className="w-full flex items-center justify-between px-4 py-4 bg-white border border-slate-400 rounded-lg outline-none font-black text-black transition-all focus:ring-4 focus:ring-slate-100 text-base text-left shadow-sm hover:border-slate-500"
                    >
                      <span className="font-bold text-[15px] text-[#000000]">
                        {paymentFormData.shopId ? (
                          (() => {
                            const shop = shops.find(s => s.id === paymentFormData.shopId);
                            return shop ? `${shop.shopName} (${shop.shopkeeperName}) - Due: ${(shop.creditBalance || 0).toLocaleString('en-IN')}` : 'Choose Supplier';
                          })()
                        ) : 'Choose Supplier'}
                      </span>
                      <span className="text-slate-400 text-xs ml-2 select-none">▼</span>
                    </button>

                    {isDropdownPaymentOpen && (
                      <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-300 rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-100">
                        {/* Search Box */}
                        <div className="px-4 py-2.5 bg-slate-50">
                          <input
                            type="text"
                            value={searchTermPayment}
                            onChange={(e) => setSearchTermPayment(e.target.value)}
                            placeholder="Search Supplier"
                            className="w-full bg-transparent border-0 outline-none text-slate-800 placeholder-slate-400 font-bold text-[14px] py-1"
                          />
                        </div>
                        
                        {/* Scrollable List */}
                        <div className="max-h-60 overflow-y-auto">
                          {filteredShopsPayment.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-slate-400 italic">No supplier found</div>
                          ) : (
                            filteredShopsPayment.map(shop => (
                              <button
                                key={shop.id}
                                type="button"
                                onClick={() => {
                                  setPaymentFormData(prev => ({ ...prev, shopId: shop.id }));
                                  setIsDropdownPaymentOpen(false);
                                  setSearchTermPayment('');
                                }}
                                className="w-full px-4 py-2.5 text-left font-bold text-[14px] hover:bg-slate-100 text-black transition-colors border-b border-slate-100 last:border-0 flex items-center justify-between"
                              >
                                <span>{shop.shopName} ({shop.shopkeeperName})</span>
                                <span className="text-xs font-bold text-rose-600">
                                  Due: {(shop.creditBalance || 0).toLocaleString('en-IN')}
                                </span>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <FloatingInput label="Payment Date" type="date" value={paymentFormData.date} onChange={(val: string) => setPaymentFormData(prev => ({ ...prev, date: val }))} required />
                  <FloatingInput label="Amount to Pay" type="number" value={paymentFormData.amount} onChange={(val: string) => setPaymentFormData(prev => ({ ...prev, amount: val }))} required />
                  <div className="md:col-span-2">
                    <FloatingInput label="Note / Reference" value={paymentFormData.note} onChange={(val: string) => setPaymentFormData(prev => ({ ...prev, note: val }))} />
                  </div>
                </div>

                <div className="pt-4">
                  {formError && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mb-4 px-6 py-3 bg-rose-50 text-rose-500 rounded-xl font-bold text-sm border-2 border-rose-100 text-center"
                    >
                      {formError}
                    </motion.div>
                  )}
                  <motion.button 
                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    type="submit" disabled={loading} 
                    className="w-full py-4 bg-emerald-600 text-white rounded-xl font-black text-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-4"
                  >
                    {loading ? <Loader2 className="animate-spin" size={24} /> : <><HandCoins size={24} strokeWidth={3} /> Confirm Payment</>}
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {/* LIST VIEW */}
        {activeTab === 'list' && (
          <motion.div 
            key="list"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col pt-8 bg-white"
          >
              <div className="flex flex-col items-center justify-center mb-10 text-center">
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
                  All shop list
                </h2>
                <p className="text-slate-400 font-bold mt-2 tracking-widest font-mono text-[10px]">Managing {shops.length} business partners</p>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div className="flex items-center gap-4 w-full justify-center">
                  <div className="relative group/search w-full md:w-80">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black group-focus-within/search:text-blue-500 transition-colors" />
                    <input 
                      type="text" 
                      placeholder="Search supplier..."
                      value={shopSearch}
                      onChange={(e) => setShopSearch(e.target.value)}
                      className="w-full pl-12 pr-4 py-2 bg-white border border-slate-400 rounded-lg outline-none font-bold text-black transition-all focus:border-blue-500 text-base"
                    />
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-x-auto">
                <table className="w-full border-collapse border border-slate-400">
                   <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-slate-400 px-4 py-4 text-center text-xs font-black text-slate-900 uppercase tracking-wider">SL</th>
                      <th className="border border-slate-400 px-6 py-4 text-center text-xs font-black text-slate-900 uppercase tracking-wider">Shop Name</th>
                      <th className="border border-slate-400 px-6 py-4 text-center text-xs font-black text-slate-900 uppercase tracking-wider">Owner</th>
                      <th className="border border-slate-400 px-6 py-4 text-center text-xs font-black text-slate-900 uppercase tracking-wider">Mobile</th>
                      <th className="border border-slate-400 px-6 py-4 text-center text-xs font-black text-slate-900 uppercase tracking-wider">Due Balance</th>
                      <th className="border border-slate-400 px-6 py-4 text-center text-xs font-black text-slate-900 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {filteredShops.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="border border-slate-400 px-4 py-10 text-center text-slate-400 font-bold italic">
                          No suppliers found in your list
                        </td>
                      </tr>
                    ) : (
                      filteredShops.map((shop, idx) => (
                        <tr key={shop.id} className="hover:bg-slate-50 transition-colors">
                          <td className="border border-slate-400 px-4 py-2 text-center font-bold text-black text-sm">{idx + 1}</td>
                          <td className="border border-slate-400 px-6 py-2 truncate text-left font-black text-black text-sm uppercase">{shop.shopName}</td>
                          <td className="border border-slate-400 px-6 py-2 truncate text-left font-bold text-slate-600 text-sm uppercase">{shop.shopkeeperName}</td>
                          <td className="border border-slate-400 px-6 py-2 truncate text-left font-mono font-medium text-indigo-600 text-sm">{shop.mobileNumber}</td>
                          <td className={cn(
                            "border border-slate-400 px-6 py-2 text-center font-black text-sm whitespace-nowrap",
                            (shop.creditBalance || 0) > 0 ? "text-rose-700" : "text-emerald-700"
                          )}>
                             {(shop.creditBalance || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="border border-slate-400 px-6 py-2 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button 
                                onClick={() => {
                                  setShopFormData({
                                    shopName: shop.shopName,
                                    shopkeeperName: shop.shopkeeperName,
                                    mobileNumber: shop.mobileNumber,
                                    address: shop.address || ''
                                  });
                                  setSearchParams({ editShop: 'true', id: shop.id });
                                }}
                                className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all font-bold text-xs border border-blue-100"
                              >
                                Edit
                              </button>
                              <button 
                                onClick={() => handleDeleteShop(shop.id)}
                                className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-all font-bold text-xs border border-rose-100"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] px-8 py-3 bg-slate-900 text-white rounded-full shadow-2xl flex items-center gap-3 border border-white/10 whitespace-nowrap"
          >
            <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white shrink-0"><Receipt size={14} /></div>
            <span className="font-bold text-sm leading-none">{successMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


