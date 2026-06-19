import { Organismo } from '../types';

export async function fetchOrganismos(): Promise<Organismo[]> {
  try {
    const response = await fetch('/api/organismos');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching or parsing data from backend proxy API:", error);
    throw error;
  }
}
