import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  hover?: boolean
}

export const Card = ({ children, className = '', onClick, hover = true }: CardProps) => {
  return (
    <motion.div
      whileHover={hover ? { y: -4, boxShadow: '0 20px 40px rgba(0,0,0,0.4)', transition: { duration: 0.3 } } : {}}
      onClick={onClick}
      className={`
        bg-slate-900/40 border border-slate-800/80 rounded-3xl backdrop-blur-md
        transition-all duration-500 group relative overflow-hidden
        ${onClick ? 'cursor-pointer active:scale-[0.99]' : ''}
        ${className}
      `}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />
      <div className="relative z-10">{children}</div>
    </motion.div>
  )

}
