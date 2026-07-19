import { useContext } from 'react'
import { HouseholdContext, type HouseholdContextValue } from './householdContextStore'

export function useHousehold(): HouseholdContextValue {
  const value = useContext(HouseholdContext)
  if (!value) {
    throw new Error('useHousehold muss innerhalb des HouseholdProvider verwendet werden.')
  }
  return value
}
