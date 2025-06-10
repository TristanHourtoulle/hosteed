'use client'
import { signIn } from "next-auth/react";
import { useState } from "react";
import { createUser } from "@/lib/services/user.service";
import { Button } from "@/components/ui/shadcnui/button";
import { Input } from "@/components/ui/shadcnui/input";
import Link from "next/link";

export const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError("Email ou mot de passe incorrect");
            } else {
                window.location.href = "/dashboard";
            }
        } catch {
            setError("Une erreur est survenue");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = () => {
        signIn("google", { redirectTo: "/dashboard" });
    };

    async function submit() {
        try {
            const newUser = await createUser({
                email: "pierre.maurer@epitech.eu",
                password: "pierre",
                name: "Pierre",
                lastname: "Maurer"
            });

            if (!newUser) {
                setError("Erreur lors de la création de l'utilisateur");
                return;
            }

            // Redirection après inscription réussie
            window.location.href = "/dashboard";
        } catch {
            setError("Une erreur est survenue lors de l'inscription");
        }
    }

    return (
        <div className="flex" style={{ height: 'calc(100vh - 64px)' }}>
            {/* Left side - Image */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-orange-400 via-pink-500 to-blue-600">
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent z-10" />
                <div className="absolute inset-0 flex items-center justify-center z-20">
                    <div className="text-center text-white">
                        <div className="mb-4">
                            <svg className="w-16 h-16 mx-auto mb-4 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-light mb-2">Bienvenue sur Hosteed</h2>
                        <p className="text-white/90 text-lg">Découvrez des hébergements exceptionnels</p>
                    </div>
                </div>
                {/* Decorative boat silhouette */}
                <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-20">
                    <svg className="w-20 h-12 text-white/60" fill="currentColor" viewBox="0 0 100 50">
                        <path d="M10,40 L20,20 L80,20 L90,40 L85,45 L15,45 Z M45,20 L45,10 L55,10 L55,20" />
                    </svg>
                </div>
            </div>

            {/* Right side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
                <div className="w-full max-w-md space-y-8">
                    {/* Header */}
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Content de vous revoir !
                        </h1>
                        <p className="text-gray-600">
                            Remplissez les champs ci dessous pour vous connecter
                        </p>
                    </div>

                    {/* Google Sign In */}
                    <Button
                        variant="outline"
                        onClick={handleGoogleSignIn}
                        className="w-full flex items-center justify-center gap-3 py-3 border-gray-300 hover:bg-gray-50"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Se connecter avec Google
                    </Button>

                    {/* Divider */}
                    <div className="flex items-center">
                        <div className="flex-1 border-t border-gray-300" />
                        <span className="px-4 text-sm text-gray-500 bg-gray-50">OU</span>
                        <div className="flex-1 border-t border-gray-300" />
                    </div>

                    {/* Email/Password Form */}
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <div>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    placeholder="Votre adresse mail"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <Input
                                    id="password"
                                    type="password"
                                    required
                                    placeholder="Votre mot de passe"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Forgot Password */}
                        <div className="text-right">
                            <Link href="#" className="text-sm text-blue-600 hover:text-blue-500">
                                Mot de passe oublié ?
                            </Link>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">
                                {error}
                            </div>
                        )}

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-2 py-3"
                        >
                            {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Connexion...
                                </>
                            ) : (
                                <>
                                    Se connecter
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </>
                            )}
                        </Button>
                    </form>

                    {/* Register Link */}
                    <div className="text-center">
                        <p className="text-gray-600">
                            Pas encore de compte ?{" "}
                            <button
                                onClick={submit}
                                className="text-blue-600 hover:text-blue-500 font-medium"
                            >
                                S&apos;inscrire
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

