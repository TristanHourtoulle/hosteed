import { Suspense } from 'react'
import ClientAccountPage from './ClientAccountPage'
import AccountLoading from './loading'

type Tab = 'reservations' | 'favoris' | 'profil'

interface AccountPageProps {
  searchParams: Promise<{
    tab?: Tab
  }>
}

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const params = await searchParams
  const tab = params.tab || 'reservations'

  return (
    <Suspense fallback={<AccountLoading />}>
      <ClientAccountPage initialTab={tab} />
    </Suspense>
  )
}
