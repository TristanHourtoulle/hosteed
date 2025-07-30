import { UserDetailsClient as UserDetails } from './UserDetailsClient'
import {findSecurityById} from "@/lib/services/security.services";
import {SecurityInterface} from "@/lib/interface/securityInterface";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const data = await findSecurityById(resolvedParams.id) as SecurityInterface | null | undefined;
  if (!data) {
    throw new Error("Security data not found");
  }
  return <UserDetails id={data.id} name={data.name} />
}
