const variantStyles: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600 border border-slate-200',
  generated: 'bg-blue-50 text-blue-700 border border-blue-200',
  irn: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  gstr1_filed: 'bg-purple-50 text-purple-700 border border-purple-200',
  reconciled: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
  matched: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  unmatched: 'bg-red-50 text-red-700 border border-red-200',
  b2b: 'bg-indigo-50 text-indigo-700 border border-indigo-100',
  b2cs: 'bg-sky-50 text-sky-700 border border-sky-100',
  b2cl: 'bg-violet-50 text-violet-700 border border-violet-100',
  default: 'bg-slate-100 text-slate-600 border border-slate-200',
}
const statusLabels: Record<string, string> = {
  DRAFT: 'Draft',
  GENERATED: 'Generated',
  IRN_GENERATED: 'IRN Generated',
  GSTR1_FILED: 'GSTR-1 Filed',
  RECONCILED: 'Reconciled',
  CANCELLED: 'Cancelled',
}
interface BadgeProps { variant?: string; status?: string; children?: React.ReactNode; className?: string }
export function Badge({ variant, status, children, className = '' }: BadgeProps) {
  const v = variant ?? (status === 'IRN_GENERATED' ? 'irn' : status?.toLowerCase() ?? 'default')
  const style = variantStyles[v] ?? variantStyles.default
  const label = children ?? (status ? statusLabels[status] ?? status : '')
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style} ${className}`}>{label}</span>
}
