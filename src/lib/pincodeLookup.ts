/**
 * Indian PIN Code Directory & Logistics Routing Utility
 * Maps 6-digit Indian PIN codes to authentic states, logistics airport hubs, and routing codes
 */

export interface PincodeInfo {
  state: string;
  hub: string;       // Logistics 3-letter Airport/Hub code (e.g. PNQ, BOM, DEL, JAI)
  routingCode: string; // Origin/Destination routing string (e.g. ABH/PNQ)
}

/**
 * Extracts numeric weight in Kilograms from product item title or variant
 * Examples:
 * - "haldi (70kg)" -> 70
 * - "haldi (100gm)" -> 0.1
 * - "jeera (500g)" -> 0.5
 * - "Red Chilli Powder 1kg" -> 1
 * - "Turmeric 2.5kg" -> 2.5
 */
export function extractItemWeightKg(itemName: string): number {
  if (!itemName) return 0.25;

  const clean = itemName.trim();

  // 1. Check parenthetical weight first: e.g. "haldi (70kg)" or "Haldi Powder (500gm)"
  const parenMatch = clean.match(/\(([^)]+)\)/);
  if (parenMatch) {
    const inside = parenMatch[1].trim().toLowerCase();
    
    // KG match inside parens
    const kgInside = inside.match(/^([\d.]+)\s*(?:kg|kilo|kilogram)s?$/i);
    if (kgInside) {
      const val = parseFloat(kgInside[1]);
      if (!isNaN(val) && val > 0) return val;
    }

    // Gram match inside parens
    const gmInside = inside.match(/^([\d.]+)\s*(?:gm|g|gram)s?$/i);
    if (gmInside) {
      const val = parseFloat(gmInside[1]);
      if (!isNaN(val) && val > 0) return Math.round((val / 1000) * 1000) / 1000;
    }
  }

  // 2. Search anywhere in the text
  const kgMatch = clean.match(/(\d+(?:\.\d+)?)\s*(?:kg|kilo|kilogram)s?\b/i);
  if (kgMatch) {
    const val = parseFloat(kgMatch[1]);
    if (!isNaN(val) && val > 0) return val;
  }

  const gmMatch = clean.match(/(\d+(?:\.\d+)?)\s*(?:gm|g|gram|grams)\b/i);
  if (gmMatch) {
    const val = parseFloat(gmMatch[1]);
    if (!isNaN(val) && val > 0) return Math.round((val / 1000) * 1000) / 1000;
  }

  // Default standard 250g
  return 0.25;
}

/**
 * Calculates total order weight in Kilograms across all order items
 */
export function calculateOrderWeightKg(items: any[]): number {
  if (!items || items.length === 0) return 0.5;

  let totalKg = 0;
  for (const it of items) {
    const qty = parseInt(it.quantity) || 1;
    const name = it.product_name || it.name || '';
    const itemKg = extractItemWeightKg(name);
    totalKg += itemKg * qty;
  }

  // Minimum 0.1 KG, rounded to 2 decimal places
  return Math.max(0.1, Math.round(totalKg * 100) / 100);
}

/**
 * Formats weight nicely for shipping labels (e.g. "70 KG", "0.55 KG", "2.5 KG")
 */
export function formatShippingWeight(kg: number): string {
  if (kg >= 10) {
    return `${kg % 1 === 0 ? kg : kg.toFixed(1)} KG`;
  }
  if (kg >= 1) {
    return `${kg % 1 === 0 ? kg : kg.toFixed(2)} KG`;
  }
  return `${kg.toFixed(2)} KG`;
}

/**
 * Resolves authentic Indian State and Logistics Hub code from a 6-digit PIN code
 */
export function lookupPincode(pincode: string | number | undefined): PincodeInfo {
  const pinStr = String(pincode || '').replace(/\D/g, '').slice(0, 6);
  if (pinStr.length < 2) {
    return { state: 'Punjab', hub: 'PJB', routingCode: 'ABH/PJB' };
  }

  const prefix2 = parseInt(pinStr.slice(0, 2), 10);
  const prefix3 = parseInt(pinStr.slice(0, 3), 10);

  // Origin hub is always Abohar (ABH)
  const originHub = 'ABH';

  // 11: Delhi
  if (prefix2 === 11) {
    return { state: 'Delhi', hub: 'DEL', routingCode: `${originHub}/DEL` };
  }

  // 12 - 13: Haryana
  if (prefix2 >= 12 && prefix2 <= 13) {
    return { state: 'Haryana', hub: 'DEL', routingCode: `${originHub}/HAR` };
  }

  // 14 - 16: Punjab & Chandigarh
  if (prefix2 >= 14 && prefix2 <= 16) {
    const hub = prefix2 === 16 ? 'IXC' : 'ATQ';
    return { state: 'Punjab', hub, routingCode: `${originHub}/${hub}` };
  }

  // 17: Himachal Pradesh
  if (prefix2 === 17) {
    return { state: 'Himachal Pradesh', hub: 'SLV', routingCode: `${originHub}/HMP` };
  }

  // 18 - 19: Jammu & Kashmir
  if (prefix2 >= 18 && prefix2 <= 19) {
    return { state: 'Jammu and Kashmir', hub: 'IXJ', routingCode: `${originHub}/JNK` };
  }

  // 20 - 28: Uttar Pradesh & Uttarakhand
  if (prefix2 >= 20 && prefix2 <= 28) {
    const isUK = prefix2 === 24 || prefix2 === 26;
    return {
      state: isUK ? 'Uttarakhand' : 'Uttar Pradesh',
      hub: isUK ? 'DED' : 'LKO',
      routingCode: `${originHub}/${isUK ? 'DED' : 'LKO'}`,
    };
  }

  // 30 - 34: Rajasthan
  if (prefix2 >= 30 && prefix2 <= 34) {
    return { state: 'Rajasthan', hub: 'JAI', routingCode: `${originHub}/JAI` };
  }

  // 36 - 39: Gujarat & Daman
  if (prefix2 >= 36 && prefix2 <= 39) {
    return { state: 'Gujarat', hub: 'AMD', routingCode: `${originHub}/AMD` };
  }

  // 40 - 44: Maharashtra & Goa
  if (prefix2 >= 40 && prefix2 <= 44) {
    if (prefix3 === 403) {
      return { state: 'Goa', hub: 'GOI', routingCode: `${originHub}/GOI` };
    }
    if (prefix3 >= 400 && prefix3 <= 404) {
      return { state: 'Maharashtra', hub: 'BOM', routingCode: `${originHub}/BOM` };
    }
    // 410-416: Pune, Ahmednagar (Rahuri is 414305), Satara, Solapur, Kolhapur
    if (prefix3 >= 410 && prefix3 <= 416) {
      return { state: 'Maharashtra', hub: 'PNQ', routingCode: `${originHub}/PNQ` };
    }
    // 421-425: Nashik, Jalgaon
    if (prefix3 >= 421 && prefix3 <= 425) {
      return { state: 'Maharashtra', hub: 'NAS', routingCode: `${originHub}/NAS` };
    }
    // 431: Aurangabad
    if (prefix3 === 431) {
      return { state: 'Maharashtra', hub: 'IXU', routingCode: `${originHub}/IXU` };
    }
    // 440-445: Nagpur
    return { state: 'Maharashtra', hub: 'NAG', routingCode: `${originHub}/NAG` };
  }

  // 45 - 48: Madhya Pradesh
  if (prefix2 >= 45 && prefix2 <= 48) {
    return { state: 'Madhya Pradesh', hub: 'IDR', routingCode: `${originHub}/IDR` };
  }

  // 49: Chhattisgarh
  if (prefix2 === 49) {
    return { state: 'Chhattisgarh', hub: 'RPR', routingCode: `${originHub}/RPR` };
  }

  // 50 - 53: Telangana & Andhra Pradesh
  if (prefix2 >= 50 && prefix2 <= 53) {
    const isTelangana = prefix2 === 50;
    return {
      state: isTelangana ? 'Telangana' : 'Andhra Pradesh',
      hub: isTelangana ? 'HYD' : 'VGA',
      routingCode: `${originHub}/${isTelangana ? 'HYD' : 'VGA'}`,
    };
  }

  // 56 - 59: Karnataka
  if (prefix2 >= 56 && prefix2 <= 59) {
    return { state: 'Karnataka', hub: 'BLR', routingCode: `${originHub}/BLR` };
  }

  // 60 - 64: Tamil Nadu & Puducherry
  if (prefix2 >= 60 && prefix2 <= 64) {
    return { state: 'Tamil Nadu', hub: 'MAA', routingCode: `${originHub}/MAA` };
  }

  // 67 - 69: Kerala
  if (prefix2 >= 67 && prefix2 <= 69) {
    return { state: 'Kerala', hub: 'COK', routingCode: `${originHub}/COK` };
  }

  // 70 - 74: West Bengal
  if (prefix2 >= 70 && prefix2 <= 74) {
    return { state: 'West Bengal', hub: 'CCU', routingCode: `${originHub}/CCU` };
  }

  // 75 - 77: Odisha
  if (prefix2 >= 75 && prefix2 <= 77) {
    return { state: 'Odisha', hub: 'BBI', routingCode: `${originHub}/BBI` };
  }

  // 78: Assam
  if (prefix2 === 78) {
    return { state: 'Assam', hub: 'GAU', routingCode: `${originHub}/GAU` };
  }

  // 79: North East States
  if (prefix2 === 79) {
    return { state: 'North East', hub: 'SHL', routingCode: `${originHub}/SHL` };
  }

  // 80 - 85: Bihar & Jharkhand
  if (prefix2 >= 80 && prefix2 <= 85) {
    const isJH = prefix2 >= 81 && prefix2 <= 83;
    return {
      state: isJH ? 'Jharkhand' : 'Bihar',
      hub: isJH ? 'IXR' : 'PAT',
      routingCode: `${originHub}/${isJH ? 'IXR' : 'PAT'}`,
    };
  }

  return { state: 'India', hub: 'IND', routingCode: `${originHub}/DOM` };
}
