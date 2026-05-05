import { cn } from '../../utils/cn'
import { useTheme } from '../../contexts/ThemeContext'

const buttonSizes = {
  default: 'px-6 py-3',
  sm: 'px-4 py-2 text-sm',
  lg: 'px-8 py-4 text-lg',
}

export function Button({
  children,
  className,
  variant = 'default',
  size = 'default',
  disabled,
  ...props
}) {
  const { darkMode: isDarkMode } = useTheme()
  
  const buttonVariants = {
    default: 'bg-primary text-white hover:bg-primary-hover',
    outline: isDarkMode 
      ? 'border border-slate-600 bg-slate-700 text-slate-200 hover:bg-slate-600' 
      : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
    ghost: isDarkMode
      ? 'hover:bg-slate-700 text-slate-200'
      : 'hover:bg-slate-100 text-slate-700',
  }
  
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed',
        buttonVariants[variant],
        buttonSizes[size],
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
