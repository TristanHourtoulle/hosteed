'use client'
import React from 'react';
import {Login} from "@/components/login";
import {UserService} from "@/lib/services/user.service";

function LoginPage() {
    async function submit() {
        const newUser = await UserService.createUser({
            email: "exemijile@email.com",
            password: "motdepasse123",
            name: "Prénijiom", // optionnel
            lastname: "Njiom" // optionnel
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
