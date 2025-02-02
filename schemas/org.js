// Enums for city institutions
export const INSTITUTIONS = {
    BANK: 'bank',
    COURT: 'court',
    RESEARCH_LAB: 'research_lab',
    COUNCIL: 'council',
  };
  
  // Base institution schema
  const createInstitutionSchema = (type) => ({
    id: '',
    type,
    name: '',
    public_key: '',
    private_key: '',
    tax_collected: type === INSTITUTIONS.COUNCIL ? 0 : null, // Only council collects tax
    salary_paid: 0,
    total_balance: 0,
    employees: [], // Array of agent IDs
    created_at: null,
    updated_at: null,
  });
  
  // Validation functions
  export const validateInstitution = (institution) => {
    const errors = [];
  
    // Required fields
    if (!institution.id?.trim()) errors.push('ID is required');
    if (!institution.name?.trim()) errors.push('Name is required');
    if (!institution.public_key?.trim()) errors.push('Public key is required');
    if (!institution.private_key?.trim()) errors.push('Private key is required');
    if (!institution.type || !Object.values(INSTITUTIONS).includes(institution.type)) {
      errors.push('Valid institution type is required');
    }
  
    // Numeric validations
    if (institution.type === INSTITUTIONS.COUNCIL) {
      if (typeof institution.tax_collected !== 'number' || institution.tax_collected < 0) {
        errors.push('Tax collected must be a non-negative number for council');
      }
    } else if (institution.tax_collected !== null) {
      errors.push('Only council can collect tax');
    }
  
    if (typeof institution.salary_paid !== 'number' || institution.salary_paid < 0) {
      errors.push('Salary paid must be a non-negative number');
    }
    
    if (typeof institution.total_balance !== 'number') {
      errors.push('Total balance must be a number');
    }
  
    // Array validation
    if (!Array.isArray(institution.employees)) {
      errors.push('Employees must be an array');
    }
  
    // Date validations
    if (!(institution.created_at instanceof Date)) errors.push('Valid creation date is required');
    if (!(institution.updated_at instanceof Date)) errors.push('Valid update date is required');
  
    return {
      isValid: errors.length === 0,
      errors
    };
  };
  
  // Factory function to create a new institution
  export const createInstitution = (type, params = {}) => {
    if (!Object.values(INSTITUTIONS).includes(type)) {
      throw new Error(`Invalid institution type: ${type}`);
    }
  
    const now = new Date();
    const institution = {
      ...createInstitutionSchema(type),
      id: crypto.randomUUID(),
      created_at: now,
      updated_at: now,
      ...params
    };
  
    const { isValid, errors } = validateInstitution(institution);
    if (!isValid) {
      throw new Error(`Invalid institution: ${errors.join(', ')}`);
    }
  
    return institution;
  };
  
  // City schema
  export const createCity = (params = {}) => {
    const now = new Date();
    
    const city = {
      id: crypto.randomUUID(),
      name: '',
      institutions: {
        [INSTITUTIONS.BANK]: createInstitution(INSTITUTIONS.BANK, {
          name: 'Central Bank',
        }),
        [INSTITUTIONS.COURT]: createInstitution(INSTITUTIONS.COURT, {
          name: 'High Court',
        }),
        [INSTITUTIONS.RESEARCH_LAB]: createInstitution(INSTITUTIONS.RESEARCH_LAB, {
          name: 'Research Laboratory',
        }),
        [INSTITUTIONS.COUNCIL]: createInstitution(INSTITUTIONS.COUNCIL, {
          name: 'City Council',
        }),
      },
      total_population: 0,
      total_tax_collected: 0,
      total_salary_paid: 0,
      treasury_balance: 0,
      created_at: now,
      updated_at: now,
      ...params
    };
  
    return city;
  };
  
  // Helper functions
  export const calculateCityFinances = (city) => {
    city.total_tax_collected = city.institutions[INSTITUTIONS.COUNCIL].tax_collected;
    city.total_salary_paid = Object.values(city.institutions)
      .reduce((total, inst) => total + inst.salary_paid, 0);
    city.treasury_balance = city.total_tax_collected - city.total_salary_paid;
    
    return city;
  };
  
  export const addEmployeeToInstitution = (city, institutionType, employeeId) => {
    if (!city.institutions[institutionType]) {
      throw new Error(`Invalid institution type: ${institutionType}`);
    }
    
    // Check if employee is already assigned to any institution
    const isEmployeeAssigned = Object.values(city.institutions)
      .some(inst => inst.employees.includes(employeeId));
    
    if (isEmployeeAssigned) {
      throw new Error(`Employee ${employeeId} is already assigned to an institution`);
    }
    
    city.institutions[institutionType].employees.push(employeeId);
    city.institutions[institutionType].updated_at = new Date();
    
    return city;
  };
  
  // Example usage:
  /*
  const myCity = createCity({
    name: "Arca City",
  });
  
  // Add tax collection to council
  myCity.institutions[INSTITUTIONS.COUNCIL].tax_collected = 5000;
  
  // Update salaries
  myCity.institutions[INSTITUTIONS.BANK].salary_paid = 1000;
  myCity.institutions[INSTITUTIONS.COURT].salary_paid = 1200;
  myCity.institutions[INSTITUTIONS.RESEARCH_LAB].salary_paid = 1500;
  myCity.institutions[INSTITUTIONS.COUNCIL].salary_paid = 800;
  
  // Calculate city finances
  const updatedCity = calculateCityFinances(myCity);
  
  // Add employee to institution
  addEmployeeToInstitution(myCity, INSTITUTIONS.BANK, "employee-id-123");
  */
  