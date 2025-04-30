'use client'
import { useSession} from "next-auth/react";
import {signOut} from "next-auth/react";
import Link from "next/link";


export default function Dashboard () {
    const {data: session} = useSession();

    return (
        <>
            {session?.user ? (
                <div>
                    <p>Welcome {session.user.name + ' ' + session.user.roles}</p>
                    <button onClick={() => signOut()}>Sign out</button>
                </div>
            ) : (
                <Link href={"/login"}>
                    <button>Click here to sign In</button>
                </Link>
            )}
        </>
    );
};
