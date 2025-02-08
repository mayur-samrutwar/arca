import { generateAgentWallet, generateETHKeys } from '../utils/generate-key';

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
    if (!agent.wallet_address?.trim()) errors.push('Wallet address is required');
    
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
  export const createAgent = async (params = {}) => {
    try {
      const now = new Date();
      const defaultExpiry = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000); //1 day from now
      
      let walletAddress;
      
      try {
        // Try CDP wallet first
        const { address } = await generateAgentWallet();
        walletAddress = address;
        console.log("walletAddress - agentkit", walletAddress);
      } catch (error) {
        console.warn('CDP wallet generation failed, falling back to ethers:', error);
        // Fallback to ethers wallet if CDP fails
        const { address } = generateETHKeys();
        walletAddress = address;
        console.log("walletAddress - ethers", walletAddress);
      }

      const agent = {
        id: crypto.randomUUID(),
        name: '',
        gender: GENDERS.OTHER,
        occupation: OCCUPATIONS.UNEMPLOYED,
        wallet_address: walletAddress,
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
    } catch (error) {
      console.error('Failed to create agent:', error);
      throw error;
    }
  };