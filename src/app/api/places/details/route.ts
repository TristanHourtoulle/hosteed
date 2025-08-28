import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const placeId = searchParams.get('placeId');
    const fields = searchParams.get('fields') || 'place_id,name,formatted_address,geometry,address_components,types';
    const sessionToken = searchParams.get('sessionToken');

    if (!placeId) {
      return NextResponse.json({ error: 'Place ID requis' }, { status: 400 });
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API;
    if (!apiKey) {
      return NextResponse.json({ error: 'Clé API non configurée' }, { status: 500 });
    }

    const params = new URLSearchParams({
      place_id: placeId,
      fields,
      key: apiKey,
      ...(sessionToken && { sessiontoken: sessionToken })
    });

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== 'OK') {
      throw new Error(`Erreur Google Places API: ${data.status} - ${data.error_message || 'Erreur inconnue'}`);
    }

    return NextResponse.json({
      status: data.status,
      result: data.result
    });

  } catch (error: any) {
    console.error('Erreur API Places Details:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des détails du lieu' },
      { status: 500 }
    );
  }
}
