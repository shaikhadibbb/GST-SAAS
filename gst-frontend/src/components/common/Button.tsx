import { motion } from 'framer-motion'
import { ReactNode, ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  icon?: ReactNode
  loading?: boolean
}

export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  icon, 
  loading,
  className = '',
  ...props 
}: ButtonProps) => {
  const baseStyles = "relative flex items-center justify-center font-bold tracking-tight transition-all duration-200 overflow-hidden active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
  
  const variants = {
    primary: "bg-emerald-500 text-slate-950 shadow-neon hover:shadow-neon-hover border border-emerald-400 group-hover:border-emerald-300",
    secondary: "bg-slate-900 text-slate-100 hover:bg-slate-800 border border-slate-800",
    outline: "bg-transparent border border-slate-800 text-slate-300 hover:border-emerald-500/50 hover:text-emerald-400",
    ghost: "bg-transparent text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/5",
    danger: "bg-error-light text-error-main hover:bg-error-light/20 border border-error-main/20"
  }

  const sizes = {
    sm: "px-4 py-2 text-[12px] uppercase tracking-wider rounded-xl",
    md: "px-6 py-3 text-sm rounded-xl",
    lg: "px-8 py-4 text-base rounded-2xl"
  }

  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading && (
        <div className="absolute inset-0 bg-inherit flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <div className={`flex items-center gap-2 ${loading ? 'opacity-0' : 'opacity-100'}`}>
        {icon && <span className="shrink-0">{icon}</span>}
        {children}
      </div>
    </motion.button>
  )
}
