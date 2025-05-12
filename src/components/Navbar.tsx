'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {useSession} from "next-auth/react";

const Navbar = () => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-800">
                Hosteed
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/search"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/search')
                    ? 'border-indigo-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Recherche
              </Link>
              <Link
                href="/reservations"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/reservations')
                    ? 'border-indigo-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Réservations actuelles
              </Link>
              {session && (session.user.roles == 'HOST') ? (
                    <Link href={"/host_manager"}
                          className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                              isActive('/reservations')
                                  ? 'border-indigo-500 text-gray-900'
                                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                          }`}
                    >
                      Gestion Host
                    </Link>
              ) : null}

              {session && (session.user.roles == 'BLOGWRITTER' || session.user.roles == 'ADMIN') ? (
                    <Link href={"/host_manager"}
                          className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                              isActive('/reservations')
                                  ? 'border-indigo-500 text-gray-900'
                                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                          }`}
                    >
                      Gestion BLOG
                    </Link>
              ) : null}
              {session && (session.user.roles == 'ADMIN') ? (
                  <div>
                    <Link href={"/admin"}
                          className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                              isActive('/reservations')
                                  ? 'border-indigo-500 text-gray-900'
                                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                          }`}
                    >
                      Gestion Administrateur
                    </Link>
                  </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
