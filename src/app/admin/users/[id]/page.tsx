import { UserDetailsClient as UserDetails } from './UserDetailsClient'
import { getUserData } from './utils/getData'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const data = await getUserData(resolvedParams.id)
  return <UserDetails initialData={data} />
}
