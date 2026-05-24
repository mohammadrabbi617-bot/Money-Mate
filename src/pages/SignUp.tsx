import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Mail, Lock, User, Phone, Loader2, UserPlus, Key } from 'lucide-react';
import { motion } from 'motion/react';
import { financeService } from '../services/financeService';

export default function SignUp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [appLockPin, setAppLockPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (appLockPin.length !== 4 || isNaN(Number(appLockPin))) {
      setError('App Lock PIN must be exactly 4 digits containing numbers only! / অ্যাপ লক পিন অবশ্যই ৪ ডিজিটের সংখ্যা হতে হবে!');
      setLoading(false);
      return;
    }

    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name,
        email,
        phone,
        currency: 'BDT',
        language: 'en',
        theme: 'light',
        createdAt: new Date().toISOString(),
        appLockPin: appLockPin,
        biometricsEnabled: false
      });

      // Initialize default categories
      const defaultCategories = [
        { name: 'Salary', type: 'income' },
        { name: 'Business', type: 'income' },
        { name: 'Food', type: 'expense' },
        { name: 'Rent', type: 'expense' },
        { name: 'Shopping', type: 'expense' },
        { name: 'Bills', type: 'expense' },
      ];

      for (const cat of defaultCategories) {
        await financeService.addCategory({ ...cat, userId: user.uid } as any);
      }

      // Initialize cash account
      await financeService.ensureCashAccount(user.uid);
      
      // Sign out immediately so they have to login
      await auth.signOut();
      
      navigate('/login', { state: { registrationSuccess: true } });
    } catch (err: any) {
      setError(err.message || 'Error creating account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#456fae] flex items-center justify-center p-4 font-sans selection:bg-[#89a5e5] selection:text-[#21355a]">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md bg-[#21355a] rounded-[2.5rem] px-8 py-10 shadow-2xl relative border border-[#2d4675] overflow-hidden"
      >
        {/* Subtle decorative lights inside card */}
        <div className="absolute -top-16 -right-16 w-32 h-32 bg-[#89a5e5]/10 blur-2xl rounded-full pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-[#89a5e5]/5 blur-2xl rounded-full pointer-events-none" />

        <div className="text-center mb-8 relative z-10">
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-wide">
            Money Mate
          </h1>
          <p className="text-[#a4c0f4]/80 text-xs font-semibold leading-relaxed mt-2 max-w-xs mx-auto">
            Your smart financial companion to track payments, manage bank accounts, and streamline transactions in real-time.
          </p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-2xl text-xs font-bold text-center"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSignUp} className="space-y-4 relative z-10">
          {/* Name Field */}
          <div className="relative">
            <input
              type="text"
              id="name"
              required
              placeholder=" "
              className="peer w-full pl-11 pr-4 py-4 bg-[#293d64] border border-[#3a5483] rounded-2xl focus:ring-2 focus:ring-[#89a5e5]/30 focus:border-[#89a5e5] outline-none text-white font-semibold transition-all text-sm shadow-inner"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a4c0f4]/60 peer-focus:text-[#89a5e5] transition-colors" size={16} />
            <label
              htmlFor="name"
              className="absolute left-6 font-bold pointer-events-none transition-all duration-200 px-1.5 bg-[#21355a] text-[#a4c0f4]/80 text-xs top-0 -translate-y-1/2
              peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:left-11 peer-placeholder-shown:text-sm peer-placeholder-shown:text-[#a4c0f4]/60 peer-placeholder-shown:bg-transparent
              peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:left-6 peer-focus:text-xs peer-focus:text-[#89a5e5] peer-focus:bg-[#21355a]"
            >
              Full Name
            </label>
          </div>

          {/* Email field */}
          <div className="relative">
            <input
              type="email"
              id="email"
              required
              placeholder=" "
              className="peer w-full pl-11 pr-4 py-4 bg-[#293d64] border border-[#3a5483] rounded-2xl focus:ring-2 focus:ring-[#89a5e5]/30 focus:border-[#89a5e5] outline-none text-white font-semibold transition-all text-sm shadow-inner"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a4c0f4]/60 peer-focus:text-[#89a5e5] transition-colors" size={16} />
            <label
              htmlFor="email"
              className="absolute left-6 font-bold pointer-events-none transition-all duration-200 px-1.5 bg-[#21355a] text-[#a4c0f4]/80 text-xs top-0 -translate-y-1/2
              peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:left-11 peer-placeholder-shown:text-sm peer-placeholder-shown:text-[#a4c0f4]/60 peer-placeholder-shown:bg-transparent
              peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:left-6 peer-focus:text-xs peer-focus:text-[#89a5e5] peer-focus:bg-[#21355a]"
            >
              Email Address
            </label>
          </div>

          {/* Phone Field */}
          <div className="relative">
            <input
              type="tel"
              id="phone"
              placeholder=" "
              className="peer w-full pl-11 pr-4 py-4 bg-[#293d64] border border-[#3a5483] rounded-2xl focus:ring-2 focus:ring-[#89a5e5]/30 focus:border-[#89a5e5] outline-none text-white font-semibold transition-all text-sm shadow-inner"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a4c0f4]/60 peer-focus:text-[#89a5e5] transition-colors" size={16} />
            <label
              htmlFor="phone"
              className="absolute left-6 font-bold pointer-events-none transition-all duration-200 px-1.5 bg-[#21355a] text-[#a4c0f4]/80 text-xs top-0 -translate-y-1/2
              peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:left-11 peer-placeholder-shown:text-sm peer-placeholder-shown:text-[#a4c0f4]/60 peer-placeholder-shown:bg-transparent
              peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:left-6 peer-focus:text-xs peer-focus:text-[#89a5e5] peer-focus:bg-[#21355a]"
            >
              Phone Number
            </label>
          </div>

          {/* Password field */}
          <div className="relative">
            <input
              type="password"
              id="password"
              required
              minLength={6}
              placeholder=" "
              className="peer w-full pl-11 pr-4 py-4 bg-[#293d64] border border-[#3a5483] rounded-2xl focus:ring-2 focus:ring-[#89a5e5]/30 focus:border-[#89a5e5] outline-none text-white font-semibold transition-all text-sm shadow-inner"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a4c0f4]/60 peer-focus:text-[#89a5e5] transition-colors" size={16} />
            <label
              htmlFor="password"
              className="absolute left-6 font-bold pointer-events-none transition-all duration-200 px-1.5 bg-[#21355a] text-[#a4c0f4]/80 text-xs top-0 -translate-y-1/2
              peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:left-11 peer-placeholder-shown:text-sm peer-placeholder-shown:text-[#a4c0f4]/60 peer-placeholder-shown:bg-transparent
              peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:left-6 peer-focus:text-xs peer-focus:text-[#89a5e5] peer-focus:bg-[#21355a]"
            >
              Security Key
            </label>
          </div>

          {/* App Lock PIN field */}
          <div className="relative">
            <input
              type="password"
              id="appLockPin"
              required
              maxLength={4}
              placeholder=" "
              className="peer w-full pl-11 pr-4 py-4 bg-[#293d64] border border-[#3a5483] rounded-2xl focus:ring-2 focus:ring-[#89a5e5]/30 focus:border-[#89a5e5] outline-none text-white font-semibold transition-all text-sm shadow-inner tracking-[0.3em]"
              value={appLockPin}
              onChange={(e) => setAppLockPin(e.target.value.replace(/\D/g, ''))}
            />
            <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a4c0f4]/60 peer-focus:text-[#89a5e5] transition-colors" size={16} />
            <label
              htmlFor="appLockPin"
              className="absolute left-6 font-bold pointer-events-none transition-all duration-200 px-1.5 bg-[#21355a] text-[#a4c0f4]/80 text-xs top-0 -translate-y-1/2
              peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:left-11 peer-placeholder-shown:text-sm peer-placeholder-shown:text-[#a4c0f4]/60 peer-placeholder-shown:bg-transparent
              peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:left-6 peer-focus:text-xs peer-focus:text-[#89a5e5] peer-focus:bg-[#21355a]"
            >
              App Lock PIN (4 Digits)
            </label>
          </div>

          {/* Submit register button */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-6 bg-[#89a5e5] hover:bg-[#9cb6f0] text-[#1c2e4e] rounded-2xl font-black tracking-wider shadow-lg shadow-[#89a5e5]/10 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
          >
            {loading ? <Loader2 className="animate-spin text-[#1c2e4e]" size={20} /> : (
              <>
                <span>Register Account</span>
                <UserPlus size={16} strokeWidth={2.5} />
              </>
            )}
          </motion.button>
        </form>

        {/* Bottom links as requested */}
        <div className="mt-8 pt-6 border-t border-[#2a3e68] text-center relative z-10">
          <Link 
            to="/login" 
            className="inline-flex items-center gap-1.5 text-[#89a5e5] hover:text-[#9cb6f0] text-xs font-extrabold transition-colors py-1 tracking-wider"
          >
            Already have an account? Login
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
