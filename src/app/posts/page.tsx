"use client"
import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { getPost } from "@/lib/services/post.service";

const ReactMarkdown = dynamic(() => import("react-markdown"), { ssr: false });

export default function PostsPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPosts() {
      const res = await getPost();
      if (Array.isArray(res)) {
        setPosts(res);
      } else {
        setPosts([]);
      }
      setLoading(false);
    }
    fetchPosts();
  }, []);

  if (loading) return <div>Chargement des posts...</div>;

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 24 }}>
      <h1>Liste des posts</h1>
      {posts.length === 0 && <p>Aucun post trouvé.</p>}
      {posts.map((post) => (
        <div key={post.id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16, marginBottom: 24, background: "#fff" }}>
          <h2>{post.title}</h2>
          {post.image && (
            <img src={post.image} alt={post.title} style={{ maxWidth: 300, borderRadius: 8, marginBottom: 12 }} />
          )}
          <div style={{ marginTop: 12 }}>
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </div>
        </div>
      ))}
    </div>
  );
} 