import {
  GoogleSuggestionService,
  GooglePlacePrediction,
} from '@/lib/services/GoogleSuggestion.service';
global.fetch = jest.fn();

describe('GoogleSuggestionService', () => {
  let service: GoogleSuggestionService;

  beforeEach(() => {
    service = new GoogleSuggestionService();
    jest.clearAllMocks();
  });

  describe('Configuration', () => {
    it('devrait être configuré sans avertissement', () => {
      const service = new GoogleSuggestionService();
      expect(service).toBeDefined();
    });
  });

  describe('getCitySuggestions', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    it('devrait récupérer des suggestions de villes avec succès', async () => {
      const mockResponse = {
        status: 'OK',
        predictions: [
          {
            place_id: 'ChIJD7fiBh9u5kcRYJSMaMOCCwQ',
            description: 'Paris, France',
            structured_formatting: {
              main_text: 'Paris',
              secondary_text: 'France'
            },
            types: ['locality', 'political', 'geocode'],
            matched_substrings: [{ length: 5, offset: 0 }]
          }
        ]
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await service.getCitySuggestions({
        input: 'Paris',
        types: ['(cities)'],
        language: 'fr'
      });

      expect(result).toEqual(mockResponse.predictions);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('input=Paris'),
        expect.any(Object)
      );
    });

    it('devrait gérer les erreurs HTTP', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 429
      });

      await expect(service.getCitySuggestions({
        input: 'Paris'
      })).rejects.toThrow('Erreur HTTP: 429');
    });

    it('devrait gérer les erreurs de l\'API Google', async () => {
      const mockResponse = {
        status: 'REQUEST_DENIED',
        error_message: 'API key not valid'
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      await expect(service.getCitySuggestions({
        input: 'Paris'
      })).rejects.toThrow('Erreur Google Places API: REQUEST_DENIED - API key not valid');
    });

    it('devrait retourner un tableau vide pour ZERO_RESULTS', async () => {
      const mockResponse = {
        status: 'ZERO_RESULTS',
        predictions: []
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await service.getCitySuggestions({
        input: 'VilleInexistante'
      });

      expect(result).toEqual([]);
    });
  });

  describe('getPlaceDetails', () => {
    beforeEach(() => {
      // Mock fetch pour les tests
      global.fetch = jest.fn();
    });

    it('devrait récupérer les détails d\'un lieu avec succès', async () => {
      const mockResponse = {
        status: 'OK',
        result: {
          place_id: 'ChIJD7fiBh9u5kcRYJSMaMOCCwQ',
          name: 'Paris',
          formatted_address: 'Paris, France',
          geometry: {
            location: { lat: 48.8566, lng: 2.3522 },
            viewport: {
              northeast: { lat: 48.9021, lng: 2.4699 },
              southwest: { lat: 48.8156, lng: 2.2241 }
            }
          },
          address_components: [],
          types: ['locality', 'political', 'geocode']
        }
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await service.getPlaceDetails({
        placeId: 'ChIJD7fiBh9u5kcRYJSMaMOCCwQ'
      });

      expect(result).toEqual(mockResponse.result);
    });
  });

  describe('Méthodes utilitaires', () => {
    it('devrait extraire le nom de la ville correctement', () => {
      const prediction: GooglePlacePrediction = {
        place_id: 'test',
        description: 'Paris, France',
        structured_formatting: {
          main_text: 'Paris',
          secondary_text: 'France'
        },
        types: ['locality'],
        matched_substrings: []
      };

      const cityName = service.extractCityName(prediction);
      expect(cityName).toBe('Paris');
    });

    it('devrait extraire le pays correctement', () => {
      const prediction: GooglePlacePrediction = {
        place_id: 'test',
        description: 'Paris, France',
        structured_formatting: {
          main_text: 'Paris',
          secondary_text: 'France'
        },
        types: ['locality'],
        matched_substrings: []
      };

      const country = service.extractCountry(prediction);
      expect(country).toBe('France');
    });

    it('devrait identifier correctement une ville', () => {
      const cityPrediction: GooglePlacePrediction = {
        place_id: 'test',
        description: 'Paris, France',
        structured_formatting: {
          main_text: 'Paris',
          secondary_text: 'France'
        },
        types: ['locality'],
        matched_substrings: []
      };

      const isCity = service.isCity(cityPrediction);
      expect(isCity).toBe(true);
    });

    it('devrait générer un token de session unique', () => {
      const token1 = service.generateSessionToken();
      const token2 = service.generateSessionToken();

      expect(token1).toBeDefined();
      expect(token2).toBeDefined();
      expect(token1).not.toBe(token2);
    });
  });

  describe('Méthodes spécialisées', () => {
    beforeEach(() => {
      // Mock fetch pour les tests
      global.fetch = jest.fn();
    });

    it('devrait filtrer les suggestions par pays', async () => {
      const mockResponse = {
        status: 'OK',
        predictions: []
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      await service.getCitySuggestionsByCountry('Lyon', 'FR');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('components=country:FR'),
        expect.any(Object)
      );
    });

    it('devrait filtrer les suggestions par type', async () => {
      const mockResponse = {
        status: 'OK',
        predictions: []
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      await service.getSuggestionsByType('Lyon', ['(cities)', 'locality']);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('types=(cities)|locality'),
        expect.any(Object)
      );
    });
  });
});
