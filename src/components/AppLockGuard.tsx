import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Fingerprint, Lock, ShieldAlert } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/utils';
import { isNativeBiometricsAvailable, performNativeBiometricUnlock } from '../lib/biometrics';

export function AppLockGuard({ children }: { children: React.ReactNode }) {
  const { profile, user, loading } = useAuth();
  
  // Decide if we are waiting for user or profile states to load
  const isProfileLoading = !!user && !profile && loading;

  // Get active configurations
  const hasPin = !!profile?.appLockPin;
  const isBiometricsOn = !!profile?.biometricsEnabled;

  const [pinInput, setPinInput] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isVerifyingBio, setIsVerifyingBio] = useState(false);
  const [cancelledBiometrics, setCancelledBiometrics] = useState(false);

  // Track key pin matches inside sessionStorage so page navigations do not lock every time
  const [sessionUnlocked, setSessionUnlocked] = useState(() => {
    return sessionStorage.getItem('app_unlocked_session') === 'true';
  });

  // Decide if lock screen must be shown (derived instantly to avoid dashboard leakage/flashes!)
  const isLocked = hasPin && !sessionUnlocked;

  const showBiometricsPrompt = isBiometricsOn && isLocked && !cancelledBiometrics;

  // Handle automatic biometric trigger on mount / locked state
  useEffect(() => {
    if (showBiometricsPrompt) {
      const timer = setTimeout(() => {
        handleBiometricUnlock();
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [showBiometricsPrompt]);

  // Handle loading states safely to prevent dashboard contents from leaking
  if (loading || isProfileLoading) {
    return (
      <div className="fixed inset-0 z-[99999] bg-slate-900 flex flex-col items-center justify-center p-6 select-none font-sans">
        <div className="flex flex-col items-center text-center animate-pulse">
          <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-500/10 mb-4 border border-blue-400/20">
            <Lock className="w-7 h-7 text-white animate-bounce" />
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">
            Money Mate Security
          </h2>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mt-1">
            Verifying Security Setup...
          </p>
        </div>
      </div>
    );
  }

  const handlePinInput = (num: string) => {
    if (pinInput.length >= 4) return;
    setErrorMsg('');
    const newVal = pinInput + num;
    setPinInput(newVal);

    if (newVal.length === 4) {
      if (newVal === profile?.appLockPin) {
        triggerUnlock();
      } else {
        if (navigator.vibrate) navigator.vibrate(150);
        setErrorMsg('Incorrect PIN! Please try again.');
        setPinInput('');
      }
    }
  };

  const handleBackspace = () => {
    setPinInput(prev => prev.slice(0, -1));
    setErrorMsg('');
  };

  const triggerUnlock = () => {
    sessionStorage.setItem('app_unlocked_session', 'true');
    setSessionUnlocked(true);
    setPinInput('');
    setErrorMsg('');
  };

  // Real WebAuthn platform authenticator biometric unlock
  const handleBiometricUnlock = async () => {
    setErrorMsg('');
    setIsVerifyingBio(true);

    // Try native biometrics first if running under Capacitor
    const nativeAvailable = await isNativeBiometricsAvailable();
    if (nativeAvailable) {
      const result = await performNativeBiometricUnlock();
      if (result.success) {
        triggerUnlock();
      } else if (result.error) {
        setErrorMsg(result.error);
      }
      setIsVerifyingBio(false);
      return;
    }

    const isInsideIframe = window.self !== window.top;
    if (isInsideIframe) {
      // Simulate modern fingerprint scanner matching in preview mode
      await new Promise(resolve => setTimeout(resolve, 1500));
      triggerUnlock();
      setIsVerifyingBio(false);
      return;
    }
    
    try {
      if (!window.PublicKeyCredential) {
        setErrorMsg('Fingerprint lock not supported on this device/browser!');
        setIsVerifyingBio(false);
        return;
      }

      const isAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!isAvailable) {
        setErrorMsg('Fingerprint hardware sensor not found on this device!');
        setIsVerifyingBio(false);
        return;
      }

      const storedCredId = localStorage.getItem('bio_credential_id');
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      const allowCredentials: PublicKeyCredentialDescriptor[] = [];
      if (storedCredId) {
        const rawId = new Uint8Array(
          atob(storedCredId)
            .split("")
            .map((c) => c.charCodeAt(0))
        );
        allowCredentials.push({
          type: "public-key",
          id: rawId,
        });
      }

      const options: CredentialRequestOptions = {
        publicKey: {
          challenge,
          timeout: 20000,
          userVerification: "required",
          allowCredentials: allowCredentials.length > 0 ? allowCredentials : undefined
        }
      };

      const assertion = await navigator.credentials.get(options);
      if (assertion) {
        triggerUnlock();
      } else {
        throw new Error("No biometric credentials matching.");
      }
    } catch (err: any) {
      console.warn("Native biometric authentication error:", err);
      if (err.name === "SecurityError") {
        setErrorMsg('Device biometric hardware cannot be accessed within preview iframe. Open the app in a new tab.');
      } else {
        setErrorMsg('Fingerprint did not match or screen unlock cancelled!');
      }
      if (navigator.vibrate) navigator.vibrate(150);
    } finally {
      setIsVerifyingBio(false);
    }
  };

  if (!isLocked) {
    return <>{children}</>;
  }

  // FIRST SCREEN: Biometric screen (if enabled)
  if (showBiometricsPrompt) {
    return (
      <div className="fixed inset-0 z-[99999] bg-black text-white flex flex-col justify-end pb-12 p-6 select-none font-sans overflow-y-auto">
        <div className="w-full max-w-sm mx-auto flex flex-col items-center">
          
          {/* Header/Greeting Texts matching mockup */}
          <div className="text-center space-y-1 mb-8">
            <p className="text-slate-300 text-base font-normal tracking-wide antialiased">
              Start Using Bio-Auth- Save your time
            </p>
            <p className="text-slate-300 text-base font-normal tracking-wide antialiased">
              Login to your Money Mate Account
            </p>
            <p className="text-slate-400 text-sm font-normal tracking-wide">
              Authenticate to verify identity
            </p>
          </div>

          {/* Cancel Button styled exactly like the provided image */}
          <button
            onClick={() => setCancelledBiometrics(true)}
            type="button"
            className="w-full max-w-[280px] py-2.5 mb-14 border border-[#2e2e2e] hover:border-slate-600 rounded-2xl bg-transparent text-[#2563eb] text-2xl font-normal tracking-wide transition-all active:scale-[0.98] outline-none"
          >
            Cancel
          </button>

          {/* Biometrics Status Message / Guide */}
          <div className="min-h-[24px] mb-4 text-center px-4 w-full">
            {errorMsg ? (
              <p className="text-rose-400 font-bold text-xs flex items-center gap-1.5 justify-center">
                <ShieldAlert size={14} className="shrink-0" />
                {errorMsg}
              </p>
            ) : isVerifyingBio ? (
              <p className="text-blue-500 text-sm font-semibold animate-pulse leading-normal">
                {window.self !== window.top 
                  ? "Simulator: Auto-verifying inside development iframe..." 
                  : "Verifying platform security scanner..."}
              </p>
            ) : (
              <p className="text-slate-300 text-sm font-normal tracking-wide leading-relaxed">
                {window.self !== window.top 
                  ? "Simulation Mode (Tap to unlock). Open this app in a New Tab to test your real mobile security fingerprint censor!" 
                  : "Touch the fingerprint sensor to authenticate"}
              </p>
            )}
          </div>

          {/* High-Tech Pulse Fingerprint Circle representing in-display sensor */}
          <button
            onClick={handleBiometricUnlock}
            disabled={isVerifyingBio}
            type="button"
            className="relative w-20 h-20 rounded-full flex items-center justify-center bg-transparent border-2 border-slate-600 transition-all active:scale-95 group focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            {isVerifyingBio && (
              <span className="absolute inset-1 rounded-full border-2 border-dashed border-blue-500 animate-spin" />
            )}
            <span className="absolute inset-2 rounded-full border border-blue-500/5 animate-ping opacity-60 pointer-events-none" />
            <div className="w-14 h-14 rounded-full border border-slate-800 flex items-center justify-center bg-slate-900/10 group-hover:border-slate-500 transition-colors">
              <Fingerprint className="w-8 h-8 text-slate-300 group-hover:text-white transition-colors stroke-[1.2]" />
            </div>
          </button>
        </div>
      </div>
    );
  }

  // SECOND SCREEN: PIN keypad fallback (pure English texts)
  return (
    <div className="fixed inset-0 z-[99999] bg-slate-900 flex flex-col items-center justify-between p-6 select-none font-sans overflow-y-auto">
      {/* Top Brand Header */}
      <div className="flex flex-col items-center mt-6 text-center">
        <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-500/10 mb-4 border border-blue-400/20">
          <Lock className="w-7 h-7 text-white animate-pulse" />
        </div>
        <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
          Money Mate Security
        </h2>
        <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mt-1">
          App Is Locked
        </p>
      </div>

      {/* Main PIN input card */}
      <div className="w-full max-w-sm flex flex-col items-center my-auto py-6">
        {/* PIN Indicators */}
        <div className="flex justify-center gap-5 mb-8">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={cn(
                "w-4 h-4 rounded-full border-2 transition-all duration-150",
                index < pinInput.length
                  ? "bg-blue-500 border-blue-500 scale-110 shadow-[0_0_12px_rgba(59,130,246,0.6)]"
                  : "border-slate-600 bg-transparent"
              )}
            />
          ))}
        </div>

        {/* Dynamic Errors or Guides */}
        <div className="min-h-[24px] mb-8 text-center px-4">
          <AnimatePresence mode="wait">
            {errorMsg ? (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-rose-400 font-bold text-xs flex items-center gap-1.5 justify-center"
              >
                <ShieldAlert size={14} />
                {errorMsg}
              </motion.p>
            ) : (
              <p className="text-slate-400 text-xs font-bold font-mono">
                Provide your 4-digit App PIN
              </p>
            )}
          </AnimatePresence>
        </div>

        {/* Dynamic Trigger back to Biometrics (if biometric setup is active) */}
        {isBiometricsOn && (
          <div className="mb-6 flex flex-col items-center">
            <button
              onClick={() => setCancelledBiometrics(false)}
              type="button"
              className={cn(
                "py-2 px-4 rounded-xl flex items-center gap-2 transition-all bg-slate-800 border border-slate-700/85 text-blue-400",
                "hover:scale-105 active:scale-95 shadow-md text-xs font-semibold focus:outline-none"
              )}
            >
              <Fingerprint size={16} className="stroke-[1.8] text-blue-400" />
              Use Biometrics
            </button>
          </div>
        )}

        {/* Custom Input Keypad */}
        <div className="grid grid-cols-3 gap-y-3 gap-x-6 w-full max-w-[280px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              onClick={() => handlePinInput(num)}
              type="button"
              className="w-16 h-16 rounded-full bg-slate-800 hover:bg-slate-700/80 active:bg-blue-600 active:text-white text-white font-extrabold text-xl flex items-center justify-center transition-all shadow-md focus:outline-none"
            >
              {num}
            </button>
          ))}
          {/* Backspace / Reset Option */}
          <button
            onClick={() => {
              setPinInput('');
              setErrorMsg('');
            }}
            type="button"
            className="w-16 h-16 text-slate-400 hover:text-white font-bold text-xs flex items-center justify-center tracking-tight transition-all uppercase"
          >
            Clear
          </button>
          
          <button
            onClick={() => handlePinInput('0')}
            type="button"
            className="w-16 h-16 rounded-full bg-slate-800 hover:bg-slate-700/80 active:bg-blue-600 active:text-white text-white font-extrabold text-xl flex items-center justify-center transition-all shadow-md focus:outline-none"
          >
            0
          </button>

          <button
            onClick={handleBackspace}
            type="button"
            className="w-16 h-16 text-slate-400 hover:text-white font-bold text-sm flex items-center justify-center transition-all"
            aria-label="Delete"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Footer support credits or info */}
      <div className="mb-4 text-center">
        <p className="text-slate-500 text-[10px] font-bold text-center">
          Money Mate Pocket Accountant v2.5
        </p>
      </div>
    </div>
  );
}
