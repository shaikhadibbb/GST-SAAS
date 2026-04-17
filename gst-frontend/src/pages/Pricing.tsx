import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Zap, Shield, Crown, Star, HelpCircle } from 'lucide-react'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { useAuth } from '@/hooks/useAuth'

export default function Pricing() {
  const { user } = useAuth()
  const [isAnnual, setIsAnnual] = useState(true)

  const plans = [
    {
      name: 'STARTER',
      icon: <Zap size={40} className="text-slate-400" />,
      monthlyPrice: 999,
      annualPrice: 799,
      key: 'STARTER',
      features: ['1 GSTIN registration', '100 invoices / month', 'GSTR-2A Reconciliation', 'Standard Support']
    },
    {
      name: 'GROWTH',
      icon: <Shield size={40} className="text-sky-500" />,
      monthlyPrice: 2499,
      annualPrice: 1999,
      key: 'GROWTH',
      popular: true,
      features: ['5 GSTIN registrations', 'Unlimited invoices', 'AI Notice Defense (Beta)', 'Priority Delivery']
    },
    {
      name: 'ENTERPRISE',
      icon: <Crown size={40} className="text-sky-600" />,
      monthlyPrice: 4999,
      annualPrice: 3999,
      key: 'CA_FIRM',
      features: ['Unlimited GSTINs', 'Partner Dashboard', 'White-label Reports', 'Dedicated Strategist']
    }
  ]

  return (
    <div className="min-h-screen bg-white py-24 px-10 relative overflow-hidden">
      {/* Soft Background Accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[800px] bg-sky-50/50 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-24 relative z-10">
        
        {/* Market Section Header */}
        <div className="text-center space-y-8">
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="inline-flex items-center gap-2 px-4 py-2 bg-sky-50 border border-sky-100 rounded-full">
              <Star size={14} className="text-sky-500" fill="currentColor" />
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-sky-700">Institutional Licensing</span>
           </motion.div>
           <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[0.95]">
              Optimize your <span className="text-sky-600">tax operations</span> with scale.
           </h1>
           
           <div className="flex items-center justify-center gap-8 pt-8">
              <span className={`text-sm font-bold tracking-tight transition-colors ${!isAnnual ? 'text-slate-900 font-extrabold' : 'text-slate-400'}`}>Standard Monthly</span>
              <button onClick={() => setIsAnnual(!isAnnual)} className="w-16 h-8 bg-sky-100 rounded-full p-1 relative flex items-center transition-all">
                 <motion.div animate={{ x: isAnnual ? 32 : 0 }} className="w-6 h-6 bg-sky-600 rounded-full shadow-lg shadow-sky-600/30" />
              </button>
              <div className="flex items-center gap-3">
                 <span className={`text-sm font-bold tracking-tight transition-colors ${isAnnual ? 'text-slate-900 font-extrabold' : 'text-slate-400'}`}>Institutional Annual</span>
                 <span className="bg-success-light text-success-dark text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">Recommended -25%</span>
              </div>
           </div>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-14">
           {plans.map((plan, idx) => (
             <motion.div key={plan.key} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * idx }}>
                <Card className={`p-12 flex flex-col h-full bg-white relative ${plan.popular ? 'border-sky-500 shadow-2xl ring-4 ring-sky-50' : 'border-sky-100 shadow-xl'}`}>
                   {plan.popular && (
                     <div className="absolute top-0 right-10 -translate-y-1/2 bg-sky-600 text-white text-[10px] font-black uppercase tracking-[0.2em] px-5 py-2 rounded-full shadow-lg">
                        Highest Efficiency
                     </div>
                   )}

                   <div className="mb-12">
                      <div className="mb-8">{plan.icon}</div>
                      <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-[0.3em] mb-4">{plan.name}</h3>
                      <div className="flex items-baseline gap-2">
                         <span className="text-5xl font-extrabold text-slate-900 font-display tracking-tighter">₹{isAnnual ? plan.annualPrice : plan.monthlyPrice}</span>
                         <span className="text-slate-400 text-sm font-bold uppercase">/month</span>
                      </div>
                   </div>

                   <div className="space-y-6 mb-16 flex-1">
                      {plan.features.map((f, i) => (
                        <div key={i} className="flex items-start gap-4">
                           <div className="mt-1 w-6 h-6 rounded-lg bg-sky-50 flex items-center justify-center shrink-0">
                              <Check size={14} className="text-sky-600" />
                           </div>
                           <span className="text-sm font-semibold text-slate-500">{f}</span>
                        </div>
                      ))}
                   </div>

                   <Button className="w-full py-5 text-xs font-black uppercase tracking-widest">
                      Select {plan.name} Plan
                   </Button>
                </Card>
             </motion.div>
           ))}
        </div>

        {/* Confidence Statement */}
        <div className="max-w-4xl mx-auto rounded-3xl bg-sky-50/50 border border-sky-100 p-12 text-center">
           <HelpCircle className="mx-auto mb-6 text-sky-200" size={48} />
           <h4 className="text-lg font-bold text-slate-800 mb-4 tracking-tight">Enterprise Compliance Standards</h4>
           <p className="text-slate-500 text-base font-medium leading-relaxed max-w-2xl mx-auto">
             GSTPro infrastructure adheres to ISO 27001 data integrity standards. All tiers include AES-256 resting data encryption and periodic independent security audits.
           </p>
        </div>
      </div>
    </div>
  )
}
