// utils/locationParser.js
export const parseLocation = (location) => {
  if (!location) return 'Location not specified';
  
  if (typeof location === 'string') {
    try {
      const parsed = JSON.parse(location);
      if (parsed.address) return parsed.address;
      if (parsed.coordinates) return `Coordinates: ${parsed.coordinates[1]}, ${parsed.coordinates[0]}`;
    } catch {
      return location;
    }
  }
  
  if (typeof location === 'object') {
    if (location.address) return location.address;
    if (location.coordinates) return `Coordinates: ${location.coordinates[1]}, ${location.coordinates[0]}`;
  }
  
  return 'Location not specified';
};