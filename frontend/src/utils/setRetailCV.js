/**
 * Utility function to set a retail management CV in local storage
 * This can be run in the browser console to manually set CV data
 */

function setRetailManagementCV() {
  // Create a retail management CV
  const retailCV = {
    name: "Retail Manager",
    jobRole: "retail manager",
    target_job: "retail management",
    skills: [
      "team leadership",
      "customer service",
      "inventory management",
      "sales operations",
      "staff training",
      "merchandising",
      "retail operations",
      "conflict resolution",
      "scheduling",
      "loss prevention"
    ],
    experience: [
      "5 years of retail management experience",
      "Led teams of 15-20 associates",
      "Increased sales by 15% year-over-year",
      "Implemented new inventory management system",
      "Reduced shrinkage by 20%"
    ],
    education: [
      "Bachelor's Degree in Business Administration",
      "Retail Management Certificate"
    ],
    industry: "retail",
    summary: "Experienced retail manager with a proven track record of increasing sales, improving operational efficiency, and developing high-performing teams."
  };

  // Save to localStorage
  localStorage.setItem('cvAnalysis', JSON.stringify(retailCV));
  
  // Log success message
  console.log('Retail Management CV has been set in localStorage.');
  console.log('CV Data:', retailCV);
  console.log('To verify, check localStorage.getItem("cvAnalysis")');
  
  return retailCV;
}

// Export the function
export default setRetailManagementCV;
