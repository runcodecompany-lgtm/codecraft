import React from 'react'
import { Eye, EyeOff } from 'lucide-react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helper?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  variant?: 'outlined' | 'filled'
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  type = 'text',
  label,
  error,
  helper,
  leftIcon,
  rightIcon,
  variant = 'outlined',
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`
  const [showPassword, setShowPassword] = React.useState(false)
  const [isFocused, setIsFocused] = React.useState(false)

  const inputType = type === 'password' && showPassword ? 'text' : type

  const baseClasses = 'block w-full rounded-lg border px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed'

  const variantClasses = {
    outlined: 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600',
    filled: 'bg-gray-50 dark:bg-gray-700 border-transparent'
  }

  const errorClasses = error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
  const focusClasses = isFocused ? 'ring-2 ring-blue-500' : ''

  const classes = `${baseClasses} ${variantClasses[variant]} ${errorClasses} ${focusClasses} ${className}`.trim()

  const togglePassword = () => {
    setShowPassword(!showPassword)
  }

  return (
    <div className="w-full">
      {label && (
        <label 
          htmlFor={inputId} 
          className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500 dark:text-gray-400">
            {leftIcon}
          </div>
        )}

        <input
          ref={ref}
          type={inputType}
          id={inputId}
          className={leftIcon ? 'pl-10' : classes}
          onFocus={(e) => {
            setIsFocused(true)
            if (props.onFocus) props.onFocus(e)
          }}
          onBlur={(e) => {
            setIsFocused(false)
            if (props.onBlur) props.onBlur(e)
          }}
          {...props}
        />

        {type === 'password' && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            onClick={togglePassword}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        )}

        {rightIcon && type !== 'password' && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 dark:text-gray-400">
            {rightIcon}
          </div>
        )}
      </div>

      {(error || helper) && (
        <div className="mt-1 text-sm">
          {error && (
            <span className="text-red-600 dark:text-red-400">{error}</span>
          )}
          {!error && helper && (
            <span className="text-gray-500 dark:text-gray-400">{helper}</span>
          )}
        </div>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export default Input
