import { Routes, Route, Navigate } from 'react-router-dom'
import { ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import RootLayout from '@/components/layout/RootLayout'
import LandingPage from '@/pages/LandingPage'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import ForgotPassword from '@/pages/ForgotPassword'
import ResetPassword from '@/pages/ResetPassword'
import Dashboard from '@/pages/Dashboard'
import Invoices from '@/pages/Invoices'
import Reconciliation from '@/pages/Reconciliation'
import Settings from '@/pages/Settings'
import Pricing from '@/pages/Pricing'
import PartnerPortal from '@/pages/PartnerPortal'
import GSTR1Filing from '@/pages/GSTR1Filing'
import InvoiceDetail from '@/pages/InvoiceDetail'
import Companies from '@/pages/Companies'
import InvoiceUpload from '@/pages/InvoiceUpload'
import GSTNoticeDefense from '@/pages/GSTNoticeDefense'
import VendorLookup from '@/pages/VendorLookup'
import PartnerWhiteLabelSettings from '@/pages/PartnerWhiteLabelSettings'

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 text-sm">Loading GSTPro…</p>
      </div>
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function GuestRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootLayout><LandingPage /></RootLayout>} />
      <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
      <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
      <Route path="/reset-password" element={<GuestRoute><ResetPassword /></GuestRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><RootLayout><Dashboard /></RootLayout></ProtectedRoute>} />
      <Route path="/invoices" element={<ProtectedRoute><RootLayout><Invoices /></RootLayout></ProtectedRoute>} />
      <Route path="/invoices/:id" element={<ProtectedRoute><RootLayout><InvoiceDetail /></RootLayout></ProtectedRoute>} />
      <Route path="/upload-invoice" element={<ProtectedRoute><RootLayout><InvoiceUpload /></RootLayout></ProtectedRoute>} />
      <Route path="/reconciliation" element={<ProtectedRoute><RootLayout><Reconciliation /></RootLayout></ProtectedRoute>} />
      <Route path="/gstr1-filing" element={<ProtectedRoute><RootLayout><GSTR1Filing /></RootLayout></ProtectedRoute>} />
      <Route path="/companies" element={<ProtectedRoute><RootLayout><Companies /></RootLayout></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><RootLayout><Settings /></RootLayout></ProtectedRoute>} />
      <Route path="/pricing" element={<ProtectedRoute><RootLayout><Pricing /></RootLayout></ProtectedRoute>} />
      <Route path="/partner" element={<ProtectedRoute><RootLayout><PartnerPortal /></RootLayout></ProtectedRoute>} />
      <Route path="/partner/settings" element={<ProtectedRoute><RootLayout><PartnerWhiteLabelSettings /></RootLayout></ProtectedRoute>} />
      <Route path="/notice-defense" element={<ProtectedRoute><RootLayout><GSTNoticeDefense /></RootLayout></ProtectedRoute>} />
      <Route path="/vendor-lookup" element={<VendorLookup />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
