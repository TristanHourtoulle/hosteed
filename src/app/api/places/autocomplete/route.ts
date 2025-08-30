import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const input = searchParams.get('input');
    const types = searchParams.get('types') || '(cities)';
    const language = searchParams.get('language') || 'fr';
    const country = searchParams.get('country');
    const sessionToken = searchParams.get('sessionToken');

    console.log('Paramètres reçus:', { input, types, language, country, sessionToken });

    if (!input || input.length < 2) {
      return NextResponse.json({ error: 'Input trop court' }, { status: 400 });
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API;
    if (!apiKey) {
      console.error('Clé API manquante:', process.env.NEXT_PUBLIC_GOOGLE_PLACES_API);
      return NextResponse.json({ error: 'Clé API non configurée' }, { status: 500 });
    }

    const params = new URLSearchParams({
      input,
      types,
      language,
      key: apiKey,
      ...(country && { components: `country:${country}` }),
      ...(sessionToken && { sessiontoken: sessionToken })
    });

    const googleUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`;
    console.log('URL Google:', googleUrl.replace(apiKey, '***'));

    const response = await fetch(googleUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erreur HTTP Google:', response.status, errorText);
      throw new Error(`Erreur HTTP Google: ${response.status}`);
    }

    const data = await response.json();
    console.log('Réponse Google:', data);

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(`Erreur Google Places API: ${data.status} - ${data.error_message || 'Erreur inconnue'}`);
    }

    return NextResponse.json({
      status: data.status,
      predictions: data.predictions || []
    });

  } catch (error: unknown) {
    console.error('Erreur API Places:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    return NextResponse.json(
      { 
        error: 'Erreur lors de la récupération des suggestions',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}
