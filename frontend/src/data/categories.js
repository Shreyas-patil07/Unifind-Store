/**
 * Product Categories Configuration
 * Core categories structure for the marketplace
 */

export const categories = [
  "All",
  "Books",
  "Digital Notes",
  "Lab & Practical",
  "Stationery & Tools",
  "Electronics",
  "Furniture & Hostel"
];

// Detailed category structure with subcategories
export const categoryDetails = {
  "Books": {
    icon: "📚",
    subcategories: [
      "Semester textbooks",
      "Reference books",
      "GATE / entrance prep books",
      "Novels / general reading"
    ]
  },
  "Digital Notes": {
    icon: "📄",
    description: "(original only)",
    subcategories: [
      "Handwritten notes",
      "Typed summaries",
      "Revision sheets"
    ]
  },
  "Lab & Practical": {
    icon: "🧪",
    subcategories: [
      "Lab manuals",
      "Lab journals / records",
      "Lab coats",
      "Safety gear"
    ]
  },
  "Stationery & Tools": {
    icon: "🧮",
    subcategories: [
      "Calculators (scientific / graphing)",
      "Geometry kits",
      "Engineering drawing tools"
    ]
  },
  "Electronics": {
    icon: "💻",
    subcategories: [
      "Laptops / PCs",
      "Smartphones",
      "Routers / dongles",
      "Printers / monitors",
      "USB gadgets"
    ]
  },
  "Furniture & Hostel": {
    icon: "🛏️",
    subcategories: [
      "Beds / tables / chairs",
      "Mattress / pillows",
      "Cupboards / lockers",
      "Cycles"
    ]
  }
};

// Condition options
export const conditions = [
  "Like New",
  "Excellent",
  "Good",
  "Fair"
];
