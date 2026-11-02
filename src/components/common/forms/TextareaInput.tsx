import React from 'react'
import { AlertCircle } from 'lucide-react'

export interface TextareaInputProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
  showCharCount?: boolean
}

/**
 * Standard Form TextareaInput UBK
 * Sesuai DESAIN.md Bab 16.3
 */
export const TextareaInput = React.forwardRef<HTMLTextAreaElement, TextareaInputProps>(
  (
    {
      label,
      error,
      helperText,
      showCharCount = true,
      id,
      name,
      required,
      disabled,
      maxLength,
      value,
      className = '',
      rows = 3,
      ...rest
    },
    ref
  ) => {
    const textareaId = id || name || label?.toLowerCase().replace(/\s+/g, '-')
    const currentLength = typeof value === 'string' ? value.length : 0

    return (
      <div className={`ubk-form-field ${className}`} style={{ width: '100%', marginBottom: 12 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 5,
          }}
        >
          {label && (
            <label
              htmlFor={textareaId}
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: '#1e293b',
              }}
            >
              {label}
              {required && <span style={{ color: '#ef4444', marginLeft: 3 }}>*</span>}
            </label>
          )}

          {showCharCount && maxLength && (
            <span
              style={{
                fontSize: '11.5px',
                color: currentLength >= maxLength ? '#ef4444' : '#64748b',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {currentLength} / {maxLength}
            </span>
          )}
        </div>

        <textarea
          ref={ref}
          id={textareaId}
          name={name}
          required={required}
          disabled={disabled}
          maxLength={maxLength}
          value={value}
          rows={rows}
          style={{
            width: '100%',
            minHeight: 90,
            padding: '10px 12px',
            fontSize: '13.5px',
            color: disabled ? '#94a3b8' : '#0f172a',
            background: disabled ? '#f8fafc' : '#ffffff',
            border: `1px solid ${error ? '#ef4444' : '#cbd5e1'}`,
            borderRadius: 8,
            outline: 'none',
            resize: 'vertical',
            boxSizing: 'border-box',
            fontFamily: 'inherit',
            lineHeight: 1.5,
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

TextareaInput.displayName = 'TextareaInput'
