import type { ReactNode } from 'react'
import { HouseholdContext, type HouseholdContextValue } from './householdContextStore'

type HouseholdProviderProps = HouseholdContextValue & {
  children: ReactNode
}

export function HouseholdProvider({ household, refreshHousehold, children }: HouseholdProviderProps) {
  return (
    <HouseholdContext.Provider value={{ household, refreshHousehold }}>
      {children}
    </HouseholdContext.Provider>
  )
}
