// City schema
export const CITY_DEFAULTS = {
  MIN_POPULATION: 0,
  MAX_POPULATION: 10,
  INITIAL_POPULATION: 0,
};

// Validation functions
export const validateCity = (city) => {
  const errors = [];

  // Required fields
  if (!city.id?.trim()) errors.push('ID is required');
  if (!city.name?.trim()) errors.push('Name is required');

  // Population validations
  if (typeof city.current_population !== 'number' || city.current_population < CITY_DEFAULTS.MIN_POPULATION) {
    errors.push('Current population must be a non-negative number');
  }

  if (typeof city.max_population !== 'number' || city.max_population <= CITY_DEFAULTS.MIN_POPULATION) {
    errors.push('Max population must be a positive number');
  }

  if (city.current_population > city.max_population) {
    errors.push('Current population cannot exceed max population');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Factory function to create a new city
export const createCity = (params = {}) => {
  const now = new Date();
  
  const city = {
    id: crypto.randomUUID(),
    name: '',
    current_population: CITY_DEFAULTS.INITIAL_POPULATION,
    max_population: CITY_DEFAULTS.MAX_POPULATION,
    created_at: now,
    updated_at: now,
    ...params
  };

  const { isValid, errors } = validateCity(city);
  if (!isValid) {
    throw new Error(`Invalid city: ${errors.join(', ')}`);
  }

  return city;
};

// Helper functions
export const isAtCapacity = (city) => {
  return city.current_population >= city.max_population;
};

export const getPopulationPercentage = (city) => {
  return (city.current_population / city.max_population) * 100;
};

export const canAddPopulation = (city, amount) => {
  return (city.current_population + amount) <= city.max_population;
};

// Example usage:
/*
const newCity = createCity({
  name: "Arca City",
  max_population: 5000
});

const atCapacity = isAtCapacity(newCity);
const populationPercentage = getPopulationPercentage(newCity);
const canAdd100 = canAddPopulation(newCity, 100);
*/
