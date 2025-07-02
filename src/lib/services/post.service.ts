'use server'
import prisma from '@/lib/prisma'

export async function createPost(title: string, content: string, image?: string) {
    try {
        const data: any = {
            title,
            content,
        };
        
        if (image) {
            data.image = image;
        }
        
        return await prisma.post.create({
            data
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

export async function getPostById(id: string) {
    try {
        const req = await prisma.post.findFirst({
            where: {
                id: id
            }
        });
        if (req) return req;
    } catch (e) {
        console.error(e)
        return e;
    }
}

export async function updatePost(id: string, title?: string, content?: string, image?: string) {
    try {
        const updateData: any = {};
        
        if (title !== undefined) updateData.title = title;
        if (content !== undefined) updateData.content = content;
        if (image !== undefined) updateData.image = image || undefined;
        
        const req = await prisma.post.update({
            where: {
                id: id
            },
            data: updateData
        });
        
        return req;
    } catch (e) {
        console.error(e)
        return e;
    }
}

export async function deletePost(id: string) {
    try {
        const req = await prisma.post.delete({
            where: {
                id: id
            }
        });
    } catch (e) {
        console.error(e)
        return e;
    }
}


