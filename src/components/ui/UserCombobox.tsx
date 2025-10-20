'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Search, X, ChevronDown } from 'lucide-react'

interface User {
  id: string
  email: string
  name?: string | null
  lastname?: string | null
}

interface UserComboboxProps {
  users: User[]
  value: string
  onValueChange: (userId: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function UserCombobox({
  users,
  value,
  onValueChange,
  placeholder = 'Choisir un utilisateur...',
  className = '',
  disabled = false,
}: UserComboboxProps) {
  const [inputValue, setInputValue] = useState('')
  const [filteredUsers, setFilteredUsers] = useState<User[]>(users)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  // Get the display name of selected user
  const selectedUser = users.find(u => u.id === value)
  const displayName = selectedUser ? selectedUser.name || selectedUser.email : ''

  // Filter users based on input
  const handleInputChange = useCallback(
    (text: string) => {
      setInputValue(text)
      setSelectedIndex(-1)

      if (text.trim() === '') {
        setFilteredUsers(users)
        setShowDropdown(true)
        return
      }

      const searchLower = text.toLowerCase()
      const filtered = users.filter(
        user =>
          user.email.toLowerCase().includes(searchLower) ||
          (user.name && user.name.toLowerCase().includes(searchLower))
      )

      setFilteredUsers(filtered)
      setShowDropdown(filtered.length > 0)
    },
    [users]
  )

  // Handle user selection
  const handleUserSelect = useCallback(
    (user: User, e?: React.MouseEvent) => {
      e?.preventDefault()
      e?.stopPropagation()
      onValueChange(user.id)
      setInputValue('')
      setShowDropdown(false)
      setFilteredUsers(users)
      setSelectedIndex(-1)
      triggerRef.current?.focus()
    },
    [onValueChange, users]
  )

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Always prevent form submission on Enter
      if (e.key === 'Enter') {
        e.preventDefault()
      }

      if (!showDropdown || filteredUsers.length === 0) {
        if (e.key === 'Enter' || e.key === ' ') {
          setShowDropdown(true)
        }
        return
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => (prev < filteredUsers.length - 1 ? prev + 1 : prev))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1))
          break
        case 'Enter':
          if (selectedIndex >= 0) {
            handleUserSelect(filteredUsers[selectedIndex])
          }
          break
        case 'Escape':
          e.preventDefault()
          setShowDropdown(false)
          setSelectedIndex(-1)
          break
        default:
          break
      }
    },
    [showDropdown, filteredUsers, selectedIndex, handleUserSelect]
  )

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        inputRef.current &&
        !inputRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setShowDropdown(false)
        setSelectedIndex(-1)
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdown])

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onValueChange('')
    setInputValue('')
    setFilteredUsers(users)
    setShowDropdown(false)
    inputRef.current?.focus()
  }

  const handleTriggerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Use onMouseDown to prevent form submission and toggle before onClick fires
    setShowDropdown(prev => !prev)
  }

  return (
    <div className={`relative w-full ${className}`}>
      {/* Trigger Button / Input Area */}
      <button
        ref={triggerRef}
        type='button'
        onMouseDown={handleTriggerMouseDown}
        disabled={disabled}
        className='w-full px-3 py-2 text-left border border-orange-200 rounded-md bg-white hover:border-orange-300 focus:outline-none focus:ring-1 focus:ring-orange-200 focus:border-orange-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
      >
        <div className='flex items-center justify-between'>
          <div className='flex items-center flex-1 gap-2 min-w-0 pointer-events-none'>
            <Search className='h-4 w-4 text-gray-400 flex-shrink-0' />
            {value ? (
              <span className='text-sm text-gray-700 truncate font-medium'>{displayName}</span>
            ) : (
              <span className='text-sm text-gray-500'>{placeholder}</span>
            )}
          </div>
          {value && (
            <X
              className='h-4 w-4 text-gray-400 hover:text-gray-600 flex-shrink-0 cursor-pointer'
              onClick={handleClear}
              onMouseDown={e => {
                e.preventDefault()
                e.stopPropagation()
              }}
            />
          )}
          {!value && (
            <ChevronDown
              className={`h-4 w-4 text-gray-400 flex-shrink-0 transition-transform pointer-events-none ${
                showDropdown ? 'transform rotate-180' : ''
              }`}
            />
          )}
        </div>
      </button>

      {/* Dropdown Content */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className='absolute z-50 w-full mt-1 bg-white border border-orange-200 rounded-md shadow-lg'
        >
          {/* Search Input */}
          <div className='p-2 border-b border-orange-100'>
            <input
              ref={inputRef}
              type='text'
              value={inputValue}
              onChange={e => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder='Rechercher un utilisateur...'
              autoFocus
              className='w-full px-3 py-2 text-sm border border-orange-200 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-200 focus:border-orange-300'
            />
          </div>

          {/* Users List */}
          <div className='max-h-60 overflow-y-auto'>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user, index) => (
                <div
                  key={user.id}
                  onMouseDown={e => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleUserSelect(user)
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`px-4 py-3 cursor-pointer transition-colors ${
                    index === selectedIndex
                      ? 'bg-orange-50 border-l-4 border-orange-500'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className='flex items-start gap-2'>
                    <div className='flex-1 min-w-0'>
                      <div className='text-sm font-medium text-gray-900 truncate'>
                        {user.name || 'N/A'}
                      </div>
                      <div className='text-xs text-gray-500 truncate'>{user.email}</div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className='px-4 py-6 text-center text-sm text-gray-500'>
                {inputValue
                  ? `Aucun utilisateur trouvé pour "${inputValue}"`
                  : 'Aucun utilisateur disponible'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default UserCombobox
