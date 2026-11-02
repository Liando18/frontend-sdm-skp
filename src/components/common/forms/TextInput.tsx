import React, { ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'

export interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: ReactNode
  rightElement?: ReactNode
}

/**
 * Standard Form TextInput UBK
 * Sesuai DESAIN.md Bab 16.1
 */
export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightElement,
      id,
      name,
      required,
      disabled,
      className = '',
      ...rest
    },
    ref
  ) => {
    const inputId = id || name || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className={`ubk-form-field ${className}`} style={{ width: '100%', marginBottom: 12 }}>
        {label && (
          <label
            htmlFor={inputId}
            style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 600,
              color: '#1e293b',
              marginBottom: 5,
            }}
          >
            {label}
            {required && <span style={{ color: '#ef4444', marginLeft: 3 }}>*</span>}
          </label>
        )}

        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            width: '100%',
          }}
        >
          {leftIcon && (
            <div
              style={{
                position: 'absolute',
                left: 12,
                display: 'flex',
                alignItems: 'center',
                pointerEvents: 'none',
                color: error ? '#ef4444' : '#64748b',
              }}
            >
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            name={name}
            required={required}
            disabled={disabled}
            style={{
              width: '100%',
              minHeight: 42,
              paddingTop: 8,
              paddingBottom: 8,
              paddingLeft: leftIcon ? 38 : 12,
              paddingRight: rightElement ? 38 : 12,
              fontSize: '13.5px',
              color: disabled ? '#94a3b8' : '#0f172a',
              background: disabled ? '#f8fafc' : '#ffffff',
              border: `1px solid ${error ? '#ef4444' : '#cbd5e1'}`,
              borderRadius: 8,
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = error ? '#ef4444' : '#0284c7'
              e.currentTarget.style.boxShadow = error
                ? '0 0 0 3px rgba(239, 68, 68, 0.15)'
                : '0 0 0 3px rgba(2, 132, 199, 0.15)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = error ? '#ef4444' : '#cbd5e1'
              e.currentTarget.style.boxShadow = 'none'
            }}
            {...rest}
          />

          {rightElement && (
            <div
              style={{
                position: 'absolute',
                right: 10,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {rightElement}
            </div>
          )}
        </div>

        {error ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              marginTop: 4,
              fontSize: '12px',
              color: '#ef4444',
            }}
          >
            <AlertCircle size={13} />
            <span>{error}</span>
          </div>
        ) : helperText ? (
          <div style={{ marginTop: 4, fontSize: '12px', color: '#64748b' }}>
            {helperText}
          </div>
        ) : null}
      </div>
    )
  }
)

TextInput.displayName = 'TextInput'
