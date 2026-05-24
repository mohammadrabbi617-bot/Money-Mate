import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Building2, CreditCard, ArrowRightLeft, TrendingUp, TrendingDown, Trash2, Edit3, X, Loader2, ArrowUpRight, ArrowDownRight, History, Landmark, ChevronLeft, List, Wallet } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { translations } from '../translations';
import { useBackButton } from '../components/BackButtonProvider';
import { financeService } from '../services/financeService';
import { BankAccount } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

export default function BankAccountsPage() {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const location = useLocation();
  const statementRef = useRef<HTMLDivElement>(null);
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [cashBalance, setCashBalance] = useState(0);
  const [onlineAccounts, setOnlineAccounts] = useState<any[]>([]);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isBankListModalOpen, setIsBankListModalOpen] = useState(false);
  const [isStatementViewOpen, setIsStatementViewOpen] = useState(false);
  const [showStatementResults, setShowStatementResults] = useState(false);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [incomes, setIncomes] = useState<any[]>([]);
  const [loans, setLoansData] = useState<any[]>([]);
  const [onlineTxs, setOnlineTxs] = useState<any[]>([]);
  const [creditTxs, setCreditTxs] = useState<any[]>([]);
  const [statementFilters, setStatementFilters] = useState({
    accountId: '',
    fromDate: new Date().toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0]
  });
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([]);
  const [editingBankId, setEditingBankId] = useState<string | null>(null);
  
  const [accountFormData, setAccountFormData] = useState({
    bankName: '',
    accountName: '',
    accountNumber: '',
    branchName: '',
    currentBalance: ''
  });

  const [txFormData, setTxFormData] = useState({
    bankId: '',
    amount: '',
    type: 'Deposit' as 'Deposit' | 'Withdrawal',
    paymentMethod: 'Cash',
    otherMethod: 'Bkash',
    methodAccountId: '',
    sourceBankId: '',
    date: new Date().toISOString().split('T')[0],
    note: ''
  });

  const [withoutPaymentMethod, setWithoutPaymentMethod] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const lang = profile?.language || 'en';
  const t = translations[lang as keyof typeof translations];

  const { registerHandler } = useBackButton();

  useEffect(() => {
    if (isAccountModalOpen || isBankListModalOpen || isTxModalOpen || isStatementViewOpen) {
      const unregister = registerHandler(() => {
        if (isAccountModalOpen) {
          setIsAccountModalOpen(false);
          navigate('/?menu=true', { replace: true });
          return true;
        }
        if (isBankListModalOpen) {
          setIsBankListModalOpen(false);
          navigate('/?menu=true', { replace: true });
          return true;
        }
        if (isTxModalOpen) {
          setIsTxModalOpen(false);
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
    isAccountModalOpen,
    isBankListModalOpen,
    isTxModalOpen,
    isStatementViewOpen,
    showStatementResults,
    registerHandler,
    navigate
  ]);

  useEffect(() => {
    if (!user) return;
    const unsubBanks = financeService.subscribeToCollection('banks', user.uid, setBanks);
    const unsubTxs = financeService.subscribeToCollection('bankTransactions', user.uid, setTransactions);
    const unsubExpenses = financeService.subscribeToCollection('expenses', user.uid, setExpenses);
    const unsubIncomes = financeService.subscribeToCollection('incomes', user.uid, setIncomes);
    const unsubLoans = financeService.subscribeToCollection('loans', user.uid, setLoansData);
    const unsubOnlineTxs = financeService.subscribeToCollection('onlineTransactions', user.uid, setOnlineTxs);
    const unsubCreditTxs = financeService.subscribeToCollection('creditTransactions', user.uid, setCreditTxs);
    const unsubCash = financeService.getCashBalance(user.uid, setCashBalance);
    const unsubOnline = financeService.subscribeToCollection('onlineAccounts', user.uid, setOnlineAccounts);
    return () => { 
      unsubBanks(); unsubTxs(); unsubCash(); unsubOnline(); 
      unsubExpenses(); unsubIncomes(); unsubLoans(); unsubOnlineTxs(); unsubCreditTxs();
    };
  }, [user]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const add = searchParams.get('add') === 'true';
    const deposit = searchParams.get('deposit') === 'true';
    const withdraw = searchParams.get('withdraw') === 'true';
    const statement = searchParams.get('statement') === 'true';
    const list = searchParams.get('list') === 'true';

    // Set visibility states based on URL, ensuring exclusivity
    setIsAccountModalOpen(add);
    setIsBankListModalOpen(list);
    setIsStatementViewOpen(statement);
    setIsTxModalOpen(deposit || withdraw);

    if (deposit) {
      setTxFormData(prev => ({ ...prev, type: 'Deposit' }));
    }
    if (withdraw) {
      setTxFormData(prev => ({ ...prev, type: 'Withdrawal' }));
    }

    if (statement) {
      setTimeout(() => {
        statementRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    }
  }, [location.search]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const add = searchParams.get('add') === 'true';
    if (!add) {
      setEditingBankId(null);
      setAccountFormData({
        bankName: '',
        accountName: '',
        accountNumber: '',
        branchName: '',
        currentBalance: ''
      });
    }
  }, [location.search]);

  const handleViewStatement = () => {
    if (!statementFilters.accountId) {
      alert('Please select an account');
      return;
    }

    const allTxs: any[] = [];

    // 1. Bank Transactions
    transactions.forEach(tx => {
      if (tx.bankId === statementFilters.accountId) {
        let displayPaymentMethod = '';
        if (tx.paymentMethod === 'None') {
          displayPaymentMethod = tx.type === 'Deposit' ? 'Deposit' : 'Withdraw';
        } else if (tx.paymentMethod === 'Other') {
          displayPaymentMethod = tx.otherMethod || 'Other';
        } else {
          displayPaymentMethod = tx.paymentMethod || 'Bank';
        }

        allTxs.push({
          ...tx,
          amount: typeof tx.amount === 'number' ? tx.amount : 0,
          displayNote: tx.note || 'N/A',
          sourceName: displayPaymentMethod
        });
      }
    });

    // 2. Expenses via Bank
    expenses.forEach(ex => {
      if (ex.paymentMethod === 'Bank' && ex.accountId === statementFilters.accountId) {
        allTxs.push({
          ...ex,
          amount: typeof ex.amount === 'number' ? ex.amount : 0,
          type: 'Withdrawal',
          displayNote: ex.note || 'N/A',
          sourceName: 'Expense'
        });
      }
    });

    // 3. Incomes via Bank
    incomes.forEach(inc => {
      if (inc.paymentMethod === 'Bank' && inc.accountId === statementFilters.accountId) {
        allTxs.push({
          ...inc,
          amount: typeof inc.amount === 'number' ? inc.amount : 0,
          type: 'Deposit',
          displayNote: inc.note || 'N/A',
          sourceName: 'Income'
        });
      }
    });

    // 4. Loans via Bank
    loans.forEach(loan => {
      if (loan.paymentMethod === 'Bank' && loan.accountId === statementFilters.accountId) {
        allTxs.push({
          ...loan,
          amount: loan.principalAmount || loan.amount || 0,
          type: loan.type === 'given' ? 'Withdrawal' : 'Deposit',
          date: loan.startDate || loan.date,
          displayNote: loan.notes || loan.note || 'N/A',
          sourceName: 'Loans'
        });
      }
    });

    // 5. Online Transactions via Bank
    onlineTxs.forEach(otx => {
      if (otx.paymentMethod === 'Bank' && otx.bankId === statementFilters.accountId) {
        allTxs.push({
          ...otx,
          amount: typeof otx.amount === 'number' ? otx.amount : 0,
          type: otx.type === 'receive' ? 'Withdrawal' : 'Deposit', 
          displayNote: otx.note || 'N/A',
          sourceName: otx.platform || 'Online'
        });
      }
    });

    // 6. Credit System via Bank (Payments)
    creditTxs.forEach(ctx => {
      if (ctx.paidAmount > 0 && ctx.accountId === statementFilters.accountId) {
        allTxs.push({
          ...ctx,
          amount: ctx.paidAmount || 0,
          type: 'Withdrawal',
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

    const selectedBank = banks.find(b => b.id === statementFilters.accountId);
    const bankCurrentBalance = selectedBank ? selectedBank.currentBalance : 0;

    let totalNetChange = 0;
    chronologicallySortedAllTxs.forEach(tx => {
      if (tx.type === 'Deposit') {
        totalNetChange += tx.amount;
      } else {
        totalNetChange -= tx.amount;
      }
    });

    const initialBalance = bankCurrentBalance - totalNetChange;

    let runBal = initialBalance;
    const allTxsWithBalance = chronologicallySortedAllTxs.map(tx => {
      if (tx.type === 'Deposit') {
        runBal += tx.amount;
      } else {
        runBal -= tx.amount;
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

    setFilteredTransactions(filtered);
    setShowStatementResults(true);
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || loading) return;

    setLoading(true);
    try {
      if (editingBankId) {
        await financeService.updateDoc('banks', editingBankId, {
          bankName: accountFormData.bankName,
          accountName: accountFormData.accountName,
          accountNumber: accountFormData.accountNumber,
          branchName: accountFormData.branchName,
          currentBalance: Number(accountFormData.currentBalance) || 0
        });
        setSuccessMessage('Account Updated Successfully');
      } else {
        await financeService.addBank({
          bankName: accountFormData.bankName,
          accountName: accountFormData.accountName,
          accountNumber: accountFormData.accountNumber,
          branchName: accountFormData.branchName,
          currentBalance: Number(accountFormData.currentBalance) || 0,
          userId: user.uid
        });
        setSuccessMessage('Account Added Successfully');
      }
      
      setAccountFormData({ bankName: '', accountName: '', accountNumber: '', branchName: '', currentBalance: '' });
      setEditingBankId(null);
      setShowSuccess(true);
      
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
      navigate('/banks?list=true', { replace: true });
    } catch (err) {
      console.error(err);
      alert('Error saving bank account');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || loading) return;

    setFormError(null);

    const amount = Number(txFormData.amount);
    const selectedBank = banks.find(b => b.id === txFormData.bankId);
    if (!selectedBank) {
      setFormError('Please select a bank account');
      return;
    }

    // Validation Logic
    if (txFormData.type === 'Deposit') {
      if (!withoutPaymentMethod) {
        if (txFormData.paymentMethod === 'Cash') {
          if (amount > cashBalance) {
            setFormError(`Sorry! Not enough cash. Your balance is ${cashBalance.toLocaleString('en-IN')}`);
            return;
          }
        } else if (txFormData.paymentMethod === 'Bank') {
          const sourceBank = banks.find(b => b.id === txFormData.sourceBankId);
          if (!sourceBank || sourceBank.currentBalance < amount) {
            setFormError('Insufficient balance in source bank account!');
            return;
          }
        } else if (txFormData.paymentMethod === 'Other') {
          const otherAcc = onlineAccounts.find(a => a.id === txFormData.methodAccountId);
          if (!otherAcc || otherAcc.balance < amount) {
            setFormError('Insufficient balance in source account!');
            return;
          }
        }
      }
    } else {
      // Withdrawal
      if (amount > selectedBank.currentBalance) {
        setFormError(`Sorry! Not enough bank balance. Account balance is ${selectedBank.currentBalance.toLocaleString('en-IN')}`);
        return;
      }
    }

    setLoading(true);
    try {
      // 1. Record Transaction
      await financeService.addDoc('bankTransactions', {
        bankId: txFormData.bankId,
        bankName: selectedBank.bankName,
        amount,
        type: txFormData.type,
        date: txFormData.date,
        note: txFormData.note,
        paymentMethod: withoutPaymentMethod ? 'None' : txFormData.paymentMethod,
        sourceBankId: txFormData.sourceBankId,
        methodAccountId: txFormData.methodAccountId,
        otherMethod: txFormData.otherMethod,
        userId: user.uid,
        createdAt: new Date()
      });

      // 2. Update Primary Bank Balance
      const primaryBankChange = txFormData.type === 'Deposit' ? amount : -amount;
      await financeService.updateBalance(user.uid, 'Bank', txFormData.bankId, primaryBankChange);

      // 3. Update Payment Method Balance (if not "without")
      if (!withoutPaymentMethod) {
        const methodChange = txFormData.type === 'Deposit' ? -amount : amount;
        if (txFormData.paymentMethod === 'Cash') {
          await financeService.updateBalance(user.uid, 'Cash', null, methodChange);
        } else if (txFormData.paymentMethod === 'Bank' && txFormData.sourceBankId) {
          await financeService.updateBalance(user.uid, 'Bank', txFormData.sourceBankId, methodChange);
        } else if (txFormData.paymentMethod === 'Other' && txFormData.methodAccountId) {
          await financeService.updateBalance(user.uid, 'Other', txFormData.methodAccountId, methodChange);
        }
      }

      setTxFormData({ 
        bankId: '', 
        amount: '', 
        type: 'Deposit', 
        paymentMethod: 'Cash',
        otherMethod: 'Bkash',
        methodAccountId: '',
        sourceBankId: '',
        date: new Date().toISOString().split('T')[0], 
        note: '' 
      });
      setWithoutPaymentMethod(false);
      setSuccessMessage('Transaction Saved Successfully');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || 'Error saving transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-12 pb-20 relative">
      {!isAccountModalOpen && !isTxModalOpen && !isStatementViewOpen && !isBankListModalOpen && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-300">
           <Building2 size={64} strokeWidth={1} className="mb-4 opacity-20" />
           <p className="font-bold uppercase tracking-[0.2em] text-sm">Select an option from the menu</p>
        </div>
      )}

       {/* Link Account Full Page Overlay */}
       <AnimatePresence>
        {isAccountModalOpen && (
          <motion.div 
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-[calc(4rem+env(safe-area-inset-top,0px))] bottom-0 left-0 right-0 lg:top-0 lg:bottom-0 lg:left-[88px] z-40 bg-white overflow-y-auto"
          >
            <div className="max-w-4xl mx-auto px-6 pt-6 pb-40 relative text-center">
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
                  {editingBankId ? 'Edit your bank account' : 'Add your bank account'}
                </h2>
                <p className="text-slate-400 font-bold mt-4">Enter your banking credentials to link your account</p>
              </div>

              <form onSubmit={handleAddAccount} className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-12">
                  <FloatingInput 
                    label="Account Name" 
                    value={accountFormData.accountName} 
                    onChange={(val) => setAccountFormData(prev => ({ ...prev, accountName: val }))}
                    required
                  />
                  <FloatingInput 
                    label="Account Number" 
                    type="number"
                    value={accountFormData.accountNumber} 
                    onChange={(val) => setAccountFormData(prev => ({ ...prev, accountNumber: val }))}
                    required
                  />
                  <FloatingInput 
                    label="Bank Name" 
                    value={accountFormData.bankName} 
                    onChange={(val) => setAccountFormData(prev => ({ ...prev, bankName: val }))}
                    required
                  />
                  <FloatingInput 
                    label="Branch Name" 
                    value={accountFormData.branchName} 
                    onChange={(val) => setAccountFormData(prev => ({ ...prev, branchName: val }))}
                  />
                  <FloatingInput 
                    label="Current Balance" 
                    type="number"
                    value={accountFormData.currentBalance} 
                    onChange={(val) => setAccountFormData(prev => ({ ...prev, currentBalance: val }))}
                    required
                  />
                </div>

                <div className="flex flex-col gap-4 pt-4">
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={loading}
                    type="submit" 
                    className="w-full px-16 py-5 bg-slate-900 text-white rounded-2xl font-black text-xl shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-4"
                  >
                    {loading ? <Loader2 className="animate-spin" size={24} /> : (
                      <>
                        <Building2 size={24} strokeWidth={2.5} />
                        {editingBankId ? 'Update Account' : 'Save Account'}
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Transaction Full Page Overlay */}
      <AnimatePresence>
        {isTxModalOpen && (
          <motion.div 
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-[calc(4rem+env(safe-area-inset-top,0px))] bottom-0 left-0 right-0 lg:top-0 lg:bottom-0 lg:left-[88px] z-40 bg-white overflow-y-auto"
          >
            <div className="max-w-4xl mx-auto px-6 pt-10 pb-40 relative">
              <div className="flex flex-col items-center justify-center text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
                  {txFormData.type === 'Deposit' ? 'Bank deposit' : 'Bank withdrawal'}
                </h2>
                <p className="text-slate-400 font-bold mt-4">Record your banking transaction details accurately</p>
              </div>

              <form onSubmit={handleAddTransaction} className="space-y-10">
                <div className="flex items-center gap-4 p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl mb-10 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/[0.05] blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-500/[0.08] transition-colors" />
                  <input 
                    type="checkbox" 
                    id="withoutPayment"
                    className="w-7 h-7 rounded-lg text-indigo-600 focus:ring-indigo-500 border-slate-300 relative z-10"
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
                          value={txFormData.paymentMethod}
                          onChange={(e) => setTxFormData(prev => ({ ...prev, paymentMethod: e.target.value, sourceBankId: '', methodAccountId: '' }))}
                          className="w-full px-4 py-4 bg-white border border-slate-400 rounded-lg outline-none font-black text-black transition-all appearance-none focus:ring-4 focus:ring-slate-100 cursor-pointer shadow-sm text-base"
                        >
                          <option value="Cash">Cash</option>
                          <option value="Bank">Bank</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      {txFormData.paymentMethod === 'Bank' && (
                        <div className="relative group">
                          <label className="absolute -top-2.5 left-4 px-2 bg-white text-slate-400 font-bold text-xs z-10 transition-colors group-focus-within:text-indigo-500">
                            Select source bank account
                          </label>
                          <select
                            required
                            className="w-full px-4 py-4 bg-white border border-slate-400 rounded-lg outline-none font-black text-black transition-all appearance-none focus:ring-4 focus:ring-slate-100 cursor-pointer shadow-sm text-base"
                            value={txFormData.sourceBankId}
                            onChange={(e) => setTxFormData(prev => ({ ...prev, sourceBankId: e.target.value }))}
                          >
                            <option value="">Select bank</option>
                            {banks.filter(b => b.id !== txFormData.bankId).map(bank => (
                              <option key={bank.id} value={bank.id}>{bank.accountNumber} ({bank.accountName})</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {txFormData.paymentMethod === 'Other' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="relative group">
                            <label className="absolute -top-2.5 left-4 px-2 bg-white text-slate-400 font-bold text-xs z-10">
                              Platform
                            </label>
                            <select 
                              required
                              className="w-full px-4 py-4 bg-white border border-slate-400 rounded-lg outline-none font-black text-black transition-all appearance-none focus:ring-4 focus:ring-slate-100 cursor-pointer shadow-sm text-base"
                              value={txFormData.otherMethod}
                              onChange={(e) => setTxFormData(prev => ({ ...prev, otherMethod: e.target.value }))}
                            >
                              {['Bkash', 'Nagad', 'Rocket', 'Upay', 'Other'].map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                          </div>
                          <div className="relative group">
                            <label className="absolute -top-2.5 left-4 px-2 bg-white text-slate-400 font-bold text-xs z-10">
                              Account
                            </label>
                            <select 
                              required
                              className="w-full px-4 py-4 bg-white border border-slate-400 rounded-lg outline-none font-black text-black transition-all appearance-none focus:ring-4 focus:ring-slate-100 cursor-pointer shadow-sm text-base"
                              value={txFormData.methodAccountId}
                              onChange={(e) => setTxFormData(prev => ({ ...prev, methodAccountId: e.target.value }))}
                            >
                              <option value="">Select account</option>
                              {onlineAccounts.filter(a => a.platform === txFormData.otherMethod).map(acc => (
                                <option key={acc.id} value={acc.id}>{acc.accountName} ({acc.accountNumber})</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="relative group md:col-span-2">
                    <label className="absolute -top-2.5 left-4 px-2 bg-white text-slate-400 font-bold text-sm z-10">
                      Select Bank Account
                    </label>
                    <select
                      required
                      className="w-full px-4 py-4 bg-white border border-slate-400 rounded-lg outline-none font-black text-black transition-all appearance-none focus:ring-4 focus:ring-slate-100 cursor-pointer text-base shadow-sm"
                      value={txFormData.bankId}
                      onChange={(e) => setTxFormData(prev => ({ ...prev, bankId: e.target.value }))}
                    >
                      <option value="">Choose Account</option>
                      {banks.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.accountNumber} ({b.accountName})
                        </option>
                      ))}
                    </select>
                  </div>

                  {txFormData.bankId && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="md:col-span-2 -mt-6 ml-2 flex items-center gap-4 flex-wrap"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-400">
                          Current Bank Balance:
                        </span>
                        <span className="text-sm font-black text-indigo-600">
                          {banks.find(b => b.id === txFormData.bankId)?.currentBalance.toLocaleString('en-IN')}
                        </span>
                      </div>
                      
                      {!withoutPaymentMethod && txFormData.type === 'Deposit' && (
                        <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
                          <span className="text-[11px] font-bold text-slate-400">
                            Source Balance:
                          </span>
                          <span className={cn(
                            "text-sm font-black",
                            txFormData.paymentMethod === 'Cash' ? "text-emerald-600" : "text-indigo-600"
                          )}>
                            {txFormData.paymentMethod === 'Cash' 
                              ? cashBalance.toLocaleString('en-IN')
                              : txFormData.paymentMethod === 'Bank'
                                ? banks.find(b => b.id === txFormData.sourceBankId)?.currentBalance.toLocaleString('en-IN') || 0
                                : onlineAccounts.find(a => a.id === txFormData.methodAccountId)?.balance.toLocaleString('en-IN') || 0
                            }
                          </span>
                        </div>
                      )}
                    </motion.div>
                  )}

                  <FloatingInput 
                    label="Amount" 
                    type="number"
                    value={txFormData.amount} 
                    onChange={(val) => setTxFormData(prev => ({ ...prev, amount: val }))}
                    required
                  />

                  <FloatingInput 
                    label="Date" 
                    type="date"
                    value={txFormData.date} 
                    onChange={(val) => setTxFormData(prev => ({ ...prev, date: val }))}
                    required
                  />

                  <div className="md:col-span-2">
                    <FloatingInput 
                      label="Note (Optional)" 
                      value={txFormData.note} 
                      onChange={(val) => setTxFormData(prev => ({ ...prev, note: val }))}
                    />
                  </div>
                </div>                <div className="flex flex-col gap-6 pt-10">
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
                    className={`w-full py-6 rounded-2xl font-black text-xl shadow-2xl transition-all flex items-center justify-center gap-4 ${
                      txFormData.type === 'Deposit' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-rose-600 hover:bg-rose-700 text-white'
                    }`}
                  >
                    {loading ? <Loader2 className="animate-spin" size={24} /> : (
                      <>
                        <ArrowRightLeft size={24} strokeWidth={2.5} />
                        Save Transaction
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Bank Statement Full Page View */}
      <AnimatePresence>
        {isStatementViewOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-[calc(4rem+env(safe-area-inset-top,0px))] bottom-0 left-0 right-0 lg:top-0 lg:bottom-0 lg:left-[88px] z-40 bg-white flex items-center justify-center overflow-hidden"
          >
            {!showStatementResults ? (
              <div className="w-full max-w-sm mx-auto px-4 relative">
                <div className="flex flex-col items-center justify-center mb-4">
                  <h2 className="text-xl font-black text-slate-900 tracking-tight text-center underline decoration-indigo-500 decoration-4 underline-offset-4">
                    Generate Statement
                  </h2>
                </div>

                <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
                  <div className="space-y-1">
                    <label className="text-sm font-black text-slate-400 tracking-widest ml-1">
                      Select Bank Account
                    </label>
                    <select 
                      value={statementFilters.accountId}
                      onChange={(e) => setStatementFilters({...statementFilters, accountId: e.target.value})}
                      className="w-full p-4 bg-white border-2 border-slate-200 rounded-lg font-bold text-slate-900 focus:border-indigo-500 outline-none transition-all appearance-none text-base shadow-sm"
                    >
                      <option value="">Choose Account</option>
                      {banks.map(bank => (
                        <option key={bank.id} value={bank.id}>{bank.accountNumber} ({bank.accountName})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 tracking-widest ml-1">
                        From Date
                      </label>
                      <input 
                        type="date"
                        value={statementFilters.fromDate}
                        onChange={(e) => setStatementFilters({...statementFilters, fromDate: e.target.value})}
                        className="w-full p-4 bg-white border border-slate-400 rounded-lg font-bold text-slate-900 focus:border-indigo-500 outline-none transition-all text-base shadow-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 tracking-widest ml-1">
                        To Date
                      </label>
                      <input 
                        type="date"
                        value={statementFilters.toDate}
                        onChange={(e) => setStatementFilters({...statementFilters, toDate: e.target.value})}
                        className="w-full p-4 bg-white border border-slate-400 rounded-lg font-bold text-slate-900 focus:border-indigo-500 outline-none transition-all text-base shadow-sm"
                      />
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleViewStatement}
                    className="w-full py-4 bg-indigo-600 text-white rounded-lg font-black text-xs tracking-widest shadow-md hover:bg-indigo-700 transition-all flex items-center justify-center whitespace-nowrap"
                  >
                    View Statement
                  </motion.button>
                </div>
              </div>
            ) : (
              <div className="w-full h-full overflow-y-auto px-4 md:px-10 pt-10 pb-20 bg-white">
                <div className="max-w-[900px] mx-auto bg-white">
                  {/* Header */}
                  <div className="text-center mb-8">
                    <h1 className="text-2xl md:text-3xl font-black text-black tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
                      {banks.find(b => b.id === statementFilters.accountId)?.bankName || 'Bank'}
                    </h1>
                    <div className="mt-4">
                      <span className="text-lg font-black text-black underline decoration-2 underline-offset-4">
                        Account Statement
                      </span>
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2 mb-10 text-[13px]">
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <span className="w-32 font-black text-black">A/C No.</span>
                        <span className="font-black text-black">:</span>
                        <span className="font-bold text-black font-mono ml-2">
                          {banks.find(b => b.id === statementFilters.accountId)?.accountNumber}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="w-32 font-black text-black">A/C Name</span>
                        <span className="font-black text-black">:</span>
                        <span className="font-bold text-black ml-2">
                          {banks.find(b => b.id === statementFilters.accountId)?.accountName}
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
                          {banks.find(b => b.id === statementFilters.accountId)?.currentBalance.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="w-32 font-black text-black">Platform</span>
                        <span className="font-black text-black">:</span>
                        <span className="font-bold text-black ml-2">Bank</span>
                      </div>
                    </div>
                  </div>

                  {/* Statement Table */}
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
                        {filteredTransactions.length > 0 ? (() => {
                           const sortedTxs = [...filteredTransactions].sort((a, b) => a.date.localeCompare(b.date));
                           let runningBalance = 0; 
                           
                           return sortedTxs.map((tx) => {
                             const amount = typeof tx.amount === 'number' ? tx.amount : 0;
                             if (tx.type === 'Deposit') runningBalance += amount;
                             else runningBalance -= amount;

                             let formattedDate = 'Invalid';
                             try {
                               formattedDate = format(new Date(tx.date), 'dd/MM/yyyy');
                             } catch (e) {}

                             return (
                               <tr key={tx.id} className="text-[12px] h-10">
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
                                   {tx.type === 'Withdrawal' ? amount.toLocaleString('en-IN') : '0'}
                                 </td>
                                 <td className="border border-slate-400 px-3 py-2 text-center font-bold text-black">
                                   {tx.type === 'Deposit' ? amount.toLocaleString('en-IN') : '0'}
                                 </td>
                                 <td className="border border-slate-400 px-3 py-2 text-center font-black text-black">
                                   {(typeof tx.computedRunningBalance === 'number' ? tx.computedRunningBalance : 0).toLocaleString('en-IN')}
                                 </td>
                               </tr>
                             );
                           });
                        })() : (
                          <tr>
                            <td colSpan={6} className="border border-slate-400 py-20 text-center text-slate-400 font-bold italic">
                              No transactions found for the selected criteria.
                            </td>
                          </tr>
                        )}
                        {/* Footer Totals */}
                        <tr className="bg-white text-[12px]">
                          <td colSpan={3} className="border-t border-slate-400 px-4 py-3 text-right font-black text-black tracking-widest">Total</td>
                          <td className="border border-slate-400 px-3 py-3 text-center font-black text-black bg-slate-50">
                            {filteredTransactions.filter(tx => tx.type === 'Withdrawal').reduce((sum, tx) => sum + (typeof tx.amount === 'number' ? tx.amount : 0), 0).toLocaleString('en-IN')}
                          </td>
                          <td className="border border-slate-400 px-3 py-3 text-center font-black text-black bg-slate-50">
                            {filteredTransactions.filter(tx => tx.type === 'Deposit').reduce((sum, tx) => sum + (typeof tx.amount === 'number' ? tx.amount : 0), 0).toLocaleString('en-IN')}
                          </td>
                          <td className="border border-slate-400 px-3 py-3"></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-12 flex justify-end print:hidden">
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* All Bank List Modal View */}
      <AnimatePresence>
        {isBankListModalOpen && (
          <motion.div 
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-[calc(4rem+env(safe-area-inset-top,0px))] bottom-0 left-0 right-0 lg:top-0 lg:bottom-0 lg:left-[88px] z-40 bg-white overflow-y-auto"
          >
            <div className="max-w-7xl mx-auto px-6 pt-10 pb-20 relative">
              <div className="flex flex-col items-center justify-center mb-12 relative group">
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight text-center whitespace-nowrap overflow-hidden text-ellipsis uppercase">
                  All Bank Account List
                </h2>
              </div>

              <div className="overflow-x-auto w-full">
                <table className="w-full border-collapse border border-slate-400 min-w-max">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-slate-400 px-4 py-4 text-center text-xs font-black text-slate-900 uppercase tracking-wider">SL</th>
                      <th className="border border-slate-400 px-6 py-4 text-center text-xs font-black text-slate-900 uppercase tracking-wider">A/C Name</th>
                      <th className="border border-slate-400 px-6 py-4 text-center text-xs font-black text-slate-900 uppercase tracking-wider">A/C Number</th>
                      <th className="border border-slate-400 px-6 py-4 text-center text-xs font-black text-slate-900 uppercase tracking-wider">Bank Name</th>
                      <th className="border border-slate-400 px-6 py-4 text-center text-xs font-black text-slate-900 uppercase tracking-wider">Branch Name</th>
                      <th className="border border-slate-400 px-6 py-4 text-center text-xs font-black text-slate-900 uppercase tracking-wider">Balance</th>
                      <th className="border border-slate-400 px-6 py-4 text-center text-xs font-black text-slate-900 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {banks.map((bank, index) => (
                      <tr key={bank.id} className="hover:bg-slate-50 transition-colors">
                        <td className="border border-slate-400 px-4 py-2 text-center font-bold text-black text-sm">
                          {index + 1}
                        </td>
                        <td className="border border-slate-400 px-6 py-2 truncate text-left font-bold text-black text-sm uppercase">
                          {bank.accountName}
                        </td>
                        <td className="border border-slate-400 px-6 py-2 truncate text-left font-mono font-medium text-black text-sm">
                          {bank.accountNumber}
                        </td>
                        <td className="border border-slate-400 px-6 py-2 truncate text-left font-bold text-black text-sm">
                          {bank.bankName}
                        </td>
                        <td className="border border-slate-400 px-6 py-2 truncate text-left font-bold text-black text-sm">
                          {bank.branchName}
                        </td>
                        <td className="border border-slate-400 px-6 py-2 text-center font-black text-indigo-700 text-sm whitespace-nowrap">
                          {bank.currentBalance.toLocaleString('en-IN')}
                        </td>
                        <td className="border border-slate-400 px-6 py-2 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => {
                                setEditingBankId(bank.id);
                                setAccountFormData({
                                  bankName: bank.bankName,
                                  accountName: bank.accountName,
                                  accountNumber: bank.accountNumber,
                                  branchName: bank.branchName || '',
                                  currentBalance: String(bank.currentBalance || '')
                                });
                                navigate('/banks?add=true');
                              }}
                              className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all font-bold text-xs border border-blue-100"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={async () => {
                                if (bank.currentBalance > 0) {
                                  alert(`Sorry! This account has a balance of ${bank.currentBalance.toLocaleString('en-IN')}, so it cannot be deleted.`);
                                  return;
                                }
                                if (window.confirm('Are you sure you want to delete this account?')) {
                                  await financeService.deleteDoc('banks', bank.id);
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
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] px-8 py-4 bg-white text-emerald-600 rounded-2xl shadow-2xl flex items-center gap-4 border-2 border-emerald-100 min-w-[320px] justify-center"
          >
            <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white shrink-0">
              <Building2 size={18} strokeWidth={3} />
            </div>
            <span className="font-black text-lg tracking-tight whitespace-nowrap">
              {successMessage}
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
        className="w-full px-4 py-4 bg-white border border-slate-400 rounded-lg outline-none font-black text-black transition-all focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 text-base shadow-sm placeholder:text-slate-300"
      />
    </div>
  );
}

// Landmark was imported from lucide-react above
