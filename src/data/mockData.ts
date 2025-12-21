// Mock data for labs
export interface Lab {
  id: string;
  name: string;
  city: string;
  branches: string[];
  discount: number;
  rating: number;
  reviewCount: number;
  image: string;
  popularTests: string[];
  description: string;
}

export interface Test {
  id: string;
  name: string;
  category: string;
  description: string;
}

export interface LabTest {
  labId: string;
  testId: string;
  originalPrice: number;
}

export const labs: Lab[] = [
  {
    id: "1",
    name: "Chughtai Lab",
    city: "Lahore",
    branches: ["Gulberg", "DHA", "Model Town", "Johar Town", "Bahria Town"],
    discount: 25,
    rating: 4.8,
    reviewCount: 12500,
    image: "/placeholder.svg",
    popularTests: ["CBC", "Lipid Profile", "Thyroid Profile", "HbA1c"],
    description: "Pakistan's leading diagnostic laboratory with state-of-the-art equipment and ISO certification."
  },
  {
    id: "2",
    name: "Shaukat Khanum Lab",
    city: "Lahore",
    branches: ["Main Campus", "Peshawar", "Karachi"],
    discount: 20,
    rating: 4.9,
    reviewCount: 8900,
    image: "/placeholder.svg",
    popularTests: ["Cancer Markers", "Genetic Testing", "Histopathology"],
    description: "World-class cancer research and diagnostic facility with international accreditation."
  },
  {
    id: "3",
    name: "Excel Labs",
    city: "Karachi",
    branches: ["Clifton", "Gulshan", "PECHS", "North Nazimabad"],
    discount: 30,
    rating: 4.6,
    reviewCount: 6700,
    image: "/placeholder.svg",
    popularTests: ["Vitamin D", "Iron Studies", "Liver Function", "Kidney Function"],
    description: "Leading diagnostic center in Karachi with quick turnaround times."
  },
  {
    id: "4",
    name: "IDC Labs",
    city: "Islamabad",
    branches: ["F-8", "G-9", "Blue Area", "Rawalpindi"],
    discount: 22,
    rating: 4.7,
    reviewCount: 5400,
    image: "/placeholder.svg",
    popularTests: ["Allergy Panel", "Hormone Profile", "Diabetes Panel"],
    description: "Islamabad's trusted diagnostic partner with comprehensive test menu."
  },
  {
    id: "5",
    name: "Aga Khan Lab",
    city: "Karachi",
    branches: ["Main Hospital", "Stadium Road", "Hyderabad"],
    discount: 15,
    rating: 4.9,
    reviewCount: 15200,
    image: "/placeholder.svg",
    popularTests: ["Molecular Diagnostics", "Microbiology", "Cytology"],
    description: "International standard laboratory services with expert pathologists."
  },
  {
    id: "6",
    name: "Dr. Essa Lab",
    city: "Karachi",
    branches: ["Bahadurabad", "Nazimabad", "Malir", "Korangi"],
    discount: 35,
    rating: 4.5,
    reviewCount: 4200,
    image: "/placeholder.svg",
    popularTests: ["CBC", "Urine R/E", "Blood Sugar", "Uric Acid"],
    description: "Affordable quality diagnostics serving Karachi for over 30 years."
  }
];

export const tests: Test[] = [
  { id: "t1", name: "Complete Blood Count (CBC)", category: "Hematology", description: "Measures different components of blood" },
  { id: "t2", name: "Lipid Profile", category: "Biochemistry", description: "Measures cholesterol and triglycerides" },
  { id: "t3", name: "Thyroid Profile (T3, T4, TSH)", category: "Hormones", description: "Evaluates thyroid function" },
  { id: "t4", name: "HbA1c", category: "Diabetes", description: "Average blood sugar over 3 months" },
  { id: "t5", name: "Liver Function Test (LFT)", category: "Biochemistry", description: "Assesses liver health" },
  { id: "t6", name: "Kidney Function Test (KFT)", category: "Biochemistry", description: "Evaluates kidney performance" },
  { id: "t7", name: "Vitamin D (25-OH)", category: "Vitamins", description: "Measures vitamin D levels" },
  { id: "t8", name: "Vitamin B12", category: "Vitamins", description: "Measures B12 levels" },
  { id: "t9", name: "Iron Studies", category: "Hematology", description: "Complete iron panel" },
  { id: "t10", name: "Urine Routine (R/E)", category: "Urinalysis", description: "General urine examination" },
  { id: "t11", name: "Blood Sugar Fasting", category: "Diabetes", description: "Fasting glucose level" },
  { id: "t12", name: "Blood Sugar Random", category: "Diabetes", description: "Random glucose level" },
  { id: "t13", name: "Uric Acid", category: "Biochemistry", description: "Measures uric acid in blood" },
  { id: "t14", name: "ESR", category: "Hematology", description: "Erythrocyte sedimentation rate" },
  { id: "t15", name: "CRP", category: "Immunology", description: "C-reactive protein for inflammation" },
  { id: "t16", name: "Dengue NS1 Antigen", category: "Serology", description: "Dengue virus detection" },
  { id: "t17", name: "Typhoid (Widal Test)", category: "Serology", description: "Typhoid fever detection" },
  { id: "t18", name: "Hepatitis B Surface Antigen", category: "Serology", description: "HBsAg screening" },
  { id: "t19", name: "Hepatitis C Antibody", category: "Serology", description: "Anti-HCV screening" },
  { id: "t20", name: "COVID-19 PCR", category: "Molecular", description: "SARS-CoV-2 detection" },
];

export const labTests: LabTest[] = [
  // Chughtai Lab prices
  { labId: "1", testId: "t1", originalPrice: 850 },
  { labId: "1", testId: "t2", originalPrice: 2200 },
  { labId: "1", testId: "t3", originalPrice: 3500 },
  { labId: "1", testId: "t4", originalPrice: 1800 },
  { labId: "1", testId: "t5", originalPrice: 2800 },
  { labId: "1", testId: "t6", originalPrice: 2400 },
  { labId: "1", testId: "t7", originalPrice: 3200 },
  { labId: "1", testId: "t8", originalPrice: 2800 },
  { labId: "1", testId: "t9", originalPrice: 2600 },
  { labId: "1", testId: "t10", originalPrice: 450 },
  // Shaukat Khanum prices
  { labId: "2", testId: "t1", originalPrice: 900 },
  { labId: "2", testId: "t2", originalPrice: 2400 },
  { labId: "2", testId: "t3", originalPrice: 3800 },
  { labId: "2", testId: "t4", originalPrice: 2000 },
  { labId: "2", testId: "t5", originalPrice: 3000 },
  { labId: "2", testId: "t6", originalPrice: 2600 },
  { labId: "2", testId: "t7", originalPrice: 3500 },
  { labId: "2", testId: "t8", originalPrice: 3000 },
  { labId: "2", testId: "t9", originalPrice: 2800 },
  { labId: "2", testId: "t10", originalPrice: 500 },
  // Excel Labs prices
  { labId: "3", testId: "t1", originalPrice: 750 },
  { labId: "3", testId: "t2", originalPrice: 1900 },
  { labId: "3", testId: "t3", originalPrice: 3200 },
  { labId: "3", testId: "t4", originalPrice: 1600 },
  { labId: "3", testId: "t5", originalPrice: 2500 },
  { labId: "3", testId: "t6", originalPrice: 2200 },
  { labId: "3", testId: "t7", originalPrice: 2900 },
  { labId: "3", testId: "t8", originalPrice: 2500 },
  { labId: "3", testId: "t9", originalPrice: 2300 },
  { labId: "3", testId: "t10", originalPrice: 400 },
  // IDC Labs prices
  { labId: "4", testId: "t1", originalPrice: 800 },
  { labId: "4", testId: "t2", originalPrice: 2100 },
  { labId: "4", testId: "t3", originalPrice: 3400 },
  { labId: "4", testId: "t4", originalPrice: 1700 },
  { labId: "4", testId: "t5", originalPrice: 2700 },
  { labId: "4", testId: "t6", originalPrice: 2300 },
  { labId: "4", testId: "t7", originalPrice: 3100 },
  { labId: "4", testId: "t8", originalPrice: 2700 },
  { labId: "4", testId: "t9", originalPrice: 2500 },
  { labId: "4", testId: "t10", originalPrice: 420 },
  // Aga Khan prices
  { labId: "5", testId: "t1", originalPrice: 1000 },
  { labId: "5", testId: "t2", originalPrice: 2600 },
  { labId: "5", testId: "t3", originalPrice: 4000 },
  { labId: "5", testId: "t4", originalPrice: 2200 },
  { labId: "5", testId: "t5", originalPrice: 3200 },
  { labId: "5", testId: "t6", originalPrice: 2800 },
  { labId: "5", testId: "t7", originalPrice: 3800 },
  { labId: "5", testId: "t8", originalPrice: 3200 },
  { labId: "5", testId: "t9", originalPrice: 3000 },
  { labId: "5", testId: "t10", originalPrice: 550 },
  // Dr. Essa Lab prices
  { labId: "6", testId: "t1", originalPrice: 650 },
  { labId: "6", testId: "t2", originalPrice: 1700 },
  { labId: "6", testId: "t3", originalPrice: 2800 },
  { labId: "6", testId: "t4", originalPrice: 1400 },
  { labId: "6", testId: "t5", originalPrice: 2200 },
  { labId: "6", testId: "t6", originalPrice: 1900 },
  { labId: "6", testId: "t7", originalPrice: 2600 },
  { labId: "6", testId: "t8", originalPrice: 2200 },
  { labId: "6", testId: "t9", originalPrice: 2000 },
  { labId: "6", testId: "t10", originalPrice: 350 },
];

export const getLabById = (id: string): Lab | undefined => labs.find(lab => lab.id === id);

export const getTestsForLab = (labId: string) => {
  const lab = getLabById(labId);
  if (!lab) return [];
  
  return labTests
    .filter(lt => lt.labId === labId)
    .map(lt => {
      const test = tests.find(t => t.id === lt.testId);
      if (!test) return null;
      const discountedPrice = lt.originalPrice * (1 - lab.discount / 100);
      return {
        ...test,
        originalPrice: lt.originalPrice,
        discountedPrice: Math.round(discountedPrice),
        discount: lab.discount
      };
    })
    .filter(Boolean);
};

export const generateUniqueId = (): string => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `MEDI-${year}-${random}`;
};
