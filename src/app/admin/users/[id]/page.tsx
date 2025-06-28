import { UserDetailsClient as UserDetails } from './UserDetailsClient'
import { getUserData } from './utils/getData'

interface PageProps {
  params: {
    id: string
  }
}

export default async function Page({ params }: PageProps) {
  const data = await getUserData(params.id)
  return <UserDetails initialData={data} />
}
