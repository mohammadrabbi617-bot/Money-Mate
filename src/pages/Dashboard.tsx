import React, { useEffect, useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Building2, 
  HandCoins, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  Eye,
  EyeOff,
  Building,
  Smartphone,
  ChevronDown,
  ChevronUp,
  List,
  Lock,
  Calendar,
  Layers,
  Sparkles,
  X
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { translations } from '../translations';
import { financeService } from '../services/financeService';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { useBackButton } from '../components/BackButtonProvider';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

export default function Dashboard() {
  const { profile, user } = useAuth();
  const { registerHandler } = useBackButton();
  
  // Real-time state arrays
  const [banks, setBanks] = useState<any[]>([]);
  const [onlineAccounts, setOnlineAccounts] = useState<any[]>([]);
  const [cashBalance, setCashBalance] = useState<number>(0);
  
  // Existing summary/charts state stats
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpense: 0,
    recentTransactions: [] as any[]
  });

  const lang = profile?.language || 'en';
  const isBn = lang === 'bn';
  const t = translations[lang as keyof typeof translations];

  // Digital clock state update every 1s
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // Format localized clock strings
  const formattedTime = useMemo(() => {
    return currentTime.toLocaleTimeString(isBn ? 'bn-BD' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  }, [currentTime, isBn]);

  const formattedDate = useMemo(() => {
    return currentTime.toLocaleDateString(isBn ? 'bn-BD' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, [currentTime, isBn]);

  const greeting = useMemo(() => {
    const hour = currentTime.getHours();
    if (hour >= 5 && hour < 12) {
      return isBn ? 'শুভ সকাল' : 'Good Morning';
    } else if (hour >= 12 && hour < 17) {
      return isBn ? 'শুভ দুপুর' : 'Good Afternoon';
    } else if (hour >= 17 && hour < 20) {
      return isBn ? 'শুভ সন্ধ্যা' : 'Good Evening';
    } else {
      return isBn ? 'শুভ রাত্রি' : 'Good Night';
    }
  }, [currentTime, isBn]);

  // Hide/Show balance parameters with 4 Seconds countdown
  const [showCash, setShowCash] = useState(false);
  const [showBank, setShowBank] = useState(false);
  const [showOthers, setShowOthers] = useState(false);

  const [cashTimer, setCashTimer] = useState(0);
  const [bankTimer, setBankTimer] = useState(0);
  const [othersTimer, setOthersTimer] = useState(0);

  // 1. Cash countdown timer loop
  useEffect(() => {
    if (cashTimer > 0 && showCash) {
      const timer = setTimeout(() => {
        setCashTimer(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (cashTimer === 0 && showCash) {
      setShowCash(false);
    }
  }, [cashTimer, showCash]);

  // 2. Bank countdown timer loop
  useEffect(() => {
    if (bankTimer > 0 && showBank) {
      const timer = setTimeout(() => {
        setBankTimer(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (bankTimer === 0 && showBank) {
      setShowBank(false);
    }
  }, [bankTimer, showBank]);

  // 3. Others countdown timer loop
  useEffect(() => {
    if (othersTimer > 0 && showOthers) {
      const timer = setTimeout(() => {
        setOthersTimer(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (othersTimer === 0 && showOthers) {
      setShowOthers(false);
    }
  }, [othersTimer, showOthers]);

  // Specific lists expand collapse flags
  const [expandBanks, setExpandBanks] = useState(false);
  const [expandOthers, setExpandOthers] = useState(false);

  useEffect(() => {
    if (expandBanks) {
      const unsub = registerHandler(() => {
        setExpandBanks(false);
        return true;
      });
      return unsub;
    }
  }, [expandBanks, registerHandler]);

  useEffect(() => {
    if (expandOthers) {
      const unsub = registerHandler(() => {
        setExpandOthers(false);
        return true;
      });
      return unsub;
    }
  }, [expandOthers, registerHandler]);

  // Selected Mobile Services Platform Dropdown filter
  const [selectedMfsPlatform, setSelectedMfsPlatform] = useState<'Bkash' | 'Nagad' | 'Rocket' | 'Upay'>('Bkash');

  // Trigger utilities
  const handleToggleCash = () => {
    if (showCash) {
      setShowCash(false);
      setCashTimer(0);
    } else {
      setShowCash(true);
      setCashTimer(4);
    }
  };

  const handleToggleBank = () => {
    if (showBank) {
      setShowBank(false);
      setBankTimer(0);
    } else {
      setShowBank(true);
      setBankTimer(4);
    }
  };

  const handleToggleOthers = () => {
    if (showOthers) {
      setShowOthers(false);
      setOthersTimer(0);
    } else {
      setShowOthers(true);
      setOthersTimer(4);
    }
  };

  // Real-time Firestore synchronization
  useEffect(() => {
    if (!user) return;

    const unsubIncomes = financeService.subscribeToCollection('incomes', user.uid, (data) => {
      const total = data.reduce((acc, curr) => acc + curr.amount, 0);
      setStats(prev => {
        const withIncomes = [...data.map(d => ({ ...d, type: 'income' })), ...prev.recentTransactions.filter(t => t.type === 'expense')];
        const sorted = withIncomes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return { ...prev, totalIncome: total, recentTransactions: sorted };
      });
    });

    const unsubExpenses = financeService.subscribeToCollection('expenses', user.uid, (data) => {
      const total = data.reduce((acc, curr) => acc + curr.amount, 0);
      setStats(prev => {
        const withExpenses = [...data.map(d => ({ ...d, type: 'expense' })), ...prev.recentTransactions.filter(t => t.type === 'income')];
        const sorted = withExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return { ...prev, totalExpense: total, recentTransactions: sorted };
      });
    });

    const unsubBanks = financeService.subscribeToCollection('banks', user.uid, (data) => {
      setBanks(data);
    });

    const unsubOnline = financeService.subscribeToCollection('onlineAccounts', user.uid, (data) => {
      setOnlineAccounts(data);
    });

    const unsubCash = financeService.getCashBalance(user.uid, (balance) => {
      setCashBalance(balance);
    });

    return () => {
      unsubIncomes();
      unsubExpenses();
      unsubBanks();
      unsubOnline();
      unsubCash();
    };
  }, [user]);

  // Aggregate values
  const totalBankBalance = useMemo(() => {
    return banks.reduce((sum, item) => sum + (Number(item.currentBalance) || 0), 0);
  }, [banks]);

  const totalOthersBalance = useMemo(() => {
    const platformList = ['Bkash', 'Nagad', 'Rocket', 'Upay'];
    return onlineAccounts
      .filter(item => platformList.includes(item.platform))
      .reduce((sum, item) => sum + (Number(item.balance) || 0), 0);
  }, [onlineAccounts]);

  // Static mockup chart summary
  const chartData = [
    { name: isBn ? 'জানু' : 'Jan', income: 4000, expense: 2400 },
    { name: isBn ? 'ফেব্রু' : 'Feb', income: 3000, expense: 1398 },
    { name: isBn ? 'মার্চ' : 'Mar', income: 6000, expense: 3800 },
    { name: isBn ? 'এপ্রিল' : 'Apr', income: 4500, expense: 3908 },
    { name: isBn ? 'মে' : 'May', income: 5890, expense: 4800 },
    { name: isBn ? 'জুন' : 'Jun', income: 7390, expense: 5200 },
  ];

  return (
    <div className="space-y-10">
      
      {/* Top Header Panel: Greeting & Live Digital Clock */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 md:p-8 rounded-[2rem] text-white shadow-xl relative overflow-hidden border border-slate-700/50">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/[0.08] rounded-full blur-[100px] -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/[0.05] rounded-full blur-[80px] -ml-24 -mb-24" />
        
        <div className="space-y-2 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2"
          >
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-widest bg-indigo-500/30 text-indigo-200 border border-indigo-500/20 uppercase">
              {isBn ? 'সিস্টেম স্ট্যাটাস: সচল' : 'SYSTEM ONLINE'}
            </span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight"
          >
            {greeting},
            <span className="block mt-1 text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-yellow-300 font-extrabold drop-shadow-sm">
              {profile?.name || ''}!
            </span>
          </motion.h1>
          <p className="text-slate-300 text-xs md:text-sm font-medium tracking-wide">
            {isBn ? 'আপনার আর্থিক পোর্টফোলিও এবং হিসাবের লাইভ ড্যাশবোর্ড।' : 'Your digital financial logs and live records.'}
          </p>
        </div>

        {/* Live Digital Clock Widget */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="mt-6 md:mt-0 px-6 py-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 flex flex-col items-center md:items-end justify-center text-center md:text-right shadow-lg min-w-[240px] relative z-10"
        >
          <div className="flex items-center gap-2 text-yellow-300 font-mono text-xl md:text-2xl font-black tracking-widest">
            <Clock size={18} className="text-yellow-400 animate-pulse shrink-0" />
            {formattedTime}
          </div>
          <div className="text-[10px] md:text-xs font-bold text-slate-300 mt-1.5 uppercase tracking-wider">
            {formattedDate}
          </div>
        </motion.div>
      </div>

      {/* 3 Interactive Balance Cards: Cash, Bank, Others */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
        
        {/* Card 1: Cash Balance */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "bg-white border-2 rounded-[2.25rem] p-6 lg:p-8 relative overflow-hidden shadow-sm transition-all duration-300 flex flex-col justify-between min-h-[190px]",
            showCash ? "border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)] bg-emerald-50/5" : "border-slate-100 hover:border-slate-300"
          )}
        >
          {/* Header row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 transition-transform hover:scale-105 shrink-0">
                <Wallet size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-slate-900 font-extrabold text-sm md:text-base uppercase tracking-tight">
                  {isBn ? 'নগদ ক্যাশ' : 'Cash Balance'}
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {isBn ? 'পকেট ক্যাশ হিসাব' : 'Physical Cash'}
                </p>
              </div>
            </div>

            {/* Eye visibility activator */}
            <div className="flex items-center gap-1.5">
              <button 
                type="button"
                onClick={handleToggleCash}
                className={cn(
                  "p-2 rounded-full transition-colors cursor-pointer shrink-0 border",
                  showCash ? "bg-emerald-100 border-emerald-200 text-emerald-700 hover:bg-emerald-200" : "bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200"
                )}
              >
                {showCash ? <EyeOff size={18} strokeWidth={2.5} /> : <Eye size={18} strokeWidth={2.5} />}
              </button>
            </div>
          </div>

          {/* Amount section */}
          <div>
            <div className="text-slate-400 text-[10px] font-bold tracking-wider uppercase">
              {isBn ? 'মোট নগদ ব্যালেন্স' : 'Total Cash Balance'}
            </div>
            <div className="mt-1 h-12 flex items-center min-w-0">
              <AnimatePresence mode="wait">
                {showCash ? (
                  <motion.h4
                    key="visible"
                    initial={{ opacity: 0, filter: "blur(4px)" }}
                    animate={{ opacity: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, filter: "blur(4px)" }}
                    className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight text-ellipsis overflow-hidden whitespace-nowrap"
                  >
                    ৳ {cashBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </motion.h4>
                ) : (
                  <motion.h4
                    key="masked"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-2xl lg:text-3xl font-black text-slate-300 tracking-wide select-none"
                  >
                    ৳ •••• ••••
                  </motion.h4>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Card 2: Bank Balance */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.05 }}
          className={cn(
            "bg-white border-2 rounded-[2.25rem] p-6 lg:p-8 relative overflow-hidden shadow-sm transition-all duration-300 flex flex-col justify-between min-h-[190px]",
            showBank ? "border-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.15)] bg-blue-50/5" : "border-slate-100 hover:border-slate-300"
          )}
        >
          {/* Header row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 transition-transform hover:scale-105 shrink-0">
                <Building2 size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-slate-900 font-extrabold text-sm md:text-base uppercase tracking-tight">
                  {isBn ? 'ব্যাংক ব্যালেন্স' : 'Bank Balance'}
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {isBn ? 'সমস্ত ব্যাংক একাউন্ট' : 'All Bank Accounts'}
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1.5">
              {/* Specific Listing trigger */}
              <button 
                type="button"
                onClick={() => setExpandBanks(true)}
                className="p-2 rounded-full transition-all shrink-0 border cursor-pointer bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-blue-600"
                title={isBn ? 'স্পেসিফিক ব্যাংক ব্যালেন্স তালিকা' : 'Specific bank balances'}
              >
                <List size={18} strokeWidth={2.5} />
              </button>

              <button 
                type="button"
                onClick={handleToggleBank}
                className={cn(
                  "p-2 rounded-full transition-colors cursor-pointer shrink-0 border",
                  showBank ? "bg-blue-100 border-blue-200 text-blue-700 hover:bg-blue-200" : "bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200"
                )}
              >
                {showBank ? <EyeOff size={18} strokeWidth={2.5} /> : <Eye size={18} strokeWidth={2.5} />}
              </button>
            </div>
          </div>

          {/* Amount section */}
          <div>
            <div className="text-slate-400 text-[10px] font-bold tracking-wider uppercase">
              {isBn ? 'মোট ব্যাংক যোগফল' : 'Total Bank Combined Sum'}
            </div>
            <div className="mt-1 h-12 flex items-center min-w-0">
              <AnimatePresence mode="wait">
                {showBank ? (
                  <motion.h4
                    key="visible"
                    initial={{ opacity: 0, filter: "blur(4px)" }}
                    animate={{ opacity: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, filter: "blur(4px)" }}
                    className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight text-ellipsis overflow-hidden whitespace-nowrap"
                  >
                    ৳ {totalBankBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </motion.h4>
                ) : (
                  <motion.h4
                    key="masked"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-2xl lg:text-3xl font-black text-slate-300 tracking-wide select-none"
                  >
                    ৳ •••• ••••
                  </motion.h4>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Card 3: Others Balance */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className={cn(
            "bg-white border-2 rounded-[2.25rem] p-6 lg:p-8 relative overflow-hidden shadow-sm transition-all duration-300 flex flex-col justify-between min-h-[190px]",
            showOthers ? "border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.15)] bg-amber-50/5" : "border-slate-100 hover:border-slate-300"
          )}
        >
          {/* Header row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 transition-transform hover:scale-105 shrink-0">
                <Smartphone size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-slate-900 font-extrabold text-sm md:text-base uppercase tracking-tight">
                  {isBn ? 'অন্যান্য অ্যাকাউন্টস' : 'Others Balance'}
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                  {isBn ? 'বিকাশ, রকেট, নগদ, উপায়' : 'Bkash, Nagad, etc'}
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1.5">
              {/* Specific MFS dropdown trigger */}
              <button 
                type="button"
                onClick={() => setExpandOthers(true)}
                className="p-2 rounded-full transition-all shrink-0 border cursor-pointer bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-amber-600"
                title={isBn ? 'স্পেসিফিক মোবাইল একাউন্ট ব্যালেন্স' : 'Specific MFS accounts'}
              >
                <Smartphone size={18} strokeWidth={2.5} />
              </button>

              <button 
                type="button"
                onClick={handleToggleOthers}
                className={cn(
                  "p-2 rounded-full transition-colors cursor-pointer shrink-0 border",
                  showOthers ? "bg-amber-100 border-amber-200 text-amber-700 hover:bg-amber-200" : "bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200"
                )}
              >
                {showOthers ? <EyeOff size={18} strokeWidth={2.5} /> : <Eye size={18} strokeWidth={2.5} />}
              </button>
            </div>
          </div>

          {/* Amount section */}
          <div>
            <div className="text-slate-400 text-[10px] font-bold tracking-wider uppercase">
              {isBn ? 'মোবাইল ব্যাংকিং যোগফল' : 'Total MFS Combined Sum'}
            </div>
            <div className="mt-1 h-12 flex items-center min-w-0">
              <AnimatePresence mode="wait">
                {showOthers ? (
                  <motion.h4
                    key="visible"
                    initial={{ opacity: 0, filter: "blur(4px)" }}
                    animate={{ opacity: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, filter: "blur(4px)" }}
                    className="text-2xl lg:text-3xl font-black text-indigo-950 tracking-tight text-ellipsis overflow-hidden whitespace-nowrap"
                  >
                    ৳ {totalOthersBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </motion.h4>
                ) : (
                  <motion.h4
                    key="masked"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-2xl lg:text-3xl font-black text-slate-300 tracking-wide select-none"
                  >
                    ৳ •••• ••••
                  </motion.h4>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

      </div>

      {/* Conditionally Expanded Listings based on Expand States */}
      <AnimatePresence>
        {expandBanks && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-[2rem] w-full max-w-lg p-6 md:p-8 shadow-2xl relative border border-slate-100 flex flex-col max-h-[85vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-2 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                    <Building size={20} />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-sm md:text-base uppercase tracking-tight">
                      {isBn ? 'ব্যাংক ব্যালেন্স বিবরণী' : 'Bank Balance Logs'}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-extrabold uppercase mt-0.5">
                      {isBn ? 'নিবন্ধিত ব্যাংক সমূহ' : 'All Associated Accounts'}
                    </p>
                  </div>
                </div>
                <motion.button
                  type="button"
                  whileHover={{ rotate: 90, scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setExpandBanks(false)}
                  className="w-10 h-10 flex items-center justify-center bg-indigo-50 rounded-full text-indigo-600 border border-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.55)] cursor-pointer active:scale-95 transition-all duration-300"
                >
                  <X size={22} strokeWidth={2.5} />
                </motion.button>
              </div>

              {/* Bank Accounts List: left side shows account number/info, right side shows balance */}
              <div className="flex-1 overflow-y-auto pr-1 py-4 space-y-3.5 custom-scrollbar">
                {banks.length > 0 ? (
                  banks.map((b) => (
                    <div 
                      key={b.id} 
                      className="p-4 bg-slate-50 hover:bg-blue-50/20 border border-slate-100 hover:border-blue-200 rounded-2xl flex items-center justify-between transition-all"
                    >
                      <div className="min-w-0 pr-4">
                        <p className="font-black text-slate-900 text-xs md:text-sm truncate">
                          {b.bankName}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono font-bold mt-1 tracking-wide">
                          {isBn ? 'হিসাব নম্বর: ' : 'A/C No: '} {b.accountNumber || 'N/A'}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-black text-blue-600 text-sm md:text-base font-mono leading-none block">
                          ৳ {Number(b.currentBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center">
                    <Building className="mx-auto text-slate-300 mb-2" size={36} />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {isBn ? 'কোনো ব্যাংক অ্যাকাউন্ট নথিভুক্ত করা হয়নি।' : 'No verified bank records found.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Close Button Footer */}
              <div className="pt-4 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setExpandBanks(false)}
                  className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-2xl text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  {isBn ? 'বন্ধ করুন' : 'Close Details'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {expandOthers && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-[2rem] w-full max-w-lg p-6 md:p-8 shadow-2xl relative border border-slate-100 flex flex-col max-h-[85vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                    <Smartphone size={20} />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-sm md:text-base uppercase tracking-tight">
                      {isBn ? 'অন্যান্য একাউন্ট ব্যালেন্স' : 'MFS Accounts balance'}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-extrabold uppercase mt-0.5">
                      {isBn ? 'মোবাইল ওয়ালেট সমূহ' : 'Mobile wallets detail summary'}
                    </p>
                  </div>
                </div>
                <motion.button
                  type="button"
                  whileHover={{ rotate: 90, scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setExpandOthers(false)}
                  className="w-10 h-10 flex items-center justify-center bg-indigo-50 rounded-full text-indigo-600 border border-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.55)] cursor-pointer active:scale-95 transition-all duration-300"
                >
                  <X size={22} strokeWidth={2.5} />
                </motion.button>
              </div>

              {/* Dynamic MFS Select Dropdown */}
              <div className="flex items-center justify-between bg-amber-50/50 border border-amber-100 rounded-2xl p-3 my-4 shrink-0">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  {isBn ? 'পদ্ধতি নির্বাচন:' : 'Filter Platform:'}
                </span>
                <select
                  value={selectedMfsPlatform}
                  onChange={(e) => setSelectedMfsPlatform(e.target.value as any)}
                  className="bg-white border-2 border-amber-200 rounded-xl px-3 py-1 text-xs font-black text-amber-900 outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer shadow-sm transition-all"
                >
                  <option value="Bkash">Bkash</option>
                  <option value="Nagad">Nagad</option>
                  <option value="Rocket">Rocket</option>
                  <option value="Upay">Upay</option>
                </select>
              </div>

              {/* MFS Accounts List: left side shows account number, right side shows balance */}
              <div className="flex-1 overflow-y-auto pr-1 py-1 space-y-3.5 custom-scrollbar">
                {(() => {
                  const matchedAccounts = onlineAccounts.filter(acc => acc.platform?.toLowerCase() === selectedMfsPlatform.toLowerCase());
                  return matchedAccounts.length > 0 ? (
                    matchedAccounts.map((acc) => (
                      <div 
                        key={acc.id} 
                        className="p-4 bg-slate-50 hover:bg-amber-50/20 border border-slate-100 hover:border-amber-200 rounded-2xl flex items-center justify-between transition-all"
                      >
                        <div className="min-w-0 pr-4">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-amber-100 text-amber-800 border border-amber-200 uppercase shrink-0">
                              {acc.platform}
                            </span>
                            <span className="text-[10px] text-slate-500 font-bold truncate">
                              {acc.accountName || (isBn ? 'নামহীন একাউন্ট' : 'Unnamed Account')}
                            </span>
                          </div>
                          <span className="text-xs text-slate-900 font-black mt-1.5 font-mono block">
                            {isBn ? 'মোবাইল নম্বর: ' : 'Phone No: '} {acc.accountNumber || 'N/A'}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-black text-amber-600 text-sm md:text-base font-mono leading-none block">
                            ৳ {Number(acc.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center">
                      <Smartphone className="mx-auto text-slate-300 mb-2" size={36} />
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        {isBn ? `${selectedMfsPlatform} এর কোনো অ্যাকাউন্ট পাওয়া যায়নি!` : `No ${selectedMfsPlatform} records found.`}
                      </p>
                    </div>
                  );
                })()}
              </div>

              {/* Close Button Footer */}
              <div className="pt-4 border-t border-slate-100 mt-4 shrink-0">
                <button
                  type="button"
                  onClick={() => setExpandOthers(false)}
                  className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-2xl text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  {isBn ? 'বন্ধ করুন' : 'Close Details'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Chart & Activity Rows (Summaries preserved nicely with outstanding aesthetic layouts) */}
      <div className="grid grid-cols-1 gap-8">
        
        {/* Chart Card */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white border-2 border-slate-100 rounded-[2.5rem] p-6 md:p-10 group relative overflow-hidden shadow-sm hover:border-indigo-100 transition-colors"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/[0.02] blur-[100px] rounded-full -mr-32 -mt-32" />
          <div className="flex items-center justify-between mb-8 relative z-10">
            <div>
              <h2 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">
                {isBn ? 'মাসিক লেনদেন সারসংক্ষেপ' : 'Monthly Financial Trends'}
              </h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                {isBn ? 'আয় বনাম ব্যয় বিশ্লেষণ' : 'Income vs Expense Analytics'}
              </p>
            </div>
            <div className="flex gap-4 shrink-0">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm" />
                <span className="text-[10px] font-black text-slate-400 uppercase">{isBn ? 'আয়' : 'Income'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm" />
                <span className="text-[10px] font-black text-slate-400 uppercase">{isBn ? 'ব্যয়' : 'Expense'}</span>
              </div>
            </div>
          </div>
          <div className="h-[280px] w-full relative z-10 font-black">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.12}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.12}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}
                  itemStyle={{ fontSize: '11px', fontWeight: 700 }}
                  labelStyle={{ fontSize: '11px', fontWeight: 800, marginBottom: '2px', color: '#6366f1' }}
                />
                <Area type="monotone" dataKey="income" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorIncome)" />
                <Area type="monotone" dataKey="expense" stroke="#4f46e5" strokeWidth={4} fillOpacity={1} fill="url(#colorExpense)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
