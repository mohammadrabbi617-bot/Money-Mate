import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, HandCoins, Phone, Calendar, ArrowUpRight, ArrowDownRight, Trash2, Edit3, X, Loader2, Info, Users, History, Search } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { translations } from '../translations';
import { financeService } from '../services/financeService';
import { Loan } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { useBackButton } from '../components/BackButtonProvider';

export default function LoansPage() {
  const { profile, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { registerHandler } = useBackButton();
  const topRef = useRef<HTMLDivElement>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [persons, setPersons] = useState<any[]>([]);
  const [banks, setBanks] = useState<any[]>([]);
  const [onlineAccounts, setOnlineAccounts] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);
  const [isRepaymentModalOpen, setIsRepaymentModalOpen] = useState(false);
  const [isListOpen, setIsListOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchListTerm, setSearchListTerm] = useState('');

  useEffect(() => {
    if (isModalOpen || isPersonModalOpen || isRepaymentModalOpen || isListOpen) {
      const unregister = registerHandler(() => {
        setIsModalOpen(false);
        setIsPersonModalOpen(false);
        setIsRepaymentModalOpen(false);
        setIsListOpen(false);
        navigate('/?menu=true', { replace: true });
        return true;
      });
      return unregister;
    }
  }, [isModalOpen, isPersonModalOpen, isRepaymentModalOpen, isListOpen, registerHandler, navigate]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('Transaction Saved Successfully');
  const [formError, setFormError] = useState<string | null>(null);
  const [cashBalance, setCashBalance] = useState(0);
  
  const [personFormData, setPersonFormData] = useState({
    name: '',
    fathersName: '',
    mobileNumber: '',
    address: ''
  });

  const [repaymentFormData, setRepaymentFormData] = useState({
    personId: '',
    transactionType: 'Loan Collection',
    paymentMethod: 'Cash',
    accountId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [formData, setFormData] = useState({
    personId: '',
    transactionType: 'Loan Given',
    paymentMethod: 'Cash',
    accountId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [loanNetwork, setLoanNetwork] = useState('');
  const [repaymentNetwork, setRepaymentNetwork] = useState('');

  const [isDropdown1Open, setIsDropdown1Open] = useState(false);
  const [searchTerm1, setSearchTerm1] = useState('');
  const dropdown1Ref = useRef<HTMLDivElement>(null);

  const [isDropdown2Open, setIsDropdown2Open] = useState(false);
  const [searchTerm2, setSearchTerm2] = useState('');
  const dropdown2Ref = useRef<HTMLDivElement>(null);

  const lang = profile?.language || 'en';
  const t = translations[lang as keyof typeof translations];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdown1Ref.current && !dropdown1Ref.current.contains(event.target as Node)) {
        setIsDropdown1Open(false);
      }
      if (dropdown2Ref.current && !dropdown2Ref.current.contains(event.target as Node)) {
        setIsDropdown2Open(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubLoans = financeService.subscribeToCollection('loans', user.uid, setLoans);
    const unsubPersons = financeService.subscribeToCollection('persons', user.uid, setPersons);
    const unsubBanks = financeService.subscribeToCollection('banks', user.uid, setBanks);
    const unsubOnline = financeService.subscribeToCollection('onlineAccounts', user.uid, setOnlineAccounts);
    
    return () => {
      unsubLoans();
      unsubPersons();
      unsubBanks();
      unsubOnline();
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsubCash = financeService.getCashBalance(user.uid, setCashBalance);
    return () => unsubCash();
  }, [user]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const addPerson = searchParams.get('addPerson') === 'true';
    const addLoan = searchParams.get('addLoan') === 'true';
    const repayment = searchParams.get('repayment') === 'true';
    const loanList = searchParams.get('loanList') === 'true';

    setIsPersonModalOpen(addPerson);
    setIsModalOpen(addLoan);
    setIsRepaymentModalOpen(repayment);
    setIsListOpen(loanList);
    
    // Clear any previous errors when switching views
    setFormError(null);
  }, [location]);

  const handlePersonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!user || loading) return;

    if (!personFormData.name) {
      setFormError('Please provide a name!');
      return;
    }

    setLoading(true);
    try {
      await financeService.addDoc('persons', {
        ...personFormData,
        userId: user.uid
      });
      
      setPersonFormData({
        name: '',
        fathersName: '',
        mobileNumber: '',
        address: ''
      });
      
      setSuccessMessage('Person Added Successfully');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setFormError('Something went wrong!');
    } finally {
      setLoading(false);
    }
  };

  const handleRepaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || loading) return;

    const amount = parseFloat(repaymentFormData.amount);
    if (!repaymentFormData.personId || isNaN(amount) || amount <= 0) {
      setFormError('Please fill all information!');
      return;
    }

    const person = persons.find(p => p.id === repaymentFormData.personId);
    const isCollection = repaymentFormData.transactionType === 'Loan Collection';

    // 1. Balance Check Logic
    if (isCollection) {
      // Loan Collection: Cannot exceed person's Loan Given Balance
      const currentGiven = person?.loanGivenBalance || 0;
      if (amount > currentGiven) {
        setFormError('Insufficient loan balance for this person!');
        return;
      }
    } else {
      // Loan Repayment: Cannot exceed selected Payment Method's Balance
      let currentAccountBalance = 0;
      if (repaymentFormData.paymentMethod === 'Cash') {
        currentAccountBalance = cashBalance;
      } else if (repaymentFormData.paymentMethod === 'Bank') {
        const bank = banks.find(b => b.id === repaymentFormData.accountId);
        currentAccountBalance = bank?.currentBalance || 0;
      } else if (repaymentFormData.paymentMethod === 'Other') {
        const onlineAcc = onlineAccounts.find(a => a.id === repaymentFormData.accountId);
        currentAccountBalance = onlineAcc?.balance || 0;
      }

      if (amount > currentAccountBalance) {
        setFormError('Insufficient balance!');
        return;
      }
    }

    setLoading(true);
    try {
      // 2. Update Payment Method Balance
      const balanceChange = isCollection ? amount : -amount;
      await financeService.updateBalance(
        user.uid,
        repaymentFormData.paymentMethod,
        repaymentFormData.paymentMethod === 'Cash' ? null : repaymentFormData.accountId,
        balanceChange
      );

      // 3. Update Person Balance
      const currentGiven = person?.loanGivenBalance || 0;
      const currentTaken = person?.loanTakenBalance || 0;

      await financeService.updateDoc('persons', repaymentFormData.personId, {
        loanGivenBalance: isCollection ? currentGiven - amount : currentGiven,
        loanTakenBalance: !isCollection ? currentTaken - amount : currentTaken
      });

      // 4. Add to Transactions (using 'loans' collection so we can track history)
      await financeService.addDoc('loans', {
        userId: user.uid,
        personId: repaymentFormData.personId,
        personName: person?.name || 'Unknown',
        phoneNumber: person?.mobileNumber || '',
        type: isCollection ? 'collection' : 'repayment',
        principalAmount: amount,
        totalAmount: amount,
        startDate: repaymentFormData.date,
        notes: repaymentFormData.notes,
        paymentMethod: repaymentFormData.paymentMethod,
        accountId: repaymentFormData.paymentMethod === 'Cash' ? null : repaymentFormData.accountId,
        otherMethod: repaymentFormData.paymentMethod === 'Other' ? repaymentNetwork : null
      });
      
      setRepaymentFormData({
        personId: '',
        transactionType: isCollection ? 'Loan Collection' : 'Loan Repayment',
        paymentMethod: 'Cash',
        accountId: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      setRepaymentNetwork('');
      
      setFormError(null);
      setSuccessMessage('Transaction Saved Successfully');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setFormError('Something went wrong!');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || loading) return;

    const amount = parseFloat(formData.amount);
    if (!formData.personId || isNaN(amount) || amount <= 0) {
      setFormError('Please fill all information!');
      return;
    }

    // Balance check for Loan Given
    if (formData.transactionType === 'Loan Given') {
      let currentBalance = 0;
      if (formData.paymentMethod === 'Cash') {
        currentBalance = cashBalance;
      } else if (formData.paymentMethod === 'Bank') {
        const bank = banks.find(b => b.id === formData.accountId);
        currentBalance = bank?.currentBalance || 0;
      } else if (formData.paymentMethod === 'Other') {
        const onlineAcc = onlineAccounts.find(a => a.id === formData.accountId);
        currentBalance = onlineAcc?.balance || 0;
      }

      if (amount > currentBalance) {
        setFormError('Insufficient balance!');
        return;
      }
    }

    setLoading(true);
    try {
      const person = persons.find(p => p.id === formData.personId);
      const isGiven = formData.transactionType === 'Loan Given';

      // 1. Update Payment Method Balance
      const balanceChange = isGiven ? -amount : amount;
      await financeService.updateBalance(
        user.uid, 
        formData.paymentMethod, 
        formData.paymentMethod === 'Cash' ? null : formData.accountId, 
        balanceChange
      );

      // 2. Update Person Balance
      const currentGiven = person?.loanGivenBalance || 0;
      const currentTaken = person?.loanTakenBalance || 0;

      await financeService.updateDoc('persons', formData.personId, {
        loanGivenBalance: isGiven ? currentGiven + amount : currentGiven,
        loanTakenBalance: !isGiven ? currentTaken + amount : currentTaken
      });

      // 3. Add to Loans collection to show in list
      await financeService.addDoc('loans', {
        userId: user.uid,
        personId: formData.personId,
        personName: person?.name || 'Unknown',
        phoneNumber: person?.mobileNumber || '',
        type: isGiven ? 'given' : 'taken',
        principalAmount: amount,
        profitAmount: 0,
        totalAmount: amount,
        installmentAmount: amount,
        totalInstallments: 1,
        paidInstallments: 0,
        paidAmount: 0,
        remainingDue: amount,
        startDate: formData.date,
        status: 'active',
        notes: formData.notes,
        paymentMethod: formData.paymentMethod,
        accountId: formData.paymentMethod === 'Cash' ? null : formData.accountId,
        otherMethod: formData.paymentMethod === 'Other' ? loanNetwork : null
      });

      setFormData({ 
        personId: '',
        transactionType: 'Loan Given',
        paymentMethod: 'Cash',
        accountId: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      setLoanNetwork('');
      setSuccessMessage('Transaction Saved Successfully');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setFormError('Something went wrong!');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateInstallment = async (loan: Loan) => {
    if (loan.paidInstallments >= loan.totalInstallments) return;
    
    const confirmInstallment = window.confirm('Do you want to process this installment?');
    if (!confirmInstallment) return;

    const newPaidInstallments = loan.paidInstallments + 1;
    const newPaidAmount = loan.paidAmount + loan.installmentAmount;
    const newRemainingDue = Math.max(0, loan.totalAmount - newPaidAmount);
    
    await financeService.updateLoan(loan.id, {
      paidInstallments: newPaidInstallments,
      paidAmount: newPaidAmount,
      remainingDue: newRemainingDue,
      status: newRemainingDue <= 0 ? 'paid' : 'active'
    } as any);

    setSuccessMessage('Transaction Saved Successfully');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const filteredPersons1 = persons.filter(p => {
    if (formData.transactionType === 'Loan Given') {
      return (p.loanTakenBalance || 0) < 1;
    } else if (formData.transactionType === 'Loan Taken') {
      return (p.loanGivenBalance || 0) <= 0;
    }
    return true;
  }).filter(p =>
    (p.name || '').toLowerCase().includes(searchTerm1.toLowerCase())
  );

  const filteredPersons2 = persons.filter(p => {
    if (repaymentFormData.transactionType === 'Loan Collection') {
      return (p.loanGivenBalance || 0) > 0;
    } else if (repaymentFormData.transactionType === 'Loan Repayment') {
      return (p.loanTakenBalance || 0) > 0;
    }
    return true;
  }).filter(p =>
    (p.name || '').toLowerCase().includes(searchTerm2.toLowerCase())
  );

  const filteredPersonsList = persons.filter(p =>
    (p.name || '').toLowerCase().includes(searchListTerm.toLowerCase()) ||
    (p.fathersName || '').toLowerCase().includes(searchListTerm.toLowerCase()) ||
    (p.mobileNumber || '').toLowerCase().includes(searchListTerm.toLowerCase()) ||
    (p.address || '').toLowerCase().includes(searchListTerm.toLowerCase())
  );

  return (
    <div className="space-y-10">
      {(isListOpen || (!isModalOpen && !isRepaymentModalOpen && !isPersonModalOpen)) && (
        <div className="bg-white p-2 md:p-4 flex flex-col pt-2">
          <div className="flex flex-col items-center justify-center mb-3 text-center">
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
              {lang === 'bn' ? 'ব্যক্তি তালিকা' : 'Persons List'}
            </h2>
            <p className="text-slate-400 font-bold mt-0.5 tracking-widest font-mono text-[9px] uppercase">
              {lang === 'bn' ? `মোট ${persons.length} জন রেজিস্টার্ড ব্যক্তি` : `Total ${persons.length} registered persons`}
            </p>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
            <div className="flex items-center gap-4 w-full justify-center">
              <div className="relative group/search w-full md:w-80">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black group-focus-within/search:text-blue-500 transition-colors" />
                <input
                  type="text"
                  placeholder={lang === 'bn' ? 'ব্যক্তি খুঁজুন...' : 'Search person...'}
                  value={searchListTerm}
                  onChange={(e) => setSearchListTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-1.5 bg-white border border-slate-400 rounded-lg outline-none font-bold text-black transition-all focus:border-blue-500 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full border-collapse border border-slate-400">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-400 px-2 py-1.5 text-center text-xs font-black text-slate-900 uppercase tracking-wider">{lang === 'bn' ? 'ক্রমিক' : 'SL'}</th>
                  <th className="border border-slate-400 px-3 py-1.5 text-center text-xs font-black text-slate-900 uppercase tracking-wider">{lang === 'bn' ? 'নাম' : 'Name'}</th>
                  <th className="border border-slate-400 px-3 py-1.5 text-center text-xs font-black text-slate-900 uppercase tracking-wider">{lang === 'bn' ? 'পিতার নাম' : "Father's Name"}</th>
                  <th className="border border-slate-400 px-3 py-1.5 text-center text-xs font-black text-slate-900 uppercase tracking-wider">{lang === 'bn' ? 'মোবাইল' : 'Mobile'}</th>
                  <th className="border border-slate-400 px-3 py-1.5 text-center text-xs font-black text-slate-900 uppercase tracking-wider">{lang === 'bn' ? 'ঠিকানা' : 'Address'}</th>
                  <th className="border border-slate-400 px-3 py-1.5 text-center text-xs font-black text-slate-900 uppercase tracking-wider">{lang === 'bn' ? 'ধার দেওয়া' : 'Loan Given'}</th>
                  <th className="border border-slate-400 px-3 py-1.5 text-center text-xs font-black text-slate-900 uppercase tracking-wider">{lang === 'bn' ? 'ধার নেওয়া' : 'Loan Taken'}</th>
                  <th className="border border-slate-400 px-3 py-1.5 text-center text-xs font-black text-slate-900 uppercase tracking-wider">{lang === 'bn' ? 'অবशिष्ट ব্যালেন্স' : 'Net Balance'}</th>
                  <th className="border border-slate-400 px-3 py-1.5 text-center text-xs font-black text-slate-900 uppercase tracking-wider">{lang === 'bn' ? 'অ্যাকশন' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {filteredPersonsList.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="border border-slate-400 px-3 py-6 text-center text-slate-400 font-bold italic">
                      {lang === 'bn' ? 'কোনো ব্যক্তি পাওয়া যায়নি' : 'No persons found'}
                    </td>
                  </tr>
                ) : (
                  filteredPersonsList.map((person, idx) => {
                    const balance = (person.loanGivenBalance || 0) - (person.loanTakenBalance || 0);
                    return (
                      <tr key={person.id} className="hover:bg-slate-50 transition-colors">
                        <td className="border border-slate-400 px-2 py-1 text-center font-bold text-black text-sm">{idx + 1}</td>
                        <td className="border border-slate-400 px-3 py-1 truncate text-left font-black text-black text-sm uppercase">{person.name}</td>
                        <td className="border border-slate-400 px-3 py-1 truncate text-left font-bold text-slate-600 text-sm uppercase">{person.fathersName || 'N/A'}</td>
                        <td className="border border-slate-400 px-3 py-1 truncate text-left font-mono font-medium text-indigo-600 text-sm">{person.mobileNumber || 'N/A'}</td>
                        <td className="border border-slate-400 px-3 py-1 truncate text-left font-bold text-slate-600 text-sm uppercase">{person.address || 'N/A'}</td>
                        <td className="border border-slate-400 px-3 py-1 text-center font-black text-sm text-emerald-700 whitespace-nowrap">
                          {Math.abs(person.loanGivenBalance || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="border border-slate-400 px-3 py-1 text-center font-black text-sm text-rose-700 whitespace-nowrap">
                          {Math.abs(person.loanTakenBalance || 0).toLocaleString('en-IN')}
                        </td>
                        <td className={cn(
                          "border border-slate-400 px-3 py-1 text-center font-black text-sm whitespace-nowrap",
                          balance >= 0 ? "text-emerald-700" : "text-rose-700"
                        )}>
                          {Math.abs(balance).toLocaleString('en-IN')}
                        </td>
                        <td className="border border-slate-400 px-3 py-1 text-center">
                          <button
                            type="button"
                            onClick={async () => {
                              if (window.confirm(lang === 'bn' ? 'আপনি কি নিশ্চিতভাবে এই ব্যক্তিকে ডিলিট করতে চান?' : 'Are you sure you want to delete this person?')) {
                                try {
                                  await financeService.deleteDoc('persons', person.id);
                                  alert(lang === 'bn' ? 'সাফল্যের সাথে ডিলিট করা হয়েছে' : 'Person deleted successfully');
                                } catch (error) {
                                  console.error(error);
                                  alert('Error deleting person');
                                }
                              }
                            }}
                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors inline-flex items-center cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

       {/* Loan Given or Taken Full Page Modal */}
       <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-[calc(4rem+env(safe-area-inset-top,0px))] bottom-0 left-0 right-0 lg:top-0 lg:bottom-0 lg:left-[88px] z-50 bg-white overflow-y-auto shadow-2xl"
          >
            <div className="max-w-4xl mx-auto px-6 pt-16 pb-40 relative">
              <div className="flex flex-col items-center justify-center text-center mb-8 px-4">
                <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                  Loan given or taken
                </h2>
                <p className="text-slate-400 font-bold mt-4">
                  Record personal loan transactions
                </p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-10 px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-slate-500 ml-1">Payment Method</label>
                    <select 
                      className="w-full px-4 py-4 bg-white border border-slate-400 rounded-lg outline-none font-black text-black transition-all focus:ring-4 focus:ring-slate-100 appearance-none text-base"
                      value={formData.paymentMethod}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, paymentMethod: e.target.value, accountId: '' }));
                        setLoanNetwork('');
                      }}
                    >
                      <option value="Cash">Cash</option>
                      <option value="Bank">Bank</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {formData.paymentMethod === 'Bank' && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 relative group">
                      <label className="absolute -top-3 px-2 bg-white text-slate-400 font-bold text-xs z-10 transition-colors group-focus-within:text-blue-600">Select Bank Account</label>
                      <select 
                        required
                        className="w-full px-4 py-4 bg-white border border-slate-400 rounded-lg outline-none font-black text-black transition-all focus:ring-4 focus:ring-slate-100 appearance-none text-base shadow-sm"
                        value={formData.accountId}
                        onChange={(e) => setFormData(prev => ({ ...prev, accountId: e.target.value }))}
                      >
                        <option value="">Select Bank</option>
                        {banks.map(bank => (
                          <option key={bank.id} value={bank.id}>{bank.accountName} ({bank.accountNumber})</option>
                        ))}
                      </select>
                    </motion.div>
                  )}

                  {formData.paymentMethod === 'Other' && (
                    <>
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 relative group">
                        <label className="absolute -top-3 px-2 bg-white text-slate-400 font-bold text-xs z-10 transition-colors group-focus-within:text-blue-600">Platform</label>
                        <select 
                          required
                          className="w-full px-4 py-4 bg-white border border-slate-400 rounded-lg outline-none font-black text-black transition-all focus:ring-4 focus:ring-slate-100 appearance-none text-base shadow-sm"
                          value={loanNetwork}
                          onChange={(e) => {
                            setLoanNetwork(e.target.value);
                            setFormData(prev => ({ ...prev, accountId: '' }));
                          }}
                        >
                          <option value="">Select Platform</option>
                          {['Bkash', 'Nagad', 'Rocket', 'Upay', 'Other'].map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </motion.div>

                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 relative group">
                        <label className="absolute -top-3 px-2 bg-white text-slate-400 font-bold text-xs z-10 transition-colors group-focus-within:text-blue-600">Select Account</label>
                        <select 
                          required
                          className="w-full px-4 py-4 bg-white border border-slate-400 rounded-lg outline-none font-black text-black transition-all focus:ring-4 focus:ring-slate-100 appearance-none text-base shadow-sm"
                          value={formData.accountId}
                          onChange={(e) => setFormData(prev => ({ ...prev, accountId: e.target.value }))}
                        >
                          <option value="">Select Account</option>
                          {onlineAccounts
                            .filter(acc => !loanNetwork || acc.platform === loanNetwork || acc.method === loanNetwork)
                            .map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.accountName || acc.platform} ({acc.accountNumber})</option>
                          ))}
                        </select>
                      </motion.div>
                    </>
                  )}

                  <div className="relative group">
                    <label className="absolute -top-2.5 left-4 px-2 bg-white text-slate-400 font-bold text-xs z-10 transition-colors group-focus-within:text-blue-600">
                      Transaction Type
                    </label>
                    <select 
                      className="w-full px-4 py-4 bg-white border border-slate-400 rounded-lg outline-none font-black text-black transition-all focus:ring-4 focus:ring-slate-100 appearance-none text-base"
                      value={formData.transactionType}
                      onChange={(e) => setFormData(prev => ({ ...prev, transactionType: e.target.value }))}
                    >
                      <option value="Loan Given">Loan Given</option>
                      <option value="Loan Taken">Loan Taken</option>
                    </select>
                  </div>

                  <div className="relative" ref={dropdown1Ref}>
                    <label className="absolute -top-2.5 left-4 px-2 bg-white text-slate-400 font-bold text-xs z-15 transition-colors group-focus-within:text-blue-600">
                      Choice Person
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsDropdown1Open(!isDropdown1Open)}
                      className="w-full flex items-center justify-between px-4 py-4 bg-white border border-slate-400 rounded-lg outline-none font-black text-black transition-all focus:ring-4 focus:ring-slate-100 text-base text-left shadow-sm hover:border-slate-500"
                    >
                      <span className="font-bold text-[15px] text-[#000000]">
                        {formData.personId ? (persons.find(p => p.id === formData.personId)?.name || 'Select Person') : 'Select Person'}
                      </span>
                      <span className="text-slate-400 text-xs ml-2 select-none">▼</span>
                    </button>

                    {isDropdown1Open && (
                      <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-300 rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-100">
                        {/* Search Box */}
                        <div className="px-4 py-2.5 bg-slate-50">
                          <input
                            type="text"
                            value={searchTerm1}
                            onChange={(e) => setSearchTerm1(e.target.value)}
                            placeholder="Search Person"
                            className="w-full bg-transparent border-0 outline-none text-slate-800 placeholder-slate-400 font-bold text-[14px] py-1"
                          />
                        </div>
                        
                        {/* Scrollable Person List */}
                        <div className="max-h-60 overflow-y-auto">
                          {filteredPersons1.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-slate-400 italic">No person found</div>
                          ) : (
                            filteredPersons1.map(p => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, personId: p.id }));
                                  setIsDropdown1Open(false);
                                  setSearchTerm1('');
                                }}
                                className="w-full px-4 py-2.5 text-left font-bold text-[14px] hover:bg-slate-100 text-black transition-colors border-b border-slate-100 last:border-0 flex items-center justify-between"
                              >
                                <span>{p.name}</span>
                                {p.mobileNumber && (
                                  <span className="text-xs text-slate-400 font-normal">
                                    {p.mobileNumber}
                                  </span>
                                )}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <FloatingInput 
                    label="Date" 
                    type="date"
                    value={formData.date} 
                    onChange={(val: any) => setFormData(prev => ({ ...prev, date: val }))}
                    required
                  />

                  <FloatingInput 
                    label="Amount" 
                    type="number"
                    value={formData.amount} 
                    onChange={(val: any) => setFormData(prev => ({ ...prev, amount: val }))}
                    required
                  />

                  <div className="md:col-span-2">
                    <FloatingInput 
                      label="Note (Optional)" 
                      value={formData.notes} 
                      onChange={(val: any) => setFormData(prev => ({ ...prev, notes: val }))}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-4 pt-4">
                  {formError && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="px-6 py-3 bg-rose-50 text-rose-500 rounded-xl font-bold text-sm border-2 border-rose-100 text-center"
                    >
                      {formError}
                    </motion.div>
                  )}
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={loading}
                    type="submit" 
                    className="w-full px-16 py-5 bg-slate-900 text-white rounded-2xl font-black text-xl shadow-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-4"
                  >
                    {loading ? <Loader2 className="animate-spin" size={24} /> : (
                      <>
                        <HandCoins size={24} strokeWidth={2.5} />
                        Save Record
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loan Repayment Full Page Modal */}
      <AnimatePresence>
        {isRepaymentModalOpen && (
          <motion.div 
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-[calc(4rem+env(safe-area-inset-top,0px))] bottom-0 left-0 right-0 lg:top-0 lg:bottom-0 lg:left-[88px] z-50 bg-white overflow-y-auto shadow-2xl"
          >
            <div className="max-w-4xl mx-auto px-6 pt-16 pb-40 relative">
              <div className="flex flex-col items-center justify-center text-center mb-8 px-4">
                <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                  Loan repayment or collection
                </h2>
                <p className="text-slate-400 font-bold mt-4">
                  Record loan repayment transactions
                </p>
              </div>
              
              <form onSubmit={handleRepaymentSubmit} className="space-y-10 px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="relative group">
                    <label className="absolute -top-2.5 left-4 px-2 bg-white text-slate-400 font-bold text-xs z-10">Payment Method</label>
                    <select 
                      className="w-full px-4 py-4 bg-white border border-slate-400 rounded-lg outline-none font-black text-black transition-all focus:ring-4 focus:ring-slate-100 appearance-none text-base shadow-sm"
                      value={repaymentFormData.paymentMethod}
                      onChange={(e) => {
                        setRepaymentFormData(prev => ({ ...prev, paymentMethod: e.target.value, accountId: '' }));
                        setRepaymentNetwork('');
                      }}
                    >
                      <option value="Cash">Cash</option>
                      <option value="Bank">Bank</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {repaymentFormData.paymentMethod === 'Bank' && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="relative group">
                      <label className="absolute -top-2.5 left-4 px-2 bg-white text-slate-400 font-bold text-xs z-10 transition-colors group-focus-within:text-blue-600">Select Bank Account</label>
                      <select 
                        required
                        className="w-full px-4 py-4 bg-white border border-slate-400 rounded-lg outline-none font-black text-black transition-all focus:ring-4 focus:ring-slate-100 appearance-none text-base shadow-sm"
                        value={repaymentFormData.accountId}
                        onChange={(e) => setRepaymentFormData(prev => ({ ...prev, accountId: e.target.value }))}
                      >
                        <option value="">Select Bank</option>
                        {banks.map(bank => (
                          <option key={bank.id} value={bank.id}>{bank.accountName} ({bank.accountNumber})</option>
                        ))}
                      </select>
                    </motion.div>
                  )}

                  {repaymentFormData.paymentMethod === 'Other' && (
                    <>
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="relative group">
                        <label className="absolute -top-2.5 left-4 px-2 bg-white text-slate-400 font-bold text-xs z-10">Platform</label>
                        <select 
                          required
                          className="w-full px-4 py-4 bg-white border border-slate-400 rounded-lg outline-none font-black text-black transition-all focus:ring-4 focus:ring-slate-100 appearance-none text-base shadow-sm"
                          value={repaymentNetwork}
                          onChange={(e) => {
                            setRepaymentNetwork(e.target.value);
                            setRepaymentFormData(prev => ({ ...prev, accountId: '' }));
                          }}
                        >
                          <option value="">Select Platform</option>
                          <option value="Bkash">Bkash</option>
                          <option value="Nagad">Nagad</option>
                          <option value="Rocket">Rocket</option>
                          <option value="Upay">Upay</option>
                          <option value="Other">Other</option>
                        </select>
                      </motion.div>

                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="relative group">
                        <label className="absolute -top-2.5 left-4 px-2 bg-white text-slate-400 font-bold text-xs z-10">Select Account</label>
                        <select 
                          required
                          className="w-full px-4 py-4 bg-white border border-slate-400 rounded-lg outline-none font-black text-black transition-all focus:ring-4 focus:ring-slate-100 appearance-none text-base shadow-sm"
                          value={repaymentFormData.accountId}
                          onChange={(e) => setRepaymentFormData(prev => ({ ...prev, accountId: e.target.value }))}
                        >
                          <option value="">Select Account</option>
                          {onlineAccounts
                            .filter(acc => !repaymentNetwork || acc.platform === repaymentNetwork || acc.method === repaymentNetwork)
                            .map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.accountName || acc.method} ({acc.accountNumber})</option>
                          ))}
                        </select>
                      </motion.div>
                    </>
                  )}

                  <div className="relative group">
                    <label className="absolute -top-2.5 left-4 px-2 bg-white text-slate-400 font-bold text-xs z-10">Transaction Type</label>
                    <select 
                      className="w-full px-4 py-4 bg-white border border-slate-400 rounded-lg outline-none font-black text-black transition-all focus:ring-4 focus:ring-slate-100 appearance-none text-base shadow-sm"
                      value={repaymentFormData.transactionType}
                      onChange={(e) => setRepaymentFormData(prev => ({ ...prev, transactionType: e.target.value }))}
                    >
                      <option value="Loan Collection">Loan Collection</option>
                      <option value="Loan Repayment">Loan Repayment</option>
                    </select>
                  </div>

                  <div className="relative" ref={dropdown2Ref}>
                    <label className="absolute -top-2.5 left-4 px-2 bg-white text-slate-400 font-bold text-xs z-10">Select Person</label>
                    <button
                      type="button"
                      onClick={() => setIsDropdown2Open(!isDropdown2Open)}
                      className="w-full flex items-center justify-between px-4 py-4 bg-white border border-slate-400 rounded-lg outline-none font-black text-black transition-all focus:ring-4 focus:ring-slate-100 text-base text-left shadow-sm hover:border-slate-500"
                    >
                      <span className="font-bold text-[15px] text-[#000000]">
                        {repaymentFormData.personId ? (persons.find(p => p.id === repaymentFormData.personId)?.name || 'Select Person') : 'Select Person'}
                      </span>
                      <span className="text-slate-400 text-xs ml-2 select-none">▼</span>
                    </button>

                    {isDropdown2Open && (
                      <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-300 rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-100">
                        {/* Search Box */}
                        <div className="px-4 py-2.5 bg-slate-50">
                          <input
                            type="text"
                            value={searchTerm2}
                            onChange={(e) => setSearchTerm2(e.target.value)}
                            placeholder="Search Person"
                            className="w-full bg-transparent border-0 outline-none text-slate-800 placeholder-slate-400 font-bold text-[14px] py-1"
                          />
                        </div>
                        
                        {/* Scrollable Person List */}
                        <div className="max-h-60 overflow-y-auto">
                          {filteredPersons2.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-slate-400 italic">No person found</div>
                          ) : (
                            filteredPersons2.map(p => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                  setRepaymentFormData(prev => ({ ...prev, personId: p.id }));
                                  setIsDropdown2Open(false);
                                  setSearchTerm2('');
                                }}
                                className="w-full px-4 py-2.5 text-left font-bold text-[14px] hover:bg-slate-100 text-black transition-colors border-b border-slate-100 last:border-0 flex items-center justify-between"
                              >
                                <span>{p.name}</span>
                                {p.mobileNumber && (
                                  <span className="text-xs text-slate-400 font-normal">
                                    {p.mobileNumber}
                                  </span>
                                )}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <FloatingInput 
                    label="Date" 
                    type="date"
                    value={repaymentFormData.date} 
                    onChange={(val: any) => setRepaymentFormData(prev => ({ ...prev, date: val }))}
                    required
                  />

                  <FloatingInput 
                    label="Amount" 
                    type="number"
                    value={repaymentFormData.amount} 
                    onChange={(val: any) => setRepaymentFormData(prev => ({ ...prev, amount: val }))}
                    required
                  />

                  <div className="md:col-span-2">
                    <FloatingInput 
                      label="Note (Optional)" 
                      value={repaymentFormData.notes} 
                      onChange={(val: any) => setRepaymentFormData(prev => ({ ...prev, notes: val }))}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-4 pt-4">
                  {formError && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="px-6 py-3 bg-rose-50 text-rose-500 rounded-xl font-bold text-sm border-2 border-rose-100 text-center"
                    >
                      {formError}
                    </motion.div>
                  )}
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={loading}
                    type="submit" 
                    className="w-full px-16 py-5 bg-slate-900 text-white rounded-2xl font-black text-xl shadow-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-4"
                  >
                    {loading ? <Loader2 className="animate-spin" size={24} /> : (
                      <span className="whitespace-nowrap">Process Payment</span>
                    )}
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add New Person Full Page Modal */}
      <AnimatePresence>
        {isPersonModalOpen && (
          <motion.div 
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-[calc(4rem+env(safe-area-inset-top,0px))] bottom-0 left-0 right-0 lg:top-0 lg:bottom-0 lg:left-[88px] z-50 bg-white overflow-y-auto shadow-2xl"
          >
            <div className="max-w-4xl mx-auto px-6 pt-16 pb-40 relative">
              <div className="flex flex-col items-center justify-center text-center mb-8 px-4">
                <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                  Add new person
                </h2>
                <p className="text-slate-400 font-bold mt-4">
                  Register a new person for loan management
                </p>
              </div>

              <form onSubmit={handlePersonSubmit} className="space-y-10 px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <FloatingInput 
                    label="Full Name" 
                    value={personFormData.name} 
                    onChange={(val: any) => setPersonFormData(prev => ({ ...prev, name: val }))}
                    required
                  />
                  <FloatingInput 
                    label="Father's Name" 
                    value={personFormData.fathersName} 
                    onChange={(val: any) => setPersonFormData(prev => ({ ...prev, fathersName: val }))}
                    required
                  />
                  <FloatingInput 
                    label="Mobile Number" 
                    type="number"
                    value={personFormData.mobileNumber} 
                    onChange={(val: any) => setPersonFormData(prev => ({ ...prev, mobileNumber: val }))}
                    required
                  />
                  <div className="md:col-span-2">
                    <FloatingInput 
                      label="Address" 
                      value={personFormData.address} 
                      onChange={(val: any) => setPersonFormData(prev => ({ ...prev, address: val }))}
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-4 pt-4">
                  {formError && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="px-6 py-3 bg-rose-50 text-rose-500 rounded-xl font-bold text-sm border-2 border-rose-100 text-center"
                    >
                      {formError}
                    </motion.div>
                  )}
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={loading}
                    type="submit" 
                    className="w-full px-16 py-5 bg-slate-900 text-white rounded-2xl font-black text-xl shadow-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-4"
                  >
                    {loading ? <Loader2 className="animate-spin" size={24} /> : (
                      <>
                        <Plus size={24} strokeWidth={2.5} />
                        Add Person
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* View All Persons Modal removed as it's now integrated into the main view */}
      
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] px-8 py-3 bg-slate-900 text-white rounded-full shadow-2xl flex items-center gap-3 border border-white/10 whitespace-nowrap"
          >
            <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white shrink-0">
              <HandCoins size={14} strokeWidth={3} />
            </div>
            <span className="font-bold text-sm leading-none">{successMessage}</span>
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
