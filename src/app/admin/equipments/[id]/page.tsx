import { UserDetailsClient as UserDetails } from './UserDetailsClient'
import {findEquipmentById} from "@/lib/services/equipments.service";
import {EquipmentInterface} from "@/lib/interface/equipmentInterface";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const data = await findEquipmentById(resolvedParams.id) as EquipmentInterface | null | undefined;
  if (!data) {
    throw new Error("Equipment data not found");
  }
  return <UserDetails id={data.id} name={data.name} icon={data.icon} />
}
