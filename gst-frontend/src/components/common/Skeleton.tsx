interface SkeletonProps { className?: string; rows?: number }

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`animate-pulse bg-slate-200 rounded-lg ${className}`} />
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100">
      <Skeleton className="w-10 h-10 rounded-xl mb-3" />
      <Skeleton className="w-24 h-7 mb-1.5" />
      <Skeleton className="w-32 h-4 mb-1" />
      <Skeleton className="w-20 h-3" />
    </div>
  )
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr className="border-b border-slate-50">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <Skeleton className={`h-4 ${i === 0 ? 'w-24' : i === cols-1 ? 'w-16' : 'w-32'}`} />
        </td>
      ))}
    </tr>
  )
}
