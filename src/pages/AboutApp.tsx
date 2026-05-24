import React from 'react';
import { motion } from 'motion/react';
import { 
  Info, 
  CreditCard, 
  CheckCircle2, 
  Facebook, 
  Mail, 
  MessageCircle, 
  Send, 
  Heart,
  TrendingUp,
  Landmark,
  Wallet,
  HandCoins,
  History,
  BarChart3,
  Smartphone
} from 'lucide-react';

export default function AboutApp() {
  const features = [
    { text: 'Track Income & Expense', icon: <TrendingUp size={18} className="text-emerald-500" /> },
    { text: 'Manage Cash Transactions', icon: <Wallet size={18} className="text-amber-500" /> },
    { text: 'Handle Bank Transactions', icon: <Landmark size={18} className="text-blue-500" /> },
    { text: 'Manage Loans Given & Taken', icon: <HandCoins size={18} className="text-purple-500" /> },
    { text: 'Track Credit/Due System', icon: <History size={18} className="text-rose-500" /> },
    { text: 'Generate Financial Reports', icon: <BarChart3 size={18} className="text-teal-500" /> },
    { text: 'Manage Mobile Banking Accounts', icon: <Smartphone size={18} className="text-indigo-500" /> },
  ];

  const contacts = [
    { 
      name: 'Facebook', 
      icon: <Facebook size={22} />, 
      url: 'https://www.facebook.com/share/1NtoX89Agg/', 
      color: 'bg-[#1877F2]' 
    },
    { 
      name: 'Email', 
      icon: <Mail size={22} />, 
      url: 'mailto:mdrabbi.career@gmail.com', 
      color: 'bg-[#EA4335]' 
    },
    { 
      name: 'WhatsApp', 
      icon: <MessageCircle size={22} />, 
      url: 'https://wa.me/8801300594522', 
      color: 'bg-[#25D366]' 
    },
    { 
      name: 'Telegram', 
      icon: <Send size={22} />, 
      url: 'https://t.me/+8801300594522', 
      color: 'bg-[#0088cc]' 
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-16 px-4">
      {/* App Branding Header */}
      <div className="text-center space-y-4 pt-4">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-20 h-20 bg-blue-600 text-white rounded-[1.8rem] flex items-center justify-center mx-auto shadow-xl shadow-blue-500/10"
        >
          <CreditCard size={40} strokeWidth={2} />
        </motion.div>
        <div className="space-y-1">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
            Money <span className="text-blue-600">Mate</span>
          </h1>
          <p className="text-slate-400 font-bold tracking-[0.2em] text-xs uppercase">Smart Finance Manager</p>
        </div>
      </div>

      {/* Main Content Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* App Overview & Philosophy Card */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-3xl border-2 border-slate-100 p-8 shadow-sm flex flex-col justify-between"
        >
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <Info size={20} strokeWidth={2.5} />
              </div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">About App</h2>
            </div>
            
            <p className="text-slate-500 text-base leading-relaxed font-semibold">
              Money Mate is a modern smart finance management application designed to help users manage their daily financial activities easily and securely.
            </p>
            
            <p className="text-slate-500 text-base leading-relaxed font-semibold">
              This app is designed with a clean modern UI and user-based secure accounting system, where every user can manage their own personal financial records privately.
            </p>
          </div>
        </motion.div>

        {/* Features Checklist Card */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-3xl border-2 border-slate-100 p-8 shadow-sm"
        >
          <h2 className="text-xl font-bold text-slate-800 tracking-tight mb-6 flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 size={20} strokeWidth={2.5} />
            </div>
            Core Capabilities
          </h2>
          
          <ul className="space-y-4">
            {features.map((feature, idx) => (
              <motion.li 
                key={idx}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center gap-3"
              >
                <div className="p-1.5 bg-slate-50 rounded-lg">
                  {feature.icon}
                </div>
                <span className="text-slate-700 font-bold text-[14px]">
                  {feature.text}
                </span>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* Developer Persona Section and Contacts */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl border-2 border-slate-100 p-8 md:p-10 shadow-sm relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Picture Grid - Left Side */}
          <div className="md:col-span-4 flex flex-col items-center text-center">
            <div className="relative group p-1.5 border-2 border-dashed border-indigo-200 rounded-full">
              <img 
                src="https://i.ibb.co.com/ny3szqM/file-00000000be4471fab7cf4a3050215650.png" 
                alt="Mohammad Rabbi" 
                referrerPolicy="no-referrer"
                className="w-32 h-32 rounded-full object-cover shadow-md group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>

          {/* Details / Text Grid - Right Side */}
          <div className="md:col-span-8 space-y-6">
            <div className="space-y-2 text-center md:text-left">
              <p className="text-xs font-black tracking-widest text-indigo-600 uppercase">About Developer</p>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">Mohammad Rabbi</h3>
              <p className="text-slate-500 text-[14px] leading-relaxed font-semibold">
                A passionate app developer focused on creating smart, modern, and user-friendly financial management solutions.
              </p>
            </div>

            {/* Quick Modern Interaction Platform Panel */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs font-black tracking-widest text-slate-400 uppercase">
                Connect Directly
              </span>
              <div className="flex items-center gap-3">
                {contacts.map((contact, idx) => (
                  <motion.a 
                    key={idx}
                    href={contact.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.15, y: -2 }}
                    className={`${contact.color} w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md hover:shadow-lg transition-all`}
                    title={contact.name}
                  >
                    {contact.icon}
                  </motion.a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Thank you and Bottom Footer Panel */}
      <div className="text-center space-y-2 pt-4">
        <h3 className="text-base font-extrabold text-slate-800 tracking-tight flex items-center justify-center gap-2">
          Thank you for using Money Mate <Heart size={16} className="text-rose-500 fill-rose-500 animate-pulse" />
        </h3>
        <p className="text-slate-400 font-bold tracking-tight text-[11px]">© 2026 Money Mate. All Rights Reserved.</p>
      </div>
    </div>
  );
}
