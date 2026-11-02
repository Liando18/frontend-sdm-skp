import React, { ReactNode } from 'react'
import { ChevronDown, AlertCircle } from 'lucide-react'

export interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
}

export interface SelectOptGroup {
  groupLabel: string
  options: SelectOption[]
}

export interface SelectDropdownProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string
  options: (SelectOption | SelectOptGroup)[]
  error?: string
  helperText?: string
  leftIcon?: ReactNode
  placeholder?: string
}

function isGroup(opt: SelectOption | SelectOptGroup): opt is SelectOptGroup {
  return 'groupLabel' in opt && Array.isArray((opt as SelectOptGroup).options)
}

/**
 * Standard Form SelectDropdown UBK
 * Sesuai DESAIN.md Bab 16.2
 */
export const SelectDropdown = React.forwardRef<HTMLSelectElement, SelectDropdownProps>(
  (
    {
      label,
      options,
      error,
      helperText,
      leftIcon,
      placeholder,
      id,
      name,
      required,
      disabled,
      className = '',
      value,
      ...rest
    },
    ref
  ) => {
    const selectId = id || name || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className={`ubk-form-field ${className}`} style={{ width: '100%', marginBottom: 12 }}>
        {label && (
          <label
            htmlFor={selectId}
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
                zIndex: 1,
              }}
            >
              {leftIcon}
            </div>
          )}

          <select
            ref={ref}
            id={selectId}
            name={name}
            required={required}
            disabled={disabled}
            value={value}
            style={{
              width: '100%',
              minHeight: 42,
              paddingTop: 8,
              paddingBottom: 8,
              paddingLeft: leftIcon ? 38 : 12,
              paddingRight: 36,
              fontSize: '13.5px',
              color: disabled ? '#94a3b8' : !value && placeholder ? '#94a3b8' : '#0f172a',
              background: disabled ? '#f8fafc' : '#ffffff',
              border: `1px solid ${error ? '#ef4444' : '#cbd5e1'}`,
              borderRadius: 8,
              outline: 'none',
              appearance: 'none',
              boxSizing: 'border-box',
              cursor: disabled ? 'not-allowed' : 'pointer',
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
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt, idx) => {
              if (isGroup(opt)) {
                return (
                  <optgroup key={`group-${idx}`} label={opt.groupLabel}>
                    {opt.options.map((child) => (
                      <option key={String(child.value)} value={child.value} disabled={child.disabled}>
                        {child.label}
                      </option>
                    ))}
                  </optgroup>
                )
              }
              return (
                <option key={String(opt.value)} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </option>
              )
            })}
          </select>

          <div
            style={{
              position: 'absolute',
              right: 12,
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none',
              color: '#64748b',
            }}
          >
            <ChevronDown size={16} />
          </div>
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

SelectDropdown.displayName = 'SelectDropdown'
