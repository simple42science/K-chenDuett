import { useContext } from 'react'
import { AuthContext, type AuthContextValue } from './authContextStore'

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth muss innerhalb des AuthProvider verwendet werden.')
  return value
}
