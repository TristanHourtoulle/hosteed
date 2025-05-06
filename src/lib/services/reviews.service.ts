'use server'
import {prisma} from "@/lib/prisma";
import {error} from "next/dist/build/output/log";

export async function findAllReviews() {
    try {
        return await prisma.review.findMany();
    } catch (error) {
        console.error("Erreur lors de la recherche des avis:", error);
        return null;
    }
}
export async function createReview(params: {
    productId: string,
    rentId: string
    userId: string,
    grade: number,
    title: string,
    text: string,
    visitingDate: Date,
    publishDate: Date,
}) {
    try {
        const rent = await prisma.rent.findUnique({where: {id: params.rentId}});
        if (!rent) return error("No rent find");
        const user = await prisma.user.findUnique({where: {id: params.userId}});
        if (!user) return error("No user find");

        const review = await prisma.review.create({
            data: {
                title: params.title,
                text: params.text,
                product: {connect: {id: params.productId}},
                rentRelation: {connect: {id: params.rentId}},
                grade: params.grade,
                visitDate: params.visitingDate,
                publishDate: params.publishDate
            }
        })
        if (!review) return error("Error while creation of the review");
        return review;
    } catch (e) {
        console.error("Error: ", e);
        return error("Error: ", e);
    }
}
