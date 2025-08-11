import Image from 'next/image'
import { cn } from '@/lib/utils'

interface LenteLogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-20 h-20'
}

export function LenteLogo({ 
  className, 
  size = 'md', 
  showText = false 
}: LenteLogoProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className={cn(
        'relative overflow-hidden rounded-2xl shadow-lg',
        sizeClasses[size]
      )}>
        <Image
          src="/lente-logo.png"
          alt="Lente AI Logo"
          fill
          className="object-cover"
          priority
        />
      </div>
      
      {showText && (
        <div className="flex flex-col">
          <span className="text-xl font-bold text-gray-900">Lente AI</span>
          <span className="text-sm text-gray-600">Inteligencia Artificial</span>
        </div>
      )}
    </div>
  )
}

// Variante solo para el logo sin texto
export function LenteLogoIcon({ 
  className, 
  size = 'md' 
}: Omit<LenteLogoProps, 'showText'>) {
  return (
    <div className={cn(
      'relative overflow-hidden rounded-2xl shadow-lg',
      sizeClasses[size],
      className
    )}>
      <Image
        src="/lente-logo.png"
        alt="Lente AI Logo"
        fill
        className="object-cover"
        priority
      />
    </div>
  )
}
