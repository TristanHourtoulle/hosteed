'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createReview } from '@/lib/services/reviews.service'
import { getRentById } from '@/lib/services/rents.service'

interface ReviewFormData {
    productId: string
    rentId: string
    userId: string
    grade: number
    title: string
    text: string
    visitingDate: string
    publishDate: string
}

export default function CreateReviewPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const rentId = searchParams.get('rentId')

    const [formData, setFormData] = useState<ReviewFormData>({
        productId: '',
        rentId: rentId || '',
        userId: '',
        grade: 5,
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
                        Note (1-5)
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
