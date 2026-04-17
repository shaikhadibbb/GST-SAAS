import { motion } from 'framer-motion'
import { FileText, Truck, CheckCircle, Sparkles, DollarSign, BarChart3, Building } from 'lucide-react'
const features = [
  { icon: FileText, title: 'Invoice Automation', desc: 'Generate GST-compliant invoices with real-time IRN and QR code auth.', color: 'bg-indigo-50 text-indigo-600' },
  { icon: Sparkles, title: 'AI Compliance Sidekick', desc: 'AI assistant that proactively flags errors and suggests tax savings before you file.', color: 'bg-indigo-50 text-indigo-600' },
  { icon: DollarSign, title: 'Revenue Leakage Monitor', desc: 'Automatically identifies unclaimed ITC in GSTR-2A and converts it to cash.', color: 'bg-red-50 text-red-600' },
  { icon: CheckCircle, title: '2A Smart Match', desc: 'AI-assisted reconciliation that matches purchase data with government filings.', color: 'bg-emerald-50 text-emerald-600' },
  { icon: Building, title: 'Multi-GSTIN Scale', desc: 'Handle 100+ branches and state registrations from a single secure login.', color: 'bg-slate-50 text-slate-600' },
  { icon: BarChart3, title: 'Expert GSTR-1 Filing', desc: 'Zero-error filing with categorization (B2B/B2C) and JSON export.', color: 'bg-blue-50 text-blue-600' },
]
export default function Features() {
  return (
    <section id="features" className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-indigo-600 text-sm font-semibold uppercase tracking-widest">Features</span>
          <h2 className="text-4xl font-display font-bold text-slate-900 mt-3">Everything for GST compliance</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}
              whileHover={{ y: -4 }} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${f.color}`}><f.icon size={22} /></div>
              <h3 className="font-display font-bold text-slate-900 mb-2">{f.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
