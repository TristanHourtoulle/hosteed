'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createReview } from '@/lib/services/reviews.service'
import { getRentById } from '@/lib/services/rents.service'

interface ReviewFormData {
    productId: string
    rentId: string
    userId: string
    grade: number
    welcomeGrade: number
    staff: number
    comfort: number
    equipment: number
    cleaning: number
    title: string
    text: string
    visitingDate: string
    publishDate: string
}

function ReviewForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const rentId = searchParams.get('rentId')

    const [formData, setFormData] = useState<ReviewFormData>({
        productId: '',
        rentId: rentId || '',
        userId: '',
        grade: 5,
        welcomeGrade: 5,
        staff: 5,
        comfort: 5,
        equipment: 5,
        cleaning: 5,
        title: '',
        text: '',
        visitingDate: '',
        publishDate: new Date().toISOString().split('T')[0]
    })

    const [errors, setErrors] = useState<Partial<Record<keyof ReviewFormData, string>>>({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchRentData = async () => {
            if (!rentId) {
                setIsLoading(false)
                return
            }
            console.log(rentId)
            try {
                const rent = await getRentById(rentId)
                if (rent) {
                    setFormData(prev => ({
                        ...prev,
                        rentId,
                        productId: rent.product.id,
                        userId: rent.userId
                    }))
                } else {
                    setErrors(prev => ({
                        ...prev,
                        rentId: "Location non trouvée"
                    }))
                }
            } catch (error) {
                console.error("Erreur lors de la récupération de la location:", error)
                setErrors(prev => ({
                    ...prev,
                    rentId: "Erreur lors de la récupération de la location"
                }))
            } finally {
                setIsLoading(false)
            }
        }

        fetchRentData()
    }, [rentId])

    const validateForm = (): boolean => {
        const newErrors: Partial<Record<keyof ReviewFormData, string>> = {}

        if (!formData.productId) newErrors.productId = "L'ID du produit est requis"
        if (!formData.rentId) newErrors.rentId = "L'ID de la location est requis"
        if (!formData.userId) newErrors.userId = "L'ID de l'utilisateur est requis"
        if (formData.grade < 1 || formData.grade > 5) newErrors.grade = "La note doit être entre 1 et 5"
        if (formData.welcomeGrade < 1 || formData.welcomeGrade > 5) newErrors.welcomeGrade = "La note d'accueil doit être entre 1 et 5"
        if (formData.staff < 1 || formData.staff > 5) newErrors.staff = "La note du personnel doit être entre 1 et 5"
        if (formData.comfort < 1 || formData.comfort > 5) newErrors.comfort = "La note du confort doit être entre 1 et 5"
        if (formData.equipment < 1 || formData.equipment > 5) newErrors.equipment = "La note de l'équipement doit être entre 1 et 5"
        if (formData.cleaning < 1 || formData.cleaning > 5) newErrors.cleaning = "La note du nettoyage doit être entre 1 et 5"
        if (!formData.title) newErrors.title = "Le titre est requis"
        if (!formData.text || formData.text.length < 10) newErrors.text = "Le texte doit contenir au moins 10 caractères"
        if (!formData.visitingDate) newErrors.visitingDate = "La date de visite est requise"
        if (!formData.publishDate) newErrors.publishDate = "La date de publication est requise"

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) return

        setIsSubmitting(true)
        try {
            const result = await createReview({
                ...formData,
                visitingDate: new Date(formData.visitingDate),
                publishDate: new Date(formData.publishDate)
            })

            if (result) {
                alert("Avis créé avec succès")
                router.push("/reservations")
            } else {
                alert("Erreur lors de la création de l'avis")
            }
        } catch (error) {
            console.error(error)
            alert("Une erreur est survenue")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: name === 'grade' ? Number(value) : value
        }))
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <p className="text-gray-600">Chargement...</p>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-10 px-4">
            <h1 className="text-2xl font-bold mb-6">Créer un avis</h1>
            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
                <div className="form-group">
                    <label htmlFor="grade" className="block mb-2 font-medium">
                        Note globale (1-5)
                    </label>
                    <input
                        type="number"
                        id="grade"
                        name="grade"
                        min="1"
                        max="5"
                        value={formData.grade}
                        onChange={handleChange}
                        className={`w-full p-2 border rounded ${errors.grade ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.grade && <p className="text-red-500 text-sm mt-1">{errors.grade}</p>}
                </div>

                <div className="form-group">
                    <label htmlFor="welcomeGrade" className="block mb-2 font-medium">
                        Note d&apos;accueil (1-5)
                    </label>
                    <input
                        type="number"
                        id="welcomeGrade"
                        name="welcomeGrade"
                        min="1"
                        max="5"
                        value={formData.welcomeGrade}
                        onChange={handleChange}
                        className={`w-full p-2 border rounded ${errors.welcomeGrade ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.welcomeGrade && <p className="text-red-500 text-sm mt-1">{errors.welcomeGrade}</p>}
                </div>

                <div className="form-group">
                    <label htmlFor="staff" className="block mb-2 font-medium">
                        Note du personnel (1-5)
                    </label>
                    <input
                        type="number"
                        id="staff"
                        name="staff"
                        min="1"
                        max="5"
                        value={formData.staff}
                        onChange={handleChange}
                        className={`w-full p-2 border rounded ${errors.staff ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.staff && <p className="text-red-500 text-sm mt-1">{errors.staff}</p>}
                </div>

                <div className="form-group">
                    <label htmlFor="comfort" className="block mb-2 font-medium">
                        Note du confort (1-5)
                    </label>
                    <input
                        type="number"
                        id="comfort"
                        name="comfort"
                        min="1"
                        max="5"
                        value={formData.comfort}
                        onChange={handleChange}
                        className={`w-full p-2 border rounded ${errors.comfort ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.comfort && <p className="text-red-500 text-sm mt-1">{errors.comfort}</p>}
                </div>

                <div className="form-group">
                    <label htmlFor="equipment" className="block mb-2 font-medium">
                        Note de l&apos;équipement (1-5)
                    </label>
                    <input
                        type="number"
                        id="equipment"
                        name="equipment"
                        min="1"
                        max="5"
                        value={formData.equipment}
                        onChange={handleChange}
                        className={`w-full p-2 border rounded ${errors.equipment ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.equipment && <p className="text-red-500 text-sm mt-1">{errors.equipment}</p>}
                </div>

                <div className="form-group">
                    <label htmlFor="cleaning" className="block mb-2 font-medium">
                        Note du nettoyage (1-5)
                    </label>
                    <input
                        type="number"
                        id="cleaning"
                        name="cleaning"
                        min="1"
                        max="5"
                        value={formData.cleaning}
                        onChange={handleChange}
                        className={`w-full p-2 border rounded ${errors.cleaning ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.cleaning && <p className="text-red-500 text-sm mt-1">{errors.cleaning}</p>}
                </div>

                <div className="form-group">
                    <label htmlFor="title" className="block mb-2 font-medium">
                        Titre
                    </label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        className={`w-full p-2 border rounded ${errors.title ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                </div>

                <div className="form-group">
                    <label htmlFor="text" className="block mb-2 font-medium">
                        Commentaire
                    </label>
                    <textarea
                        id="text"
                        name="text"
                        value={formData.text}
                        onChange={handleChange}
                        rows={4}
                        className={`w-full p-2 border rounded ${errors.text ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.text && <p className="text-red-500 text-sm mt-1">{errors.text}</p>}
                </div>

                <div className="form-group">
                    <label htmlFor="visitingDate" className="block mb-2 font-medium">
                        Date de visite
                    </label>
                    <input
                        type="date"
                        id="visitingDate"
                        name="visitingDate"
                        value={formData.visitingDate}
                        onChange={handleChange}
                        className={`w-full p-2 border rounded ${errors.visitingDate ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.visitingDate && <p className="text-red-500 text-sm mt-1">{errors.visitingDate}</p>}
                </div>

                <div className="form-group">
                    <label htmlFor="publishDate" className="block mb-2 font-medium">
                        Date de publication
                    </label>
                    <input
                        type="date"
                        id="publishDate"
                        name="publishDate"
                        value={formData.publishDate}
                        onChange={handleChange}
                        className={`w-full p-2 border rounded ${errors.publishDate ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.publishDate && <p className="text-red-500 text-sm mt-1">{errors.publishDate}</p>}
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-2 px-4 rounded text-white font-medium ${
                        isSubmitting ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                >
                    {isSubmitting ? 'Création en cours...' : 'Créer l\'avis'}
                </button>
            </form>
        </div>
    )
}

export default function CreateReviewPage() {
    return (
        <Suspense fallback={<div>Chargement...</div>}>
            <ReviewForm />
        </Suspense>
    )
}
