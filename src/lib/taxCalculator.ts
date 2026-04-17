import Decimal from 'decimal.js';
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

// ✅ FIXED: Comprehensive HSN rate table (top 100 codes)
export const HSN_RATES: Record<string, { igst: number; cgst: number; sgst: number; description: string }> = {
  // Services (SAC codes)
  '9983': { igst: 18, cgst: 9, sgst: 9, description: 'IT/Software/SaaS Services' },
  '9984': { igst: 18, cgst: 9, sgst: 9, description: 'Telecom Services' },
  '9985': { igst: 18, cgst: 9, sgst: 9, description: 'Support Services' },
  '9971': { igst: 18, cgst: 9, sgst: 9, description: 'Financial Services' },
  '9961': { igst: 5,  cgst: 2.5, sgst: 2.5, description: 'Retail Trade Services' },
  '9954': { igst: 18, cgst: 9, sgst: 9, description: 'Construction Services' },
  '9972': { igst: 18, cgst: 9, sgst: 9, description: 'Real Estate Services' },
  '9973': { igst: 18, cgst: 9, sgst: 9, description: 'Leasing/Rental Services' },
  '9992': { igst: 18, cgst: 9, sgst: 9, description: 'Education Services' },
  '9993': { igst: 5,  cgst: 2.5, sgst: 2.5, description: 'Health Services' },
  '9991': { igst: 0,  cgst: 0, sgst: 0, description: 'Government Services' },
  '9994': { igst: 18, cgst: 9, sgst: 9, description: 'Sewage/Waste Services' },
  '9995': { igst: 18, cgst: 9, sgst: 9, description: 'Entertainment Services' },
  '9996': { igst: 18, cgst: 9, sgst: 9, description: 'Cultural/Sporting Services' },
  '9997': { igst: 18, cgst: 9, sgst: 9, description: 'Other Services' },
  // Electronics & IT
  '8471': { igst: 18, cgst: 9, sgst: 9, description: 'Computers & Peripherals' },
  '8517': { igst: 18, cgst: 9, sgst: 9, description: 'Phones & Communication' },
  '8528': { igst: 28, cgst: 14, sgst: 14, description: 'Monitors & Projectors' },
  '8443': { igst: 18, cgst: 9, sgst: 9, description: 'Printers & Copiers' },
  '8544': { igst: 18, cgst: 9, sgst: 9, description: 'Cables & Wires' },
  '8536': { igst: 18, cgst: 9, sgst: 9, description: 'Electrical Switches' },
  '8507': { igst: 18, cgst: 9, sgst: 9, description: 'Batteries' },
  '8518': { igst: 18, cgst: 9, sgst: 9, description: 'Speakers & Microphones' },
  '8523': { igst: 18, cgst: 9, sgst: 9, description: 'Storage Media' },
  // Vehicles
  '8703': { igst: 28, cgst: 14, sgst: 14, description: 'Motor Cars' },
  '8711': { igst: 28, cgst: 14, sgst: 14, description: 'Motorcycles' },
  '8714': { igst: 18, cgst: 9, sgst: 9, description: 'Vehicle Parts' },
  '8708': { igst: 28, cgst: 14, sgst: 14, description: 'Auto Parts' },
  // Machinery
  '8421': { igst: 18, cgst: 9, sgst: 9, description: 'Filtering Machinery' },
  '8422': { igst: 18, cgst: 9, sgst: 9, description: 'Dishwashers & Packing Machines' },
  '8450': { igst: 18, cgst: 9, sgst: 9, description: 'Washing Machines' },
  '8415': { igst: 28, cgst: 14, sgst: 14, description: 'Air Conditioners' },
  '8418': { igst: 12, cgst: 6, sgst: 6, description: 'Refrigerators' },
  '8516': { igst: 18, cgst: 9, sgst: 9, description: 'Electric Heaters & Ovens' },
  // Food & Agriculture
  '1001': { igst: 0,  cgst: 0, sgst: 0, description: 'Wheat' },
  '1006': { igst: 0,  cgst: 0, sgst: 0, description: 'Rice' },
  '0901': { igst: 5,  cgst: 2.5, sgst: 2.5, description: 'Coffee' },
  '0902': { igst: 5,  cgst: 2.5, sgst: 2.5, description: 'Tea' },
  '1701': { igst: 5,  cgst: 2.5, sgst: 2.5, description: 'Sugar' },
  '1507': { igst: 5,  cgst: 2.5, sgst: 2.5, description: 'Soya Oil' },
  '1511': { igst: 5,  cgst: 2.5, sgst: 2.5, description: 'Palm Oil' },
  '2201': { igst: 18, cgst: 9, sgst: 9, description: 'Mineral Waters' },
  '2202': { igst: 18, cgst: 9, sgst: 9, description: 'Soft Drinks' },
  '2203': { igst: 28, cgst: 14, sgst: 14, description: 'Beer' },
  '2208': { igst: 28, cgst: 14, sgst: 14, description: 'Spirits & Liquor' },
  // Pharma
  '3004': { igst: 12, cgst: 6, sgst: 6, description: 'Medicaments' },
  '3003': { igst: 12, cgst: 6, sgst: 6, description: 'Medicines (Mixed)' },
  '3005': { igst: 12, cgst: 6, sgst: 6, description: 'Medical Dressings' },
  '3401': { igst: 18, cgst: 9, sgst: 9, description: 'Soap' },
  '3402': { igst: 18, cgst: 9, sgst: 9, description: 'Detergents' },
  '3301': { igst: 18, cgst: 9, sgst: 9, description: 'Essential Oils' },
  '3304': { igst: 28, cgst: 14, sgst: 14, description: 'Beauty Products' },
  '3305': { igst: 18, cgst: 9, sgst: 9, description: 'Hair Products' },
  // Textiles
  '5208': { igst: 5,  cgst: 2.5, sgst: 2.5, description: 'Cotton Fabrics' },
  '5209': { igst: 5,  cgst: 2.5, sgst: 2.5, description: 'Cotton Fabrics (Heavy)' },
  '6101': { igst: 12, cgst: 6, sgst: 6, description: 'Overcoats' },
  '6105': { igst: 12, cgst: 6, sgst: 6, description: 'Shirts' },
  '6109': { igst: 12, cgst: 6, sgst: 6, description: 'T-Shirts' },
  '6203': { igst: 12, cgst: 6, sgst: 6, description: "Men's Suits" },
  '6204': { igst: 12, cgst: 6, sgst: 6, description: "Women's Suits" },
  '6401': { igst: 18, cgst: 9, sgst: 9, description: 'Waterproof Footwear' },
  '6403': { igst: 18, cgst: 9, sgst: 9, description: 'Leather Footwear' },
  // Construction
  '2523': { igst: 28, cgst: 14, sgst: 14, description: 'Portland Cement' },
  '7210': { igst: 18, cgst: 9, sgst: 9, description: 'Steel Products' },
  '7308': { igst: 18, cgst: 9, sgst: 9, description: 'Steel Structures' },
  '3917': { igst: 18, cgst: 9, sgst: 9, description: 'Plastic Pipes' },
  '6908': { igst: 18, cgst: 9, sgst: 9, description: 'Ceramic Tiles' },
  // Furniture
  '9401': { igst: 18, cgst: 9, sgst: 9, description: 'Seating' },
  '9403': { igst: 18, cgst: 9, sgst: 9, description: 'Furniture' },
  '9404': { igst: 12, cgst: 6, sgst: 6, description: 'Mattresses' },
  // Paper & Printing
  '4802': { igst: 12, cgst: 6, sgst: 6, description: 'Paper' },
  '4901': { igst: 0,  cgst: 0, sgst: 0, description: 'Books' },
  '4902': { igst: 0,  cgst: 0, sgst: 0, description: 'Newspapers' },
  '4911': { igst: 12, cgst: 6, sgst: 6, description: 'Printed Matter' },
  // Gems & Jewellery
  '7108': { igst: 3,  cgst: 1.5, sgst: 1.5, description: 'Gold' },
  '7113': { igst: 3,  cgst: 1.5, sgst: 1.5, description: 'Jewellery' },
  '7102': { igst: 0.25, cgst: 0.125, sgst: 0.125, description: 'Diamonds' },
  // Fuel & Energy
  '2709': { igst: 0,  cgst: 0, sgst: 0, description: 'Crude Oil (outside GST)' },
  '2710': { igst: 0,  cgst: 0, sgst: 0, description: 'Petroleum Products (outside GST)' },
  '2716': { igst: 5,  cgst: 2.5, sgst: 2.5, description: 'Electrical Energy' },
  // Solar & Renewable
  '8541': { igst: 5,  cgst: 2.5, sgst: 2.5, description: 'Solar Cells' },
  '8501': { igst: 5,  cgst: 2.5, sgst: 2.5, description: 'Electric Motors' },
  // Tobacco (high rate)
  '2402': { igst: 28, cgst: 14, sgst: 14, description: 'Cigarettes' },
  '2401': { igst: 5,  cgst: 2.5, sgst: 2.5, description: 'Tobacco Unmanufactured' },
  // Plastics
  '3923': { igst: 18, cgst: 9, sgst: 9, description: 'Plastic Containers' },
  '3926': { igst: 18, cgst: 9, sgst: 9, description: 'Plastic Articles' },
  // Chemicals
  '2804': { igst: 12, cgst: 6, sgst: 6, description: 'Hydrogen & Noble Gases' },
  '2814': { igst: 18, cgst: 9, sgst: 9, description: 'Ammonia' },
  '2836': { igst: 18, cgst: 9, sgst: 9, description: 'Carbonates' },
  // Sports & Recreation
  '9506': { igst: 18, cgst: 9, sgst: 9, description: 'Sports Equipment' },
  '9504': { igst: 18, cgst: 9, sgst: 9, description: 'Games & Gaming' },
  // Watches & Clocks
  '9101': { igst: 18, cgst: 9, sgst: 9, description: 'Wrist Watches' },
  '9102': { igst: 18, cgst: 9, sgst: 9, description: 'Clocks' },
};

const DEFAULT_RATES = { igst: 18, cgst: 9, sgst: 9 };

export interface TaxInput {
  taxableValue: number | string;
  placeOfSupply: string;
  companyStateCode: string;
  hsnCode?: string;
}

export interface TaxResult {
  taxableValue: string;
  cgst: string;
  sgst: string;
  igst: string;
  totalTax: string;
  totalAmount: string;
  isInterState: boolean;
  appliedRate: { igst: number; cgst: number; sgst: number };
  hsnDescription?: string;
}

export function calculateTax(input: TaxInput): TaxResult {
  const taxable = new Decimal(input.taxableValue);
  if (taxable.isNegative() || taxable.isNaN()) {
    throw new Error('Taxable value must be non-negative');
  }
  const hsnData = input.hsnCode ? (HSN_RATES[input.hsnCode] ?? DEFAULT_RATES) : DEFAULT_RATES;
  const rates = { igst: hsnData.igst, cgst: hsnData.cgst, sgst: hsnData.sgst };
  const isInterState = input.placeOfSupply.trim() !== input.companyStateCode.trim();

  let cgst = new Decimal(0);
  let sgst = new Decimal(0);
  let igst = new Decimal(0);

  if (isInterState) {
    igst = taxable.mul(rates.igst).div(100).toDecimalPlaces(2);
  } else {
    cgst = taxable.mul(rates.cgst).div(100).toDecimalPlaces(2);
    sgst = taxable.mul(rates.sgst).div(100).toDecimalPlaces(2);
  }

  const totalTax = cgst.add(sgst).add(igst);
  const totalAmount = taxable.add(totalTax);

  return {
    taxableValue: taxable.toFixed(2),
    cgst: cgst.toFixed(2),
    sgst: sgst.toFixed(2),
    igst: igst.toFixed(2),
    totalTax: totalTax.toFixed(2),
    totalAmount: totalAmount.toFixed(2),
    isInterState,
    appliedRate: rates,
    hsnDescription: 'description' in hsnData ? (hsnData as any).description : undefined,
  };
}

export function getHSNRate(hsnCode: string) {
  return HSN_RATES[hsnCode] ?? DEFAULT_RATES;
}

export function getHSNList() {
  return Object.entries(HSN_RATES).map(([code, data]) => ({
    code,
    ...data,
  }));
}
