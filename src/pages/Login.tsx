import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Mail, Lock, Loader2, LogIn, Eye, EyeOff, ArrowLeft, Key, ShieldAlert, Fingerprint } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { isNativeBiometricsAvailable, performNativeBiometricUnlock } from '../lib/biometrics';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Step based login configurations
  const [step, setStep] = useState<'credentials' | 'pin' | 'bio'>('credentials');
  const [userPin, setUserPin] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [isVerifyingBio, setIsVerifyingBio] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const registrationSuccess = location.state?.registrationSuccess;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      
      // Fetch user profile securely to verify if PIN is set
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data.appLockPin) {
          setUserPin(data.appLockPin);
          setPinInput('');
          setLoading(false);
          
          if (data.biometricsEnabled) {
            setStep('bio');
          } else {
            setStep('pin');
          }
          return;
        }
      }

      // Old accounts or missing configuration
      sessionStorage.setItem('app_unlocked_session', 'true');
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError('Invalid email or password / ভুল ইমেইল অথবা পাসওয়ার্ড দিয়েছেন!');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBio = () => {
    setError('');
    setStep('pin');
  };

  // Real WebAuthn platform authenticator biometric unlock inside Login
  const handleBiometricUnlock = async () => {
    setError('');
    setIsVerifyingBio(true);

    // Try native biometrics first if running under Capacitor
    const nativeAvailable = await isNativeBiometricsAvailable();
    if (nativeAvailable) {
       const result = await performNativeBiometricUnlock();
       if (result.success) {
         sessionStorage.setItem('app_unlocked_session', 'true');
         navigate('/');
       } else if (result.error) {
         setError(result.error);
       }
       setIsVerifyingBio(false);
       return;
    }

    const isInsideIframe = window.self !== window.top;
    if (isInsideIframe) {
      // Simulate modern fingerprint scanner matching in preview mode
      await new Promise(resolve => setTimeout(resolve, 1500));
      sessionStorage.setItem('app_unlocked_session', 'true');
      navigate('/');
      setIsVerifyingBio(false);
      return;
    }
    
    try {
      if (!window.PublicKeyCredential) {
        setError('Fingerprint lock not supported on this device/browser!');
        setIsVerifyingBio(false);
        return;
      }

      const isAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!isAvailable) {
        setError('Fingerprint hardware sensor not found on this device!');
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
        sessionStorage.setItem('app_unlocked_session', 'true');
        navigate('/');
      } else {
        throw new Error("No biometric credentials matching.");
      }
    } catch (err: any) {
      console.warn("Native biometric authentication error:", err);
      if (err.name === "SecurityError") {
        setError('Device biometric hardware cannot be accessed within preview iframe. Open the app in a new tab.');
      } else {
        setError('Fingerprint did not match or screen unlock cancelled!');
      }
      if (navigator.vibrate) navigator.vibrate(150);
    } finally {
      setIsVerifyingBio(false);
    }
  };

  React.useEffect(() => {
    if (step === 'bio') {
      const timer = setTimeout(() => {
        handleBiometricUnlock();
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const handleCancelPin = async () => {
    setLoading(true);
    try {
      await auth.signOut();
    } catch (e) {}
    setStep('credentials');
    setPinInput('');
    setUserPin('');
    setError('');
    setLoading(false);
  };

  const handlePinInput = (num: string) => {
    if (pinInput.length >= 4) return;
    setError('');
    const newVal = pinInput + num;
    setPinInput(newVal);

    if (newVal.length === 4) {
      if (newVal === userPin) {
        sessionStorage.setItem('app_unlocked_session', 'true');
        navigate('/');
      } else {
        if (navigator.vibrate) navigator.vibrate(150);
        setError('Incorrect PIN! Please try again.');
        setPinInput('');
      }
    }
  };

  const handleBackspace = () => {
    setPinInput(prev => prev.slice(0, -1));
    setError('');
  };

  if (step === 'bio') {
    return (
      <div className="fixed inset-0 z-[99999] bg-black text-white flex flex-col justify-end pb-[8vh] p-6 select-none font-sans overflow-y-auto">
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
            onClick={handleCancelBio}
            type="button"
            className="w-full max-w-[280px] py-2.5 mb-14 border border-[#2e2e2e] hover:border-slate-600 rounded-2xl bg-transparent text-[#2563eb] text-2xl font-normal tracking-wide transition-all active:scale-[0.98] outline-none cursor-pointer"
          >
            Cancel
          </button>

          {/* Biometrics Status Message / Guide */}
          <div className="min-h-[24px] mb-4 text-center px-4 w-full">
            {error ? (
              <p className="text-rose-400 font-bold text-xs flex items-center gap-1.5 justify-center">
                <ShieldAlert size={14} className="shrink-0" />
                {error}
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
            className="relative w-20 h-20 rounded-full flex items-center justify-center bg-transparent border-2 border-slate-600 transition-all active:scale-95 group focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
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

  return (
    <div className="min-h-screen bg-[#456fae] flex items-center justify-center p-4 font-sans selection:bg-[#89a5e5] selection:text-[#21355a]">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md bg-[#21355a] rounded-[2.5rem] px-8 py-12 shadow-2xl relative border border-[#2d4675] overflow-hidden"
      >
        {/* Subtle decorative lights inside card */}
        <div className="absolute -top-16 -right-16 w-32 h-32 bg-[#89a5e5]/10 blur-2xl rounded-full pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-[#89a5e5]/5 blur-2xl rounded-full pointer-events-none" />

        {/* Brand Header */}
        <div className="text-center mb-8 relative z-10">
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-wide">
            Money Mate
          </h1>
          <p className="text-[#a4c0f4]/80 text-xs font-semibold leading-relaxed mt-2 max-w-xs mx-auto">
            Your smart financial companion to track payments, manage bank accounts, and streamline transactions in real-time.
          </p>
        </div>

        {registrationSuccess && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-2xl text-xs font-bold text-center"
          >
            Registration successful! Please login. / রেজিস্ট্রেশন সফল হয়েছে! লগইন করুন।
          </motion.div>
        )}

        {error && step === 'credentials' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-2xl text-xs font-bold text-center"
          >
            {error}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {step === 'credentials' ? (
            <motion.form 
              key="credentials-form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleLogin} 
              className="space-y-5 relative z-10"
            >
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

              {/* Password field with toggle visibility */}
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  required
                  placeholder=" "
                  className="peer w-full pl-11 pr-11 py-4 bg-[#293d64] border border-[#3a5483] rounded-2xl focus:ring-2 focus:ring-[#89a5e5]/30 focus:border-[#89a5e5] outline-none text-white font-semibold transition-all text-sm shadow-inner"
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
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#a4c0f4]/60 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={loading}
                className="w-full py-4 mt-6 bg-[#89a5e5] hover:bg-[#9cb6f0] text-[#1c2e4e] rounded-2xl font-black tracking-wider shadow-lg shadow-[#89a5e5]/10 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                {loading ? <Loader2 className="animate-spin text-[#1c2e4e]" size={20} /> : (
                  <>
                    <span>Login</span>
                    <LogIn size={16} strokeWidth={2.5} />
                  </>
                )}
              </motion.button>
            </motion.form>
          ) : step === 'pin' ? (
            <motion.div
              key="pin-form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="relative z-10 flex flex-col items-center py-2"
            >
              {/* PIN Screen Headers */}
              <div className="text-center mb-6 animate-pulse">
                <div className="w-12 h-12 bg-[#89a5e5]/10 rounded-2xl flex items-center justify-center text-[#89a5e5] mx-auto mb-3">
                  <Key size={24} />
                </div>
                <h3 className="text-white font-extrabold text-base tracking-wide">
                  Verification PIN
                </h3>
                <p className="text-[#a4c0f4]/80 text-[11px] font-semibold leading-relaxed mt-1">
                  Enter your 4-digit App Lock PIN to authenticate
                </p>
              </div>

              {/* Error messages inside Pin-code form */}
              {error && (
                <div className="mb-4 text-rose-300 text-xs font-bold text-center px-4 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-xl max-w-[240px]">
                  {error}
                </div>
              )}

              {/* Dot Indicators */}
              <div className="flex justify-center gap-4 mb-6">
                {[0, 1, 2, 3].map((index) => (
                  <div
                    key={index}
                    className={cn(
                      "w-4.5 h-4.5 rounded-full border-2 transition-all duration-150",
                      index < pinInput.length
                        ? "bg-[#89a5e5] border-[#89a5e5] scale-110 shadow-[0_0_12px_rgba(137,165,229,0.7)]"
                        : "border-slate-500 bg-transparent"
                    )}
                  />
                ))}
              </div>

              {/* Pin Pad buttons */}
              <div className="grid grid-cols-3 gap-y-3 gap-x-6 w-full max-w-[260px] mx-auto mb-6">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                  <button
                    key={num}
                    onClick={() => handlePinInput(num)}
                    type="button"
                    className="w-14 h-14 rounded-full bg-[#293d64] hover:bg-[#324a79] active:bg-[#89a5e5] active:text-[#21355a] text-white font-extrabold text-lg flex items-center justify-center transition-all shadow-md focus:outline-none"
                  >
                    {num}
                  </button>
                ))}
                
                <button
                  onClick={() => setPinInput('')}
                  type="button"
                  className="w-14 h-14 text-slate-400 hover:text-white font-bold text-xs flex items-center justify-center tracking-tight transition-all uppercase"
                >
                  Clear
                </button>
                
                <button
                  onClick={() => handlePinInput('0')}
                  type="button"
                  className="w-14 h-14 rounded-full bg-[#293d64] hover:bg-[#324a79] active:bg-[#89a5e5] active:text-[#21355a] text-white font-extrabold text-lg flex items-center justify-center transition-all shadow-md focus:outline-none"
                >
                  0
                </button>

                <button
                  onClick={handleBackspace}
                  type="button"
                  className="w-14 h-14 text-slate-400 hover:text-white font-bold text-sm flex items-center justify-center transition-all"
                  aria-label="Delete"
                >
                  Del
                </button>
              </div>

              {/* Go Back action */}
              <button
                onClick={handleCancelPin}
                disabled={loading}
                type="button"
                className="inline-flex items-center gap-1.5 text-xs font-black text-[#a4c0f4] hover:text-white px-4 py-2 bg-[#293d64]/60 hover:bg-[#293d64] border border-[#3a5483]/50 rounded-xl transition-all"
              >
                {loading ? <Loader2 className="animate-spin text-white" size={14} /> : (
                  <>
                    <ArrowLeft size={14} />
                    <span>Cancel</span>
                  </>
                )}
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Footer buttons / links */}
        {step === 'credentials' && (
          <div className="mt-8 pt-6 border-t border-[#2a3e68] text-center space-y-3 relative z-10">
            <div>
              <Link 
                to="/forgot-password" 
                className="text-[#a4c0f4] hover:text-white text-xs font-bold transition-colors block py-1 tracking-wide"
              >
                Forgot Password?
              </Link>
            </div>
            <div>
              <Link 
                to="/signup" 
                className="inline-flex items-center gap-1.5 text-[#89a5e5] hover:text-[#9cb6f0] text-xs font-extrabold transition-colors py-1 tracking-wider"
              >
                Create New Account
              </Link>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
