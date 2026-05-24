/**
 * Safely handles biometric operations both on Web (WebAuthn / Mock Sim) 
 * and on Mobile (Native Capacitor Plugin: @capacitor-community/native-biometric)
 */

export interface BiometricsResult {
  success: boolean;
  error?: string;
}

/**
 * Gets the NativeBiometric plugin from Capacitor dynamic window object
 */
function getNativeBiometricPlugin(): any {
  const cap = (window as any).Capacitor;
  if (!cap || !cap.Plugins) return null;
  return cap.Plugins.NativeBiometric || null;
}

/**
 * Checks if the Capacitor Native Biometrics plugin is installed and available
 */
export async function isNativeBiometricsAvailable(): Promise<boolean> {
  const isCapacitor = (window as any).Capacitor !== undefined;
  if (!isCapacitor) {
    return false;
  }

  try {
    const NativeBiometric = getNativeBiometricPlugin();
    if (!NativeBiometric) {
      console.warn("Capacitor NativeBiometric plugin is not registered under Capacitor.Plugins.");
      return false;
    }
    const result = await NativeBiometric.isAvailable();
    return !!result.isAvailable;
  } catch (e) {
    console.warn("Capacitor NativeBiometric plugin check failed:", e);
    return false;
  }
}

/**
 * Triggers the 100% native Android/iOS system biometric (fingerprint/face) scanner prompt.
 * This directly accesses the device's main system lock fingerprint!
 */
export async function performNativeBiometricUnlock(): Promise<BiometricsResult> {
  try {
    const NativeBiometric = getNativeBiometricPlugin();
    if (!NativeBiometric) {
      return { 
        success: false, 
        error: "Capacitor NativeBiometric প্লাগিনটি আপনার লোকাল প্রোজেক্টে ইনস্টল করা নেই।" 
      };
    }
    
    const availability = await NativeBiometric.isAvailable();
    if (!availability.isAvailable) {
      return { 
        success: false, 
        error: "আপনার মোবাইলে ফিঙ্গারপ্রিন্ট সেটআপ করা নেই অথবা হার্ডওয়্যার পাওয়া যায়নি।" 
      };
    }

    // This presents the beautiful native system fingerprint scanner overlay model in Android!
    await NativeBiometric.verifyIdentity({
      reason: "এপটিতে প্রবেশ করতে আপনার ফিঙ্গারপ্রিন্ট ভেরিফাই করুন।",
      title: "Money Mate Security",
      subtitle: "ভেরিফিকেশন প্রয়োজন",
      description: "আপনার মোবাইলের ফিঙ্গারপ্রিন্ট সেন্সরে আঙুল রাখুন",
      negativeButtonText: "Cancel"
    });

    return { success: true };
  } catch (err: any) {
    console.error("Native Biometric system authentication failed:", err);
    
    const errMsg = err.message || "";
    if (errMsg.includes("cancel") || errMsg.includes("Cancel") || err.code === "USER_CANCELED") {
      return { success: false, error: "ভেরিফিকেশন বাতিল করা হয়েছে।" };
    }
    
    return { success: false, error: "ফিঙ্গারপ্রিন্ট মিলেনি! পুনরায় সঠিক আঙুল স্পর্শ করুন।" };
  }
}
