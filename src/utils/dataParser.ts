import { Organismo } from '../types';
import { apiUrl } from '../lib/api';

export async function fetchOrganismos(): Promise<Organismo[]> {
  try {
    const response = await fetch(apiUrl('/api/organismos'));
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching or parsing data from backend proxy API:", error);
    throw error;
  }
}
