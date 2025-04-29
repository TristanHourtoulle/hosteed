'use client'
import React from 'react';
import {Login} from "@/component/login";
import {UserService} from "@/lib/services/user.service";

function LoginPage() {
    async function submit() {
        const newUser = await UserService.createUser({
            email: "exemple@email.com",
            password: "motdepasse123",
            name: "Prénom", // optionnel
            lastname: "Nom" // optionnel
        });
    }
    return (
        <>
        <Login/>
            <button onClick={submit}>oui</button>
        </>
    );
}

export default LoginPage;
