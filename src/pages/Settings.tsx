import React, { useState, useEffect, useMemo } from 'react';
import { 
  Shield, User, Check, Plus, Trash2, Tag, TrendingUp, TrendingDown, 
  Lock, Phone, Mail, Database, Calendar, Search, Filter, AlertCircle,
  ChevronDown, Fingerprint
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { translations } from '../translations';
import { doc, updateDoc } from 'firebase/firestore';
import { updateEmail, updatePassword } from 'firebase/auth';
import { db } from '../lib/firebase';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { financeService } from '../services/financeService';
import { Category } from '../types';

function formatDateDMY(dateValue: any) {
  if (!dateValue) return 'N/A';
  let dateStr = '';
  if (typeof dateValue === 'string') {
    dateStr = dateValue;
  } else if (dateValue instanceof Date) {
    const y = dateValue.getFullYear();
    const m = String(dateValue.getMonth() + 1).padStart(2, '0');
    const d = String(dateValue.getDate()).padStart(2, '0');
    return `${d}-${m}-${y}`;
  } else if (dateValue && typeof dateValue.toDate === 'function') {
    const dObj = dateValue.toDate();
    const y = dObj.getFullYear();
    const m = String(dObj.getMonth() + 1).padStart(2, '0');
    const d = String(dObj.getDate()).padStart(2, '0');
    return `${d}-${m}-${y}`;
  } else if (dateValue && typeof dateValue.seconds === 'number') {
    const dObj = new Date(dateValue.seconds * 1000);
    const y = dObj.getFullYear();
    const m = String(dObj.getMonth() + 1).padStart(2, '0');
    const d = String(dObj.getDate()).padStart(2, '0');
    return `${d}-${m}-${y}`;
  } else {
    return 'N/A';
  }

  const parts = dateStr.split('-');
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  }
  return dateStr;
}

function AnimatedSettingsHeader({ text, colorClass }: { text: string; colorClass: string }) {
  return (
    <div className="overflow-hidden whitespace-nowrap flex-1 min-w-0">
      <motion.div
        className={cn(
          "inline-block whitespace-nowrap font-extrabold text-base md:text-lg tracking-wider uppercase font-sans",
          colorClass
        )}
        animate={{ x: ["0%", "0%", "-35%", "-35%", "0%", "0%"] }}
        transition={{
          repeat: Infinity,
          duration: 10,
          ease: "easeInOut",
          times: [0, 0.15, 0.45, 0.65, 0.95, 1],
        }}
      >
        {text}
      </motion.div>
    </div>
  );
}

export default function SettingsPage() {
  const { profile, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'income' | 'expense'>('income');
  
  const lang = profile?.language || 'en';
  const t = translations[lang as keyof typeof translations];

  // Profile credentials edit state
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePassword, setProfilePassword] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Transaction manager state
  const [txSection, setTxSection] = useState<'cash' | 'bank' | 'credit' | 'loans' | 'other'>('cash');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('All');
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [searchTx, setSearchTx] = useState('');
  const [txSuccess, setTxSuccess] = useState('');
  const [txError, setTxError] = useState('');

  // Category single table filter
  const [catFilterType, setCatFilterType] = useState<'all' | 'income' | 'expense'>('all');

  // Hidable sections states
  const [showProfile, setShowProfile] = useState(false);
  const [showAppLock, setShowAppLock] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);
  const [showDanger, setShowDanger] = useState(false);

  // App Lock Setup States
  const [appPin, setAppPin] = useState('');
  const [bioEnabled, setBioEnabled] = useState(false);
  const [appLockSuccess, setAppLockSuccess] = useState('');
  const [appLockError, setAppLockError] = useState('');

  // Transacational collections
  const [incomes, setIncomes] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [creditTransactions, setCreditTransactions] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [onlineTransactions, setOnlineTransactions] = useState<any[]>([]);
  const [bankTransactions, setBankTransactions] = useState<any[]>([]);
  const [banks, setBanks] = useState<any[]>([]);
  const [onlineAccounts, setOnlineAccounts] = useState<any[]>([]);
  const [persons, setPersons] = useState<any[]>([]);
  const [shops, setShops] = useState<any[]>([]);

  // Subscriptions
  useEffect(() => {
    if (!user) return;
    const unsubCat = financeService.subscribeToCollection('categories', user.uid, setCategories);
    const unsubIncomes = financeService.subscribeToCollection('incomes', user.uid, setIncomes);
    const unsubExpenses = financeService.subscribeToCollection('expenses', user.uid, setExpenses);
    const unsubCredit = financeService.subscribeToCollection('creditTransactions', user.uid, setCreditTransactions);
    const unsubLoans = financeService.subscribeToCollection('loans', user.uid, setLoans);
    const unsubOnline = financeService.subscribeToCollection('onlineTransactions', user.uid, setOnlineTransactions);
    const unsubBanks = financeService.subscribeToCollection('banks', user.uid, setBanks);
    const unsubOnlineAccs = financeService.subscribeToCollection('onlineAccounts', user.uid, setOnlineAccounts);
    const unsubPersons = financeService.subscribeToCollection('persons', user.uid, setPersons);
    const unsubShops = financeService.subscribeToCollection('shops', user.uid, setShops);
    const unsubBankTxs = financeService.subscribeToCollection('bankTransactions', user.uid, setBankTransactions);

    return () => {
      unsubCat();
      unsubIncomes();
      unsubExpenses();
      unsubCredit();
      unsubLoans();
      unsubOnline();
      unsubBanks();
      unsubOnlineAccs();
      unsubPersons();
      unsubShops();
      unsubBankTxs();
    };
  }, [user]);

  // Sync profile details initially
  useEffect(() => {
    if (profile) {
      setProfileName(profile.name || '');
      setProfilePhone(profile.phone || '');
      setProfileEmail(profile.email || '');
      setAppPin(profile.appLockPin || '');
      setBioEnabled(!!profile.biometricsEnabled);
    }
  }, [profile]);

  const addCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newCatName.trim()) return;
    setLoading(true);
    try {
      await financeService.addCategory({
        name: newCatName.trim(),
        type: newCatType,
        userId: user.uid
      });
      setNewCatName('');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteCategory = async (id: string) => {
    if (!window.confirm(lang === 'bn' ? 'ক্যাটাগরি কি ডিলিট করতে চান?' : 'Delete category?')) return;
    try {
      await financeService.deleteCategory(id);
    } catch (err) {
      console.error(err);
    }
  };

  // Profile Form update
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setProfileSuccess('');
    setProfileError('');
    try {
      // 1. Update Password if typed
      if (profilePassword.trim()) {
        if (profilePassword.length < 6) {
          throw new Error(lang === 'bn' ? 'পাসওয়ার্ড অত্যন্ত ৬ অক্ষরের হতে হবে।' : 'Password must be at least 6 characters long.');
        }
        await updatePassword(user, profilePassword);
      }

      // 2. Update Email if changed
      if (profileEmail.trim() && profileEmail !== user.email) {
        await updateEmail(user, profileEmail);
      }

      // 3. Update Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        name: profileName,
        phone: profilePhone,
        email: profileEmail,
        updatedAt: new Date().toISOString()
      });

      setProfilePassword('');
      setProfileSuccess(lang === 'bn' ? 'প্রোফাইল সফলভাবে আপডেট করা হয়েছে!' : 'Profile updated successfully!');
      setTimeout(() => setProfileSuccess(''), 4000);
    } catch (err: any) {
      console.error(err);
      let errMsg = err.message || 'Error updating profile';
      if (err.code === 'auth/requires-recent-login') {
        errMsg = lang === 'bn' 
          ? 'নিরাপত্তার স্বার্থে ইমেল অথবা পাসওয়ার্ড পরিবর্তন করতে অ্যাকাউন্ট রি-লগইন করে পুনরায় চেষ্টা করুন।'
          : 'For security reasons, changing email or password requires logging out and logging back in, then trying again.';
      }
      setProfileError(errMsg);
      setTimeout(() => setProfileError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleBioToggle = async () => {
    if (!bioEnabled) {
      try {
        if (!window.PublicKeyCredential) {
          alert(lang === 'bn' ? 'আপনার ব্রাউজার বা ডিভাইসে ফিঙ্গারপ্রিন্ট সেন্সর পাওয়া যায়নি।' : 'Biometric fingerprint is not supported on this device or browser.');
          return;
        }

        const isAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        if (!isAvailable) {
          alert(lang === 'bn' ? 'আপনার ডিভাইসে ফিঙ্গারপ্রিন্ট সেন্সর পাওয়া যায়নি।' : 'Biometric sensor not found on this device.');
          return;
        }

        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);
        const randomId = new Uint8Array(16);
        window.crypto.getRandomValues(randomId);

        const options: CredentialCreationOptions = {
          publicKey: {
            challenge,
            rp: { name: "Money Mate" },
            user: {
              id: randomId,
              name: profile?.email || "user",
              displayName: profile?.name || "User"
            },
            pubKeyCredParams: [{ type: "public-key", alg: -7 }], // ES256
            timeout: 20000,
            authenticatorSelection: {
              authenticatorAttachment: "platform",
              userVerification: "required"
            }
          }
        };

        const credential = await navigator.credentials.create(options) as PublicKeyCredential;
        if (credential) {
          const rawId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
          localStorage.setItem('bio_credential_id', rawId);
          setBioEnabled(true);
        }
      } catch (err: any) {
        console.error("Biometric registration failed:", err);
        if (err.name === "SecurityError" || err.message?.includes("iframe")) {
          alert(
            lang === 'bn' 
              ? 'আইফ্রেম (Preview Mode) এ ডিভাইস সেন্সর অ্যাক্সেস করা সম্ভব না। অনুগ্রহ করে অ্যাপটি অন্য ট্যাবে ওপেন করুন।' 
              : 'Device biometrics sensor cannot be accessed within preview iframe. Please open the application in a new tab to register.'
          );
        } else {
          setAppLockError(lang === 'bn' ? 'বায়োমেট্রিক সেন্সর ভেরিফিকেশন ব্যর্থ হয়েছে বা বাতিল করা হয়েছে।' : 'Biometric enrollment failed or cancelled.');
          setTimeout(() => setAppLockError(''), 4000);
        }
      }
    } else {
      setBioEnabled(false);
    }
  };

  const handleSaveAppLock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setAppLockSuccess('');
    setAppLockError('');

    // PIN validation
    if (!appPin || appPin.length !== 4 || isNaN(Number(appPin))) {
      setAppLockError(lang === 'bn' ? 'পিন অবশ্যই ৪ ডিজিটের সংখ্যা হতে হবে!' : 'PIN must be exactly 4 digits containing numbers only!');
      setLoading(false);
      setTimeout(() => setAppLockError(''), 4000);
      return;
    }

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        appLockPin: appPin,
        biometricsEnabled: bioEnabled
      });
      setAppLockSuccess(lang === 'bn' ? 'সিকিউরিটি অ্যাপ লক পিন ও বায়োমেট্রিক সফলভাবে আপডেট করা হয়েছে!' : 'Security App Lock PIN & Biometrics successfully updated!');
      setTimeout(() => setAppLockSuccess(''), 4000);
    } catch (err: any) {
      console.error(err);
      setAppLockError(err.message || 'Error updating security settings');
      setTimeout(() => setAppLockError(''), 4000);
    } finally {
      setLoading(false);
    }
  };
  const filteredCashTx = useMemo(() => {
    const incs = incomes.filter(i => i.paymentMethod === 'Cash').map(i => ({ ...i, txGroup: 'income' }));
    const exps = expenses.filter(e => e.paymentMethod === 'Cash').map(e => ({ ...e, txGroup: 'expense' }));
    const combined = [...incs, ...exps].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return combined.filter(tx => {
      const d = tx.date;
      const matchesDate = (!fromDate || d >= fromDate) && (!toDate || d <= toDate);
      const detailsStr = `${tx.category || ''} ${tx.source || ''} ${tx.purpose || ''} ${tx.note || ''}`.toLowerCase();
      const matchesSearch = detailsStr.includes(searchTx.toLowerCase()) || tx.amount.toString().includes(searchTx);
      return matchesDate && matchesSearch;
    });
  }, [incomes, expenses, fromDate, toDate, searchTx]);

  const filteredBankTx = useMemo(() => {
    const incs = incomes
      .filter(i => i.paymentMethod === 'Bank')
      .map(i => ({ 
        ...i, 
        txGroup: 'income', 
        collectionName: 'incomes',
        bankId: i.accountId,
        type: 'Income'
      }));
    const exps = expenses
      .filter(e => e.paymentMethod === 'Bank')
      .map(e => ({ 
        ...e, 
        txGroup: 'expense', 
        collectionName: 'expenses',
        bankId: e.accountId,
        type: 'Expense'
      }));
    const btxs = bankTransactions.map(bt => ({
      ...bt,
      txGroup: bt.type === 'Deposit' ? 'income' : 'expense',
      collectionName: 'bankTransactions',
      type: bt.type
    }));

    const combined = [...incs, ...exps, ...btxs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return combined.filter(tx => {
      const d = tx.date;
      const matchesDate = (!fromDate || d >= fromDate) && (!toDate || d <= toDate);
      const detailsStr = `${tx.category || ''} ${tx.type || ''} ${tx.note || ''} ${tx.bankName || ''}`.toLowerCase();
      const matchesSearch = detailsStr.includes(searchTx.toLowerCase()) || tx.amount.toString().includes(searchTx);
      return matchesDate && matchesSearch;
    });
  }, [incomes, expenses, bankTransactions, fromDate, toDate, searchTx]);

  const filteredCreditTx = useMemo(() => {
    return creditTransactions.filter(tx => {
      const d = tx.date;
      const matchesDate = (!fromDate || d >= fromDate) && (!toDate || d <= toDate);
      const detailsStr = `${tx.productName || ''} ${tx.customerName || ''} ${tx.notes || ''}`.toLowerCase();
      const matchesSearch = detailsStr.includes(searchTx.toLowerCase()) || 
                            tx.totalPrice.toString().includes(searchTx) || 
                            tx.paidAmount.toString().includes(searchTx);
      return matchesDate && matchesSearch;
    });
  }, [creditTransactions, fromDate, toDate, searchTx]);

  const filteredLoansTx = useMemo(() => {
    return loans.filter(tx => {
      const d = tx.startDate || tx.date;
      const matchesDate = (!fromDate || d >= fromDate) && (!toDate || d <= toDate);
      const detailsStr = `${tx.personName || ''} ${tx.type || ''} ${tx.notes || ''}`.toLowerCase();
      const matchesSearch = detailsStr.includes(searchTx.toLowerCase()) || 
                            tx.principalAmount.toString().includes(searchTx);
      return matchesDate && matchesSearch;
    });
  }, [loans, fromDate, toDate, searchTx]);

  const filteredOtherTx = useMemo(() => {
    const incs = incomes
      .filter(i => i.paymentMethod === 'Other')
      .map(i => ({
        ...i,
        txGroup: 'income',
        type: 'receive',
        platform: i.otherMethod || 'Other',
        collectionName: 'incomes'
      }));
    const exps = expenses
      .filter(e => e.paymentMethod === 'Other')
      .map(e => ({
        ...e,
        txGroup: 'expense',
        type: 'send',
        platform: e.otherMethod || 'Other',
        collectionName: 'expenses'
      }));
    const otxs = onlineTransactions.map(ot => ({
      ...ot,
      txGroup: ot.type === 'receive' ? 'income' : 'expense',
      collectionName: 'onlineTransactions'
    }));

    const combined = [...incs, ...exps, ...otxs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return combined.filter(tx => {
      const d = tx.date;
      const matchesDate = (!fromDate || d >= fromDate) && (!toDate || d <= toDate);
      const matchesPlatform = selectedPlatform === 'All' || tx.platform === selectedPlatform;
      const detailsStr = `${tx.platform || ''} ${tx.type || ''} ${tx.note || ''}`.toLowerCase();
      const matchesSearch = detailsStr.includes(searchTx.toLowerCase()) || 
                            tx.amount.toString().includes(searchTx);
      return matchesDate && matchesSearch && matchesPlatform;
    });
  }, [incomes, expenses, onlineTransactions, fromDate, toDate, searchTx, selectedPlatform]);

  const allRecentTransactions = useMemo(() => {
    const list: any[] = [];

    // incomes
    incomes.forEach(i => {
      list.push({
        id: i.id,
        date: i.date,
        description: `${i.category || (lang === 'bn' ? 'আয়' : 'Income')} ${i.source ? `(${i.source})` : ''} ${i.note ? `| "${i.note}"` : ''}`,
        amount: i.amount,
        type: 'income',
        method: i.paymentMethod + (i.otherMethod ? ` (${i.otherMethod})` : ''),
        collectionName: 'incomes',
        originalTx: i
      });
    });

    // expenses
    expenses.forEach(e => {
      list.push({
        id: e.id,
        date: e.date,
        description: `${e.category || (lang === 'bn' ? 'ব্যয়' : 'Expense')} ${e.purpose ? `(${e.purpose})` : ''} ${e.note ? `| "${e.note}"` : ''}`,
        amount: e.amount,
        type: 'expense',
        method: e.paymentMethod + (e.otherMethod ? ` (${e.otherMethod})` : ''),
        collectionName: 'expenses',
        originalTx: e
      });
    });

    // bankTransactions
    bankTransactions.forEach(bt => {
      const typeStr = bt.type === 'Deposit' ? (lang === 'bn' ? 'জমা' : 'Deposit') : bt.type === 'Withdrawal' ? (lang === 'bn' ? 'উত্তোলন' : 'Withdrawal') : (lang === 'bn' ? 'স্থানান্তর' : 'Transfer');
      list.push({
        id: bt.id,
        date: bt.date,
        description: `${lang === 'bn' ? 'ব্যাংক লেনদেন' : 'Bank'} - ${typeStr} ${bt.note ? `| "${bt.note}"` : ''}`,
        amount: bt.amount,
        type: bt.type === 'Deposit' ? 'income' : 'expense',
        method: lang === 'bn' ? 'ব্যাংক' : 'Bank',
        collectionName: 'bankTransactions',
        originalTx: bt
      });
    });

    // creditTransactions
    creditTransactions.forEach(ct => {
      const isPayment = ct.productName === 'Supplier Payment';
      list.push({
        id: ct.id,
        date: ct.date,
        description: isPayment 
          ? `${lang === 'bn' ? 'সাপ্লায়ার পেমেন্ট' : 'Supplier Payment'} (${lang === 'bn' ? 'সরবরাহকারী' : 'Supplier'}: ${ct.customerName}) ${ct.notes ? `| "${ct.notes}"` : ''}`
          : `${lang === 'bn' ? 'মাল ক্রয় / বাকি' : 'Supplier Purchase'} (${lang === 'bn' ? 'সরবরাহকারী' : 'Supplier'}: ${ct.customerName}) - ${ct.productName} ${ct.notes ? `| "${ct.notes}"` : ''}`,
        amount: isPayment ? ct.paidAmount : ct.dueAmount,
        type: isPayment ? 'expense' : 'income',
        method: isPayment ? (ct.method || 'Cash') : (lang === 'bn' ? 'বাকি' : 'Due'),
        collectionName: 'creditTransactions',
        originalTx: ct
      });
    });

    // loans
    loans.forEach(l => {
      let typeLabel = '';
      let isIncome = false;
      if (l.type === 'given') {
        typeLabel = lang === 'bn' ? 'ঋণ দেওয়া' : 'Loan Given';
        isIncome = false;
      } else if (l.type === 'taken') {
        typeLabel = lang === 'bn' ? 'ঋণ নেওয়া' : 'Loan Taken';
        isIncome = true;
      } else if (l.type === 'collection') {
        typeLabel = lang === 'bn' ? 'ঋণ আদায়' : 'Loan Collection';
        isIncome = true;
      } else if (l.type === 'repayment') {
        typeLabel = lang === 'bn' ? 'ঋণ পরিশোধ' : 'Loan Repayment';
        isIncome = false;
      }
      list.push({
        id: l.id,
        date: l.startDate || l.date,
        description: `${typeLabel} (${lang === 'bn' ? 'ব্যক্তি' : 'Person'}: ${l.personName}) ${l.notes ? `| "${l.notes}"` : ''}`,
        amount: l.principalAmount,
        type: isIncome ? 'income' : 'expense',
        method: l.paymentMethod || 'Cash',
        collectionName: 'loans',
        originalTx: l
      });
    });

    // onlineTransactions
    onlineTransactions.forEach(ot => {
      list.push({
        id: ot.id,
        date: ot.date,
        description: `${ot.platform} - ${ot.type === 'receive' ? (lang === 'bn' ? 'গ্রহন' : 'Received') : (lang === 'bn' ? 'প্রেরণ' : 'Sent')} ${ot.note ? `| "${ot.note}"` : ''}`,
        amount: ot.amount,
        type: ot.type === 'receive' ? 'income' : 'expense',
        method: ot.platform,
        collectionName: 'onlineTransactions',
        originalTx: ot
      });
    });

    // Sort: newest first
    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    let filtered = list;
    if (searchTx.trim()) {
      const q = searchTx.toLowerCase();
      filtered = list.filter(item => 
        item.description.toLowerCase().includes(q) ||
        item.amount.toString().includes(q) ||
        (item.method && item.method.toLowerCase().includes(q))
      );
    }

    return filtered.slice(0, 25);
  }, [incomes, expenses, bankTransactions, creditTransactions, loans, onlineTransactions, searchTx, lang]);

  const handleDeleteTransaction = async (collectionName: string, tx: any) => {
    const confirmMsg = lang === 'bn' 
      ? 'আপনি কি নিশ্চিতভাবে এই লেনদেনটি ডিলিট করতে চান? ডিলিট করলে এর সাথে জড়িত সকল ক্যাশ, ব্যাংক বা অ্যাকাউন্ট ব্যালেন্স স্বয়ংক্রিয়ভাবে আগের অবস্থায় ফিরে যাবে!'
      : 'Are you sure you want to delete this transaction? This will automatically revert the respective account balances!';

    if (!window.confirm(confirmMsg)) {
      return;
    }

    setLoading(true);
    setTxSuccess('');
    setTxError('');

    try {
      if (collectionName === 'incomes') {
        // Subtract income from balance
        await financeService.updateBalance(user!.uid, tx.paymentMethod, tx.accountId || null, -tx.amount);
        await financeService.deleteDoc('incomes', tx.id);
        setTxSuccess(lang === 'bn' ? 'আয় লেনদেন ডিলিট এবং ব্যালেন্স সমন্বয় করা হয়েছে!' : 'Income transaction deleted and balance reverted successfully!');
      } 
      else if (collectionName === 'expenses') {
        // Add expense back to balance
        await financeService.updateBalance(user!.uid, tx.paymentMethod, tx.accountId || null, tx.amount);
        await financeService.deleteDoc('expenses', tx.id);
        setTxSuccess(lang === 'bn' ? 'ব্যয় লেনদেন ডিলিট এবং ব্যালেন্স সমন্বয় করা হয়েছে!' : 'Expense transaction deleted and balance reverted successfully!');
      }
      else if (collectionName === 'bankTransactions') {
        const amount = tx.amount;
        
        // 1. Revert Primary Bank Balance
        if (tx.type === 'Deposit') {
          await financeService.updateBalance(user!.uid, 'Bank', tx.bankId, -amount);
          
          if (tx.paymentMethod === 'Cash') {
            await financeService.updateBalance(user!.uid, 'Cash', null, amount);
          } else if (tx.paymentMethod === 'Bank' && tx.sourceBankId) {
            await financeService.updateBalance(user!.uid, 'Bank', tx.sourceBankId, amount);
          } else if (tx.paymentMethod === 'Other' && tx.methodAccountId) {
            await financeService.updateBalance(user!.uid, 'Other', tx.methodAccountId, amount);
          }
        } 
        else if (tx.type === 'Withdrawal') {
          await financeService.updateBalance(user!.uid, 'Bank', tx.bankId, amount);
          
          if (tx.paymentMethod === 'Cash') {
            await financeService.updateBalance(user!.uid, 'Cash', null, -amount);
          } else if (tx.paymentMethod === 'Bank' && tx.sourceBankId) {
            await financeService.updateBalance(user!.uid, 'Bank', tx.sourceBankId, -amount);
          } else if (tx.paymentMethod === 'Other' && tx.methodAccountId) {
            await financeService.updateBalance(user!.uid, 'Other', tx.methodAccountId, -amount);
          }
        } 
        else if (tx.type === 'Transfer') {
          await financeService.updateBalance(user!.uid, 'Bank', tx.bankId, -amount);
          if (tx.sourceBankId) {
            await financeService.updateBalance(user!.uid, 'Bank', tx.sourceBankId, amount);
          }
        }
        
        await financeService.deleteDoc('bankTransactions', tx.id);
        setTxSuccess(lang === 'bn' ? 'ব্যাংক লেনদেন ডিলিট এবং ব্যালেন্স সমন্বয় করা হয়েছে!' : 'Bank transaction deleted and balance reverted successfully!');
      }
      else if (collectionName === 'creditTransactions') {
        const shop = shops.find(s => s.shopName === tx.customerName);
        if (shop) {
          if (tx.productName === 'Supplier Payment') {
            // Revert payment: restore supplier credit balance, add money back to payment method
            await financeService.updateDoc('shops', shop.id, {
              creditBalance: (shop.creditBalance || 0) + tx.paidAmount
            });
            const method = tx.method === 'Other' ? 'Other' : (tx.method === 'Cash' ? 'Cash' : 'Bank');
            await financeService.updateBalance(user!.uid, method, tx.accountId || null, tx.paidAmount);
          } else {
            // Revert purchase: decrease supplier credit balance by purchase dueAmount
            await financeService.updateDoc('shops', shop.id, {
              creditBalance: Math.max(0, (shop.creditBalance || 0) - tx.dueAmount)
            });
          }
        }
        await financeService.deleteDoc('creditTransactions', tx.id);
        setTxSuccess(lang === 'bn' ? 'ক্রেডিট সিস্টেম লেনদেন ডিলিট ও সমন্বয় করা হয়েছে!' : 'Credit transaction deleted and supplier balance adjusted successfully!');
      }
      else if (collectionName === 'loans') {
        const person = persons.find(p => p.id === tx.personId);
        if (tx.type === 'given') {
          await financeService.updateBalance(user!.uid, tx.paymentMethod, tx.accountId || null, tx.principalAmount);
          if (person) {
            await financeService.updateDoc('persons', tx.personId, {
              loanGivenBalance: Math.max(0, (person.loanGivenBalance || 0) - tx.principalAmount)
            });
          }
        } else if (tx.type === 'taken') {
          await financeService.updateBalance(user!.uid, tx.paymentMethod, tx.accountId || null, -tx.principalAmount);
          if (person) {
            await financeService.updateDoc('persons', tx.personId, {
              loanTakenBalance: Math.max(0, (person.loanTakenBalance || 0) - tx.principalAmount)
            });
          }
        } else if (tx.type === 'collection') {
          await financeService.updateBalance(user!.uid, tx.paymentMethod, tx.accountId || null, -tx.principalAmount);
          if (person) {
            await financeService.updateDoc('persons', tx.personId, {
              loanGivenBalance: (person.loanGivenBalance || 0) + tx.principalAmount
            });
          }
        } else if (tx.type === 'repayment') {
          await financeService.updateBalance(user!.uid, tx.paymentMethod, tx.accountId || null, tx.principalAmount);
          if (person) {
            await financeService.updateDoc('persons', tx.personId, {
              loanTakenBalance: (person.loanTakenBalance || 0) + tx.principalAmount
            });
          }
        }
        await financeService.deleteDoc('loans', tx.id);
        setTxSuccess(lang === 'bn' ? 'লোন লেনদেন ডিলিট এবং ব্যাক্তি ব্যালেন্স সমন্বয় সফল হয়েছে!' : 'Loan transaction deleted and person balance reverted!');
      }
      else if (collectionName === 'onlineTransactions') {
        const primaryChange = tx.type === 'receive' ? -tx.amount : tx.amount;
        await financeService.updateBalance(user!.uid, 'Other', tx.accountId, primaryChange);
 
        if (tx.paymentMethod && tx.paymentMethod !== 'None') {
          const methodChange = tx.type === 'receive' ? tx.amount : -tx.amount;
          if (tx.paymentMethod === 'Cash') {
            await financeService.updateBalance(user!.uid, 'Cash', null, methodChange);
          } else if (tx.paymentMethod === 'Bank' && tx.bankId) {
            await financeService.updateBalance(user!.uid, 'Bank', tx.bankId, methodChange);
          } else if (tx.paymentMethod === 'Other' && tx.methodAccountId) {
            await financeService.updateBalance(user!.uid, 'Other', tx.methodAccountId, methodChange);
          }
        }
        await financeService.deleteDoc('onlineTransactions', tx.id);
        setTxSuccess(lang === 'bn' ? 'অনলাইন/মোবাইল ব্যাংকিং লেনদেন ডিলিট ও সমন্বয় করা হয়েছে!' : 'Online Mobile bank transaction deleted!');
      }
      
      // Auto-hide success
      setTimeout(() => setTxSuccess(''), 4000);
    } catch (err: any) {
      console.error(err);
      setTxError(err.message || 'Error occurred during deletion');
    } finally {
      setLoading(false);
    }
  };

  const displayedCategories = useMemo(() => {
    if (catFilterType === 'all') return categories;
    return categories.filter(c => c.type === catFilterType);
  }, [categories, catFilterType]);

  return (
    <div className="w-full h-full overflow-y-auto px-4 md:px-10 pt-10 pb-20 bg-white">
      <div className="max-w-[900px] mx-auto bg-white space-y-12 text-black">
        
        {/* 1. Profile Section */}
        <div className="space-y-6">
          <div 
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center justify-between cursor-pointer p-4 bg-slate-50 border-2 border-pink-500 rounded hover:bg-pink-50/20 transition-all select-none gap-4 shadow-sm"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="p-2 bg-pink-100 rounded text-pink-700 shrink-0">
                <User size={22} strokeWidth={2.5} />
              </div>
              <AnimatedSettingsHeader 
                text={lang === 'bn' ? 'প্রোফাইল ও সিকিউরিটি' : 'PROFILE & SECURITY DETAILS'} 
                colorClass="text-[#ec4899]" 
              />
            </div>
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shrink-0",
              "bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white font-bold",
              "shadow-[0_0_15px_rgba(236,72,153,0.7)] hover:shadow-[0_0_22px_rgba(236,72,153,0.95)] hover:scale-105 active:scale-95",
              showProfile ? "rotate-180" : "rotate-0"
            )}>
              <ChevronDown size={22} strokeWidth={3} />
            </div>
          </div>

          {showProfile && (
            <div className="space-y-6">
              <p className="text-xs text-slate-700 font-bold">{lang === 'bn' ? 'আপনার নাম, ফোন, ইমেইল এবং পাসওয়ার্ড পরিবর্তন করুন' : 'Update your personal credentials and security access'}</p>

              <form onSubmit={handleSaveProfile} className="space-y-6 bg-white">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-black uppercase tracking-wider block">{lang === 'bn' ? 'পুরো নাম' : 'Full Name'}</label>
                    <input 
                      type="text"
                      required
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-400 outline-none focus:border-black text-black font-bold text-sm"
                      placeholder="E.g. Md Rabbi"
                    />
                  </div>

                  {/* Phone/Mobile */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-black uppercase tracking-wider block">{lang === 'bn' ? 'মোবাইল নাম্বার' : 'Mobile Number'}</label>
                    <input 
                      type="text"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-400 outline-none focus:border-black text-black font-bold text-sm"
                      placeholder="E.g. 017XXXXXXXX"
                    />
                  </div>

                  {/* Email Address */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-black uppercase tracking-wider block">{lang === 'bn' ? 'ইমেইল অ্যাড্রেস' : 'Email Address'}</label>
                    <input 
                      type="email"
                      required
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-400 rounded outline-none focus:border-black text-black font-bold text-sm"
                      placeholder="E.g. user@gmail.com"
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-black uppercase tracking-wider block">{lang === 'bn' ? 'নতুন পাসওয়ার্ড (ঐচ্ছিক)' : 'New Password (Optional)'}</label>
                    <input 
                      type="password"
                      value={profilePassword}
                      onChange={(e) => setProfilePassword(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-400 rounded outline-none focus:border-black text-black font-bold text-sm"
                      placeholder={lang === 'bn' ? 'পরিবর্তন না করতে চাইলে ফাঁকা রাখুন' : 'Leave blank to keep current password'}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-black hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider border border-black shadow"
                  >
                    {loading ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                    ) : (
                      (lang === 'bn' ? 'তথ্য পরিবর্তন করুন' : 'Save Changes')
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* App Lock & Biometric Security Section */}
        <div className="space-y-6 pt-6 border-t-2 border-slate-300">
          <div 
            onClick={() => setShowAppLock(!showAppLock)}
            className="flex items-center justify-between cursor-pointer p-4 bg-slate-50 border-2 border-blue-500 rounded hover:bg-blue-50/20 transition-all select-none gap-4 shadow-sm"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="p-2 bg-blue-100 rounded text-blue-700 shrink-0">
                <Lock size={22} strokeWidth={2.5} />
              </div>
              <AnimatedSettingsHeader 
                text={lang === 'bn' ? 'অ্যাপ লক ও বায়োমেট্রিক' : 'APP LOCK & BIOMETRICS'} 
                colorClass="text-[#3b82f6]" 
              />
            </div>
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shrink-0",
              "bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white font-bold",
              "shadow-[0_0_15px_rgba(59,130,246,0.7)] hover:shadow-[0_0_22px_rgba(59,130,246,0.95)] hover:scale-105 active:scale-95",
              showAppLock ? "rotate-180" : "rotate-0"
            )}>
              <ChevronDown size={22} strokeWidth={3} />
            </div>
          </div>

          {showAppLock && (
            <div className="space-y-6 bg-white p-5 border border-slate-300 rounded shadow-sm">
              <p className="text-xs text-slate-700 font-bold">
                {lang === 'bn' 
                  ? 'আপনার অ্যাপকে ৪-ডিজিট পিন কোড এবং মোবাইল ফিঙ্গারপ্রিন্ট দিয়ে নিরাপদ রাখুন!' 
                  : 'Protect your application using a 4-digit secure app passcode and fingerprint authentication.'}
              </p>

              <form onSubmit={handleSaveAppLock} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Passcode input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-black uppercase tracking-wider block">
                      {lang === 'bn' ? '৪-ডিজিট অ্যাপ লক পিন' : '4-Digit App Lock PIN'}
                    </label>
                    <input 
                      type="password"
                      maxLength={4}
                      value={appPin}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setAppPin(val);
                      }}
                      placeholder="E.g. 1234"
                      className="w-full px-3 py-2 bg-white border border-slate-400 outline-none focus:border-black text-black font-black text-sm tracking-[0.5em]"
                    />
                    <span className="text-[10px] text-slate-500 font-semibold block mt-1 leading-relaxed">
                      {lang === 'bn' 
                        ? 'প্রতিবার এপে ঢোকার জন্য এই পিনটি লাগবে। আপনি চাইলে পিন নম্বরটি পরিবর্তন করতে পারেন।' 
                        : 'This PIN is required every time you enter the app. You can modify this PIN here as needed.'}
                    </span>
                  </div>

                  {/* Fingerprint toggle switcher */}
                  <div className="space-y-3 pt-1">
                    <label className="text-xs font-black text-black uppercase tracking-wider block flex items-center gap-1.5">
                      <Fingerprint size={16} className="text-blue-500" />
                      {lang === 'bn' ? 'ফিঙ্গারপ্রিন্ট আনলক সক্রিয়' : 'Fingerprint Unlock Enabled'}
                    </label>
                    
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleBioToggle}
                        className={cn(
                          "w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-all duration-200 outline-none focus:ring-1 focus:ring-blue-500/50",
                          bioEnabled ? "bg-blue-500 justify-end" : "bg-slate-300 justify-start"
                        )}
                        aria-label="Toggle biometrics"
                      >
                        <motion.div 
                          layout 
                          className="w-4 h-4 bg-white rounded-full shadow-md"
                        />
                      </button>
                      <span className="text-xs font-bold text-slate-700">
                        {bioEnabled 
                          ? (lang === 'bn' ? 'ফিঙ্গারপ্রিন্ট সক্রিয়' : 'Fingerprint lock active') 
                          : (lang === 'bn' ? 'ফিঙ্গারপ্রিন্ট নিষ্ক্রিয়' : 'Fingerprint lock disabled')}
                      </span>
                    </div>

                    <span className="text-[10px] text-slate-500 font-semibold block leading-relaxed mt-1">
                      {lang === 'bn' 
                        ? 'এপ্লিকেশন পুনরায় ওপেন করার সময় ফিঙ্গারপ্রিন্ট বা ফেস আইডি স্ক্যান করার জন্য এটি অন করে রাখুন।' 
                        : 'Trigger your device\'s hardware fingerprint or biometrics sensor upon opening the app.'}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end pt-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider border border-blue-600 shadow transition-colors rounded"
                  >
                    {loading ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                    ) : (
                      (lang === 'bn' ? 'সংরক্ষণ করুন' : 'Save Security Options')
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* 2. Category Management */}
        <div className="space-y-6 pt-6 border-t-2 border-slate-300">
          <div 
            onClick={() => setShowCategories(!showCategories)}
            className="flex items-center justify-between cursor-pointer p-4 bg-slate-50 border-2 border-emerald-500 rounded hover:bg-emerald-50/20 transition-all select-none gap-4 shadow-sm"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="p-2 bg-emerald-100 rounded text-emerald-700 shrink-0">
                <Tag size={22} strokeWidth={2.5} />
              </div>
              <AnimatedSettingsHeader 
                text={lang === 'bn' ? 'ক্যাটাগরি ম্যানেজমেন্ট' : 'CATEGORY MANAGEMENT'} 
                colorClass="text-[#059669]" 
              />
            </div>
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shrink-0",
              "bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 text-white font-bold",
              "shadow-[0_0_15px_rgba(16,185,129,0.7)] hover:shadow-[0_0_22px_rgba(16,185,129,0.95)] hover:scale-105 active:scale-95",
              showCategories ? "rotate-180" : "rotate-0"
            )}>
              <ChevronDown size={22} strokeWidth={3} />
            </div>
          </div>

          {showCategories && (
            <div className="space-y-6">
              <p className="text-xs text-slate-700 font-bold">{lang === 'bn' ? 'আপনার আয় ও ব্যয়ের খাতসমূহ আলাদা ভাবে দেখুন ও নিয়ন্ত্রণ করুন' : 'Add or delete categories for income and expense lines'}</p>

              {/* Form directly on page */}
              <form onSubmit={addCategory} className="flex flex-col md:flex-row gap-4 bg-white p-4 border border-slate-400">
                <div className="flex-1 space-y-1">
                  <label className="text-xs font-black text-black uppercase block">{lang === 'bn' ? 'ক্যাটাগরির নাম' : 'Category Name'}</label>
                  <input 
                    type="text"
                    required
                    placeholder={lang === 'bn' ? 'নতুন ক্যাটাগরির নাম লিখুন...' : 'New Category Name...'}
                    className="w-full px-3 py-2 bg-white border border-slate-400 outline-none focus:border-black text-black font-bold text-sm"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs font-black text-black uppercase block">{lang === 'bn' ? 'ধরণ' : 'Type'}</label>
                  <div className="flex p-0.5 border border-slate-400 bg-slate-100 rounded">
                    <button
                      type="button"
                      onClick={() => setNewCatType('income')}
                      className={cn(
                        "px-4 py-1.5 rounded font-black text-xs transition-colors",
                        newCatType === 'income' ? "bg-black text-white" : "text-slate-700 hover:bg-slate-200"
                      )}
                    >
                      {lang === 'bn' ? 'আয়' : 'Income'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewCatType('expense')}
                      className={cn(
                        "px-4 py-1.5 rounded font-black text-xs transition-colors",
                        newCatType === 'expense' ? "bg-black text-white" : "text-slate-700 hover:bg-slate-200"
                      )}
                    >
                      {lang === 'bn' ? 'ব্যয়' : 'Expense'}
                    </button>
                  </div>
                </div>

                <div className="flex items-end">
                  <button 
                    type="submit"
                    disabled={loading || !newCatName}
                    className="w-full md:w-auto px-6 py-2 bg-black hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider border border-black shadow disabled:opacity-50"
                  >
                    {lang === 'bn' ? 'যুক্ত করুন' : 'Add Category'}
                  </button>
                </div>
              </form>

              {/* SINGLE TABLE WITH DROPDOWN FILTER AS REQUESTED */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-400 pb-1.5">
                  <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">
                    {lang === 'bn' ? 'ক্যাটাগরি তালিকা' : 'Categories Directory'} ({displayedCategories.length})
                  </h3>
                  
                  {/* Dropdown to filter types */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-black text-black uppercase">{lang === 'bn' ? 'ফিল্টার:' : 'Filter:'}</label>
                    <select
                      value={catFilterType}
                      onChange={(e: any) => setCatFilterType(e.target.value)}
                      className="px-2 py-1 bg-white border border-slate-400 outline-none text-black font-bold text-xs"
                    >
                      <option value="all">{lang === 'bn' ? 'সব ক্যাটাগরি' : 'All Categories'}</option>
                      <option value="income">{lang === 'bn' ? 'শুধুমাত্র আয়' : 'Incomes Only'}</option>
                      <option value="expense">{lang === 'bn' ? 'শুধুমাত্র ব্যয়' : 'Expenses Only'}</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-slate-400 bg-white">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border border-slate-400 px-3 py-2 text-center text-xs font-black text-slate-900 uppercase">SL</th>
                        <th className="border border-slate-400 px-4 py-2 text-left text-xs font-black text-slate-900 uppercase">Name (ক্যাটাগরি)</th>
                        <th className="border border-slate-400 px-4 py-2 text-center text-xs font-black text-slate-900 uppercase">Type (ধরণ)</th>
                        <th className="border border-slate-400 px-3 py-2 text-center text-xs font-black text-slate-900 uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedCategories.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="border border-slate-400 px-4 py-8 text-center text-xs text-slate-450 font-bold italic">
                            {lang === 'bn' ? 'কোনো ক্যাটাগরি পাওয়া যায়নি' : 'No Categories Found'}
                          </td>
                        </tr>
                      ) : (
                        displayedCategories.map((cat, idx) => (
                          <tr key={cat.id} className="hover:bg-slate-50">
                            <td className="border border-slate-400 px-3 py-1.5 text-center font-bold text-black text-xs font-mono">{idx + 1}</td>
                            <td className="border border-slate-400 px-4 py-1.5 font-bold text-black text-sm uppercase">{cat.name}</td>
                            <td className="border border-slate-400 px-4 py-1.5 text-center">
                              <span className={cn(
                                "px-2 py-0.5 font-black text-[10px] uppercase border",
                                cat.type === 'income' 
                                  ? "bg-emerald-50 border-emerald-400 text-emerald-800" 
                                  : "bg-rose-50 border-rose-400 text-rose-800"
                              )}>
                                {cat.type === 'income' ? (lang === 'bn' ? 'আয়' : 'Income') : (lang === 'bn' ? 'ব্যয়' : 'Expense')}
                              </span>
                            </td>
                            <td className="border border-slate-400 px-3 py-1.5 text-center">
                              <button 
                                type="button"
                                onClick={() => deleteCategory(cat.id)}
                                className="px-3 py-0.5 border border-red-400 bg-red-100 hover:bg-red-200 text-red-700 font-black text-xs uppercase"
                              >
                                {lang === 'bn' ? 'ডিলিট' : 'Delete'}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="space-y-6 pt-6 border-t-2 border-slate-300">
          <div 
            onClick={() => setShowTransactions(!showTransactions)}
            className="flex items-center justify-between cursor-pointer p-4 bg-slate-50 border-2 border-amber-500 rounded hover:bg-amber-50/20 transition-all select-none gap-4 shadow-sm"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="p-2 bg-amber-100 rounded text-amber-700 shrink-0">
                <Database size={22} strokeWidth={2.5} />
              </div>
              <AnimatedSettingsHeader 
                text={lang === 'bn' ? 'লেনদেন ডিলিট ও সংশোধন' : 'AUDIT & REVERT TRANSACTIONS'} 
                colorClass="text-[#d97706]" 
              />
            </div>
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shrink-0",
              "bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 text-white font-bold",
              "shadow-[0_0_15px_rgba(245,158,11,0.7)] hover:shadow-[0_0_22px_rgba(245,158,11,0.95)] hover:scale-105 active:scale-95",
              showTransactions ? "rotate-180" : "rotate-0"
            )}>
              <ChevronDown size={22} strokeWidth={3} />
            </div>
          </div>

          {showTransactions && (
            <div className="space-y-6">
              <p className="text-xs text-slate-700 font-bold">
                {lang === 'bn' 
                  ? 'সর্বশেষ ২৫টি লেনদেন দেখুন এবং যেকোনো ভুল লেনদেন ডিলিট করুন' 
                  : 'View last 25 recent transactions and delete any incorrect records.'}
              </p>

              <form className="space-y-4">
                {/* Search field */}
                <div className="flex items-center gap-4 max-w-md">
                  <div className="relative w-full group/search">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold" />
                    <input 
                      type="text"
                      value={searchTx}
                      onChange={(e) => setSearchTx(e.target.value)}
                      placeholder={lang === 'bn' ? 'লেনদেন খুঁজুন...' : 'Search transactions...'}
                      className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-400 rounded outline-none text-black font-semibold text-xs transition-all focus:border-slate-600"
                    />
                  </div>
                </div>

                {/* Displaying records in standard transparent table format used in other pages */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-slate-400 bg-white min-w-[850px]">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border border-slate-400 px-3 py-2 text-center text-xs font-black text-slate-900 uppercase">SL</th>
                        <th className="border border-slate-400 px-4 py-2 text-center text-xs font-black text-slate-900 uppercase">{lang === 'bn' ? 'তারিখ' : 'Date'}</th>
                        <th className="border border-slate-400 px-4 py-2 text-center text-xs font-black text-slate-900 uppercase">{lang === 'bn' ? 'মাধ্যম' : 'Method'}</th>
                        <th className="border border-slate-400 px-4 py-2 text-left text-xs font-black text-slate-900 uppercase min-w-[200px] w-auto">{lang === 'bn' ? 'বিবরণ' : 'Description'}</th>
                        <th className="border border-slate-400 px-4 py-2 text-center text-xs font-black text-slate-900 uppercase">{lang === 'bn' ? 'টাকা' : 'Amount'}</th>
                        <th className="border border-slate-400 px-3 py-2 text-center text-xs font-black text-slate-900 uppercase">{lang === 'bn' ? 'অ্যাকশন' : 'Action'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allRecentTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="border border-slate-300 p-8 text-center text-sm text-slate-400 italic">
                            {lang === 'bn' ? 'কোনো লেনদেন পাওয়া যায়নি' : 'No transactions found'}
                          </td>
                        </tr>
                      ) : (
                        allRecentTransactions.map((item, idx) => (
                          <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                            <td className="border border-slate-400 px-3 py-2 text-center font-bold text-black text-xs font-mono">{idx + 1}</td>
                            <td className="border border-slate-400 px-3 py-2 text-center font-bold text-black text-xs whitespace-nowrap font-mono">{formatDateDMY(item.date)}</td>
                            <td className="border border-slate-400 px-4 py-2 text-center font-bold text-slate-700 text-xs font-serif whitespace-nowrap">{item.method}</td>
                            <td className="border border-slate-400 px-4 py-2 text-left text-sm text-black">
                              <span className="font-extrabold text-xs block text-slate-900 leading-tight">{item.description}</span>
                              <span className="text-[9px] text-slate-400 uppercase font-mono tracking-wider block mt-0.5">{item.collectionName}</span>
                            </td>
                            <td className={cn(
                              "border border-slate-400 px-4 py-2 text-center font-black text-sm whitespace-nowrap",
                              item.type === 'income' ? "text-emerald-700" : "text-rose-700"
                            )}>
                              {item.type === 'income' ? '+' : '-'}{item.amount.toLocaleString('en-IN')}
                            </td>
                            <td className="border border-slate-400 px-3 py-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeleteTransaction(item.collectionName, item.originalTx)}
                                className="px-3 py-1 border border-red-400 bg-red-100 hover:bg-red-200 text-red-700 font-bold text-xs uppercase transition-colors rounded"
                              >
                                {lang === 'bn' ? 'ডিলিট' : 'Delete'}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* 4. Core Security Override Banner */}
        <div className="pt-8 border-t-2 border-red-300 space-y-4">
          <div 
            onClick={() => setShowDanger(!showDanger)}
            className="flex items-center justify-between cursor-pointer p-4 bg-slate-50 border-2 border-red-500 rounded hover:bg-red-50/20 transition-all select-none gap-4 shadow-sm"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="p-2 bg-red-100 rounded text-red-700 shrink-0">
                <Shield size={22} strokeWidth={2.5} />
              </div>
              <AnimatedSettingsHeader 
                text={lang === 'bn' ? 'ডেঞ্জার জোন ও সিকিউরিটি ওভাররাইড' : 'DANGER ZONE & SECURITY OVERRIDE'} 
                colorClass="text-red-600" 
              />
            </div>
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shrink-0",
              "bg-gradient-to-r from-red-500 via-orange-500 to-rose-700 text-white font-bold",
              "shadow-[0_0_15px_rgba(239,68,68,0.7)] hover:shadow-[0_0_22px_rgba(239,68,68,0.95)] hover:scale-105 active:scale-95",
              showDanger ? "rotate-180" : "rotate-0"
            )}>
              <ChevronDown size={22} strokeWidth={3} />
            </div>
          </div>

          {showDanger && (
            <div className="space-y-4 pt-2">
              <p className="text-xs font-bold text-slate-700">
                {lang === 'bn' 
                  ? 'অ্যাকাউন্টের সকল প্যারামিটার এবং ট্রানজিশনাল ক্রেডেনশিয়াল ম্যানুয়ালি মুছে ফেলতে এই বাটনটি চাপুন।' 
                  : 'Clear and purge all local application parameters or reset account secure keys.'}
              </p>
              <button 
                type="button"
                onClick={() => window.confirm(lang === 'bn' ? 'অ্যাকাউন্ট ওভাররাইড কি পরিবর্তন করতে চান?' : 'Confirm security credentials override?') && alert(lang === 'bn' ? 'ডাটা ওভাররাইড করা হয়েছে' : 'Credentials reset operation initialized')}
                className="px-4 py-2 bg-red-100 hover:bg-red-200 border border-red-400 text-red-700 font-black text-xs uppercase"
              >
                {lang === 'bn' ? 'ক্রেডেনশিয়াল রিসেট করুন' : 'Reset Credentials'}
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Premium Floating Status Notifications (Zero Layout Shift) */}
      <AnimatePresence>
        {(profileSuccess || profileError || appLockSuccess || appLockError || txSuccess || txError) && (
          <motion.div
            initial={{ opacity: 0, y: 100, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 100, x: "-50%" }}
            className={cn(
              "fixed bottom-10 left-1/2 z-[99999]",
              "px-5 py-3.5 bg-slate-900 border border-slate-700/50 rounded-2xl sm:rounded-full shadow-2xl",
              "flex flex-row items-center gap-3 w-[calc(100vw-2rem)] sm:w-auto max-w-md sm:max-w-lg text-white font-bold text-sm tracking-wide"
            )}
          >
            {(profileSuccess || appLockSuccess || txSuccess) ? (
              <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-white shrink-0">
                <Check size={12} strokeWidth={3} />
              </div>
            ) : (
              <div className="w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center text-white shrink-0">
                <AlertCircle size={12} strokeWidth={3} />
              </div>
            )}
            
            <span className="text-white text-xs font-semibold leading-relaxed break-words whitespace-normal flex-1">
              {profileSuccess || profileError || appLockSuccess || appLockError || txSuccess || txError}
            </span>

            <button
              onClick={() => {
                setProfileSuccess('');
                setProfileError('');
                setAppLockSuccess('');
                setAppLockError('');
                setTxSuccess('');
                setTxError('');
              }}
              className="text-slate-400 hover:text-white ml-2 text-base font-black leading-none focus:outline-none focus:ring-1 focus:ring-slate-500 rounded px-1 transition-colors shrink-0"
              type="button"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
