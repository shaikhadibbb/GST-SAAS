import { createContext, useCallback, useEffect, useState, ReactNode } from 'react'
import api from '@/services/api'
import { User, Role } from '@/types'

interface AuthContextType {
  user: User | null
  activeCompanyId: string
  gstinRegId: string
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (payload: any) => Promise<any>
  logout: () => void
  switchCompany: (companyId: string) => Promise<void>
  isAdmin: () => boolean
  isCA: () => boolean
  isComplianceOfficer: () => boolean
  canEdit: () => boolean
  canOverrideIRN: () => boolean
}

export const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [activeCompanyId, setActiveCompanyId] = useState(localStorage.getItem('activeCompanyId') || '')
  const [gstinRegId, setGstinRegId] = useState(localStorage.getItem('gstinRegId') || '')
  const [loading, setLoading] = useState(true)

  const fetchAndSetGstinReg = async (companyId: string) => {
    if (!companyId) return ''
    try {
      const res = await api.get('/auth/gstin-regs', { headers: { 'x-company-id': companyId } })
      const regs = res.data.data
      if (regs && regs.length > 0) {
        const id = regs[0].id
        setGstinRegId(id)
        localStorage.setItem('gstinRegId', id)
        return id
      }
    } catch (err) { console.error('Failed to fetch GSTIN regs:', err) }
    return ''
  }

  const fetchMe = useCallback(async () => {
    const token = localStorage.getItem('accessToken')
    if (!token) { setLoading(false); return }
    try {
      const res = await api.get('/auth/me')
      const userData = res.data.data
      setUser(userData)
      
      let currentCompanyId = localStorage.getItem('activeCompanyId')
      if (!currentCompanyId && userData.companies?.length > 0) {
        currentCompanyId = userData.companies[0].id
        localStorage.setItem('activeCompanyId', currentCompanyId!)
      }
      setActiveCompanyId(currentCompanyId || '')
      
      if (currentCompanyId) {
        await fetchAndSetGstinReg(currentCompanyId)
      }
    } catch {
      logout()
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchMe() }, [fetchMe])

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password })
    const { accessToken, refreshToken, user: userData } = res.data.data
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    
    const initialCompanyId = userData.company?.id || (userData.companies?.[0]?.id) || ''
    if (initialCompanyId) {
      localStorage.setItem('activeCompanyId', initialCompanyId)
      setActiveCompanyId(initialCompanyId)
    }
    
    setUser(userData)
    await fetchAndSetGstinReg(initialCompanyId)
  }

  const switchCompany = async (companyId: string) => {
    localStorage.setItem('activeCompanyId', companyId)
    setActiveCompanyId(companyId)
    // Clear page-specific state and refetch
    await fetchMe()
    window.location.href = '/dashboard' // Force refresh to dashboard to ensure clean context
  }

  const register = async (payload: any) => {
    const res = await api.post('/auth/register', payload)
    const { accessToken, refreshToken, user: userData, gstinRegistration } = res.data.data
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    
    if (userData.company?.id) {
      localStorage.setItem('activeCompanyId', userData.company.id)
      setActiveCompanyId(userData.company.id)
    }

    if (gstinRegistration?.id) {
      localStorage.setItem('gstinRegId', gstinRegistration.id)
      setGstinRegId(gstinRegistration.id)
    }
    setUser(userData)
    return res.data.data
  }

  const logout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('gstinRegId')
    localStorage.removeItem('activeCompanyId')
    setUser(null)
    setGstinRegId('')
    setActiveCompanyId('')
  }

  const isAdmin = () => user?.role === Role.ADMIN
  const isCA = () => user?.role === Role.CA || user?.role === Role.ADMIN
  const isComplianceOfficer = () => user?.role === Role.COMPLIANCE_OFFICER
  const canEdit = () => user?.role !== Role.VIEWER
  const canOverrideIRN = () => user?.role === Role.COMPLIANCE_OFFICER

  return (
    <AuthContext.Provider value={{ 
      user, activeCompanyId, gstinRegId, loading, login, register, logout, switchCompany,
      isAdmin, isCA, isComplianceOfficer, canEdit, canOverrideIRN 
    }}>
      {children}
    </AuthContext.Provider>
  )
}
