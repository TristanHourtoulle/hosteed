'use server'
import {prisma} from "@/lib/prisma";
import {error} from "next/dist/build/output/log";
import {findAllUserByRoles} from "@/lib/services/user.service";
import {sendTemplatedMail} from "@/lib/services/sendTemplatedMail";

export async function findAllReviews() {
    try {
        return await prisma.review.findMany();
    } catch (error) {
        console.error("Erreur lors de la recherche des avis:", error);
        return null;
    }
}

export async function findAllWaitingReview() {
    try {
        return await prisma.review.findMany({
            where: {
                approved: false,
            }
        });
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
                publishDate: params.publishDate,
                approved: false,
            }
        })
        if (!review) return error("Error while creation of the review");
        const admin = await findAllUserByRoles('ADMIN');
        admin?.map(async (user) => {
            await sendTemplatedMail(
                user.email,
                'Nouvel avis posté !',
                'validation-avis.html',
                {
                    reviewUrl: (process.env.NEXTAUTH_URL + '/avis/' + review.id),
                }
            );
        })
        return review;
    } catch (e) {
        console.error("Error: ", e);
        return error("Error: ", e);
    }
}

export async function approveReview(id: string) {
    try {
        const review = await prisma.review.update({
            where: {id},
            data: {
                approved: true,
            },
            include: {
                rentRelation: {
                    include: {
                        product: {
                            include: {
                                user: true,
                            }
                        },
                    }
                }
            }
        })
        console.log(review);
        if (!review || !review.rentRelation || !review.rentRelation.product) throw Error('No review found or impossible to update');
        const user = review.rentRelation.product.user;
        console.log(user);
        if (!user) throw Error('No user found');
        user.map(async (userSend) => {
            await sendTemplatedMail(
                userSend.email,
                'Nouvel avis posté !',
                'new-review.html',
                {
                    reviewUrl: (process.env.NEXTAUTH_URL + '/product/' + review.rentRelation.product.id),
                }
            );
        })
    } catch (e) {
        console.error(e);
        return null;
    }
}
export async function deleteReview(id: string) {
    try {
        const request = await prisma.review.delete({
            where: {id}
        });
        if (!request) throw Error('Error during delete review');
    } catch (e) {
        console.error(e);
        return null;
    }
}
