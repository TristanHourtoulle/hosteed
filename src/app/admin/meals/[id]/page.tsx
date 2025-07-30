import { UserDetailsClient as UserDetails } from './UserDetailsClient'
import {SecurityInterface} from "@/lib/interface/securityInterface";
import {findMealById} from "@/lib/services/meals.service";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const data = await findMealById(resolvedParams.id) as SecurityInterface | null | undefined;
  if (!data) {
    throw new Error("Meal data not found");
  }
  return <UserDetails id={data.id} name={data.name} />
}
