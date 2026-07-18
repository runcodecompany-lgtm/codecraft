import React from 'react'

export interface CardProps {
  children: React.ReactNode
  className?: string
  variant?: 'elevated' | 'outlined' | 'filled'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
}

export interface CardHeaderProps {
  title?: string
  description?: string
  children?: React.ReactNode
  className?: string
}

export interface CardBodyProps {
  children: React.ReactNode
  className?: string
}

export interface CardFooterProps {
  children: React.ReactNode
  className?: string
}

const Card = ({ 
  children, 
  className = '', 
  variant = 'elevated', 
  padding = 'md',
  hover = false
}: CardProps) => {
  const baseClasses = 'rounded-xl bg-white dark:bg-gray-800 transition-all duration-200'

  const variantClasses = {
    elevated: 'border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md',
    outlined: 'border-2 border-gray-200 dark:border-gray-700',
    filled: 'border border-transparent shadow-sm'
  }

  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-8'
  }

  const hoverClasses = hover ? 'hover:-translate-y-1 hover:shadow-lg' : ''

  const classes = `${baseClasses} ${variantClasses[variant]} ${paddingClasses[padding]} ${hoverClasses} ${className}`.trim()

  return (
    <div className={classes}>
      {children}
    </div>
  )
}

const CardHeader = ({ 
  title, 
  description, 
  children, 
  className = '' 
}: CardHeaderProps) => {
  const hasTitle = title || description

  if (hasTitle) {
    return (
      <div className={`mb-6 ${className}`}>
        {title && (
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            {title}
          </h3>
        )}
        {description && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        )}
      </div>
    )
  }

  return <div className={className}>{children}</div>
}

const CardBody = ({ children, className = '' }: CardBodyProps) => {
  return <div className={className}>{children}</div>
}

const CardFooter = ({ children, className = '' }: CardFooterProps) => {
  return (
    <div className={`mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 ${className}`}>
      {children}
    </div>
  )
}

Card.Header = CardHeader
Card.Body = CardBody
Card.Footer = CardFooter

export default Card
