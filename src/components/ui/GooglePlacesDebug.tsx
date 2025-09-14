'use client';

import React, { useState } from 'react';

// Types pour les résultats de l'API Places
interface PlaceResult {
  structured_formatting?: {
    main_text?: string;
    secondary_text?: string;
  };
  description?: string;
}

// Type pour les résultats de test
interface TestResult {
  error?: string;
  [key: string]: unknown;
}

export default function GooglePlacesDebug() {
  const [input, setInput] = useState('');
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<TestResult | null>(null);

  const testBasicAPI = async () => {
    try {
      console.log('Test de la route de test...');
      
      const response = await fetch('/api/test');
      const data = await response.json();
      
      console.log('Route de test:', data);
      setTestResults(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      console.error('Erreur route de test:', err);
      setTestResults({ error: errorMessage });
    }
  };

  const testPlacesAPI = async () => {
    if (!input.trim()) return;
    
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      console.log('Test de l&apos;API Places avec:', input);
      
      const response = await fetch(`/api/places/autocomplete?input=${encodeURIComponent(input)}&types=(cities)&language=fr`);
      
      console.log('Réponse API Places:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Erreur ${response.status}: ${errorData.error || errorData.details || 'Erreur inconnue'}`);
      }
      
      const data = await response.json();
      console.log('Données reçues:', data);
      
      setResults(data.predictions || []);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      console.error('Erreur détaillée:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <h3 className="text-lg font-semibold mb-3">🔍 Debug Google Places API</h3>
      
      <div className="space-y-4">
        {/* Test de la route de base */}
        <div className="p-3 bg-blue-50 rounded">
          <h4 className="font-medium mb-2">🧪 Test de la route de base</h4>
          <button
            onClick={testBasicAPI}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
          >
            Tester route de base
          </button>
          {testResults && (
            <div className="mt-2 text-xs">
              <pre className="bg-white p-2 rounded overflow-auto">
                {JSON.stringify(testResults, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Test de l'API Places */}
        <div className="p-3 bg-green-50 rounded">
          <h4 className="font-medium mb-2">🌍 Test de l&apos;API Places (Madagascar)</h4>
          <div className="space-y-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tapez une ville (ex: Antananarivo, Toamasina)"
              className="w-full p-2 border rounded text-sm"
            />
            <button
              onClick={testPlacesAPI}
              disabled={loading || !input.trim()}
              className="px-3 py-1 bg-green-600 text-white rounded text-sm disabled:opacity-50"
            >
              {loading ? 'Test en cours...' : 'Tester API Places'}
            </button>
          </div>
        </div>

        {/* Affichage des erreurs */}
        {error && (
          <div className="p-3 bg-red-100 border border-red-300 rounded text-red-700">
            <strong>❌ Erreur :</strong> {error}
          </div>
        )}

        {/* Affichage des résultats */}
        {results.length > 0 && (
          <div className="p-3 bg-green-100 rounded">
            <h4 className="font-medium mb-2">✅ Résultats ({results.length})</h4>
            <div className="space-y-2">
              {results.map((result, index) => (
                <div key={index} className="p-2 bg-white rounded text-sm">
                  <div><strong>Ville:</strong> {result.structured_formatting?.main_text}</div>
                  <div><strong>Pays:</strong> {result.structured_formatting?.secondary_text}</div>
                  <div><strong>Description:</strong> {result.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Informations de debug */}
        <div className="text-xs text-gray-600 p-3 bg-gray-100 rounded">
          <p><strong>Variable d&apos;environnement:</strong> {process.env.NEXT_PUBLIC_GOOGLE_PLACES_API ? 'Configurée' : 'Non configurée'}</p>
          <p><strong>Note:</strong> Cette variable est utilisée côté serveur via les routes API</p>
          <p><strong>Variable utilisée:</strong> NEXT_PUBLIC_GOOGLE_PLACES_API</p>
        </div>
      </div>
    </div>
  );
}
