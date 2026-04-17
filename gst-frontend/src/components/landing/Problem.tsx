import { Clock, AlertTriangle, GitMerge } from 'lucide-react'
import { motion } from 'framer-motion'
const problems = [
  { icon: Clock, title: '40 Hours Wasted', desc: 'Finance teams spend 40+ hours every month on manual GST data entry, reconciliation, and filing.', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
  { icon: AlertTriangle, title: 'Penalty Risk', desc: 'Late filings, mismatches, and incorrect ITC claims lead to notices and penalties from GST department.', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
  { icon: GitMerge, title: 'Reconciliation Hell', desc: 'Matching GSTR-2A with purchase registers manually across hundreds of vendors is error-prone.', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
]
export default function Problem() {
  return (
    <section id="about" className="bg-navy text-white py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-indigo-400 text-sm font-semibold uppercase tracking-widest">The Problem</span>
          <h2 className="text-4xl font-display font-bold mt-3">Why GST filing is painful</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {problems.map((p, i) => (
            <motion.div key={p.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }} viewport={{ once: true }}
              className={`rounded-2xl border p-8 ${p.bg}`}>
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-5"><p.icon size={24} className={p.color} /></div>
              <h3 className="text-xl font-display font-bold mb-3">{p.title}</h3>
              <p className="text-slate-400 leading-relaxed text-sm">{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
