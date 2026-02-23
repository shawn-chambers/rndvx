import { PlaceSuggestion } from '@rndvx/types';

// Stub implementation — replace with Google Places API or similar when ready.
// Interface is intentionally stable so the frontend/controller contract won't change.

const MOCK_PLACES: PlaceSuggestion[] = [
  {
    placeId: 'mock-place-1',
    name: 'The Coffee House',
    address: '123 Main St, Springfield',
    lat: 37.7749,
    lng: -122.4194,
    types: ['cafe', 'food'],
  },
  {
    placeId: 'mock-place-2',
    name: 'Riverside Park',
    address: '456 River Rd, Springfield',
    lat: 37.7739,
    lng: -122.4312,
    types: ['park', 'outdoors'],
  },
  {
    placeId: 'mock-place-3',
    name: 'The Board Room',
    address: '789 Oak Ave, Springfield',
    lat: 37.7751,
    lng: -122.4183,
    types: ['bar', 'food'],
  },
];

/**
 * Search for places matching a query string.
 * Stub: returns filtered mock data. Replace with real API call.
 */
export async function searchPlaces(query: string): Promise<PlaceSuggestion[]> {
  const q = query.toLowerCase();
  return MOCK_PLACES.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.address.toLowerCase().includes(q) ||
      p.types?.some((t) => t.includes(q)),
  );
}

/**
 * Get details for a specific place by ID.
 * Stub: looks up mock data. Replace with real API call.
 */
export async function getPlaceDetails(placeId: string): Promise<PlaceSuggestion> {
  const place = MOCK_PLACES.find((p) => p.placeId === placeId);
  if (!place) {
    throw Object.assign(new Error('Place not found'), { status: 404 });
  }
  return place;
}

/**
 * Auto-pick a location for a meeting based on members' preferences/history.
 * Stub: returns the first mock place. Replace with real scoring logic.
 */
export async function autoPickLocation(meetingId: string): Promise<PlaceSuggestion> {
  // Future: fetch vote tallies, member preferences, proximity data, etc.
  void meetingId;
  return MOCK_PLACES[0];
}
