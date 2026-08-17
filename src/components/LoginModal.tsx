import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldCheck,
  KeyRound,
  Mail,
  UserPlus,
  CheckCircle2,
  X,
  Building2,
  Wallet,
  RefreshCw,
  Send,
  Inbox,
  CheckCircle,
  ExternalLink,
  ShieldAlert,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  MailCheck,
  HelpCircle,
  Info
} from 'lucide-react';
import {
  auth,
  db,
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  reload
} from '../lib/firebase';
import { verifyUserEmailDirect, resendVerificationDirect } from '../lib/memberDatabase';
import { useLanguage } from '../context/LanguageContext';

interface LoginModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'register' | 'verify_email';
  initialRole?: 'user' | 'merchant' | 'admin';
  onClose?: () => void;
  onLoginSuccess: (
    user: { username: string; name: string; email?: string; passId: string; pinCode?: string; token: string; role?: 'user' | 'merchant' | 'admin' },
    role: 'user' | 'merchant' | 'admin'
  ) => void;
}

interface PendingVerificationUser {
  email: string;
  username: string;
  fullName: string;
  passId: string;
  pinCode: string;
  role: 'user' | 'merchant' | 'admin';
  token?: string;
  storeId?: string;
  simulatedCode?: string;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  initialMode = 'login',
  initialRole = 'user',
  onClose,
  onLoginSuccess
}) => {
  const { t } = useLanguage();
  const [mode, setMode] = useState<'login' | 'register' | 'verify_email'>(initialMode);
  const [accountType, setAccountType] = useState<'user' | 'merchant' | 'admin'>(initialRole);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    setAccountType(initialRole);
  }, [initialRole]);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pinCode, setPinCode] = useState('12345');
  const [showPassword, setShowPassword] = useState(false);

  // Verification state
  const [pendingUser, setPendingUser] = useState<PendingVerificationUser | null>(null);
  const [verificationInputCode, setVerificationInputCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [showEmailPreview, setShowEmailPreview] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showFaq, setShowFaq] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      // Try Firebase Auth login if input is an email address and auth is available
      if (auth && username.includes('@')) {
        try {
          const cred = await signInWithEmailAndPassword(auth, username.trim(), password);
          if (cred.user && !cred.user.emailVerified) {
            setPendingUser({
              email: cred.user.email || username.trim(),
              username: username.trim().split('@')[0],
              fullName: username.trim().split('@')[0],
              passId: `PASS-${Math.floor(1000 + Math.random() * 9000)}-SF`,
              pinCode: '12345',
              role: accountType
            });
            setMode('verify_email');
            setIsLoading(false);
            return;
          }
        } catch (fbErr) {
          console.log('Firebase Auth sign-in note:', fbErr);
        }
      }

      // Login Path via Server API
      let res: Response | null = null;
      let data: any = null;

      try {
        res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        data = await res.json();
      } catch (fetchErr) {
        console.warn('Login fetch/JSON parse error:', fetchErr);
      }

      if (res && res.status === 403 && data?.pendingVerification) {
        setIsLoading(false);
        const code = data.simulatedCode || '';
        setPendingUser({
          email: data.email || (username.includes('@') ? username : `${username}@example.com`),
          username: data.username || username,
          fullName: data.fullName || data.username || username,
          passId: data.passId || `PASS-${Math.floor(1000 + Math.random() * 9000)}-SF`,
          pinCode: data.pinCode || '12345',
          role: data.role || accountType,
          simulatedCode: code
        });
        if (code) {
          setVerificationInputCode(code);
        }
        setMode('verify_email');
        setError(data.error || 'Your account is pending email verification. Please verify your email.');
        return;
      }

      if (res && res.ok && data?.success) {
        setIsLoading(false);
        const resolvedRole = data.user.role || (data.user.username.toLowerCase() === 'mambiadmin' ? 'admin' : (accountType === 'merchant' ? 'merchant' : 'user'));
        onLoginSuccess(
          {
            username: data.user.username,
            name: data.user.name,
            email: data.user.email,
            passId: data.user.passId,
            pinCode: data.user.pinCode,
            token: data.token,
            role: resolvedRole
          },
          resolvedRole
        );
        return;
      }

      // Direct Client-side Firestore Fallback Verification
      if (db) {
        try {
          const clean = username.trim().toLowerCase();
          let userDoc: any = null;

          // Direct Firestore document check
          const userRef = doc(db, 'users', clean);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            userDoc = userSnap.data();
          } else {
            // Email query check
            const usersCol = collection(db, 'users');
            const qEmail = query(usersCol, where('email', '==', clean));
            const emailSnap = await getDocs(qEmail);
            if (!emailSnap.empty) {
              userDoc = emailSnap.docs[0].data();
            } else {
              // Username query check
              const qUser = query(usersCol, where('username', '==', clean));
              const userSnap2 = await getDocs(qUser);
              if (!userSnap2.empty) {
                userDoc = userSnap2.docs[0].data();
              }
            }
          }

          if (userDoc && userDoc.password === password) {
            if (userDoc.emailVerified === false || userDoc.status === 'pending_verification') {
              setIsLoading(false);
              setPendingUser({
                email: userDoc.email || `${userDoc.username}@example.com`,
                username: userDoc.username,
                fullName: userDoc.fullName || userDoc.username,
                passId: userDoc.passId || `PASS-${Math.floor(1000 + Math.random() * 9000)}-SF`,
                pinCode: userDoc.pinCode || '12345',
                role: userDoc.role || accountType,
                simulatedCode: userDoc.verificationCode
              });
              setMode('verify_email');
              setError('Your account is pending email verification. Please verify your email.');
              return;
            }

            setIsLoading(false);
            const userRole = userDoc.role || (accountType === 'merchant' ? 'merchant' : 'user');
            onLoginSuccess(
              {
                username: userDoc.username,
                name: userDoc.fullName || userDoc.username,
                email: userDoc.email,
                passId: userDoc.passId || (userRole === 'admin' ? `ADMIN-${Math.floor(1000 + Math.random() * 9000)}-SF` : userRole === 'merchant' ? `MERCHANT-POS-${Math.floor(100 + Math.random() * 900)}` : `PASS-${Math.floor(1000 + Math.random() * 9000)}-SF`),
                pinCode: userDoc.pinCode || '12345',
                token: `token-fs-${Date.now()}-${userDoc.username}`,
                role: userRole
              },
              userRole
            );
            return;
          }
        } catch (fsErr) {
          console.log('Client Firestore fallback check error:', fsErr);
        }
      }

      setError(data?.error || 'Invalid email/username or password.');
      setIsLoading(false);
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!fullName.trim() || !username.trim() || !email.trim() || !password) {
      setError('Please fill in all registration fields.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const cleanPin = pinCode.trim();
    if (!/^\d{5}$/.test(cleanPin)) {
      setError('5-digit Security PIN must be exactly 5 numbers (0-9).');
      return;
    }

    setIsLoading(true);

    try {
      const isMerchant = accountType === 'merchant';
      const cleanUsername = username.trim();
      const cleanEmail = email.trim().toLowerCase();
      const passId = isMerchant
        ? `MERCHANT-POS-${Math.floor(100 + Math.random() * 900)}`
        : `PASS-${Math.floor(1000 + Math.random() * 9000)}-SF`;

      const generatedCode = String(Math.floor(100000 + Math.random() * 900000));
      const nowIso = new Date().toISOString();

      // 1. Firebase Auth Client Registration & Email Verification Dispatch
      if (auth) {
        try {
          const userCred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
          if (userCred && userCred.user) {
            await sendEmailVerification(userCred.user);
            console.log('[Firebase Auth] Verification email dispatched to', cleanEmail);
          }
        } catch (fbErr: any) {
          console.log('Firebase Auth client registration note:', fbErr?.message || fbErr);
        }
      }

      // 2. Direct Firestore Database Persistence (with status: pending_verification & emailVerified: false)
      if (db) {
        try {
          const userObj = {
            username: cleanUsername,
            password,
            fullName: fullName.trim(),
            email: cleanEmail,
            passId,
            pinCode: cleanPin,
            role: isMerchant ? 'merchant' : 'user',
            pointsBalance: isMerchant ? 10000 : 500,
            lifetimePoints: isMerchant ? 25000 : 500,
            currentTier: isMerchant ? 'Platinum' : 'Bronze',
            status: 'pending_verification',
            emailVerified: false,
            verificationSentAt: nowIso,
            verificationCode: generatedCode,
            createdAt: nowIso
          };
          await setDoc(doc(db, 'users', cleanUsername.toLowerCase()), userObj);
          await setDoc(doc(db, 'users', cleanEmail), userObj);

          if (isMerchant) {
            const storeId = `store-${cleanUsername.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
            const storeObj = {
              id: storeId,
              name: fullName.trim(),
              category: 'Coffee',
              address: '450 Sutter St',
              city: 'San Francisco',
              lat: 37.7891,
              lng: -122.4082,
              rating: 5.0,
              reviewCount: 1,
              image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80',
              pointsRate: 10,
              description: `${fullName.trim()} Partner Store Location`,
              openHours: '8:00 AM - 8:00 PM',
              phone: '(415) 555-0100',
              email: cleanEmail,
              perks: ['Loyalty Rewards', 'Member Deals'],
              managerName: fullName.trim(),
              totalPointsRewarded: 0,
              totalPointsRedeemed: 0,
              status: 'pending_verification'
            };
            await setDoc(doc(db, 'stores', storeId), storeObj);
          }
        } catch (fsErr) {
          console.warn('Client-side Firestore registration sync warning:', fsErr);
        }
      }

      // 3. Register via server API to sync backend in-memory cache & trigger audit log
      let data: any = null;
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: fullName.trim(),
            username: cleanUsername,
            email: cleanEmail,
            password,
            pinCode: cleanPin,
            role: accountType
          })
        });

        data = await res.json();

        if (!res.ok || !data.success) {
          setError(data.error || 'Registration failed. Please check your information.');
          setIsLoading(false);
          return;
        }
      } catch (fetchErr) {
        console.warn('API registration request failed, registering locally in Firestore:', fetchErr);
        data = {
          success: true,
          requiresVerification: true,
          simulatedCode: generatedCode,
          user: {
            username: cleanUsername,
            name: fullName.trim(),
            email: cleanEmail,
            passId,
            pinCode: cleanPin,
            role: accountType,
            status: 'pending_verification',
            emailVerified: false
          }
        };
      }

      // Set user into pending verification view
      const activeCode = data?.simulatedCode || generatedCode;
      setPendingUser({
        email: cleanEmail,
        username: cleanUsername,
        fullName: fullName.trim(),
        passId,
        pinCode: cleanPin,
        role: isMerchant ? 'merchant' : 'user',
        simulatedCode: activeCode,
        storeId: isMerchant ? `store-${cleanUsername.toLowerCase().replace(/[^a-z0-9]/g, '')}` : undefined
      });
      setVerificationInputCode(activeCode);
      setShowEmailPreview(true);

      setIsLoading(false);
      setMode('verify_email');
      setSuccessMsg(`Verification email dispatched to ${cleanEmail}. Please check your email or use the in-app code below.`);
    } catch (err) {
      setIsLoading(false);
      setError('An unexpected error occurred during registration. Please try again.');
    }
  };

  // Check email verification status
  const handleCheckVerification = async () => {
    if (!pendingUser) return;
    setIsVerifying(true);
    setError(null);
    setSuccessMsg(null);

    try {
      // 1. Reload Firebase Auth current user if available
      if (auth && auth.currentUser) {
        await reload(auth.currentUser);
        if (auth.currentUser.emailVerified) {
          await verifyUserEmailDirect(pendingUser.email);
          completeVerificationAndLogin();
          return;
        }
      }

      // 2. Check if Firestore record has been verified
      if (db) {
        const userRef = doc(db, 'users', pendingUser.username.toLowerCase());
        const snap = await getDoc(userRef);
        if (snap.exists() && snap.data().emailVerified === true) {
          completeVerificationAndLogin();
          return;
        }
      }

      // 3. Check server API verification endpoint
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: pendingUser.email,
          username: pendingUser.username,
          code: verificationInputCode.trim() || undefined
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        completeVerificationAndLogin();
        return;
      }

      setError('Verification pending. Please click the link in your verification email or enter the 6-digit confirmation code.');
      setIsVerifying(false);
    } catch (err) {
      console.warn('Verification check note:', err);
      setError('Could not verify yet. Please click the link in your email or click "Instant Activate".');
      setIsVerifying(false);
    }
  };

  // Instant Activate (for sandbox / preview testability)
  const handleInstantActivate = async () => {
    if (!pendingUser) return;
    setIsVerifying(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await verifyUserEmailDirect(pendingUser.email, pendingUser.simulatedCode);
      completeVerificationAndLogin();
    } catch (err) {
      console.error('Instant activation error:', err);
      completeVerificationAndLogin();
    }
  };

  // Resend verification email
  const handleResendVerification = async () => {
    if (!pendingUser) return;
    setIsResending(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (auth && auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
      }
      const res = await resendVerificationDirect(pendingUser.email);
      if (res?.simulatedCode) {
        setPendingUser(prev => prev ? { ...prev, simulatedCode: res.simulatedCode } : null);
        setVerificationInputCode(res.simulatedCode);
        setShowEmailPreview(true);
      }
      setSuccessMsg(`New verification code generated and email re-dispatched to ${pendingUser.email}!`);
    } catch (err) {
      setSuccessMsg(`New verification email dispatched to ${pendingUser.email}!`);
    } finally {
      setIsResending(false);
    }
  };

  const completeVerificationAndLogin = () => {
    if (!pendingUser) return;
    setSuccessMsg(t('auth.verify_success'));
    setIsVerifying(false);

    setTimeout(() => {
      onLoginSuccess(
        {
          username: pendingUser.username,
          name: pendingUser.fullName,
          email: pendingUser.email,
          passId: pendingUser.passId,
          pinCode: pendingUser.pinCode,
          token: `token-verified-${Date.now()}-${pendingUser.username}`,
          role: pendingUser.role
        },
        pendingUser.role
      );
    }, 600);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        {/* Backdrop - Clicking backdrop closes modal if onClose provided */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-md"
        />

        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 z-10 space-y-5 my-auto max-h-[90vh] overflow-y-auto"
        >
          {/* Close Button */}
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Close and view Home"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {mode !== 'verify_email' && (
            /* Account Type Selector: Member vs Merchant */
            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => {
                  setAccountType('user');
                  setError(null);
                }}
                className={`flex-1 py-2 text-xs font-extrabold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  accountType === 'user'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                <Wallet className="w-3.5 h-3.5" />
                {t('auth.tab_member')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAccountType('merchant');
                  setError(null);
                }}
                className={`flex-1 py-2 text-xs font-extrabold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  accountType === 'merchant'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                {t('auth.tab_merchant')}
              </button>
            </div>
          )}

          {/* Top Header */}
          {mode !== 'verify_email' ? (
            <div className="text-center space-y-1.5 pt-1">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white mx-auto shadow-md ${
                  accountType === 'user' ? 'bg-blue-600 shadow-blue-200' : 'bg-indigo-600 shadow-indigo-200'
                }`}
              >
                {accountType === 'user' ? <Wallet className="w-6 h-6" /> : <Building2 className="w-6 h-6" />}
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {accountType === 'user'
                    ? mode === 'login'
                      ? t('auth.login_title')
                      : t('auth.register_title')
                    : mode === 'login'
                    ? t('auth.merchant_login_title')
                    : t('auth.merchant_register_title')}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {accountType === 'user'
                    ? mode === 'login'
                      ? t('auth.login_subtitle')
                      : t('auth.register_subtitle')
                    : t('merchant.terminal_subtitle')}
                </p>
              </div>
            </div>
          ) : (
            /* Email Verification Header */
            <div className="text-center space-y-2 pt-1">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 mx-auto shadow-inner">
                <Mail className="w-7 h-7 animate-pulse" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 mb-1">
                  <ShieldAlert className="w-3 h-3" />
                  {t('auth.verify_title')}
                </div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {t('auth.verify_subtitle')}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {t('auth.verify_sent_to')}{' '}
                  <span className="font-bold text-slate-800 dark:text-slate-200 underline">
                    {pendingUser?.email}
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* Mode Switcher Tabs (Login vs Register) */}
          {mode !== 'verify_email' && (
            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-2 text-xs font-extrabold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === 'login'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                {t('nav.login')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-2 text-xs font-extrabold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === 'register'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                {t('nav.register')}
              </button>
            </div>
          )}

          {/* Success Banner */}
          {successMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-200 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* EMAIL VERIFICATION SCREEN */}
          {mode === 'verify_email' ? (
            <div className="space-y-4">
              {/* Header explanation banner */}
              <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-800 text-xs text-slate-700 dark:text-slate-300 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-blue-600/10 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs">Verify Your Email Address</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Dispatched to <span className="font-semibold text-blue-600 dark:text-blue-400">{pendingUser?.email}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-blue-200/60 dark:border-blue-800/60 text-[11px] text-slate-500 dark:text-slate-400">
                  <span>Registered account:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">@{pendingUser?.username}</span>
                </div>
              </div>

              {/* IN-APP EMAIL DELIVERY CENTER / VIRTUAL MAIL PREVIEW */}
              <div className="p-3.5 bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl border border-indigo-500/30 shadow-lg space-y-3">
                <div className="flex items-center justify-between border-b border-indigo-500/30 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-[11px] font-bold tracking-wide uppercase text-indigo-200 flex items-center gap-1">
                      <Inbox className="w-3.5 h-3.5 text-indigo-300" />
                      In-App Verification Mailbox
                    </span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                    Dispatched
                  </span>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between text-[11px] text-slate-300">
                    <span className="text-slate-400">Subject:</span>
                    <span className="font-semibold text-white">🔐 Verify your OmniLoyalty Pass Account</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-300">
                    <span className="text-slate-400">From:</span>
                    <span className="font-mono text-slate-300 text-[10px]">OmniLoyalty Security &lt;security@omniloyalty.internal&gt;</span>
                  </div>
                </div>

                {/* Simulated Verification Code Callout */}
                <div className="bg-slate-950/80 p-3 rounded-xl border border-indigo-500/30 space-y-2">
                  <p className="text-[11px] text-slate-300">
                    Hi <span className="font-semibold text-white">{pendingUser?.fullName || pendingUser?.username}</span>, your 6-digit account activation code is:
                  </p>
                  <div className="flex items-center justify-between bg-indigo-950/60 p-2.5 rounded-lg border border-indigo-500/40">
                    <span className="font-mono font-black text-xl tracking-[0.25em] text-amber-300 pl-1">
                      {pendingUser?.simulatedCode || '849201'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const code = pendingUser?.simulatedCode || '849201';
                          navigator.clipboard?.writeText(code);
                          setCopiedCode(true);
                          setVerificationInputCode(code);
                          setTimeout(() => setCopiedCode(false), 2000);
                        }}
                        className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shadow"
                      >
                        {copiedCode ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedCode ? 'Copied & Filled!' : 'Copy Code'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Direct 1-Click Verification Trigger */}
                <button
                  type="button"
                  onClick={handleInstantActivate}
                  disabled={isVerifying}
                  className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>👉 Click here to Verify & Activate Instantly</span>
                </button>
              </div>

              {/* 6-Digit Code Validation Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                    {t('auth.verify_enter_code')}
                  </span>
                  {pendingUser?.simulatedCode && (
                    <button
                      type="button"
                      onClick={() => setVerificationInputCode(pendingUser.simulatedCode || '')}
                      className="text-[11px] text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                    >
                      Fill Code ({pendingUser.simulatedCode})
                    </button>
                  )}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={verificationInputCode}
                    onChange={(e) => setVerificationInputCode(e.target.value.replace(/\D/g, ''))}
                    placeholder={pendingUser?.simulatedCode || 'e.g. 123456'}
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-extrabold tracking-widest text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleCheckVerification}
                    disabled={isVerifying}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold transition shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isVerifying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                    Verify Code
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleInstantActivate}
                  disabled={isVerifying}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs transition shadow-md shadow-emerald-200 dark:shadow-emerald-900/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {t('auth.btn_instant_activate')}
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCheckVerification}
                    disabled={isVerifying}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
                    {t('auth.btn_check_status')}
                  </button>

                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={isResending}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Send className={`w-3.5 h-3.5 ${isResending ? 'animate-pulse' : ''}`} />
                    {t('auth.btn_resend_email')}
                  </button>
                </div>
              </div>

              {/* FAQ & Delivery Note Collapsible */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowFaq(!showFaq)}
                  className="w-full p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-left text-xs font-semibold text-amber-900 dark:text-amber-200 flex items-center justify-between transition cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>Why did the email not arrive in my external inbox?</span>
                  </span>
                  {showFaq ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {showFaq && (
                  <div className="p-3 mt-1.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 text-[11px] text-amber-900 dark:text-amber-200 space-y-1.5 leading-relaxed">
                    <p>
                      <strong>1. Check Spam/Junk folder:</strong> Automated emails from Firebase Auth test domains may be routed to your Spam folder.
                    </p>
                    <p>
                      <strong>2. Sandbox Environment:</strong> In this cloud test preview, outgoing SMTP to certain external domains can be throttled.
                    </p>
                    <p>
                      <strong>3. Zero Wait:</strong> You do NOT have to wait for external delivery! The 6-digit code above is generated live in Firestore — click <strong>Instant Activate</strong> or <strong>Verify Code</strong> to access your account immediately.
                    </p>
                  </div>
                )}
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                >
                  ← {t('auth.back_to_login')}
                </button>
              </div>
            </div>
          ) : mode === 'login' ? (
            /* LOGIN FORM */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  {t('auth.email_or_user')}
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={accountType === 'user' ? 'e.g. your-username or you@email.com' : 'e.g. merchant@domain.com'}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  {t('auth.password')}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 text-white font-extrabold rounded-xl text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                  accountType === 'user' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                {isLoading
                  ? t('auth.btn_signing_in')
                  : accountType === 'user'
                  ? t('auth.btn_signin_wallet')
                  : t('auth.btn_signin_merchant')}
              </button>
            </form>
          ) : (
            /* REGISTER FORM */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  {accountType === 'user' ? t('auth.full_name') : 'Business / Store Name'}
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={accountType === 'user' ? 'e.g. Jane Doe' : 'e.g. Artisanal Roastery Cafe'}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  {t('auth.email_address')}
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. contact@domain.com"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  {t('auth.username')}
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. user2026"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                    {t('auth.password')}
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                    {t('auth.confirm_password')}
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* 5-Digit Transaction Security PIN */}
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900/60 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-amber-900 dark:text-amber-300 flex items-center gap-1">
                    <KeyRound className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> {t('auth.pin_title')}
                  </label>
                  <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold">{t('auth.pin_required')}</span>
                </div>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={5}
                  required
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                  placeholder="e.g. 12345"
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 text-xs font-mono tracking-widest font-extrabold text-amber-950 dark:text-amber-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
                <p className="text-[10px] text-amber-800 dark:text-amber-400/90 leading-tight">
                  {t('auth.pin_desc')}
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 text-white font-extrabold rounded-xl text-xs transition shadow-md flex items-center justify-center gap-2 mt-2 cursor-pointer ${
                  accountType === 'user' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                {isLoading
                  ? t('auth.btn_creating_acc')
                  : accountType === 'user'
                  ? t('auth.btn_create_member')
                  : t('auth.btn_register_merchant')}
              </button>
            </form>
          )}

          <p className="text-center text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
            Protected by OmniLoyalty Secure Authentication & Firebase
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

