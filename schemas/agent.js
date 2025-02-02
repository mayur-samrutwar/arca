// Enums for agent properties
export const OCCUPATIONS = {
    RESEARCHER: 'researcher',
    BANKER: 'banker',
    JUDGE: 'judge',
    COUNCIL: 'council',
    UNEMPLOYED: 'unemployed',
  };
  
  export const TRAITS = {
    GREEDY: 'greedy',
    GENEROUS: 'generous',
    CAUTIOUS: 'cautious',
    RECKLESS: 'reckless',
    DIPLOMATIC: 'diplomatic',
    AGGRESSIVE: 'aggressive',
    INNOVATIVE: 'innovative',
    TRADITIONAL: 'traditional',
    COOPERATIVE: 'cooperative',
    COMPETITIVE: 'competitive',
    HONEST: 'honest',
    DECEPTIVE: 'deceptive',
    PATIENT: 'patient',
    IMPULSIVE: 'impulsive',
    ANALYTICAL: 'analytical',
  };
  
  export const GENDERS = {
    MALE: 'male',
    FEMALE: 'female',
    OTHER: 'other',
  };
  
  // Validation functions
  export const validateAgent = (agent) => {
    const errors = [];
  
    // Required fields
    if (!agent.name?.trim()) errors.push('Name is required');
    if (!agent.gender || !Object.values(GENDERS).includes(agent.gender)) errors.push('Valid gender is required');
    if (!agent.occupation || !Object.values(OCCUPATIONS).includes(agent.occupation)) errors.push('Valid occupation is required');
    if (!agent.public_key?.trim()) errors.push('Public key is required');
    if (!agent.private_key?.trim()) errors.push('Private key is required');
    
    // Initial balance validation
    if (typeof agent.initial_balance !== 'number' || agent.initial_balance < 0) {
      errors.push('Initial balance must be a non-negative number');
    }
  
    // Traits validation
    if (!Array.isArray(agent.traits) || agent.traits.length !== 3) {
      errors.push('Exactly 3 traits are required');
    } else {
      const uniqueTraits = new Set(agent.traits);
      if (uniqueTraits.size !== 3) errors.push('All traits must be unique');
      agent.traits.forEach(trait => {
        if (!Object.values(TRAITS).includes(trait)) errors.push(`Invalid trait: ${trait}`);
      });
    }
  
    // Date validations
    if (!(agent.date_of_birth instanceof Date)) errors.push('Valid date of birth is required');
    if (!(agent.expiry_date instanceof Date)) errors.push('Valid expiry date is required');
    if (agent.date_of_birth && agent.expiry_date && agent.date_of_birth >= agent.expiry_date) {
      errors.push('Expiry date must be after date of birth');
    }
  
    return {
      isValid: errors.length === 0,
      errors
    };
  };
  
  // Helper functions
  export const generateRandomTraits = () => {
    const traits = Object.values(TRAITS);
    const shuffled = traits.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  };
  
  export const isExpired = (agent) => {
    return Date.now() >= agent.expiry_date.getTime();
  };
  
  export const getAge = (agent) => {
    return Math.floor((Date.now() - agent.date_of_birth.getTime()) / (1000 * 60 * 60 * 24));
  };
  
  // Factory function to create a new agent
  export const createAgent = (params = {}) => {
    const now = new Date();
    const defaultExpiry = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000); //1 day from now
    const agent = {
      id: crypto.randomUUID(),
      name: '',
      gender: GENDERS.OTHER,
      occupation: OCCUPATIONS.UNEMPLOYED,
      public_key: '',
      private_key: '',
      initial_balance: 1000,
      traits: generateRandomTraits(),
      date_of_birth: now,
      expiry_date: defaultExpiry,
      created_at: now,
      updated_at: now,
      ...params
    };
  
    const { isValid, errors } = validateAgent(agent);
    if (!isValid) {
      throw new Error(`Invalid agent: ${errors.join(', ')}`);
    }
  
    return agent;
  };