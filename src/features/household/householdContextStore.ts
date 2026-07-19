import { createContext } from 'react'
import type { HouseholdSnapshot } from './householdService'

export type HouseholdContextValue = {
  household: HouseholdSnapshot
  refreshHousehold: () => Promise<void>
}

export const HouseholdContext = createContext<HouseholdContextValue | undefined>(undefined)
