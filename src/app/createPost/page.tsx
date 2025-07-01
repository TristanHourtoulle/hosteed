'use client'// Page de création de post : permet d'ajouter un titre, des images et un contenu formaté en Markdown avec prévisualisation.
import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import MDEditor from '@uiw/react-md-editor';
import {createPost} from "@/lib/services/post.service";

export default function CreatePostPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<File[]>([]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const req = await createPost(title, content);
    console.log(req)
    alert('Post créé ! (fonctionnalité à implémenter)');
  };

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: 24 }}>
      <h1>Créer un post</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <label>
          Titre
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          />
        </label>
        <label>
          Images
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            style={{ marginTop: 4 }}
          />
        </label>
        <label>
          Contenu (Markdown)
          <div data-color-mode="light">
            <MDEditor
              value={content}
              onChange={setContent}
              height={300}
              style={{ marginTop: 4 }}
            />
          </div>
        </label>
        <button type="submit">Créer le post</button>
      </form>
      {images.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <h3>Images sélectionnées :</h3>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {images.map((img, idx) => (
              <img
                key={idx}
                src={URL.createObjectURL(img)}
                alt={`upload-${idx}`}
                style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 8 }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
