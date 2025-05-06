'use client'
import { useSession} from "next-auth/react";
import {signOut} from "next-auth/react";
import Link from "next/link";
import HomeSearchBar from "@/components/ui/homeSearchBar";
import {findAllTypeRent} from "@/lib/services/typeRent.service";
import {useEffect, useState} from "react";
import {TypeRent} from "@prisma/client";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const {data: session} = useSession();
  const [typeRent, setTypeRent] = useState<TypeRent[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchTypeRent = async () => {
      const types = await findAllTypeRent();
      if (types) {
        setTypeRent(types);
      } else {
        console.error("Impossible de charger les types de location");
        setTypeRent([]);
      }
    };
    fetchTypeRent();
  }, []);

  const handleSearchClick = () => {
    router.push('/search');
  };

  return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          {session?.user ? (
              <div className="mb-8 flex justify-between items-center">
                <p className="text-xl font-semibold text-gray-800">Bienvenue {session.user.name}</p>
                <div className="flex gap-4">
                  <button
                      onClick={handleSearchClick}
                      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                  >
                    Rechercher un hébergement
                  </button>
                  <button
                      onClick={() => signOut()}
                      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
                  >
                    Déconnexion
                  </button>
                </div>
              </div>
          ) : (
              <Link href={"/login"}>
                <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors">
                  Se connecter
                </button>
              </Link>
          )}
          <div className="mb-8">
            <HomeSearchBar/>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {typeRent.map((type) => (
                <Link
                    key={type.id}
                    href={`/search?type=${type.id}`}
                    className="block"
                >
                    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg cursor-pointer transform hover:scale-105">
                        <h3 className="text-xl font-semibold mb-2 text-gray-800">{type.name}</h3>
                        {type.description && (
                            <p className="text-gray-700">{type.description}</p>
                        )}
                    </div>
                </Link>
            ))}
          </div>
        </div>
      </div>
  );
};
