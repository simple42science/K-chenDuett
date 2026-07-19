import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './AppShell'
import { InventoryPage } from '../features/inventory/InventoryPage'
import { MorePage } from '../features/more/MorePage'
import { RecipesPage } from '../features/recipes/RecipesPage'
import { TodayPage } from '../features/today/TodayPage'

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<TodayPage />} />
        <Route path="inventar" element={<InventoryPage />} />
        <Route path="rezepte" element={<RecipesPage />} />
        <Route path="mehr" element={<MorePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
