import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  TrendingUp, 
  TrendingDown, 
  Building2, 
  HandCoins, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  CreditCard,
  Wallet,
  Globe,
  Info,
  ChevronDown,
  ChevronRight,
  PlusCircle,
  History
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { translations } from '../translations';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useBackButton } from './BackButtonProvider';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // For mobile
  const [isExpanded, setIsExpanded] = useState(false); // For desktop
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [openNestedMenu, setOpenNestedMenu] = useState<string | null>(null);

  const { registerHandler } = useBackButton();

  React.useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('menu') === 'true') {
      setIsSidebarOpen(true);
    }
  }, [location.search]);

  React.useEffect(() => {
    if (isSidebarOpen) {
      const unregister = registerHandler(() => {
        setIsSidebarOpen(false);
        navigate('/');
        return true;
      });
      return unregister;
    }
  }, [isSidebarOpen, registerHandler, navigate]);

  React.useEffect(() => {
    if (!isExpanded && !isSidebarOpen) {
      setOpenMenu(null);
      setOpenNestedMenu(null);
    }
  }, [isExpanded, isSidebarOpen]);

  const toggleMenu = (key: string) => {
    setOpenMenu(prev => prev === key ? null : key);
  };
  
  const lang = profile?.language || 'en';
  const t = translations[lang as keyof typeof translations];

  // Force light theme
  React.useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  const menuItems = [
    { key: 'dashboard', name: t.dashboard, icon: LayoutDashboard, path: '/', disabled: false },
    { 
      key: 'cash',
      name: t.cashTransaction, 
      icon: Wallet, 
      subItems: [
        { name: t.income, icon: TrendingUp, path: '/income', disabled: false },
        { name: t.expense, icon: TrendingDown, path: '/expense', disabled: false },
      ]
    },
    { 
      key: 'bank',
      name: t.bankTransaction, 
      icon: Building2, 
      subItems: [
        { name: t.addBankAccount, icon: PlusCircle, path: '/bank?add=true', disabled: false },
        { name: t.deposit, icon: TrendingUp, path: '/bank?deposit=true', disabled: false },
        { name: t.withdraw, icon: TrendingDown, path: '/bank?withdraw=true', disabled: false },
        { name: t.allBankList, icon: Building2, path: '/bank?list=true', disabled: false },
        { name: t.viewStatement, icon: BarChart3, path: '/bank?statement=true', disabled: false },
      ]
    },
    { 
      key: 'credit', 
      name: t.baki, 
      icon: CreditCard, 
      subItems: [
        { name: t.addShop, icon: PlusCircle, path: '/credit?addShop=true', disabled: false },
        { name: t.creditPurchase, icon: CreditCard, path: '/credit?purchase=true', disabled: false },
        { name: t.paymentToSupplier, icon: TrendingDown, path: '/credit?payment=true', disabled: false },
        { name: t.viewAllShop, icon: LayoutDashboard, path: '/credit?list=true', disabled: false },
      ]
    },
    { 
      key: 'loan', 
      name: t.loans, 
      icon: HandCoins, 
      subItems: [
        { name: t.addNewPerson, icon: PlusCircle, path: '/loans?addPerson=true', disabled: false },
        { name: t.loanGivenOrTaken, icon: HandCoins, path: '/loans?addLoan=true', disabled: false },
        { name: t.repayment, icon: History, path: '/loans?repayment=true', disabled: false },
        { name: t.viewAllPerson, icon: Users, path: '/loans', disabled: false },
      ]
    },
    { 
      key: 'online', 
      name: t.other, 
      icon: Globe, 
      subItems: [
        { 
          name: t.bkash, 
          icon: Wallet, 
          nestedItems: [
            { name: t.addMethod.replace('{{method}}', t.bkash), icon: PlusCircle, path: '/online?method=Bkash&action=add', disabled: false },
            { name: t.methodTransactions.replace('{{method}}', t.bkash), icon: History, path: '/online?method=Bkash&tab=transactions&action=transaction', disabled: false },
            { name: t.methodList.replace('{{method}}', t.bkash), icon: Users, path: '/online?method=Bkash&tab=list', disabled: false },
          ]
        },
        { 
          name: t.nagad, 
          icon: Wallet, 
          nestedItems: [
            { name: t.addMethod.replace('{{method}}', t.nagad), icon: PlusCircle, path: '/online?method=Nagad&action=add', disabled: false },
            { name: t.methodTransactions.replace('{{method}}', t.nagad), icon: History, path: '/online?method=Nagad&tab=transactions&action=transaction', disabled: false },
            { name: t.methodList.replace('{{method}}', t.nagad), icon: Users, path: '/online?method=Nagad&tab=list', disabled: false },
          ]
        },
        { 
          name: t.rocket, 
          icon: Wallet, 
          nestedItems: [
            { name: t.addMethod.replace('{{method}}', t.rocket), icon: PlusCircle, path: '/online?method=Rocket&action=add', disabled: false },
            { name: t.methodTransactions.replace('{{method}}', t.rocket), icon: History, path: '/online?method=Rocket&tab=transactions&action=transaction', disabled: false },
            { name: t.methodList.replace('{{method}}', t.rocket), icon: Users, path: '/online?method=Rocket&tab=list', disabled: false },
          ]
        },
        { 
          name: t.upay, 
          icon: Wallet, 
          nestedItems: [
            { name: t.addMethod.replace('{{method}}', t.upay), icon: PlusCircle, path: '/online?method=Upay&action=add', disabled: false },
            { name: t.methodTransactions.replace('{{method}}', t.upay), icon: History, path: '/online?method=Upay&tab=transactions&action=transaction', disabled: false },
            { name: t.methodList.replace('{{method}}', t.upay), icon: Users, path: '/online?method=Upay&tab=list', disabled: false },
          ]
        },
        { name: 'View Statement', icon: BarChart3, path: '/online?statement=true', disabled: false },
      ]
    },
    { key: 'reports', name: t.reports, icon: BarChart3, path: '/reports', disabled: false },
    { key: 'settings', name: t.settings, icon: Settings, path: '/settings', disabled: false },
    { key: 'about', name: t.aboutApp, icon: Info, path: '/about', disabled: false },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen border-none flex flex-col lg:flex-row relative">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/5 blur-[120px] rounded-full" />
      </div>

      {/* Sidebar for desktop */}
      <motion.aside
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
        animate={{ width: isExpanded ? 280 : 88 }}
        transition={{ type: 'tween', duration: 0.2, ease: 'easeOut' }}
        className="hidden lg:flex flex-col glass-sidebar sticky top-0 h-screen z-50 overflow-hidden"
      >
        <div className="p-6 mb-4">
          <div className="flex items-center gap-4">
            <div className="min-w-[40px] h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]">
              <CreditCard size={24} />
            </div>
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="whitespace-nowrap"
                >
                  <h1 className="text-xl font-black text-foreground tracking-tight neon-glow-blue">Money mate</h1>
                  <p className="text-[10px] text-blue-400 font-bold tracking-wider leading-none">Intelligence</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar overflow-x-hidden">
          {menuItems.map((item) => {
            if (item.subItems) {
              return (
                <div key={item.name} className="space-y-1">
                  <button
                    onClick={() => toggleMenu(item.key)}
                    className={cn(
                      "flex items-center justify-between w-full p-3 rounded-2xl transition-all duration-300 group hover:bg-white/5",
                      openMenu === item.key && "bg-white/5"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className="min-w-[40px] flex justify-center">
                        <item.icon size={22} className={cn(
                          "text-slate-400 transition-all group-hover:text-blue-400 group-hover:scale-110", 
                          openMenu === item.key && "text-blue-400"
                        )} />
                      </div>
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-[15px] font-medium text-slate-400 group-hover:text-foreground whitespace-nowrap"
                          >
                            {item.name}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                    {isExpanded && (
                      openMenu === item.key
                        ? <ChevronDown size={16} className="text-slate-500" /> 
                        : <ChevronRight size={16} className="text-slate-500" />
                    )}
                  </button>
                  <AnimatePresence>
                    {openMenu === item.key && isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden space-y-1 pl-10"
                      >
                        {item.subItems.map((sub) => (
                          <div key={sub.name}>
                            {sub.nestedItems ? (
                              <div className="space-y-1">
                                <button
                                  onClick={() => setOpenNestedMenu(openNestedMenu === sub.name ? null : sub.name)}
                                  className={cn(
                                    "flex items-center justify-between w-full p-2.5 rounded-xl transition-all duration-300 group/sub",
                                    openNestedMenu === sub.name ? "bg-white/5 text-blue-400" : "text-slate-500 hover:text-foreground hover:bg-white/5"
                                  )}
                                >
                                  <div className="flex items-center gap-3">
                                    <sub.icon size={16} />
                                    <span className="text-[14px] font-medium whitespace-nowrap">{sub.name}</span>
                                  </div>
                                  <ChevronRight size={14} className={cn("transition-transform duration-200", openNestedMenu === sub.name && "rotate-90")} />
                                </button>
                                <AnimatePresence>
                                  {openNestedMenu === sub.name && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="overflow-hidden space-y-1 pl-6"
                                    >
                                      {sub.nestedItems.map((nested) => (
                                        <NavLink
                                          key={nested.name}
                                          to={nested.path || '#'}
                                          onClick={(e) => nested.disabled && e.preventDefault()}
                                          className={({ isActive }) => 
                                            cn(
                                              "flex items-center gap-2 p-2 rounded-lg transition-all duration-300 group/nested",
                                              nested.disabled && "opacity-50 cursor-not-allowed",
                                              isActive 
                                                ? "text-blue-400" 
                                                : "text-slate-500 hover:text-foreground"
                                            )
                                          }
                                        >
                                          <nested.icon size={14} />
                                          <span className="text-[12px] font-medium whitespace-nowrap">{nested.name}</span>
                                        </NavLink>
                                      ))}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            ) : (
                              <NavLink
                                to={sub.path || '#'}
                                onClick={(e) => sub.disabled && e.preventDefault()}
                                className={({ isActive }) => 
                                  cn(
                                    "flex items-center gap-3 p-3 rounded-xl transition-all duration-300 group",
                                    sub.disabled && "opacity-50 cursor-not-allowed",
                                    isActive 
                                      ? "bg-blue-600/20 text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]" 
                                      : "text-slate-500 hover:text-foreground hover:bg-white/5"
                                  )
                                }
                              >
                                <sub.icon size={18} />
                                <span className="text-[14px] font-medium whitespace-nowrap">{sub.name}</span>
                              </NavLink>
                            )}
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            }
            return (
              <NavLink
                key={item.path}
                to={item.path || '#'}
                onClick={(e) => item.disabled && e.preventDefault()}
                className={({ isActive }) => 
                  cn(
                    "flex items-center gap-4 p-3 rounded-2xl transition-all duration-300 group",
                    item.disabled && "opacity-50 cursor-not-allowed",
                    isActive 
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-[0_8px_20px_rgba(59,130,246,0.3)] neon-border-blue" 
                      : "text-slate-400 hover:bg-white/5 hover:text-foreground"
                  )
                }
              >
                <div className="min-w-[40px] flex justify-center">
                  <item.icon size={22} className={cn("transition-all group-hover:scale-110")} />
                </div>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-[15px] font-medium whitespace-nowrap"
                    >
                      {item.name}
                    </motion.span>
                  )}
                </AnimatePresence>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 mt-auto">
          <AnimatePresence>
            {isExpanded && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="p-4 bg-white/5 rounded-2xl border border-white/10 mb-4"
              >
                <div className="flex items-center gap-3">
                  <div className="min-w-[40px] h-10 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center text-blue-400 border border-blue-500/30 font-bold">
                    {profile?.name?.charAt(0) || 'U'}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-bold text-foreground truncate">{profile?.name || 'User'}</p>
                    <p className="text-[10px] text-slate-500 truncate">{profile?.email}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-4 p-3 w-full text-left text-slate-500 hover:bg-red-500/10 hover:text-red-400 rounded-2xl transition-all duration-300 group"
          >
            <div className="min-w-[40px] flex justify-center">
              <LogOut size={22} className="group-hover:rotate-180 transition-transform duration-500" />
            </div>
            {isExpanded && <span className="font-medium whitespace-nowrap">{t.logout}</span>}
          </button>
        </div>
      </motion.aside>

      {/* Mobile Glass Header */}
      <div 
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          height: 'calc(4rem + env(safe-area-inset-top, 0px))'
        }}
        className="lg:hidden fixed top-0 left-0 right-0 bg-background/60 backdrop-blur-xl border-b border-glass-border flex items-center px-4 z-[9999] shadow-sm"
      >
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="w-12 h-12 flex items-center justify-center text-foreground active:scale-90 transition-transform"
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} strokeWidth={2.5} />}
        </button>
        <div className="flex items-center gap-2 ml-2">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg">
            <CreditCard size={18} />
          </div>
          <h1 className="text-base font-black text-foreground tracking-tight">Money <span className="text-indigo-500">Mate</span></h1>
        </div>
        <div className="ml-auto w-8 h-8 bg-foreground/5 rounded-full flex items-center justify-center text-[10px] font-black border border-glass-border">
          {profile?.name?.charAt(0) || 'U'}
        </div>
      </div>

      {/* Mobile Left-side Full Page Menu */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden fixed inset-0 bg-slate-900/40 z-[10000]"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-full bg-slate-50 z-[10001] flex flex-col p-0 overflow-hidden shadow-2xl"
            >
              {/* Background Decor in Sidebar */}
              <div className="absolute inset-0 pointer-events-none opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[100%] h-[40%] bg-blue-500/20 blur-[80px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[100%] h-[40%] bg-purple-500/20 blur-[80px] rounded-full" />
              </div>

              <div 
                style={{ paddingTop: 'calc(2rem + env(safe-area-inset-top, 0px))' }}
                className="p-8 pb-4 relative z-10"
              >
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                      <CreditCard size={22} />
                    </div>
                    <div>
                      <h1 className="text-xl font-black text-foreground tracking-tighter">Money <span className="text-indigo-500">Mate</span></h1>
                      <div className="h-0.5 w-8 bg-indigo-500 rounded-full mt-0.5" />
                    </div>
                  </div>
                  <motion.button 
                    whileHover={{ rotate: 90, scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsSidebarOpen(false)} 
                    className="w-10 h-10 flex items-center justify-center bg-indigo-50 rounded-full text-indigo-600 border border-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.55)] cursor-pointer active:scale-95 transition-all duration-300"
                  >
                    <X size={22} strokeWidth={2.5} />
                  </motion.button>
                </div>
              </div>
              
              <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto custom-scrollbar relative z-10">
                {menuItems.map((item, idx) => {
                   if (item.subItems) {
                    return (
                      <div 
                        key={item.name} 
                        className="space-y-1"
                      >
                        <button
                          onClick={() => toggleMenu(item.key)}
                          className={cn(
                            "flex items-center justify-between w-full p-4 rounded-2xl text-slate-500 hover:bg-foreground/5 hover:text-foreground transition-all duration-300",
                            openMenu === item.key && "bg-foreground/5 text-foreground"
                          )}
                        >
                          <div className="flex items-center gap-4">
                            <item.icon size={20} className={cn(openMenu === item.key && "text-blue-500")} />
                            <span className="text-[15px] font-bold tracking-tight text-[14px]">{item.name}</span>
                          </div>
                          {openMenu === item.key ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                        <AnimatePresence>
                          {openMenu === item.key && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.15, ease: 'easeOut' }}
                              className="overflow-hidden space-y-1 ml-4 border-l border-foreground/5"
                            >
                               {item.subItems.map((sub) => (
                                  <div key={sub.name}>
                                    {sub.nestedItems ? (
                                      <div className="space-y-1">
                                        <button
                                          onClick={() => setOpenNestedMenu(openNestedMenu === sub.name ? null : sub.name)}
                                          className={cn(
                                            "flex items-center justify-between w-full py-3 px-6 rounded-r-2xl transition-all duration-300",
                                            openNestedMenu === sub.name ? "bg-blue-500/5 text-blue-500" : "text-slate-500 hover:text-foreground"
                                          )}
                                        >
                                          <div className="flex items-center gap-4">
                                            <sub.icon size={18} />
                                            <span className="text-[14px] font-bold text-[13px]">{sub.name}</span>
                                          </div>
                                          <ChevronRight size={12} className={cn("transition-transform duration-200", openNestedMenu === sub.name && "rotate-90")} />
                                        </button>
                                        <AnimatePresence>
                                          {openNestedMenu === sub.name && (
                                            <motion.div
                                              initial={{ height: 0, opacity: 0 }}
                                              animate={{ height: 'auto', opacity: 1 }}
                                              exit={{ height: 0, opacity: 0 }}
                                              className="overflow-hidden space-y-1 ml-4 border-l border-foreground/5"
                                            >
                                              {sub.nestedItems.map((nested) => (
                  <NavLink
                    key={nested.name}
                    to={nested.path || '#'}
                    onClick={(e) => {
                      if (nested.disabled) e.preventDefault();
                      else setIsSidebarOpen(false);
                    }}
                    className={({ isActive }) => 
                      cn(
                        "flex items-center gap-3 py-2 px-8 rounded-r-xl transition-all duration-300",
                        nested.disabled && "opacity-50 cursor-not-allowed",
                        isActive 
                          ? "text-blue-500 font-bold" 
                          : "text-slate-500 hover:text-foreground"
                      )
                    }
                  >
                    <nested.icon size={16} />
                    <span className="text-[12px] font-bold text-[11px]">{nested.name}</span>
                  </NavLink>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <NavLink
          to={sub.path || '#'}
          onClick={(e) => {
            if (sub.disabled) e.preventDefault();
            else setIsSidebarOpen(false);
          }}
          className={({ isActive }) => 
            cn(
              "flex items-center gap-4 py-3 px-6 rounded-r-2xl transition-all duration-300",
              sub.disabled && "opacity-50 cursor-not-allowed",
              isActive 
                ? "bg-blue-500/10 text-blue-500 font-bold" 
                : "text-slate-500 hover:text-foreground"
            )
          }
        >
          <sub.icon size={18} />
          <span className="text-[14px] font-bold text-[11px]">{sub.name}</span>
        </NavLink>
      )}
    </div>
  ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  }
                  return (
                    <div
                      key={item.path}
                    >
                      <NavLink
                        to={item.path || '#'}
                        onClick={(e) => {
                          if (item.disabled) e.preventDefault();
                          else setIsSidebarOpen(false);
                        }}
                        className={({ isActive }) => 
                          cn(
                            "flex items-center gap-4 p-4 rounded-2xl transition-all duration-300",
                            item.disabled && "opacity-50 cursor-not-allowed",
                            isActive 
                              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_8px_20px_rgba(59,130,246,0.3)] font-bold" 
                              : "text-slate-500 hover:bg-foreground/5 hover:text-foreground"
                          )
                        }
                      >
                        <item.icon size={20} />
                        <span className="text-[15px] font-bold text-[14px]">{item.name}</span>
                      </NavLink>
                    </div>
                  );
                })}
              </nav>

              <div className="mt-8 pt-8 border-t border-slate-200">
                <div className="flex items-center gap-4 mb-6">
                   <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-blue-600 border border-slate-200 font-bold shadow-sm">
                    {profile?.name?.charAt(0) || 'U'}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-base font-black text-foreground truncate">{profile?.name || 'User'}</p>
                    <p className="text-xs text-slate-500 truncate">{profile?.email}</p>
                  </div>
                </div>
                <button 
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-3 p-4 w-full bg-red-500/10 text-red-400 border border-red-500/20 rounded-2xl font-bold transition-all active:scale-95 shadow-lg"
                >
                  <LogOut size={20} />
                  <span>{t.logout}</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 px-3 md:px-6 lg:px-12 py-4 mb-6 lg:mb-0 max-w-[1600px] mx-auto w-full relative pt-[calc(4.5rem+env(safe-area-inset-top,0px))] lg:pt-16 mt-0">
        {children}
      </main>
    </div>
  );
}
