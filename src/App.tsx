/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { BackButtonProvider } from './components/BackButtonProvider';
import Layout from './components/Layout';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import ForgotPassword from './pages/ForgotPassword';
import Income from './pages/Income';
import Expense from './pages/Expense';
import BankAccounts from './pages/BankAccounts';
import Loans from './pages/Loans';
import Customers from './pages/Customers';
import CreditSystem from './pages/CreditSystem';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import OnlineTransaction from './pages/OnlineTransaction';
import AboutApp from './pages/AboutApp';

import { AppLockGuard } from './components/AppLockGuard';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 relative overflow-hidden">
        {/* Background Decor */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/5 blur-[122px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-fuchsia-600/5 blur-[122px] rounded-full animate-pulse delay-1000" />
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-24 h-24 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin shadow-[0_0_20px_rgba(59,130,246,0.1)]"></div>
          <p className="mt-8 text-slate-400 font-black tracking-[0.4rem] text-xs animate-pulse text-center">Initializing system...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <AppLockGuard>
      <Layout>{children}</Layout>
    </AppLockGuard>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <BackButtonProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/income" element={<ProtectedRoute><Income /></ProtectedRoute>} />
            <Route path="/expense" element={<ProtectedRoute><Expense /></ProtectedRoute>} />
            <Route path="/bank" element={<ProtectedRoute><BankAccounts /></ProtectedRoute>} />
            <Route path="/loans" element={<ProtectedRoute><Loans /></ProtectedRoute>} />
            <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
            <Route path="/credit" element={<ProtectedRoute><CreditSystem /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/online" element={<ProtectedRoute><OnlineTransaction /></ProtectedRoute>} />
            <Route path="/about" element={<ProtectedRoute><AboutApp /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BackButtonProvider>
      </Router>
    </AuthProvider>
  );
}
