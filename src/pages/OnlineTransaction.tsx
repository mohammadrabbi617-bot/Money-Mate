import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, Plus, Search, Filter, Trash2, Edit3, X, Loader2, Smartphone, Send, Landmark, Wallet, Check, BarChart3, History, ChevronDown } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useBackButton } from '../components/BackButtonProvider';
import { financeService } from '../services/financeService';
import { translations } from '../translations';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

export default function OnlineTransaction() {
  const { profile, user } = useAuth();
  const location = useLocation();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'transactions' | 'list'>('transactions');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    amount: '',
    platform: 'Bkash',
    type: 'Cash Out',
    date: new Date().toISOString().split('T')[0],
    note: ''
  });

  const lang = profile?.language || 'en';
  const t = translations[lang as keyof typeof translations];

  const [onlineAccounts, setOnlineAccounts] = useState<any[]>([]);
  const [banks, setBanks] = useState<any[]>([]);
  const [accountFormData, setAccountFormData] = useState({
    accountName: '',
    accountNumber: '',
    platform: 'Bkash'
  });
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isFullPageAddOpen, setIsFullPageAddOpen] = useState(false);
  const [isFullPageTransactionOpen, setIsFullPageTransactionOpen] = useState(false);
  const [isFullPageListOpen, setIsFullPageListOpen] = useState(false);
  const [isStatementViewOpen, setIsStatementViewOpen] = useState(false);
  const [showStatementResults, setShowStatementResults] = useState(false);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [incomes, setIncomes] = useState<any[]>([]);
  const [loans, setLoansData] = useState<any[]>([]);
  const [creditTxs, setCreditTxs] = useState<any[]>([]);
  const [bankTransactions, setBankTransactions] = useState<any[]>([]);
  const [statementFilters, setStatementFilters] = useState({
    accountId: '',
    platform: 'Bkash',
    fromDate: new Date().toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0]
  });
  const [statementFilteredTransactions, setStatementFilteredTransactions] = useState<any[]>([]);
  const [withoutPaymentMethod, setWithoutPaymentMethod] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [transactionFormData, setTransactionFormData] = useState({
    accountId: '',
    type: 'receive', // receive or payment
    paymentMethod: 'Cash',
    otherMethod: 'Bkash',
    methodAccountId: '',
    bankId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    note: ''
  });

  const { registerHandler } = useBackButton();
  const navigate = useNavigate();

  useEffect(() => {
    if (isModalOpen || isAccountModalOpen || isFullPageAddOpen || isFullPageTransactionOpen || isFullPageListOpen || isStatementViewOpen) {
      const unregister = registerHandler(() => {
        if (isModalOpen) {
          setIsModalOpen(false);
          return true;
        }
        if (isAccountModalOpen) {
          setIsAccountModalOpen(false);
          return true;
        }
        if (isFullPageAddOpen) {
          setIsFullPageAddOpen(false);
          navigate('/?menu=true', { replace: true });
          return true;
        }
        if (isFullPageTransactionOpen) {
          setIsFullPageTransactionOpen(false);
          navigate('/?menu=true', { replace: true });
          return true;
        }
        if (isFullPageListOpen) {
          setIsFullPageListOpen(false);
          navigate('/?menu=true', { replace: true });
          return true;
        }
        if (isStatementViewOpen) {
          if (showStatementResults) {
            setShowStatementResults(false);
            return true;
          } else {
            navigate('/?menu=true', { replace: true });
            return true;
          }
        }
        return false;
      });
      return unregister;
    }
  }, [
    isModalOpen,
    isAccountModalOpen,
    isFullPageAddOpen,
    isFullPageTransactionOpen,
    isFullPageListOpen,
    isStatementViewOpen,
    showStatementResults,
    registerHandler,
    navigate
  ]);

  useEffect(() => {
    if (!user) return;
    const unsubTx = financeService.subscribeToCollection('onlineTransactions', user.uid, (data) => {
      setTransactions(data);
    });
    const unsubAcc = financeService.subscribeToCollection('onlineAccounts', user.uid, (data) => {
      setOnlineAccounts(data);
    });
    const unsubBanks = financeService.subscribeToCollection('banks', user.uid, (data) => {
      setBanks(data);
    });
    const unsubExpenses = financeService.subscribeToCollection('expenses', user.uid, setExpenses);
    const unsubIncomes = financeService.subscribeToCollection('incomes', user.uid, setIncomes);
    const unsubLoans = financeService.subscribeToCollection('loans', user.uid, setLoansData);
    const unsubCreditTxs = financeService.subscribeToCollection('creditTransactions', user.uid, setCreditTxs);
    const unsubBankTxs = financeService.subscribeToCollection('bankTransactions', user.uid, setBankTransactions);
    
    return () => {
      unsubTx();
      unsubAcc();
      unsubBanks();
      unsubExpenses();
      unsubIncomes();
      unsubLoans();
      unsubCreditTxs();
      unsubBankTxs();
    };
  }, [user]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const method = searchParams.get('method') as string || 'Bkash';
    const action = searchParams.get('action');
    const tab = searchParams.get('tab');
    
    if (method) {
      setFormData(prev => ({ ...prev, platform: method }));
      setAccountFormData(prev => ({ ...prev, platform: method }));
      setSearch(method);
    }
    
    if (action === 'add') {
      setIsFullPageAddOpen(true);
      setIsAccountModalOpen(false);
    } else {
      setIsFullPageAddOpen(false);
    }

    if (action === 'transaction') {
      setIsFullPageTransactionOpen(true);
    } else {
      setIsFullPageTransactionOpen(false);
    }

    if (tab === 'list') {
      setActiveTab('list');
      setIsFullPageListOpen(true);
    } else {
      setActiveTab('transactions');
      setIsFullPageListOpen(false);
    }

    if (searchParams.get('statement') === 'true') {
      setIsStatementViewOpen(true);
      setShowStatementResults(false);
    } else {
      setIsStatementViewOpen(false);
    }
  }, [location, location.search]);

  const handleViewStatement = () => {
    if (!statementFilters.accountId) {
      alert('Please select an account');
      return;
    }

    const allTxs: any[] = [];

    // 1. Online Transactions (Primary)
    transactions.forEach(tx => {
      if (tx.accountId === statementFilters.accountId) {
        let displayPaymentMethod = '';
        if (tx.paymentMethod === 'None') {
          displayPaymentMethod = tx.type === 'receive' ? 'Receive' : 'Payment';
        } else if (tx.paymentMethod === 'Bank') {
          displayPaymentMethod = 'Bank';
        } else if (tx.paymentMethod === 'Other') {
          const a = onlineAccounts.find(acc => acc.id === tx.methodAccountId);
          displayPaymentMethod = a ? a.platform : 'Other';
        } else {
          displayPaymentMethod = tx.paymentMethod || 'Online';
        }

        allTxs.push({
          ...tx,
          amount: typeof tx.amount === 'number' ? tx.amount : 0,
          displayNote: tx.note || 'N/A',
          sourceName: displayPaymentMethod
        });
      }
      // If used as secondary payment method in another online transaction
      if (tx.paymentMethod === 'Other' && tx.methodAccountId === statementFilters.accountId) {
        allTxs.push({
          ...tx,
          type: tx.type === 'receive' ? 'payment' : 'receive', // Invert because it's the source
          amount: typeof tx.amount === 'number' ? tx.amount : 0,
          displayNote: tx.note || 'N/A',
          sourceName: tx.platform || 'Online'
        });
      }
    });

    // 2. Expenses via Online Account
    expenses.forEach(ex => {
      if (ex.paymentMethod === 'Other' && (ex.accountId === statementFilters.accountId || ex.methodAccountId === statementFilters.accountId)) {
        allTxs.push({
          ...ex,
          amount: typeof ex.amount === 'number' ? ex.amount : 0,
          type: 'payment',
          displayNote: ex.note || 'N/A',
          sourceName: 'Expense'
        });
      }
    });

    // 3. Incomes via Online Account
    incomes.forEach(inc => {
      if (inc.paymentMethod === 'Other' && (inc.accountId === statementFilters.accountId || inc.methodAccountId === statementFilters.accountId)) {
        allTxs.push({
          ...inc,
          amount: typeof inc.amount === 'number' ? inc.amount : 0,
          type: 'receive',
          displayNote: inc.note || 'N/A',
          sourceName: 'Income'
        });
      }
    });

    // 4. Loans via Online Account
    loans.forEach(loan => {
      if (loan.paymentMethod === 'Other' && (loan.accountId === statementFilters.accountId || loan.methodAccountId === statementFilters.accountId)) {
        const amtValue = loan.principalAmount || loan.amount || 0;
        const isDebit = loan.type === 'given' || loan.type === 'repayment';
        allTxs.push({
          ...loan,
          amount: typeof amtValue === 'number' ? amtValue : Number(amtValue) || 0,
          type: isDebit ? 'payment' : 'receive',
          date: loan.startDate || loan.date,
          displayNote: loan.notes || loan.note || 'N/A',
          sourceName: 'Loans'
        });
      }
    });

    // 5. Bank Transactions via Online Account
    bankTransactions.forEach(btx => {
      if (btx.paymentMethod === 'Other' && (btx.accountId === statementFilters.accountId || btx.methodAccountId === statementFilters.accountId)) {
        allTxs.push({
          ...btx,
          type: btx.type === 'Deposit' ? 'payment' : 'receive', // Invert because it's the online account's perspective
          amount: typeof btx.amount === 'number' ? btx.amount : 0,
          displayNote: btx.note || 'N/A',
          sourceName: 'Bank'
        });
      }
    });

    // 6. Credit System via Online Account
    creditTxs.forEach(ctx => {
      if (ctx.paidAmount > 0 && ctx.accountId === statementFilters.accountId) {
        allTxs.push({
          ...ctx,
          amount: ctx.paidAmount || 0,
          type: 'payment',
          displayNote: ctx.notes || ctx.note || 'Supplier Payment',
          sourceName: 'Credit System'
        });
      }
    });

    // Sort ALL history chronologically (oldest to newest) to calculate actual historical running balances
    const chronologicallySortedAllTxs = [...allTxs].sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      const timeA = a.createdAt ? (typeof a.createdAt.toDate === 'function' ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime()) : 0;
      const timeB = b.createdAt ? (typeof b.createdAt.toDate === 'function' ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime()) : 0;
      return timeA - timeB;
    });

    const selectedAccount = onlineAccounts.find(a => a.id === statementFilters.accountId);
    const accountCurrentBalance = selectedAccount ? selectedAccount.balance : 0;

    let totalNetChange = 0;
    chronologicallySortedAllTxs.forEach(tx => {
      const isDebit = tx.type === 'payment' || tx.type === 'given';
      if (isDebit) {
        totalNetChange -= tx.amount;
      } else {
        totalNetChange += tx.amount;
      }
    });

    const initialBalance = accountCurrentBalance - totalNetChange;

    let runBal = initialBalance;
    const allTxsWithBalance = chronologicallySortedAllTxs.map(tx => {
      const isDebit = tx.type === 'payment' || tx.type === 'given';
      if (isDebit) {
        runBal -= tx.amount;
      } else {
        runBal += tx.amount;
      }
      return {
        ...tx,
        computedRunningBalance: runBal
      };
    });

    // Filter results by selected date range
    const filtered = allTxsWithBalance.filter(tx => {
      if (!tx.date) return false;
      const matchesDateRange = tx.date >= statementFilters.fromDate && tx.date <= statementFilters.toDate;
      return matchesDateRange;
    });

    setStatementFilteredTransactions(filtered);
    setShowStatementResults(true);
  };

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      await financeService.addDoc('onlineAccounts', {
        accountName: accountFormData.accountName,
        accountNumber: accountFormData.accountNumber,
        platform: accountFormData.platform,
        balance: 0,
        userId: user.uid
      });
      
      // Clear inputs but stay on page as requested
      setAccountFormData(prev => ({ ...prev, accountName: '', accountNumber: '' }));
      setSuccessMsg('Online Account Added Successfully');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setFormError(null);

    const amountNum = Number(transactionFormData.amount);
    const selectedAccount = onlineAccounts.find(a => a.id === transactionFormData.accountId);
    
    if (!selectedAccount) {
      setFormError('Please select an account');
      return;
    }

    // Balance Check Logic
    if (transactionFormData.type === 'payment') {
      if (selectedAccount.balance < amountNum) {
        setFormError('Insufficient balance in ' + selectedAccount.platform + ' account!');
        return;
      }
    } else {
      // receive type
      if (!withoutPaymentMethod) {
        if (transactionFormData.paymentMethod === 'Bank') {
          const bank = banks.find(b => b.id === transactionFormData.bankId);
          if (!bank || bank.currentBalance < amountNum) {
            setFormError('Insufficient balance in Bank account!');
            return;
          }
        } else if (transactionFormData.paymentMethod === 'Other') {
          const otherAcc = onlineAccounts.find(a => a.id === transactionFormData.methodAccountId);
          if (!otherAcc || otherAcc.balance < amountNum) {
            setFormError('Insufficient balance in source account!');
            return;
          }
        }
      }
    }

    setLoading(true);
    try {
      // 1. Update Primary Online Account Balance
      const primaryChange = transactionFormData.type === 'receive' ? amountNum : -amountNum;
      await financeService.updateBalance(user.uid, 'Other', transactionFormData.accountId, primaryChange);

      // 2. Update Payment Method Balance (if not "without")
      if (!withoutPaymentMethod) {
        const methodChange = transactionFormData.type === 'receive' ? -amountNum : amountNum;
        if (transactionFormData.paymentMethod === 'Cash') {
          await financeService.updateBalance(user.uid, 'Cash', null, methodChange);
        } else if (transactionFormData.paymentMethod === 'Bank' && transactionFormData.bankId) {
          await financeService.updateBalance(user.uid, 'Bank', transactionFormData.bankId, methodChange);
        } else if (transactionFormData.paymentMethod === 'Other' && transactionFormData.methodAccountId) {
          await financeService.updateBalance(user.uid, 'Other', transactionFormData.methodAccountId, methodChange);
        }
      }

      // 3. Record Transaction
      await financeService.addDoc('onlineTransactions', {
        amount: amountNum,
        platform: selectedAccount.platform,
        type: transactionFormData.type,
        date: transactionFormData.date,
        note: transactionFormData.note,
        accountId: transactionFormData.accountId,
        paymentMethod: withoutPaymentMethod ? 'None' : transactionFormData.paymentMethod,
        bankId: transactionFormData.bankId,
        methodAccountId: transactionFormData.methodAccountId,
        userId: user.uid,
        createdAt: new Date()
      });

      setTransactionFormData(prev => ({ ...prev, amount: '', note: '' }));
      setSuccessMsg('Transaction Saved Successfully');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || 'Error recording transaction');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    // Keeping this for old modal if needed, but we'll prefer the new full page one
  };

  const platforms = ['Bkash', 'Nagad', 'Rocket', 'Upay', 'Other'];
  const types = ['Send Money', 'Cash Out', 'Payment', 'Mobile Recharge', 'Received'];

  const filteredTransactions = transactions.filter(item => 
    item.platform.toLowerCase().includes(search.toLowerCase()) || 
    item.type.toLowerCase().includes(search.toLowerCase()) ||
    item.note?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-10 relative">
      <AnimatePresence>
        {isFullPageAddOpen && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-[calc(4rem+env(safe-area-inset-top,0px))] bottom-0 left-0 right-0 lg:left-[88px] z-[100] bg-white overflow-y-auto"
          >
            <div className="max-w-4xl mx-auto px-6 pt-20 pb-40">
              <div className="flex flex-col items-center justify-center text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                  Add your {accountFormData.platform} account
                </h2>
                <div className="w-24 h-1.5 bg-blue-600 rounded-full mt-4" />
              </div>

              <form onSubmit={handleAccountSubmit} className="space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="relative group md:col-span-2">
                    <label className="absolute -top-2.5 left-4 px-2 bg-white text-slate-400 font-bold text-sm z-10 transition-colors group-focus-within:text-blue-600">
                      {t.platformName || 'Platform Name'}
                    </label>
                    <input
                      type="text"
                      disabled
                      value={accountFormData.platform}
                      className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-200 rounded-2xl outline-none font-black text-slate-400 cursor-not-allowed text-lg"
                    />
                  </div>

                  <FloatingInput 
                    label={t.accountOwner || 'Account Name / Owner'} 
                    value={accountFormData.accountName} 
                    onChange={(val: string) => setAccountFormData(prev => ({ ...prev, accountName: val }))}
                    required
                  />

                  <FloatingInput 
                    label={t.accountNumber || 'Account Number'} 
                    value={accountFormData.accountNumber} 
                    onChange={(val: string) => setAccountFormData(prev => ({ ...prev, accountNumber: val }))}
                    required
                  />
                </div>

                <div className="flex flex-col gap-6 pt-10">
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={loading}
                    type="submit" 
                    className="w-full py-6 bg-blue-600 text-white rounded-2xl font-black text-2xl shadow-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-4 border-b-8 border-blue-800 active:border-b-0 active:translate-y-2"
                  >
                    {loading ? <Loader2 className="animate-spin" size={28} /> : (
                      <>
                        <Plus size={28} strokeWidth={4} />
                        {t.registerAccount || 'Register Account'}
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {isFullPageTransactionOpen && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-[calc(4rem+env(safe-area-inset-top,0px))] bottom-0 left-0 right-0 lg:left-[88px] z-[100] bg-white overflow-y-auto"
          >
            <div className="max-w-4xl mx-auto px-6 pt-20 pb-40">
              <div className="flex flex-col items-center justify-center text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                  {formData.platform} transactions
                </h2>
                <div className="w-24 h-1.5 bg-blue-600 rounded-full mt-4" />
              </div>

              <form onSubmit={handleTransactionSubmit} className="space-y-10">
                <div className="flex items-center gap-4 p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl mb-10 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/[0.05] blur-3xl -mr-16 -mt-16 group-hover:bg-blue-500/[0.08] transition-colors" />
                  <input 
                    type="checkbox" 
                    id="withoutPayment"
                    className="w-7 h-7 rounded-lg text-blue-600 focus:ring-blue-500 border-slate-300 relative z-10"
                    checked={withoutPaymentMethod}
                    onChange={(e) => setWithoutPaymentMethod(e.target.checked)}
                  />
                  <label htmlFor="withoutPayment" className="font-black text-slate-600 cursor-pointer text-lg relative z-10 tracking-tight">
                    Transaction without payment method
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {!withoutPaymentMethod && (
                    <div className="md:col-span-2 space-y-8">
                      <div className="space-y-3">
                        <label className="flex items-center gap-2 text-sm font-bold text-slate-500 ml-1">
                          <Wallet size={14} />
                          Select Payment Method
                        </label>
                        <select
                          required
                          value={transactionFormData.paymentMethod}
                          onChange={(e) => setTransactionFormData(prev => ({ ...prev, paymentMethod: e.target.value, bankId: '', methodAccountId: '' }))}
                          className="w-full px-4 py-4 bg-white border border-slate-400 rounded-lg outline-none font-black text-black transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-50 appearance-none shadow-sm text-base"
                        >
                          <option value="Cash">Cash</option>
                          <option value="Bank">Bank</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      {transactionFormData.paymentMethod === 'Bank' && (
                        <div className="relative group">
                          <label className="absolute -top-2.5 left-4 px-2 bg-white text-slate-400 font-bold text-sm z-10 transition-colors group-focus-within:text-blue-500">
                            Select Bank Account
                          </label>
                          <select 
                            required
                            className="w-full px-4 py-4 bg-white border border-slate-400 rounded-lg outline-none font-black text-black transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-50 appearance-none shadow-sm text-base"
                            value={transactionFormData.bankId}
                            onChange={(e) => setTransactionFormData(prev => ({ ...prev, bankId: e.target.value }))}
                          >
                            <option value="">Select Bank</option>
                            {banks.map(bank => (
                              <option key={bank.id} value={bank.id}>{bank.accountName} ({bank.accountNumber})</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {transactionFormData.paymentMethod === 'Other' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                          <div className="relative group">
                            <label className="absolute -top-2.5 left-4 px-2 bg-white text-slate-400 font-bold text-sm z-10">
                              Platform
                            </label>
                            <select 
                              required
                              className="w-full px-4 py-4 bg-white border border-slate-400 rounded-lg outline-none font-black text-black transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-50 appearance-none shadow-sm text-base"
                              value={transactionFormData.otherMethod}
                              onChange={(e) => setTransactionFormData(prev => ({ ...prev, otherMethod: e.target.value }))}
                            >
                              {platforms.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                          </div>
                          <div className="relative group">
                            <label className="absolute -top-2.5 left-4 px-2 bg-white text-slate-400 font-bold text-sm z-10">
                              Account
                            </label>
                            <select 
                              required
                              className="w-full px-4 py-4 bg-white border border-slate-400 rounded-lg outline-none font-black text-black transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-50 appearance-none shadow-sm text-base"
                              value={transactionFormData.methodAccountId}
                              onChange={(e) => setTransactionFormData(prev => ({ ...prev, methodAccountId: e.target.value }))}
                            >
                              <option value="">Select Account</option>
                              {onlineAccounts.filter(a => a.platform === transactionFormData.otherMethod).map(acc => (
                                <option key={acc.id} value={acc.id}>{acc.accountName} ({acc.accountNumber})</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="relative group">
                    <label className="absolute -top-2.5 left-4 px-2 bg-white text-slate-400 font-bold text-sm z-10">
                      Select {formData.platform} Account
                    </label>
                    <select 
                      required
                      className="w-full px-4 py-4 bg-white border border-slate-400 rounded-lg outline-none font-black text-black transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-50 appearance-none shadow-sm text-base"
                      value={transactionFormData.accountId}
                      onChange={(e) => setTransactionFormData(prev => ({ ...prev, accountId: e.target.value }))}
                    >
                      <option value="">Select Account</option>
                      {onlineAccounts.filter(a => a.platform === formData.platform).map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.accountName} ({acc.accountNumber})</option>
                      ))}
                    </select>
                  </div>

                  <div className="relative group">
                    <label className="absolute -top-2.5 left-4 px-2 bg-white text-slate-400 font-bold text-sm z-10">
                      Transaction Type
                    </label>
                    <select 
                      required
                      className="w-full px-4 py-4 bg-white border border-slate-400 rounded-lg outline-none font-black text-black transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-50 appearance-none shadow-sm text-base"
                      value={transactionFormData.type}
                      onChange={(e) => setTransactionFormData(prev => ({ ...prev, type: e.target.value }))}
                    >
                      <option value="receive">Receive</option>
                      <option value="payment">Payment</option>
                    </select>
                  </div>

                  <FloatingInput 
                    label="Date" 
                    type="date"
                    value={transactionFormData.date} 
                    onChange={(val: string) => setTransactionFormData(prev => ({ ...prev, date: val }))}
                    required
                  />

                  <FloatingInput 
                    label="Amount" 
                    type="number"
                    value={transactionFormData.amount} 
                    onChange={(val: string) => setTransactionFormData(prev => ({ ...prev, amount: val }))}
                    required
                  />

                  <div className="md:col-span-2">
                    <FloatingInput 
                      label="Note" 
                      value={transactionFormData.note} 
                      onChange={(val: string) => setTransactionFormData(prev => ({ ...prev, note: val }))}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-6 pt-6">
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
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={loading}
                    type="submit" 
                    className="w-full py-6 bg-slate-900 text-white rounded-2xl font-black text-xl shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-4 border-b-4 border-slate-700 active:border-b-0 active:translate-y-1"
                  >
                    {loading ? <Loader2 className="animate-spin" size={24} /> : (
                      <>
                        <Plus size={24} strokeWidth={3} />
                        Save Transaction
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {isStatementViewOpen && !showStatementResults && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-[calc(4rem+env(safe-area-inset-top,0px))] bottom-0 left-0 right-0 lg:top-0 lg:bottom-0 lg:left-[88px] z-50 bg-white overflow-y-auto"
          >
            <div className="max-w-4xl mx-auto px-6 py-10 md:py-16">
              <div className="flex flex-col items-center justify-center text-center mb-8 md:mb-12">
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                  Generate Account Statement
                </h2>
                <p className="text-slate-400 font-bold mt-2">Select criteria to view detailed transaction history</p>
              </div>

              <div className="bg-slate-50 border-2 border-slate-100 rounded-[3rem] p-10 space-y-10 relative overflow-hidden group">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="relative group">
                    <label className="absolute -top-3 left-4 px-2 bg-white text-slate-400 font-bold text-xs z-10">
                      Platform
                    </label>
                    <select 
                      className="w-full px-4 py-4 bg-white border border-slate-400 rounded-lg outline-none font-black text-slate-900 transition-all focus:border-blue-500 appearance-none text-base shadow-sm"
                      value={statementFilters.platform}
                      onChange={(e) => setStatementFilters(prev => ({ ...prev, platform: e.target.value, accountId: '' }))}
                    >
                      {platforms.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>

                  <div className="relative group">
                    <label className="absolute -top-3 left-4 px-2 bg-white text-slate-400 font-bold text-xs z-10">
                      Select Account
                    </label>
                    <select 
                      className="w-full px-4 py-4 bg-white border border-slate-400 rounded-lg outline-none font-black text-slate-900 transition-all focus:border-blue-500 appearance-none text-base shadow-sm"
                      value={statementFilters.accountId}
                      onChange={(e) => setStatementFilters(prev => ({ ...prev, accountId: e.target.value }))}
                    >
                      <option value="">Select Account</option>
                      {onlineAccounts.filter(a => a.platform === statementFilters.platform).map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.accountName} ({acc.accountNumber})</option>
                      ))}
                    </select>
                  </div>

                  <FloatingInput 
                    label="Date From" 
                    type="date"
                    value={statementFilters.fromDate}
                    onChange={(val: string) => setStatementFilters(prev => ({ ...prev, fromDate: val }))}
                  />

                  <FloatingInput 
                    label="Date To" 
                    type="date"
                    value={statementFilters.toDate}
                    onChange={(val: string) => setStatementFilters(prev => ({ ...prev, toDate: val }))}
                  />
                </div>

                <div className="pt-6">
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleViewStatement}
                    className="w-full py-6 bg-blue-600 text-white rounded-2xl font-black text-xl shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-4"
                  >
                    <BarChart3 size={24} />
                    View Statement
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {showStatementResults && isStatementViewOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed top-[calc(4rem+env(safe-area-inset-top,0px))] bottom-0 left-0 right-0 lg:top-0 lg:bottom-0 lg:left-[88px] z-[60] bg-white overflow-y-auto"
          >
            <div className="max-w-5xl mx-auto px-4 py-6">
              {/* Official Statement Layout */}
              <div className="bg-white p-2 md:p-4">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-black text-black uppercase tracking-widest underline decoration-2 underline-offset-8">
                    A/C Statement
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2 mb-10 text-[13px]">
                  <div className="space-y-1">
                    <div className="flex items-center">
                      <span className="w-32 font-black text-black">A/C No.</span>
                      <span className="font-black text-black">:</span>
                      <span className="font-bold text-black font-mono ml-2">
                        {onlineAccounts.find(a => a.id === statementFilters.accountId)?.accountNumber}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-32 font-black text-black">A/C Name</span>
                      <span className="font-black text-black">:</span>
                      <span className="font-bold text-black ml-2">
                        {onlineAccounts.find(a => a.id === statementFilters.accountId)?.accountName}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center">
                      <span className="w-32 font-black text-black">Date From</span>
                      <span className="font-black text-black">:</span>
                      <span className="font-bold text-black ml-2">
                        {format(new Date(statementFilters.fromDate), 'dd-MM-yyyy')} <span className="font-black px-1 uppercase tracking-tighter">To :</span> {format(new Date(statementFilters.toDate), 'dd-MM-yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-32 font-black text-black">Current Balance</span>
                      <span className="font-black text-black">:</span>
                      <span className="font-bold text-black ml-2">
                        {onlineAccounts.find(a => a.id === statementFilters.accountId)?.balance.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-32 font-black text-black">Platform</span>
                      <span className="font-black text-black">:</span>
                      <span className="font-bold text-black ml-2">
                        {statementFilters.platform}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-slate-400">
                    <thead>
                      <tr className="bg-slate-200">
                        <th className="border border-slate-400 px-3 py-3 text-center text-[12px] font-black text-black tracking-tight w-24">Date</th>
                        <th className="border border-slate-400 px-4 py-3 text-center text-[12px] font-black text-black tracking-tight w-[280px]">Particulars</th>
                        <th className="border border-slate-400 px-3 py-3 text-center text-[12px] font-black text-black tracking-tight">Payment Method</th>
                        <th className="border border-slate-400 px-3 py-3 text-center text-[12px] font-black text-black tracking-tight">Debit</th>
                        <th className="border border-slate-400 px-3 py-3 text-center text-[12px] font-black text-black tracking-tight">Credit</th>
                        <th className="border border-slate-400 px-3 py-3 text-center text-[12px] font-black text-black tracking-tight">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statementFilteredTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="border border-slate-400 px-3 py-10 text-center font-bold text-slate-400 italic">
                            No data found
                          </td>
                        </tr>
                      ) : (
                        statementFilteredTransactions.map((tx, idx) => {
                          const isDebit = tx.type === 'payment' || tx.type === 'given';
                          const amount = Number(tx.amount || 0);
                          const formattedDate = format(new Date(tx.date), 'dd/MM/yyyy');

                          return (
                            <tr key={idx} className="hover:bg-slate-50 transition-all text-[12px]">
                              <td className="border border-slate-400 px-3 py-2 text-center font-bold text-black">
                                {formattedDate}
                              </td>
                              <td className="border border-slate-400 px-4 py-3 text-left font-bold text-black max-w-[280px] break-words leading-tight">
                                {tx.displayNote}
                              </td>
                              <td className="border border-slate-400 px-3 py-2 text-center font-bold text-black">
                                {tx.sourceName}
                              </td>
                              <td className="border border-slate-400 px-3 py-2 text-center font-bold text-black">
                                {isDebit ? amount.toLocaleString('en-IN') : '0'}
                              </td>
                              <td className="border border-slate-400 px-3 py-2 text-center font-bold text-black">
                                {!isDebit ? amount.toLocaleString('en-IN') : '0'}
                              </td>
                              <td className="border border-slate-400 px-3 py-2 text-center font-bold text-black">
                                {(typeof tx.computedRunningBalance === 'number' ? tx.computedRunningBalance : 0).toLocaleString('en-IN')}
                              </td>
                            </tr>
                          );
                        })
                      )}
                      {/* Total Row */}
                      <tr className="bg-slate-50 font-bold text-[12px]">
                        <td colSpan={3} className="border border-slate-400 px-3 py-3 text-right font-black text-black uppercase tracking-widest">
                          Total
                        </td>
                        <td className="border border-slate-400 px-3 py-3 text-center font-black text-black">
                          {statementFilteredTransactions.reduce((acc, tx) => (tx.type === 'payment' || tx.type === 'given' ? acc + (Number(tx.amount) || 0) : acc), 0).toLocaleString('en-IN')}
                        </td>
                        <td className="border border-slate-400 px-3 py-3 text-center font-black text-black">
                          {statementFilteredTransactions.reduce((acc, tx) => (tx.type === 'receive' || tx.type === 'taken' ? acc + (Number(tx.amount) || 0) : acc), 0).toLocaleString('en-IN')}
                        </td>
                        <td className="border border-slate-400 px-3 py-3 bg-slate-100"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isFullPageListOpen && (
          <motion.div 
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-[calc(4rem+env(safe-area-inset-top,0px))] bottom-0 left-0 right-0 lg:top-0 lg:bottom-0 lg:left-[88px] z-40 bg-white overflow-y-auto"
          >
            <div className="max-w-7xl mx-auto px-6 pt-10 pb-20 relative">
              <div className="flex flex-col items-center justify-center mb-10 relative group">
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight text-center whitespace-nowrap overflow-hidden text-ellipsis uppercase">
                  {formData.platform} Account List
                </h2>
              </div>

              <div className="overflow-x-auto w-full">
                <table className="w-full border-collapse border border-slate-400 min-w-max">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-slate-400 px-4 py-4 text-center text-xs font-black text-slate-900 uppercase tracking-wider">SL</th>
                      <th className="border border-slate-400 px-6 py-4 text-center text-xs font-black text-slate-900 uppercase tracking-wider">A/C Name</th>
                      <th className="border border-slate-400 px-6 py-4 text-center text-xs font-black text-slate-900 uppercase tracking-wider">A/C Number</th>
                      <th className="border border-slate-400 px-6 py-4 text-center text-xs font-black text-slate-900 uppercase tracking-wider">Platform</th>
                      <th className="border border-slate-400 px-6 py-4 text-center text-xs font-black text-slate-900 uppercase tracking-wider">Account Type</th>
                      <th className="border border-slate-400 px-6 py-4 text-center text-xs font-black text-slate-900 uppercase tracking-wider">Balance</th>
                      <th className="border border-slate-400 px-6 py-4 text-center text-xs font-black text-slate-900 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {onlineAccounts.filter(a => a.platform === formData.platform).map((acc, index) => (
                      <tr key={acc.id} className="hover:bg-slate-50 transition-colors">
                        <td className="border border-slate-400 px-4 py-2 text-center font-bold text-black text-sm">
                          {index + 1}
                        </td>
                        <td className="border border-slate-400 px-6 py-2 truncate text-left font-bold text-black text-sm uppercase">
                          {acc.accountName}
                        </td>
                        <td className="border border-slate-400 px-6 py-2 truncate text-left font-mono font-medium text-black text-sm">
                          {acc.accountNumber}
                        </td>
                        <td className="border border-slate-400 px-6 py-2 truncate text-left font-bold text-black text-sm">
                          {acc.platform}
                        </td>
                        <td className="border border-slate-400 px-6 py-2 truncate text-left font-bold text-black text-sm italic text-slate-400">
                          Digital Wallet
                        </td>
                        <td className="border border-slate-400 px-6 py-2 text-center font-black text-blue-700 text-sm whitespace-nowrap">
                          {acc.balance.toLocaleString('en-IN')}
                        </td>
                        <td className="border border-slate-400 px-6 py-2 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={async () => {
                                if (acc.balance > 0) {
                                  alert(`Sorry! This account has a balance of ${acc.balance.toLocaleString('en-IN')}, so it cannot be deleted.`);
                                  return;
                                }
                                if (window.confirm('Are you sure you want to delete this account?')) {
                                  await financeService.deleteDoc('onlineAccounts', acc.id);
                                }
                              }}
                              className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-all font-bold text-xs border border-rose-100"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {onlineAccounts.filter(a => a.platform === formData.platform).length === 0 && (
                      <tr>
                        <td colSpan={7} className="border border-slate-400 py-10 text-center text-slate-400 font-bold italic">
                          No {formData.platform} accounts found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAccountModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsAccountModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-2xl"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h2 className="text-2xl font-black text-slate-900">New Account</h2>
                <button onClick={() => setIsAccountModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleAccountSubmit} className="p-10 space-y-8">
                <div className="space-y-4">
                  <label className="block text-[12px] font-bold text-slate-500 ml-1">Account Name / Number</label>
                  <input 
                    type="text" required placeholder="e.g. My BKash 017..."
                    className="w-full px-6 py-4 bg-white border-2 border-slate-100 rounded-xl focus:border-blue-500 outline-none text-foreground font-black transition-all placeholder:text-slate-300 text-sm"
                    value={accountFormData.accountName}
                    onChange={(e) => setAccountFormData(prev => ({ ...prev, accountName: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="block text-[12px] font-bold text-slate-500 ml-1">Platform</label>
                    <select 
                      disabled
                      className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none text-foreground font-black opacity-40 text-sm"
                      value={accountFormData.platform}
                    >
                      {platforms.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="block text-[12px] font-bold text-slate-500 ml-1">Initial Balance</label>
                    <input 
                      type="number" required
                      className="w-full px-6 py-4 bg-white border-2 border-slate-100 rounded-xl focus:border-blue-500 outline-none text-foreground font-black transition-all text-sm"
                      value={accountFormData.balance}
                      onChange={(e) => setAccountFormData(prev => ({ ...prev, balance: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setIsAccountModalOpen(false)} className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-xl font-bold border border-slate-200 hover:bg-slate-100 transition-all text-xs">
                    Cancel
                  </button>
                  <button type="submit" disabled={loading} className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-3 text-xs">
                    {loading ? <Loader2 className="animate-spin" size={20} /> : (
                      <>
                        <Plus size={20} strokeWidth={2.5} />
                        Add Account
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

        {filteredTransactions.length === 0 && activeTab === 'transactions' && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-32 bg-slate-50 border-2 border-slate-100 rounded-[3rem] relative overflow-hidden"
          >
             <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/[0.03] to-transparent blur-3xl" />
             <div className="relative z-10">
               <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200 border border-slate-100 shadow-sm">
                 <Globe size={40} strokeWidth={1} />
               </div>
               <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-sm">Frequency Void</p>
               <p className="text-slate-300 font-bold text-xs mt-2 uppercase tracking-tight">Await digital synchronization pulse</p>
             </div>
          </motion.div>
        )}

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
                <h2 className="text-2xl font-black text-slate-900">Digital Transaction</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-10 space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="block text-[12px] font-bold text-slate-500 ml-1">Amount</label>
                    <input 
                      type="number" required placeholder="0.00"
                      className="w-full px-6 py-4 bg-white border-2 border-slate-100 rounded-xl focus:border-blue-500 outline-none text-foreground font-black text-2xl transition-all"
                      value={formData.amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="block text-[12px] font-bold text-slate-500 ml-1">Date</label>
                    <input 
                      type="date" required
                      className="w-full px-6 py-4 bg-white border-2 border-slate-100 rounded-xl focus:border-blue-500 outline-none text-foreground font-black transition-all text-sm"
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="block text-[12px] font-bold text-slate-500 ml-1">Platform</label>
                    <select 
                      className="w-full px-6 py-4 bg-white border-2 border-slate-100 rounded-xl focus:border-blue-500 outline-none text-foreground font-black transition-all appearance-none cursor-pointer text-sm"
                      value={formData.platform}
                      onChange={(e) => setFormData(prev => ({ ...prev, platform: e.target.value }))}
                    >
                      {platforms.map(p => <option key={p} value={p} className="bg-white text-slate-900">{p}</option>)}
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="block text-[12px] font-bold text-slate-500 ml-1">Type</label>
                    <select 
                      className="w-full px-6 py-4 bg-white border-2 border-slate-100 rounded-xl focus:border-blue-500 outline-none text-foreground font-black transition-all appearance-none cursor-pointer text-sm"
                      value={formData.type}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                    >
                      {types.map(t => <option key={t} value={t} className="bg-white text-slate-900">{t}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-[12px] font-bold text-slate-500 ml-1">Note</label>
                  <textarea 
                    rows={2}
                    className="w-full px-6 py-4 bg-white border-2 border-slate-100 rounded-xl focus:border-blue-500 outline-none text-foreground font-medium placeholder:text-slate-300 resize-none transition-all text-sm"
                    placeholder="Transaction note..."
                    value={formData.note}
                    onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-xl font-bold border border-slate-200 hover:bg-slate-100 transition-all text-xs">
                    Cancel
                  </button>
                  <button type="submit" disabled={loading} className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-3 text-sm">
                    {loading ? <Loader2 className="animate-spin" size={20} /> : (
                      <>
                        <Globe size={20} strokeWidth={2.5} />
                        Save Transaction
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[110] px-8 py-3 bg-slate-900 text-white rounded-full shadow-2xl flex items-center gap-3 border border-white/10 whitespace-nowrap"
          >
            <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white shrink-0">
              <Check size={14} strokeWidth={4} />
            </div>
            <span className="font-black text-sm tracking-tight">{successMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pb-20" />
    </div>
  );
}

function FloatingInput({ label, value, onChange, type = "text", required = false }: any) {
  const [isFocused, setIsFocused] = useState(false);
  
  return (
    <div className="relative group">
      <motion.label
        initial={false}
        animate={{
          y: (isFocused || value) ? -10 : 16,
          x: (isFocused || value) ? 12 : 20,
          scale: (isFocused || value) ? 0.8 : 1,
          backgroundColor: (isFocused || value) ? '#ffffff' : 'transparent',
          color: isFocused ? '#2563eb' : '#64748b'
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
        className="w-full px-4 py-4 bg-white border border-slate-400 rounded-lg outline-none font-black text-black transition-all focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 shadow-sm text-base placeholder:text-slate-300"
      />
    </div>
  );
}
