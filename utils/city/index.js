import { personalActions } from '../personal';

// City level functions
export const cityActions = {
  // Pay income tax
  payIncomeTax: async (privateKey, amount) => {
    const CITY_TREASURY = "0x..."; // Replace with actual treasury address
    try {
      return await personalActions.transfer(privateKey, CITY_TREASURY, amount);
    } catch (error) {
      throw new Error(`Income tax payment failed: ${error.message}`);
    }
  },

  // Pay birth registration tax
  payBirthTax: async (privateKey) => {
    const BIRTH_TAX_AMOUNT = "10"; // Example: 10 ARCA tokens
    const REGISTRY_ADDRESS = "0x..."; // Replace with actual registry address
    try {
      return await personalActions.transfer(privateKey, REGISTRY_ADDRESS, BIRTH_TAX_AMOUNT);
    } catch (error) {
      throw new Error(`Birth tax payment failed: ${error.message}`);
    }
  },

  // Pay salary to employee
  paySalary: async (privateKey, employeeAddress, amount) => {
    try {
      return await personalActions.transfer(privateKey, employeeAddress, amount);
    } catch (error) {
      throw new Error(`Salary payment failed: ${error.message}`);
    }
  },

  // Join organization (pay membership fee)
  joinOrganization: async (privateKey, organizationAddress, membershipFee) => {
    try {
      return await personalActions.transfer(privateKey, organizationAddress, membershipFee);
    } catch (error) {
      throw new Error(`Organization joining failed: ${error.message}`);
    }
  },

  // Pay property tax
  payPropertyTax: async (privateKey, amount) => {
    const PROPERTY_TAX_ADDRESS = "0x..."; // Replace with actual address
    try {
      return await personalActions.transfer(privateKey, PROPERTY_TAX_ADDRESS, amount);
    } catch (error) {
      throw new Error(`Property tax payment failed: ${error.message}`);
    }
  },

  // Pay reward or bonus to recipient
  payReward: async (privateKey, recipientAddress, amount, rewardType = 'general') => {
    try {
      const hash = await personalActions.transfer(privateKey, recipientAddress, amount);
      return {
        hash,
        details: {
          type: rewardType,
          recipient: recipientAddress,
          amount: amount,
          timestamp: Date.now()
        }
      };
    } catch (error) {
      throw new Error(`Reward payment failed: ${error.message}`);
    }
  }
};
