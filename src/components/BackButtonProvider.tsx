import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, X, AlertTriangle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { App } from '@capacitor/app';

type BackHandler = () => boolean; // Return true if handled, false to bubbles up

interface BackButtonContextType {
  registerHandler: (handler: BackHandler) => () => void;
  triggerBack: () => void;
}

const BackButtonContext = createContext<BackButtonContextType | undefined>(undefined);

export function useBackButton() {
  const context = useContext(BackButtonContext);
  if (!context) {
    throw new Error('useBackButton must be used within a BackButtonProvider');
  }
  return context;
}

export function BackButtonProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const isBn = profile?.language === 'bn';

  const [showExitDialog, setShowExitDialog] = useState(false);
  const handlersRef = useRef<BackHandler[]>([]);

  const registerHandler = (handler: BackHandler) => {
    handlersRef.current.push(handler);
    return () => {
      handlersRef.current = handlersRef.current.filter((h) => h !== handler);
    };
  };

  const triggerBack = () => {
    // 1. Check custom handlers first (most specific to least specific)
    const handlers = handlersRef.current;
    for (let i = handlers.length - 1; i >= 0; i--) {
      const isHandled = handlers[i]();
      if (isHandled) {
        return;
      }
    }

    // 2. Default Navigation Logic based on user's exact specifications
    if (location.pathname === '/') {
      // If we are on Dashboard (and no custom handler like sidebar open intercepted it)
      setShowExitDialog(true);
    } else {
      // If we are on any subpage (e.g., /bank, /income, /online, /credit, etc.)
      // Navigate to /?menu=true (Dashboard with Main Menu open)
      navigate('/?menu=true', { replace: true });
    }
  };

  // Capacitor/Cordova Hardware and Web Popstate listener
  useEffect(() => {
    const handleHardwareBack = (e: Event) => {
      const hasHandlers = handlersRef.current.length > 0;
      if (location.pathname === '/' || hasHandlers) {
        e.preventDefault();
        triggerBack();
      } else {
        e.preventDefault();
        navigate('/?menu=true', { replace: true });
      }
    };

    // Standard history popstate hook to intercept browser-driven back buttons
    const handlePopstate = (e: PopStateEvent) => {
      const hasHandlers = handlersRef.current.length > 0;
      if (location.pathname === '/' || hasHandlers) {
        // Push state again so clicking back doesn't change URL instantly before we can intercept
        window.history.pushState(null, document.title, window.location.href);
        triggerBack();
      } else {
        // Let standard browser back navigation flow naturally back to home/dashboard
      }
    };

    // Setup history boundary to make dashboard or custom modals popstate interceptable
    const hasHandlers = handlersRef.current.length > 0;
    if (location.pathname === '/' || hasHandlers) {
      window.history.pushState(null, document.title, window.location.href);
    }

    // Bind cordova/capacitor hardware event
    document.addEventListener('backbutton', handleHardwareBack, false);
    window.addEventListener('popstate', handlePopstate);

    // Bind native Capacitor app back button event listener
    let capacitorListener: any = null;
    const registerCapacitorBack = async () => {
      try {
        capacitorListener = await App.addListener('backButton', () => {
          triggerBack();
        });
      } catch (err) {
        console.warn('Capacitor App listener skipped or failed:', err);
      }
    };
    registerCapacitorBack();

    return () => {
      document.removeEventListener('backbutton', handleHardwareBack, false);
      window.removeEventListener('popstate', handlePopstate);
      if (capacitorListener && typeof capacitorListener.remove === 'function') {
        capacitorListener.remove();
      }
    };
  }, [location.pathname]); // Update context dynamically when route changes

  // Perform App Exit
  const handleConfirmExit = async () => {
    setShowExitDialog(false);
    try {
      await App.exitApp();
    } catch {
      const navApp = (window as any).navigator?.app;
      if (navApp && typeof navApp.exitApp === 'function') {
        navApp.exitApp();
      } else {
        // Fallback for standard browsers as graceful exit
        window.close();
        // If window.close() fails because it wasn't opened by script, give notice
        alert(isBn ? 'অ্যাপ থেকে বের হওয়ার জন্য ব্রাউজার ট্যাবটি বন্ধ করুন' : 'Please close this browser tab to exit');
      }
    }
  };

  return (
    <BackButtonContext.Provider value={{ registerHandler, triggerBack }}>
      {children}

      {/* Modern, Highly Refined Exit Permission Dialog with Dynamic Safe Area offset */}
      <AnimatePresence>
        {showExitDialog && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[99999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-[2.5rem] p-6 md:p-8 max-w-sm w-full shadow-2xl border border-slate-100 relative overflow-hidden text-center"
            >
              {/* Corner decor */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/[0.02] blur-xl rounded-full" />
              
              <div className="mx-auto w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-6 border border-rose-100 animate-bounce">
                <AlertTriangle size={32} />
              </div>

              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                {isBn ? 'অ্যাপ থেকে বের হতে চান?' : 'Exit Application?'}
              </h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1.5">
                {isBn ? 'মানি মিট ইন্টেলিজেন্স' : 'Money Mate Intelligence'}
              </p>

              <p className="text-xs text-slate-500 mt-4 leading-relaxed font-semibold">
                {isBn 
                  ? 'আপনি কি নিশ্চিত যে আপনি মানি মিট অ্যাপটি বন্ধ করে দিতে চান?' 
                  : 'Are you sure you want to shut down and exit Money Mate?'}
              </p>

              <div className="grid grid-cols-2 gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => setShowExitDialog(false)}
                  className="py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold uppercase text-[11px] tracking-wider rounded-2xl transition-all active:scale-95 cursor-pointer"
                >
                  {isBn ? 'না, বন্ধ করবেন না' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmExit}
                  className="py-4 bg-rose-600 hover:bg-rose-700 text-white font-extrabold uppercase text-[11px] tracking-wider rounded-2xl shadow-lg shadow-rose-600/20 active:scale-95 transition-all cursor-pointer"
                >
                  {isBn ? 'হ্যাঁ, বের হোন' : 'Exit App'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </BackButtonContext.Provider>
  );
}
