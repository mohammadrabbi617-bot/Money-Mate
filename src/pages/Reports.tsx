import React, { useEffect, useState, useRef } from 'react';
import { BarChart3, Download, FileSpreadsheet, FileText, Calendar, Filter, ChevronRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { translations } from '../translations';
import { financeService } from '../services/financeService';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useBackButton } from '../components/BackButtonProvider';

export default function ReportsPage() {
  const { profile, user } = useAuth();
  const lang = profile?.language || 'en';
  const t = translations[lang as keyof typeof translations];
  const { registerHandler } = useBackButton();
  
  const [data, setData] = useState({
    incomes: [] as any[],
    expenses: [] as any[],
    creditTransactions: [] as any[],
  });

  const [activeReportTitle, setActiveReportTitle] = useState<string>('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showFullReport, setShowFullReport] = useState(false);
  const [reportType, setReportType] = useState<'All' | 'Income' | 'Expense'>('All');
  const [selectedShopId, setSelectedShopId] = useState<string>('');
  const [selectedPersonId, setSelectedPersonId] = useState<string>('');
  const [shops, setShops] = useState<any[]>([]);
  const [banks, setBanks] = useState<any[]>([]);
  const [onlineAccounts, setOnlineAccounts] = useState<any[]>([]);
  const [persons, setPersons] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 20;

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [filters, setFilters] = useState({
    fromDate: new Date().toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubInc = financeService.subscribeToCollection('incomes', user.uid, (d) => setData(p => ({...p, incomes: d})));
    const unsubExp = financeService.subscribeToCollection('expenses', user.uid, (d) => setData(p => ({...p, expenses: d})));
    const unsubCredit = financeService.subscribeToCollection('creditTransactions', user.uid, (d) => setData(p => ({...p, creditTransactions: d})));
    const unsubShops = financeService.subscribeToCollection('shops', user.uid, setShops);
    const unsubBanks = financeService.subscribeToCollection('banks', user.uid, setBanks);
    const unsubOnline = financeService.subscribeToCollection('onlineAccounts', user.uid, setOnlineAccounts);
    const unsubPersons = financeService.subscribeToCollection('persons', user.uid, setPersons);
    const unsubLoans = financeService.subscribeToCollection('loans', user.uid, setLoans);
    return () => { 
      unsubInc(); 
      unsubExp(); 
      unsubCredit(); 
      unsubShops(); 
      unsubBanks();
      unsubOnline();
      unsubPersons();
      unsubLoans();
    };
  }, [user]);

  useEffect(() => {
    if (activeReportTitle !== '' || isFilterOpen || showFullReport) {
      const unregister = registerHandler(() => {
        if (showFullReport) {
          if (activeReportTitle === 'Cash Reports' || activeReportTitle === 'Income/Expense') {
            setShowFullReport(false);
            setIsFilterOpen(true);
          } else {
            setShowFullReport(false);
            setActiveReportTitle('');
          }
          return true;
        } else if (isFilterOpen) {
          setIsFilterOpen(false);
          setActiveReportTitle('');
          return true;
        }
        return false;
      });
      return unregister;
    }
  }, [activeReportTitle, isFilterOpen, showFullReport, registerHandler]);

  const getPaymentMethodDisplay = (tx: any) => {
    // Helper to normalize the mobile money platform name
    const normalizeMFS = (name: string): string => {
      if (!name) return '';
      const lower = name.toLowerCase();
      if (lower.includes('bkash')) return 'Bkash';
      if (lower.includes('nagad')) return 'Nagad';
      if (lower.includes('rocket')) return 'Rocket';
      if (lower.includes('upay')) return 'Upay';
      // Capitalize first letter if it's something else
      return name.charAt(0).toUpperCase() + name.slice(1);
    };

    // Check if this is a loan transaction
    const isLoanTx = tx.personId !== undefined || tx.type === 'given' || tx.type === 'taken' || tx.type === 'collection' || tx.type === 'repayment';
    if (isLoanTx) {
      const methodAttr = tx.paymentMethod || tx.method;
      if (methodAttr === 'Cash') return 'Cash';
      if (methodAttr === 'Bank') return 'Bank';
      if (methodAttr === 'Other' || methodAttr === 'Online') {
        if (tx.otherMethod) {
          return normalizeMFS(tx.otherMethod);
        }
        if (tx.accountId) {
          const online = onlineAccounts.find(o => o.id === tx.accountId);
          if (online) {
            return normalizeMFS(online.method || online.platform) || 'Bkash';
          }
        }
        // Extract from note if possible
        const noteLower = (tx.notes || tx.note || '').toLowerCase();
        if (noteLower.includes('bkash')) return 'Bkash';
        if (noteLower.includes('nagad')) return 'Nagad';
        if (noteLower.includes('rocket')) return 'Rocket';
        if (noteLower.includes('upay')) return 'Upay';
        return 'Bkash';
      }
      return methodAttr || 'Cash';
    }

    // 1. Check if this is a credit transaction
    const isCreditTx = tx.transactionType === undefined;

    if (isCreditTx) {
      if (tx.productName !== 'Supplier Payment') {
        return '--';
      }
      
      const rawMethod = tx.method;
      if (rawMethod === 'Cash') return 'Cash';
      if (rawMethod === 'Bank') return 'Bank';
      
      // If it's a specific mobile bank name stored directly in method
      if (rawMethod && rawMethod !== 'Other' && rawMethod !== 'Online') {
        return normalizeMFS(rawMethod);
      }

      // If it has otherMethod explicitly saved
      if (tx.otherMethod) {
        return normalizeMFS(tx.otherMethod);
      }

      if (tx.accountId) {
        const bank = banks.find(b => b.id === tx.accountId);
        if (bank) {
          return 'Bank';
        }
        const online = onlineAccounts.find(o => o.id === tx.accountId);
        if (online) {
          return normalizeMFS(online.method || online.platform) || 'Bkash';
        }
      }

      // Extract from note if possible
      const noteLower = (tx.notes || '').toLowerCase();
      if (noteLower.includes('bkash')) return 'Bkash';
      if (noteLower.includes('nagad')) return 'Nagad';
      if (noteLower.includes('rocket')) return 'Rocket';
      if (noteLower.includes('upay')) return 'Upay';

      // Fallback: If we still don't know but we have some online accounts, use the first account's platform
      if (onlineAccounts && onlineAccounts.length > 0) {
        const firstOnline = onlineAccounts[0];
        return normalizeMFS(firstOnline.method || firstOnline.platform) || 'Bkash';
      }

      return 'Bkash'; // Return Bkash as final fallback instead of 'Other'
    }

    // 2. Otherwise it's an Income or Expense from Cash/Bank/Online
    const methodAttr = tx.paymentMethod || tx.method;
    if (methodAttr === 'Cash') return 'Cash';
    if (methodAttr === 'Bank') return 'Bank';
    
    // For 'Other' or 'Online' mobile banking
    if (methodAttr === 'Other' || methodAttr === 'Online') {
      if (tx.otherMethod) {
        return normalizeMFS(tx.otherMethod);
      }
      if (tx.accountId) {
        const online = onlineAccounts.find(o => o.id === tx.accountId);
        if (online) {
          return normalizeMFS(online.method || online.platform) || 'Bkash';
        }
      }
      
      // Extract from note if possible
      const noteLower = (tx.note || tx.notes || '').toLowerCase();
      if (noteLower.includes('bkash')) return 'Bkash';
      if (noteLower.includes('nagad')) return 'Nagad';
      if (noteLower.includes('rocket')) return 'Rocket';
      if (noteLower.includes('upay')) return 'Upay';

      // Fallback
      if (onlineAccounts && onlineAccounts.length > 0) {
        const firstOnline = onlineAccounts[0];
        return normalizeMFS(firstOnline.method || firstOnline.platform) || 'Bkash';
      }

      return 'Bkash';
    }

    return methodAttr || '--';
  };

  const reportList = [
    { sl: 1, title: 'Cash Reports' },
    { sl: 2, title: 'Income/Expense' },
    { sl: 3, title: 'Supplier Report' },
    { sl: 4, title: 'Loan Given-Collection' },
    { sl: 5, title: 'Loan Taken-Repayment' },
  ];

  const handleOpenFilter = (title: string) => {
    setActiveReportTitle(title);
    if (title === 'Supplier Report' || title === 'Loan Given-Collection' || title === 'Loan Taken-Repayment') {
      setShowFullReport(true);
      setSelectedShopId('');
      setSelectedPersonId('');
      setCurrentPage(1);
    } else {
      setIsFilterOpen(true);
    }
  };

  const handleGenerateReport = () => {
    setShowFullReport(true);
    setIsFilterOpen(false);
  };

  // Combine and process data for report
  const allTxs = [
    ...data.incomes.map(tx => ({ ...tx, transactionType: 'Income' })),
    ...data.expenses.map(tx => ({ ...tx, transactionType: 'Expense' }))
  ];

  // Sort by date ascending to calculate running balance
  const sortedAll = [...allTxs].sort((a, b) => {
    const dateComp = a.date.localeCompare(b.date);
    if (dateComp !== 0) return dateComp;
    
    const getTime = (val: any) => {
      if (!val) return 0;
      if (val.seconds) return val.seconds * 1000 + (val.nanoseconds / 1000000);
      if (typeof val === 'string') return new Date(val).getTime();
      if (val instanceof Date) return val.getTime();
      return 0;
    };
    return getTime(a.createdAt) - getTime(b.createdAt);
  });

  let runningBalance = 0;
  const withBalance = sortedAll.map(tx => {
    const amount = Number(tx.amount || 0);
    if (tx.transactionType === 'Income') {
      runningBalance += amount;
    } else {
      runningBalance -= amount;
    }
    return { ...tx, balance: runningBalance };
  });

  // Filter by date range and selected type
  const filteredTxs = withBalance.filter(tx => {
    const matchesDate = tx.date >= filters.fromDate && tx.date <= filters.toDate;
    const matchesType = reportType === 'All' || tx.transactionType === reportType;
    return matchesDate && matchesType;
  });

  // For Income/Expense side-by-side view, group by category
  const incomesByCat = filteredTxs
    .filter(tx => tx.transactionType === 'Income')
    .reduce((acc: any, tx) => {
      const cat = tx.category || 'Uncategorized';
      if (!acc[cat]) acc[cat] = 0;
      acc[cat] += Number(tx.amount || 0);
      return acc;
    }, {});

  const expensesByCat = filteredTxs
    .filter(tx => tx.transactionType === 'Expense')
    .reduce((acc: any, tx) => {
      const cat = tx.category || 'Uncategorized';
      if (!acc[cat]) acc[cat] = 0;
      acc[cat] += Number(tx.amount || 0);
      return acc;
    }, {});

  const incomeItems = Object.entries(incomesByCat).map(([category, amount]) => ({ category, amount: amount as number }));
  const expenseItems = Object.entries(expensesByCat).map(([category, amount]) => ({ category, amount: amount as number }));

  const maxRows = Math.max(incomeItems.length, expenseItems.length);
  const zippedItems = Array.from({ length: maxRows }, (_, i) => ({
    income: incomeItems[i] || null,
    expense: expenseItems[i] || null
  }));

  const totalFilteredIncome = incomeItems.reduce((sum, item) => sum + item.amount, 0);
  const totalFilteredExpense = expenseItems.reduce((sum, item) => sum + item.amount, 0);

  // Sort descending for display (like a statement)
  const displayTxs = [...filteredTxs].reverse();

  const totalAmount = filteredTxs.reduce((acc, tx) => acc + Number(tx.amount || 0), 0);

  // Supplier logic
  const getSupplierTxs = () => {
    if (activeReportTitle !== 'Supplier Report' || !selectedShopId) return [];
    const selectedShop = shops.find(s => s.id === selectedShopId);
    if (!selectedShop) return [];

    // Filter by Shop Name (stored in customerName) and type 'purchase'
    const filtered = data.creditTransactions.filter((tx: any) => 
      tx.customerName === selectedShop.shopName && tx.type === 'purchase'
    );

    // Sort by date then createdAt for accurate balance calculation
    const sorted = [...filtered].sort((a, b) => {
      const dateComp = a.date.localeCompare(b.date);
      if (dateComp !== 0) return dateComp;
      const getT = (v: any) => v?.seconds ? v.seconds : new Date(v || 0).getTime();
      return getT(a.createdAt) - getT(b.createdAt);
    });

    let runningDue = 0;
    return sorted.map(tx => {
      // payment info: if it's a payment, price=0, totalPrice=0, paidAmount=amount
      // if it's a purchase: price=amount, totalPrice=amount, paidAmount=0
      // however, we trust dueAmount as the net debt change
      runningDue += Number(tx.dueAmount || 0);
      return {
        ...tx,
        ownerName: selectedShop.shopkeeperName,
        dueBalance: runningDue,
        purchaseAmt: tx.productName === 'Supplier Payment' ? 0 : Number(tx.totalPrice || tx.price || 0),
        paymentAmt: tx.productName === 'Supplier Payment' ? Number(tx.paidAmount || 0) : 0
      };
    });
  };

  const supplierTxs = getSupplierTxs();
  const sortedSupplierTxs = [...supplierTxs].reverse();
  const paginatedSupplierTxs = sortedSupplierTxs.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  // Loan Givens/Collections and Taken/Repayments logic
  const getLoanTxs = (reportType: 'Given' | 'Taken') => {
    if (!selectedPersonId) return [];

    // Filter loans collection by selectedPersonId
    const personLoans = loans.filter((tx: any) => tx.personId === selectedPersonId);

    // Filter by type depending on the report
    const allowedTypes = reportType === 'Given' 
      ? ['given', 'collection'] 
      : ['taken', 'repayment'];

    const filtered = personLoans.filter((tx: any) => allowedTypes.includes(tx.type));

    // Sort ascending by date and then createdAt for correct running balance calculation
    const sorted = [...filtered].sort((a, b) => {
      const dateA = a.startDate || a.date || '';
      const dateB = b.startDate || b.date || '';
      const dateComp = dateA.localeCompare(dateB);
      if (dateComp !== 0) return dateComp;
      const getT = (v: any) => v?.seconds ? v.seconds * 1000 : new Date(v || 0).getTime();
      return getT(a.createdAt) - getT(b.createdAt);
    });

    let runningBalance = 0;
    return sorted.map(tx => {
      const amountValue = Number(tx.principalAmount || tx.amount || 0);
      const isIncrease = tx.type === 'given' || tx.type === 'taken';
      
      if (isIncrease) {
        runningBalance += amountValue;
      } else {
        runningBalance -= amountValue;
      }

      return {
        ...tx,
        normalizedAmount: amountValue,
        normalizedDate: tx.startDate || tx.date || '',
        normalizedNote: tx.notes || tx.note || '',
        runningBalance: runningBalance,
        givenAmt: tx.type === 'given' ? amountValue : 0,
        collectionAmt: tx.type === 'collection' ? amountValue : 0,
        takenAmt: tx.type === 'taken' ? amountValue : 0,
        repaymentAmt: tx.type === 'repayment' ? amountValue : 0,
      };
    });
  };

  const isCurrentReportLoanGiven = activeReportTitle === 'Loan Given-Collection';
  const isCurrentReportLoanTaken = activeReportTitle === 'Loan Taken-Repayment';

  const loanTxs = isCurrentReportLoanGiven 
    ? getLoanTxs('Given') 
    : isCurrentReportLoanTaken 
      ? getLoanTxs('Taken') 
      : [];

  const sortedLoanTxs = [...loanTxs].reverse();
  const paginatedLoanTxs = sortedLoanTxs.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const totalPages = activeReportTitle === 'Supplier Report'
    ? Math.max(1, Math.ceil(sortedSupplierTxs.length / rowsPerPage))
    : (isCurrentReportLoanGiven || isCurrentReportLoanTaken)
      ? Math.max(1, Math.ceil(sortedLoanTxs.length / rowsPerPage))
      : 1;

  const totalSupplierPurchase = supplierTxs.reduce((sum, tx) => sum + tx.purchaseAmt, 0);
  const totalSupplierPayment = supplierTxs.reduce((sum, tx) => sum + tx.paymentAmt, 0);

  const totalLoanGivenShow = loanTxs.reduce((sum, tx) => sum + (tx.givenAmt || 0), 0);
  const totalLoanCollectionShow = loanTxs.reduce((sum, tx) => sum + (tx.collectionAmt || 0), 0);
  const totalLoanTakenShow = loanTxs.reduce((sum, tx) => sum + (tx.takenAmt || 0), 0);
  const totalLoanRepaymentShow = loanTxs.reduce((sum, tx) => sum + (tx.repaymentAmt || 0), 0);

  const filteredPersons = persons.filter(p =>
    (p.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full px-1 py-4">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight border-l-4 border-blue-600 pl-4">
          Report overview
        </h1>
      </div>

      <AnimatePresence>
        {isFilterOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-[calc(4rem+env(safe-area-inset-top,0px))] bottom-0 left-0 right-0 lg:top-0 lg:bottom-0 lg:left-[88px] z-50 bg-white overflow-y-auto"
          >
            <div className="max-w-4xl mx-auto px-6 pt-16 pb-10 md:pt-24 md:pb-16">
              <div className="flex flex-col items-center justify-center text-center mb-8 md:mb-12">
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                  {activeReportTitle}
                </h2>
                <p className="text-slate-400 font-bold mt-2">Select date range to generate report</p>
              </div>

              <div className="bg-slate-50 border-2 border-slate-100 rounded-[3rem] p-10 space-y-10 relative overflow-hidden group">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FloatingInput 
                    label="From Date" 
                    type="date"
                    value={filters.fromDate}
                    onChange={(val: string) => setFilters(prev => ({ ...prev, fromDate: val }))}
                  />

                  <FloatingInput 
                    label="To Date" 
                    type="date"
                    value={filters.toDate}
                    onChange={(val: string) => setFilters(prev => ({ ...prev, toDate: val }))}
                  />
                </div>

                <div className="pt-6">
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleGenerateReport}
                    className="w-full py-6 bg-blue-600 text-white rounded-2xl font-black text-xl shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-4"
                  >
                    <BarChart3 size={24} />
                    Generate Report
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {showFullReport && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-[calc(4rem+env(safe-area-inset-top,0px))] bottom-0 left-0 right-0 lg:top-0 lg:bottom-0 lg:left-[88px] z-[60] bg-white overflow-y-auto"
          >
            <div className="max-w-7xl mx-auto px-4 py-8">
              <div className={cn(
                "border border-slate-200 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4",
                (activeReportTitle === 'Supplier Report' || activeReportTitle === 'Loan Given-Collection' || activeReportTitle === 'Loan Taken-Repayment') ? "bg-transparent border-0 p-0 mb-4" : "bg-slate-50 p-4 mb-8"
              )}>
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">
                    {activeReportTitle}
                  </h2>
                </div>
                {activeReportTitle !== 'Supplier Report' && activeReportTitle !== 'Loan Given-Collection' && activeReportTitle !== 'Loan Taken-Repayment' && (
                  <div className="text-sm font-bold text-slate-500">
                    Period: <span className="text-black">{filters.fromDate.split('-').reverse().join('-')}</span> To <span className="text-black">{filters.toDate.split('-').reverse().join('-')}</span>
                  </div>
                )}
              </div>

              {activeReportTitle === 'Cash Reports' ? (
                <>
                  <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                      Transaction History
                    </h2>
                    <div className="flex items-center gap-4">
                      <label className="text-sm font-bold text-slate-400">Filter By:</label>
                      <select 
                        className="px-4 py-4 border border-slate-400 rounded-lg font-black text-slate-900 outline-none focus:border-blue-500 text-base shadow-sm"
                        value={reportType}
                        onChange={(e) => setReportType(e.target.value as any)}
                      >
                        <option value="All">All</option>
                        <option value="Income">Income</option>
                        <option value="Expense">Expense</option>
                      </select>
                    </div>
                  </div>

                  <div className="overflow-x-auto border border-slate-400">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-[#cbd5e1]">
                          <th className="border border-slate-400 px-3 py-3 text-center text-[12px] font-black text-black whitespace-nowrap">Date</th>
                          <th className="border border-slate-400 px-4 py-3 text-center text-[12px] font-black text-black">Particulars</th>
                          <th className="border border-slate-400 px-3 py-3 text-center text-[12px] font-black text-black">Payment Method</th>
                          <th className="border border-slate-400 px-3 py-3 text-center text-[12px] font-black text-black">Transaction Type</th>
                          <th className="border border-slate-400 px-3 py-3 text-center text-[12px] font-black text-black">Category</th>
                          <th className="border border-slate-400 px-3 py-3 text-center text-[12px] font-black text-black">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayTxs.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="border border-slate-400 py-10 text-center font-bold text-slate-400 italic">
                              No transactions found for the selected period.
                            </td>
                          </tr>
                        ) : (
                          displayTxs.map((tx, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 transition-all text-[12px]">
                              <td className="border border-slate-400 px-3 py-2 text-center font-bold text-black whitespace-nowrap">
                                {tx.date.split('-').reverse().join('-')}
                              </td>
                              <td className="border border-slate-400 px-4 py-2 text-left font-bold text-black min-w-[200px]">
                                {tx.note || 'N/A'}
                              </td>
                              <td className="border border-slate-400 px-3 py-2 text-center font-bold text-black">
                                {getPaymentMethodDisplay(tx)}
                              </td>
                              <td className="border border-slate-400 px-3 py-2 text-center font-bold text-black">
                                {tx.transactionType}
                              </td>
                              <td className="border border-slate-400 px-3 py-2 text-center font-bold text-black">
                                {tx.category}
                              </td>
                              <td className="border border-slate-400 px-3 py-2 text-center font-bold text-black">
                                {Number(tx.amount || 0).toLocaleString('en-IN')}
                              </td>
                            </tr>
                          ))
                        )}
                        <tr className="bg-slate-50 font-bold text-[12px]">
                          <td colSpan={5} className="border border-slate-400 px-3 py-3 text-right font-black text-black">
                            Total
                          </td>
                          <td className="border border-slate-400 px-3 py-3 text-center font-black text-black">
                            {totalAmount.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </>
              ) : activeReportTitle === 'Income/Expense' ? (
                <div className="space-y-10">
                  <div className="overflow-x-auto">
                    <div className="min-w-max">
                      <div className="border border-slate-400">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-[#e2e8f0]">
                              <th colSpan={3} className="border-r border-b border-slate-400 py-2 text-center text-sm font-black text-black">Income</th>
                              <th colSpan={3} className="border-b border-slate-400 py-2 text-center text-sm font-black text-black">Expense</th>
                            </tr>
                            <tr className="bg-[#f1f5f9]">
                              <th className="border-r border-b border-slate-400 px-2 py-2 text-center text-[11px] font-black text-black w-10">SL</th>
                              <th className="border-r border-b border-slate-400 px-4 py-2 text-center text-[11px] font-black text-black">Category</th>
                              <th className="border-r border-b border-slate-400 px-3 py-2 text-center text-[11px] font-black text-black w-32">Amount</th>
                              <th className="border-r border-b border-slate-400 px-2 py-2 text-center text-[11px] font-black text-black w-10">SL</th>
                              <th className="border-r border-b border-slate-400 px-4 py-2 text-center text-[11px] font-black text-black">Category</th>
                              <th className="border-b border-slate-400 px-3 py-2 text-center text-[11px] font-black text-black w-32">Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {zippedItems.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="px-4 py-10 text-center text-xs font-bold text-slate-400 italic bg-white">
                                  No income or expenses found for the selected period.
                                </td>
                              </tr>
                            ) : (
                              zippedItems.map((zipped, idx) => (
                                <tr key={idx} className="text-[12px] font-bold text-black border-b border-slate-400 last:border-0 hover:bg-slate-50">
                                  {/* Income Side */}
                                  <td className="border-r border-slate-400 px-2 py-1.5 text-center bg-white">
                                    {zipped.income ? idx + 1 : ''}
                                  </td>
                                  <td className="border-r border-slate-400 px-4 py-1.5 text-left bg-white">
                                    {zipped.income?.category || ''}
                                  </td>
                                  <td className="border-r border-slate-400 px-3 py-1.5 text-center font-black bg-white">
                                    {zipped.income ? zipped.income.amount.toLocaleString('en-IN') : ''}
                                  </td>
                                  {/* Expense Side */}
                                  <td className="border-r border-slate-400 px-2 py-1.5 text-center bg-white">
                                    {zipped.expense ? idx + 1 : ''}
                                  </td>
                                  <td className="border-r border-slate-400 px-4 py-1.5 text-left bg-white">
                                    {zipped.expense?.category || ''}
                                  </td>
                                  <td className="px-3 py-1.5 text-center font-black bg-white">
                                    {zipped.expense ? zipped.expense.amount.toLocaleString('en-IN') : ''}
                                  </td>
                                </tr>
                              ))
                            )}
                            <tr className="bg-[#f1f5f9] text-[12px] font-black border-t border-slate-400">
                              <td colSpan={2} className="border-r border-slate-400 px-4 py-2 text-center tracking-wider whitespace-nowrap">Total income</td>
                              <td className="border-r border-slate-400 px-3 py-2 text-center whitespace-nowrap">{totalFilteredIncome.toLocaleString('en-IN')}</td>
                              <td colSpan={2} className="border-r border-slate-400 px-4 py-2 text-center tracking-wider whitespace-nowrap">Total expense</td>
                              <td className="px-3 py-2 text-center whitespace-nowrap">{totalFilteredExpense.toLocaleString('en-IN')}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center pt-4">
                    <div className="w-full max-w-4xl border border-black flex divide-x divide-black">
                       <div className="flex-1 p-4 flex items-center justify-center font-black text-base whitespace-nowrap">
                          Income-expense this period
                       </div>
                       <div className="flex-1 p-4 flex items-center justify-center font-black text-2xl text-emerald-600 whitespace-nowrap">
                          {(totalFilteredIncome - totalFilteredExpense).toLocaleString('en-IN')}
                       </div>
                    </div>
                  </div>
                </div>
              ) : isCurrentReportLoanGiven || isCurrentReportLoanTaken ? (
                <div className="space-y-6">
                  {/* Custom Searchable Select Person Dropdown */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm mb-4 -mt-4">
                    <div className="max-w-md flex items-center gap-4">
                      <label className="text-sm font-black text-slate-700 tracking-wide whitespace-nowrap">Select Person Name :</label>
                      
                      <div className="relative w-full" ref={dropdownRef}>
                        <button
                          type="button"
                          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                          className="w-full flex items-center justify-between px-4 py-2.5 bg-white border rounded-xl outline-none font-black text-slate-900 text-base shadow-sm transition-all text-left"
                          style={{ borderColor: '#84cc16', borderWidth: '1.5px' }}
                        >
                          <span className="font-bold text-[14px]">
                            {selectedPersonId ? (persons.find(p => p.id === selectedPersonId)?.name || 'Person') : 'Person'}
                          </span>
                          <span className="text-slate-400 text-xs ml-2 select-none">▼</span>
                        </button>

                        {isDropdownOpen && (
                          <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-300 rounded-2xl shadow-xl z-50 overflow-hidden divide-y divide-slate-200">
                            {/* Search Box */}
                            <div className="px-4 py-2.5">
                              <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search Person"
                                className="w-full bg-transparent border-0 outline-none text-slate-800 placeholder-slate-400 font-bold text-[14px] py-1"
                              />
                            </div>
                            
                            {/* Scrollable Person List */}
                            <div className="max-h-60 overflow-y-auto">
                              {filteredPersons.length === 0 ? (
                                <div className="px-4 py-3 text-sm text-slate-400 italic">No person found</div>
                              ) : (
                                filteredPersons.map(p => (
                                  <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedPersonId(p.id);
                                      setIsDropdownOpen(false);
                                      setSearchTerm('');
                                      setCurrentPage(1);
                                    }}
                                    className="w-full px-4 py-2.5 text-left font-bold text-[14px] hover:bg-slate-100 text-black transition-colors border-b border-slate-100 last:border-0"
                                  >
                                    {p.name}
                                  </button>
                                ))
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {selectedPersonId ? (
                    <div className="space-y-6">
                      <div className="overflow-x-auto border border-slate-400">
                        <table className="w-full border-collapse bg-white">
                          <thead>
                            <tr className="bg-[#cbd5e1]">
                              <th className="border border-slate-400 px-2 py-2 text-center text-[12px] font-black text-black whitespace-nowrap w-[50px] min-w-[50px]">Sl</th>
                              <th className="border border-slate-400 px-2 py-2 text-center text-[12px] font-black text-black whitespace-nowrap w-[90px] min-w-[90px]">Date</th>
                              <th className="border border-slate-400 px-4 py-2 text-center text-[12px] font-black text-black w-auto">Person Name</th>
                              <th className="border border-slate-400 px-4 py-2 text-center text-[12px] font-black text-black w-auto">Note</th>
                              <th className="border border-slate-400 px-1 py-2 text-center text-[12px] font-black text-black w-[115px] min-w-[115px] max-w-[115px] whitespace-normal break-words">Payment Method</th>
                              {isCurrentReportLoanGiven ? (
                                <>
                                  <th className="border border-slate-400 px-1 py-2 text-center text-[12px] font-black text-black w-[115px] min-w-[115px] max-w-[115px] whitespace-normal break-words">Given Amount</th>
                                  <th className="border border-slate-400 px-1 py-2 text-center text-[12px] font-black text-black w-[115px] min-w-[115px] max-w-[115px] whitespace-normal break-words">Collection Amount</th>
                                </>
                              ) : (
                                <>
                                  <th className="border border-slate-400 px-1 py-2 text-center text-[12px] font-black text-black w-[115px] min-w-[115px] max-w-[115px] whitespace-normal break-words">Taken Amount</th>
                                  <th className="border border-slate-400 px-1 py-2 text-center text-[12px] font-black text-black w-[115px] min-w-[115px] max-w-[115px] whitespace-normal break-words">Repayment Amount</th>
                                </>
                              )}
                              <th className="border border-slate-400 px-1 py-2 text-center text-[12px] font-black text-black w-[115px] min-w-[115px] max-w-[115px] whitespace-normal break-words">Balance</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedLoanTxs.length === 0 ? (
                              <tr>
                                <td colSpan={8} className="border border-slate-400 py-10 text-center font-bold text-slate-400 italic whitespace-nowrap">
                                  No records found for this person.
                                </td>
                              </tr>
                            ) : (
                              paginatedLoanTxs.map((tx, idx) => {
                                const globalIdx = sortedLoanTxs.length - ((currentPage - 1) * rowsPerPage + idx);
                                return (
                                  <tr key={idx} className="hover:bg-slate-50 transition-all text-[12px] font-bold text-black border-b border-slate-400 last:border-0">
                                    <td className="border border-slate-400 px-2 py-2 text-center whitespace-nowrap w-[50px] min-w-[50px]">{globalIdx}</td>
                                    <td className="border border-slate-400 px-2 py-2 text-center whitespace-nowrap w-[90px] min-w-[90px]">{tx.normalizedDate ? tx.normalizedDate.split('-').reverse().join('-') : 'N/A'}</td>
                                    <td className="border border-slate-400 px-4 py-2 text-left whitespace-nowrap w-auto">{tx.personName}</td>
                                    <td className="border border-slate-400 px-4 py-2 text-left whitespace-nowrap w-auto">{tx.normalizedNote || 'N/A'}</td>
                                    <td className="border border-slate-400 p-2 text-center w-[115px] min-w-[115px] max-w-[115px] whitespace-normal break-words">{getPaymentMethodDisplay(tx)}</td>
                                    {isCurrentReportLoanGiven ? (
                                      <>
                                        <td className="border border-slate-400 p-2 text-center w-[115px] min-w-[115px] max-w-[115px] whitespace-normal break-words">{tx.givenAmt > 0 ? tx.givenAmt.toLocaleString('en-IN') : '0'}</td>
                                        <td className="border border-slate-400 p-2 text-center w-[115px] min-w-[115px] max-w-[115px] whitespace-normal break-words">{tx.collectionAmt > 0 ? tx.collectionAmt.toLocaleString('en-IN') : '0'}</td>
                                      </>
                                    ) : (
                                      <>
                                        <td className="border border-slate-400 p-2 text-center w-[115px] min-w-[115px] max-w-[115px] whitespace-normal break-words">{tx.takenAmt > 0 ? tx.takenAmt.toLocaleString('en-IN') : '0'}</td>
                                        <td className="border border-slate-400 p-2 text-center w-[115px] min-w-[115px] max-w-[115px] whitespace-normal break-words">{tx.repaymentAmt > 0 ? tx.repaymentAmt.toLocaleString('en-IN') : '0'}</td>
                                      </>
                                    )}
                                    <td className="border border-slate-400 p-2 text-center w-[115px] min-w-[115px] max-w-[115px] whitespace-normal break-words font-black">{tx.runningBalance.toLocaleString('en-IN')}</td>
                                  </tr>
                                );
                              })
                            )}
                            <tr className="bg-slate-100 font-black text-[12px] text-black">
                              <td colSpan={4} className="border border-slate-400 px-4 py-3 text-right uppercase whitespace-nowrap">Total</td>
                              <td className="border border-slate-400 p-2 text-center w-[115px] min-w-[115px] max-w-[115px] whitespace-normal break-words"></td>
                              {isCurrentReportLoanGiven ? (
                                <>
                                  <td className="border border-slate-400 p-2 text-center w-[115px] min-w-[115px] max-w-[115px] whitespace-normal break-words">{totalLoanGivenShow.toLocaleString('en-IN')}</td>
                                  <td className="border border-slate-400 p-2 text-center w-[115px] min-w-[115px] max-w-[115px] whitespace-normal break-words">{totalLoanCollectionShow.toLocaleString('en-IN')}</td>
                                </>
                              ) : (
                                <>
                                  <td className="border border-slate-400 p-2 text-center w-[115px] min-w-[115px] max-w-[115px] whitespace-normal break-words">{totalLoanTakenShow.toLocaleString('en-IN')}</td>
                                  <td className="border border-slate-400 p-2 text-center w-[115px] min-w-[115px] max-w-[115px] whitespace-normal break-words">{totalLoanRepaymentShow.toLocaleString('en-IN')}</td>
                                </>
                              )}
                              <td className="border border-slate-400 p-2 text-center w-[115px] min-w-[115px] max-w-[115px] whitespace-normal break-words">
                                {isCurrentReportLoanGiven
                                  ? (totalLoanGivenShow - totalLoanCollectionShow).toLocaleString('en-IN')
                                  : (totalLoanTakenShow - totalLoanRepaymentShow).toLocaleString('en-IN')}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-6">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                            <button
                              key={p}
                              onClick={() => setCurrentPage(p)}
                              className={cn(
                                "w-8 h-8 rounded-lg font-black text-xs transition-all",
                                currentPage === p ? "bg-blue-600 text-white shadow-lg" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              )}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-20 text-center text-slate-400 font-bold italic">
                      Please select a person to view the report.
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Supplier Report View */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm mb-2 -mt-4">
                    <div className="max-w-md flex items-center gap-4">
                      <label className="text-sm font-black text-slate-700 tracking-wide whitespace-nowrap">Select shop :</label>
                      <select
                        value={selectedShopId}
                        onChange={(e) => {
                          setSelectedShopId(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-full px-4 py-4 bg-slate-50 border border-slate-400 rounded-lg outline-none font-black text-slate-900 focus:border-blue-500 transition-all appearance-none text-base shadow-sm"
                      >
                        <option value="">Select Shop owner</option>
                        {shops.map(s => (
                          <option key={s.id} value={s.id}>{s.shopName} ({s.shopkeeperName})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {selectedShopId ? (
                    <div className="space-y-6">
                      <div className="overflow-x-auto border border-slate-400">
                        <table className="w-full border-collapse bg-white">
                          <thead>
                            <tr className="bg-[#cbd5e1]">
                              <th className="border border-slate-400 px-4 py-3 text-center text-[12px] font-black text-black whitespace-nowrap">Owner Name</th>
                              <th className="border border-slate-400 px-4 py-3 text-center text-[12px] font-black text-black whitespace-nowrap">Date</th>
                              <th className="border border-slate-400 px-4 py-3 text-center text-[12px] font-black text-black whitespace-nowrap">Details</th>
                              <th className="border border-slate-400 px-4 py-3 text-center text-[12px] font-black text-black whitespace-nowrap">Payment Method</th>
                              <th className="border border-slate-400 px-4 py-3 text-center text-[12px] font-black text-black whitespace-nowrap">Purchase Amount</th>
                              <th className="border border-slate-400 px-4 py-3 text-center text-[12px] font-black text-black whitespace-nowrap">Payment Amount</th>
                              <th className="border border-slate-400 px-4 py-3 text-center text-[12px] font-black text-black whitespace-nowrap">Due Balance</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedSupplierTxs.length === 0 ? (
                              <tr>
                                <td colSpan={7} className="border border-slate-400 py-10 text-center font-bold text-slate-400 italic whitespace-nowrap">
                                  No records found for this supplier.
                                </td>
                              </tr>
                            ) : (
                              paginatedSupplierTxs.map((tx, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 transition-all text-[12px] font-bold text-black border-b border-slate-400 last:border-0">
                                  <td className="border border-slate-400 px-4 py-2 text-center whitespace-nowrap">{tx.ownerName}</td>
                                  <td className="border border-slate-400 px-4 py-2 text-center whitespace-nowrap">{tx.date.split('-').reverse().join('-')}</td>
                                  <td className="border border-slate-400 px-4 py-2 text-left whitespace-nowrap">
                                    {tx.notes || tx.productName || (tx.productName === 'Supplier Payment' ? 'Supplier Payment' : 'Credit Purchase')}
                                  </td>
                                  <td className="border border-slate-400 px-4 py-2 text-center whitespace-nowrap">{getPaymentMethodDisplay(tx)}</td>
                                  <td className="border border-slate-400 px-4 py-2 text-center whitespace-nowrap">{tx.purchaseAmt.toLocaleString('en-IN')}</td>
                                  <td className="border border-slate-400 px-4 py-2 text-center whitespace-nowrap">{tx.paymentAmt.toLocaleString('en-IN')}</td>
                                  <td className="border border-slate-400 px-4 py-2 text-center font-black whitespace-nowrap">{tx.dueBalance.toLocaleString('en-IN')}</td>
                                </tr>
                              ))
                            )}
                            <tr className="bg-slate-100 font-black text-[12px] text-black">
                              <td colSpan={4} className="border border-slate-400 px-4 py-3 text-right uppercase whitespace-nowrap">Total</td>
                              <td className="border border-slate-400 px-4 py-3 text-center whitespace-nowrap">{totalSupplierPurchase.toLocaleString('en-IN')}</td>
                              <td className="border border-slate-400 px-4 py-3 text-center whitespace-nowrap">{totalSupplierPayment.toLocaleString('en-IN')}</td>
                              <td className="border border-slate-400 px-4 py-3 text-center whitespace-nowrap"></td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-6">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                            <button
                              key={p}
                              onClick={() => setCurrentPage(p)}
                              className={cn(
                                "w-8 h-8 rounded-lg font-black text-xs transition-all",
                                currentPage === p ? "bg-blue-600 text-white shadow-lg" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              )}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-20 text-center text-slate-400 font-bold italic">
                      Please select a shop owner to view the report.
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-slate-300">
          <thead>
            <tr className="bg-[#e9f0f9]">
              <th className="px-3 py-4 border border-slate-300 text-center text-xs font-black text-slate-800 w-12">Sl</th>
              <th className="px-4 py-4 border border-slate-300 text-center text-xs font-black text-slate-800">Title</th>
              <th className="px-3 py-4 border border-slate-300 text-center text-xs font-black text-slate-800 w-24">Report</th>
            </tr>
          </thead>
          <tbody>
            {reportList.map((report) => (
              <tr key={report.sl} className="hover:bg-slate-50 transition-colors">
                <td className="px-3 py-4 border border-slate-300 text-center text-xs font-bold text-slate-900">
                  {report.sl}
                </td>
                <td className="px-4 py-4 border border-slate-300 text-left text-xs font-black text-[#1e293b]">
                  {report.title}
                </td>
                <td className="px-3 py-4 border border-slate-300 text-center">
                  <button 
                    onClick={() => handleOpenFilter(report.title)}
                    className="bg-[#2563eb] text-white px-3 py-2 rounded-lg font-bold text-[10px] hover:bg-blue-700 transition-all flex items-center gap-1 mx-auto whitespace-nowrap"
                  >
                    Report <ChevronRight size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FloatingInput({ label, value, onChange, type = "text" }: any) {
  return (
    <div className="relative group">
      <label className="absolute -top-3 left-4 px-2 bg-white text-slate-400 font-bold text-xs z-10 transition-all group-focus-within:text-blue-500">
        {label}
      </label>
      <input 
        type={type}
        className="w-full px-4 py-4 bg-white border border-slate-400 rounded-lg outline-none font-black text-slate-900 transition-all focus:border-blue-500 text-base shadow-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

