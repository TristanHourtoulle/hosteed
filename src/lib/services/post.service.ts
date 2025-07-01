'use server'
import {prisma} from "@/lib/prisma";

export async function createPost(title: string, content: string, image?: string) {
    try {
        return await prisma.post.create({
            data: {
                title,
                content,
                image: image ? image : null,
            }
        });
    } catch (e) {
        console.error(e)
        return e;
    }
}

export async function getPost() {
    try {
        const req = await prisma.post.findMany();
        if (req) return req;
    } catch (e) {
        console.error(e)
        return e;
    }
}
