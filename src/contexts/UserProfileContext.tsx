'use client'

import { createContext, useContext, useCallback, useState } from 'react'

interface UserProfileContextType {
  refreshUserProfile: () => void
  profileUpdateTrigger: number
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined)

export function UserProfileProvider({ children }: { children: React.ReactNode }) {
  const [profileUpdateTrigger, setProfileUpdateTrigger] = useState(0)

  const refreshUserProfile = useCallback(() => {
    setProfileUpdateTrigger(prev => prev + 1)
  }, [])

  return (
    <UserProfileContext.Provider value={{ refreshUserProfile, profileUpdateTrigger }}>
      {children}
    </UserProfileContext.Provider>
  )
}

export function useUserProfile() {
  const context = useContext(UserProfileContext)
  if (context === undefined) {
    throw new Error('useUserProfile must be used within a UserProfileProvider')
  }
  return context
}
