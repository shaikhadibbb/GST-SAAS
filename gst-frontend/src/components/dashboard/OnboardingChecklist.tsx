import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckCircle2, Circle, ChevronRight, Building2, 
  FilePlus, Upload, GitMerge, Users, Zap, PartyPopper 
} from 'lucide-react'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { useOnboarding } from '@/hooks/useOnboarding'

interface Step {
  id: string
  title: string
  description: string
  href: string
  buttonLabel: string
  icon: any
}

const STEPS: Step[] = [
  { 
    id: 'COMPANY_SETUP', 
    title: 'Add your company', 
    description: 'Your GSTIN and company profile are ready.', 
    href: '/settings', 
    buttonLabel: 'View Profile',
    icon: Building2
  },
  { 
    id: 'FIRST_INVOICE', 
    title: 'Create your first invoice', 
    description: 'Generate professional GST invoices in seconds.', 
    href: '/invoices', 
    buttonLabel: 'Create Invoice',
    icon: FilePlus
  },
  { 
    id: 'UPLOAD_2A', 
    title: 'Upload GSTR-2A data', 
    description: 'Download data from GSTN and upload here to match.', 
    href: '/reconciliation', 
    buttonLabel: 'Upload Data',
    icon: Upload
  },
  { 
    id: 'RUN_RECONCILIATION', 
    title: 'Run reconciliation', 
    description: 'Match your records with GSTN to protect your ITC.', 
    href: '/reconciliation', 
    buttonLabel: 'Run Now',
    icon: GitMerge
  },
  { 
    id: 'INVITE_TEAM', 
    title: 'Invite a team member', 
    description: 'Collaborate with your team or accountant.', 
    href: '/companies', 
    buttonLabel: 'Invite Team',
    icon: Users
  },
]

export default function OnboardingChecklist() {
  const navigate = useNavigate()
  const { data: progress, isLoading } = useOnboarding()

  if (isLoading || !progress) return null
  if (progress.isCompleted) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <Card className="p-6 bg-indigo-600 text-white mb-6 border-none overflow-hidden relative">
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <PartyPopper size={24} className="text-indigo-200" />
                <h2 className="text-xl font-display font-bold">You're all set!</h2>
              </div>
              <p className="text-indigo-100 text-sm max-w-md">
                Registration, invoicing, and reconciliation are now active. You're ready to master your GST compliance.
              </p>
            </div>
            <Button 
              variant="secondary" 
              onClick={() => navigate('/dashboard')}
              className="bg-white text-indigo-600 hover:bg-indigo-50"
            >
              Continue to Dashboard
            </Button>
          </div>
          {/* Animated Background Elements */}
          <motion.div 
            animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full"
          />
        </Card>
      </motion.div>
    )
  }

  return (
    <Card className="p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-display font-bold text-slate-900 flex items-center gap-2">
            Get started with GSTPro <Zap size={18} className="text-amber-500 fill-amber-500" />
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">Complete these steps to unlock the full power of your account.</p>
        </div>
        <div className="flex flex-col items-end gap-1.5 whitespace-nowrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Progress</span>
            <span className="text-sm font-bold text-indigo-600 px-2 py-0.5 bg-indigo-50 rounded-lg">
              {progress.completedCount} of {progress.totalSteps} complete
            </span>
          </div>
          <div className="w-48 h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }} 
              animate={{ width: `${progress.percentage}%` }} 
              className="h-full bg-indigo-500"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        {STEPS.map((step, idx) => {
          const isDone = progress.steps[step.id]
          const isNext = !isDone && (idx === 0 || progress.steps[STEPS[idx-1].id])

          return (
            <div 
              key={step.id}
              className={`relative p-4 rounded-2xl border transition-all ${
                isDone 
                  ? 'bg-emerald-50/30 border-emerald-100' 
                  : isNext 
                    ? 'bg-white border-indigo-200 shadow-sm ring-1 ring-indigo-50' 
                    : 'bg-slate-50 border-slate-100 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isDone ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'
                }`}>
                  <step.icon size={16} />
                </div>
                {isDone ? (
                  <CheckCircle2 size={18} className="text-emerald-500 fill-emerald-50" />
                ) : (
                  <Circle size={18} className="text-slate-200" />
                )}
              </div>
              <h3 className={`text-sm font-bold mb-1 ${isDone ? 'text-emerald-900' : 'text-slate-900'}`}>
                {step.title}
              </h3>
              <p className="text-[11px] text-slate-400 leading-tight mb-4 min-h-[2rem]">
                {step.description}
              </p>
              
              {!isDone && isNext && (
                <button 
                  onClick={() => navigate(step.href)}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors"
                >
                  {step.buttonLabel} <ChevronRight size={12} />
                </button>
              )}
              {isDone && (
                <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest text-center py-1.5">
                  Completed
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}
