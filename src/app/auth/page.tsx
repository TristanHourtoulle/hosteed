'use client'
import React, { Suspense } from 'react';
import { AuthForm } from "@/components/auth/AuthForm";

function AuthPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 64px)' }}>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        }>
            <AuthForm />
        </Suspense>
    );
}

export default AuthPage; 