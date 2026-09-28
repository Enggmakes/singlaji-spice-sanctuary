import React from 'react';

export interface IconProps {
  className?: string;
  size?: number;
}

/**
 * Red Chilli Pepper - Flaticon Flat Style Vector
 */
export const ChilliIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Green Stem and Calyx */}
    <path
      d="M48 6C47 12 43 17 38 18C37 14 39 9 44 6C46 4.5 48 4 48 6Z"
      fill="#22C55E"
    />
    <path
      d="M45 5C45 5 42 11 36 14C32 16 29 17 29 17C29 17 33 13 36 9C39 5 45 5 45 5Z"
      fill="#16A34A"
    />
    <path
      d="M43 14C45 16 46 20 44 22C41 24 35 23 33 20C31 17 33 14 36 13C39 12 41 12 43 14Z"
      fill="#15803D"
    />
    {/* Main Red Chilli Body */}
    <path
      d="M42 20C47 28 44 42 35 50C26 58 15 60 11 58C9 57 11 53 14 50C20 44 25 35 28 26C30 19 36 16 42 20Z"
      fill="#DC2626"
    />
    {/* Shadow / Depth Curve */}
    <path
      d="M42 20C38 19 32 23 29 29C26 36 21 44 14 50C12 52 10 55 11 58C12 59 15 58 19 55C28 48 37 38 42 28C43 25 43 22 42 20Z"
      fill="#B91C1C"
    />
    {/* Shiny Highlight */}
    <path
      d="M37 25C39 30 38 37 32 44C30 46 27 49 24 51C23 50 25 47 27 45C32 39 34 32 33 27C33 24 35 23 37 25Z"
      fill="#F87171"
      opacity="0.75"
    />
  </svg>
);

/**
 * Masala & Ground Spices Bowl - Flaticon Flat Style Vector
 */
export const MasalaBowlIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Wooden Mortar / Bowl Exterior */}
    <path
      d="M12 28C12 44 21 54 32 54C43 54 52 44 52 28H12Z"
      fill="#9A3412"
    />
    <path
      d="M16 32C16 44 23 51 32 51C41 51 48 44 48 32H16Z"
      fill="#C2410C"
    />
    {/* Bowl Rim */}
    <ellipse cx="32" cy="28" rx="22" ry="7" fill="#7C2D12" />
    <ellipse cx="32" cy="27" rx="20" ry="6" fill="#EA580C" />
    {/* Ground Masala Powder Mound */}
    <ellipse cx="32" cy="26" rx="17" ry="5" fill="#D97706" />
    <path
      d="M22 26C22 22 42 22 42 26C42 28 22 28 22 26Z"
      fill="#F59E0B"
    />
    {/* Pestle / Spice Grinder Tool */}
    <path
      d="M40 10L46 14L34 30L28 26L40 10Z"
      fill="#FBBF24"
    />
    <path
      d="M44 8C46 9.5 47 12 46 14L41 11C41 9 42.5 7.5 44 8Z"
      fill="#D97706"
    />
    {/* Whole spice stars/dots */}
    <circle cx="28" cy="25" r="1.5" fill="#78350F" />
    <circle cx="34" cy="27" r="1.5" fill="#78350F" />
    <circle cx="36" cy="24" r="1.2" fill="#78350F" />
    <circle cx="30" cy="28" r="1" fill="#78350F" />
  </svg>
);

/**
 * Flour & Atta Sack - Flaticon Flat Style Vector
 */
export const FlourSackIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Flour Sack Body */}
    <path
      d="M16 26C16 22 20 18 24 18H40C44 18 48 22 48 26L51 52C51 55 48 57 45 57H19C16 57 13 55 13 52L16 26Z"
      fill="#FDE68A"
    />
    {/* Sack Fold and Shadow */}
    <path
      d="M48 26L51 52C51 55 48 57 45 57H38L42 26H48Z"
      fill="#FCD34D"
    />
    {/* Tied Neck / Rope */}
    <path
      d="M22 18C22 16 24 14 28 14H36C40 14 42 16 42 18H22Z"
      fill="#D97706"
    />
    <rect x="23" y="16" width="18" height="3" rx="1.5" fill="#B45309" />
    {/* Wheat Ear Graphic on Sack Label */}
    <ellipse cx="32" cy="38" rx="8" ry="10" fill="#FFFFFF" opacity="0.85" />
    <path
      d="M32 30V46M32 34L28 32M32 37L28 35M32 40L28 38M32 34L36 32M32 37L36 35M32 40L36 38"
      stroke="#D97706"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

/**
 * Chutney & Pickle Jar - Flaticon Flat Style Vector
 */
export const ChutneyJarIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Glass Jar Body */}
    <path
      d="M17 25C17 22 19 20 22 20H42C45 20 47 22 47 25L49 51C49 55 46 58 42 58H22C18 58 15 55 15 51L17 25Z"
      fill="#ECFDF5"
    />
    {/* Chutney / Pickle Content (Zesty Green) */}
    <path
      d="M18 29C18 29 25 28 32 30C39 32 46 29 46 29L48 51C48 54 45 56 42 56H22C19 56 16 54 16 51L18 29Z"
      fill="#059669"
    />
    <path
      d="M20 38C24 37 32 42 44 38L45 51C45 54 42 56 39 56H22C19 56 17 54 17 51L20 38Z"
      fill="#047857"
    />
    {/* Cloth Jar Lid / Traditional Indian Achaar Cover */}
    <path
      d="M18 16C18 14 20 12 24 12H40C44 12 46 14 46 16L48 20H16L18 16Z"
      fill="#DC2626"
    />
    {/* Tied Ribbon on Jar Neck */}
    <rect x="18" y="19" width="28" height="3" rx="1" fill="#FCD34D" />
    <circle cx="32" cy="20.5" r="2" fill="#B45309" />
    {/* Front Label */}
    <rect x="23" y="38" width="18" height="12" rx="3" fill="#FEF3C7" />
    <path d="M26 42H38M26 46H34" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

/**
 * Turmeric & Haldi Root - Flaticon Flat Style Vector
 */
export const TurmericIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Turmeric Root */}
    <path
      d="M12 36C10 26 22 18 30 20C36 21 40 16 46 18C52 20 54 26 50 30C46 34 40 32 36 34C28 38 20 46 14 42C12 40 12 38 12 36Z"
      fill="#B45309"
    />
    <path
      d="M16 34C18 28 26 22 32 23C36 24 38 20 42 21C46 22 47 26 45 28C41 31 37 30 33 32C27 35 22 40 17 38C16 37 16 35 16 34Z"
      fill="#D97706"
    />
    {/* Golden Sliced Core */}
    <ellipse cx="48" cy="24" rx="7" ry="5" transform="rotate(-25 48 24)" fill="#F59E0B" />
    <ellipse cx="48" cy="24" rx="5" ry="3.5" transform="rotate(-25 48 24)" fill="#FBBF24" />
    {/* Haldi Golden Powder Mound */}
    <path
      d="M20 50C20 42 44 42 44 50C44 54 20 54 20 50Z"
      fill="#F59E0B"
    />
    <ellipse cx="32" cy="51" rx="14" ry="4" fill="#D97706" />
    <circle cx="28" cy="46" r="1.5" fill="#FEF08A" />
    <circle cx="34" cy="47" r="1.2" fill="#FEF08A" />
    <circle cx="38" cy="49" r="1" fill="#FEF08A" />
  </svg>
);

/**
 * Whole Spices & Seeds (Coriander, Cumin, Jeera) - Flaticon Flat Style Vector
 */
export const CorianderSeedsIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Fresh Green Coriander Leaves */}
    <path
      d="M32 10C34 16 30 22 24 24C22 18 26 12 32 10Z"
      fill="#16A34A"
    />
    <path
      d="M32 12C36 17 42 16 44 22C38 24 34 20 32 12Z"
      fill="#22C55E"
    />
    <path
      d="M28 24C30 32 32 40 32 48"
      stroke="#15803D"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    {/* Cumin / Coriander Seeds Spread */}
    <ellipse cx="20" cy="42" rx="4" ry="2" transform="rotate(-30 20 42)" fill="#92400E" />
    <ellipse cx="26" cy="48" rx="4" ry="2" transform="rotate(20 26 48)" fill="#B45309" />
    <ellipse cx="38" cy="46" rx="4.5" ry="2.2" transform="rotate(-40 38 46)" fill="#78350F" />
    <ellipse cx="44" cy="40" rx="4" ry="2" transform="rotate(35 44 40)" fill="#92400E" />
    <ellipse cx="34" cy="52" rx="4" ry="2" transform="rotate(10 34 52)" fill="#B45309" />
    <circle cx="22" cy="49" r="1.5" fill="#D97706" />
    <circle cx="42" cy="48" r="1.5" fill="#D97706" />
  </svg>
);

/**
 * Green Cardamom (Elaichi) - Flaticon Flat Style Vector
 */
export const CardamomIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Left Pod */}
    <path
      d="M24 16C16 26 14 38 22 46C30 54 42 50 44 38C46 26 34 16 24 16Z"
      fill="#4ADE80"
    />
    <path
      d="M24 16C19 26 18 36 24 44C30 52 38 48 41 38C41 38 32 30 24 16Z"
      fill="#22C55E"
    />
    {/* Pod Ribs */}
    <path
      d="M24 16C26 26 28 36 34 46M24 22C20 30 20 38 24 44M30 18C34 26 36 34 38 42"
      stroke="#16A34A"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    {/* Little Black Seeds */}
    <circle cx="40" cy="44" r="2.5" fill="#27272A" />
    <circle cx="46" cy="46" r="2" fill="#3F3F46" />
    <circle cx="44" cy="50" r="1.8" fill="#18181B" />
  </svg>
);

/**
 * Star Anise & Cloves (Garam Masala Spices) - Flaticon Flat Style Vector
 */
export const CloveStarIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Star Anise Center */}
    <circle cx="32" cy="32" r="6" fill="#78350F" />
    {/* 6 Radiating Pod Points */}
    <ellipse cx="32" cy="18" rx="4.5" ry="8" fill="#92400E" />
    <circle cx="32" cy="17" r="2" fill="#D97706" />
    <ellipse cx="32" cy="46" rx="4.5" ry="8" fill="#92400E" />
    <circle cx="32" cy="47" r="2" fill="#D97706" />
    <ellipse cx="20" cy="25" rx="8" ry="4.5" transform="rotate(-30 20 25)" fill="#92400E" />
    <circle cx="18" cy="24" r="2" fill="#D97706" />
    <ellipse cx="44" cy="25" rx="8" ry="4.5" transform="rotate(30 44 25)" fill="#92400E" />
    <circle cx="46" cy="24" r="2" fill="#D97706" />
    <ellipse cx="20" cy="39" rx="8" ry="4.5" transform="rotate(30 20 39)" fill="#78350F" />
    <circle cx="18" cy="40" r="2" fill="#B45309" />
    <ellipse cx="44" cy="39" rx="8" ry="4.5" transform="rotate(-30 44 39)" fill="#78350F" />
    <circle cx="46" cy="40" r="2" fill="#B45309" />
  </svg>
);

/**
 * Cinnamon Sticks (Dalchini) - Flaticon Flat Style Vector
 */
export const CinnamonIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* First Bark Roll */}
    <path
      d="M16 18L38 48C39 49.5 41 50 43 49L47 46C49 44.5 49 42 48 40L26 10C25 8.5 23 8 21 9L17 12C15 13.5 15 16 16 18Z"
      fill="#92400E"
    />
    <ellipse cx="21" cy="11" rx="4" ry="2.5" transform="rotate(50 21 11)" fill="#B45309" />
    <ellipse cx="43" cy="45" rx="4" ry="2.5" transform="rotate(50 43 45)" fill="#78350F" />
    {/* Second Bark Roll overlapping */}
    <path
      d="M26 18L44 44C45 45.5 47 46 49 45L52 43C54 41.5 54 39 53 37L35 11C34 9.5 32 9 30 10L27 12C25 13.5 25 16 26 18Z"
      fill="#B45309"
    />
    <line x1="22" y1="20" x2="38" y2="42" stroke="#78350F" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="31" y1="20" x2="45" y2="38" stroke="#D97706" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

/**
 * Black Pepper (Kali Mirch) - Flaticon Flat Style Vector
 */
export const BlackPepperIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Clustered Peppercorns */}
    <circle cx="32" cy="22" r="8" fill="#27272A" />
    <circle cx="30" cy="20" r="2.5" fill="#52525B" />
    <circle cx="20" cy="34" r="8.5" fill="#18181B" />
    <circle cx="18" cy="32" r="2.5" fill="#3F3F46" />
    <circle cx="44" cy="34" r="8.5" fill="#27272A" />
    <circle cx="42" cy="32" r="2.5" fill="#52525B" />
    <circle cx="32" cy="42" r="9" fill="#09090B" />
    <circle cx="30" cy="39" r="3" fill="#3F3F46" />
    <circle cx="18" cy="48" r="5" fill="#27272A" />
    <circle cx="46" cy="48" r="5.5" fill="#18181B" />
    <circle cx="32" cy="54" r="4" fill="#27272A" />
  </svg>
);

/**
 * Mustard & Fenugreek Seeds (Rai / Sarson / Methi) - Flaticon Flat Style Vector
 */
export const MustardSeedsIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Small wooden spoon with yellow & black mustard */}
    <ellipse cx="28" cy="32" rx="16" ry="12" fill="#D97706" />
    <ellipse cx="28" cy="31" rx="14" ry="10" fill="#F59E0B" />
    <path d="M40 32L56 46C57.5 47.5 57.5 50 56 51.5C54.5 53 52 53 50.5 51.5L35 36" stroke="#92400E" strokeWidth="4" strokeLinecap="round" />
    {/* Mustard seeds inside spoon */}
    <circle cx="24" cy="28" r="2.5" fill="#18181B" />
    <circle cx="30" cy="27" r="2.2" fill="#FEF08A" />
    <circle cx="34" cy="31" r="2.5" fill="#18181B" />
    <circle cx="26" cy="34" r="2.2" fill="#FEF08A" />
    <circle cx="22" cy="32" r="2" fill="#78350F" />
    <circle cx="31" cy="35" r="2.2" fill="#18181B" />
  </svg>
);

/**
 * Fresh Ginger Root (Adrak / Sonth) - Flaticon Flat Style Vector
 */
export const GingerRootIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Main Ginger Rhizome */}
    <path
      d="M16 38C12 32 14 20 24 22C30 23 34 16 42 16C48 16 52 22 48 28C54 32 54 42 46 46C38 50 34 44 28 46C20 48 18 42 16 38Z"
      fill="#D97706"
    />
    <path
      d="M18 36C15 32 17 22 25 24C30 25 33 19 40 19C45 19 48 24 45 29C50 33 50 40 44 43C37 46 34 42 29 44C22 45 20 40 18 36Z"
      fill="#F59E0B"
    />
    {/* Cut Golden Slice */}
    <ellipse cx="46" cy="26" rx="6" ry="4" fill="#FEF08A" />
    <ellipse cx="46" cy="26" rx="4.5" ry="3" fill="#FDE047" />
    {/* Root Wrinkles */}
    <line x1="24" y1="28" x2="28" y2="34" stroke="#B45309" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="32" y1="26" x2="36" y2="32" stroke="#B45309" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="28" y1="40" x2="34" y2="42" stroke="#B45309" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

/**
 * Bay Leaf (Tejpatta) - Flaticon Flat Style Vector
 */
export const BayLeafIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Dried Olive/Khaki Bay Leaf */}
    <path
      d="M16 48C18 36 28 16 48 14C48 34 32 46 16 48Z"
      fill="#65A30D"
    />
    <path
      d="M18 46C22 36 30 20 46 16C46 32 34 44 18 46Z"
      fill="#84CC16"
    />
    {/* Central Leaf Vein */}
    <path
      d="M14 50L44 18M26 38L32 34M32 30L38 26M22 42L26 40"
      stroke="#4D7C0F"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

/**
 * Default Spice Blend / Seasoning Pouch - Flaticon Flat Style Vector
 */
export const DefaultSpiceIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Pouch / Bag Package */}
    <path
      d="M18 16H46L49 52C49 55 46 58 43 58H21C18 58 15 55 15 52L18 16Z"
      fill="#DC2626"
    />
    <path
      d="M46 16L49 52C49 55 46 58 43 58H38L42 16H46Z"
      fill="#991B1B"
    />
    {/* Sealed Top Zip */}
    <rect x="16" y="10" width="32" height="6" rx="2" fill="#7F1D1D" />
    <circle cx="32" cy="13" r="1.5" fill="#FEF08A" />
    {/* Pure Seal Badge in Center */}
    <circle cx="32" cy="36" r="10" fill="#FEF08A" />
    <circle cx="32" cy="36" r="8" fill="#F59E0B" />
    <path
      d="M29 36L31 38L35 34"
      stroke="#78350F"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * ----------------------------------------------------
 * Navigation Flaticon-Style Flat Vector Icons
 * ----------------------------------------------------
 */

/**
 * Shop / All Spices Bag - Flaticon Flat Style Vector
 */
export const NavShopBagIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Bag Handles */}
    <path
      d="M24 24V16C24 11.58 27.58 8 32 8C36.42 8 40 11.58 40 16V24"
      stroke="#D97706"
      strokeWidth="4"
      strokeLinecap="round"
    />
    {/* Shopping Bag Body */}
    <path
      d="M14 22H50L53 54C53 56.5 51 58 48.5 58H15.5C13 58 11 56.5 11 54L14 22Z"
      fill="#EA580C"
    />
    {/* Bag Side Shadow */}
    <path
      d="M50 22L53 54C53 56.5 51 58 48.5 58H40L43 22H50Z"
      fill="#C2410C"
    />
    {/* Front Spice Leaf Badge */}
    <circle cx="32" cy="40" r="8" fill="#FEF3C7" />
    <path
      d="M32 35C35 38 35 43 32 45C29 43 29 38 32 35Z"
      fill="#16A34A"
    />
    <path
      d="M32 37V44"
      stroke="#15803D"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
  </svg>
);

/**
 * Categories Spice Rack / Spice Jars - Flaticon Flat Style Vector
 */
export const NavCategoriesIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Shelf Base */}
    <rect x="8" y="52" width="48" height="5" rx="2.5" fill="#78350F" />
    {/* Jar 1 (Red Chilli) */}
    <rect x="12" y="26" width="10" height="24" rx="2" fill="#FEE2E2" />
    <rect x="12" y="32" width="10" height="18" rx="1" fill="#DC2626" />
    <rect x="11" y="22" width="12" height="4" rx="1" fill="#B91C1C" />
    {/* Jar 2 (Turmeric Yellow) */}
    <rect x="27" y="22" width="10" height="28" rx="2" fill="#FEF3C7" />
    <rect x="27" y="28" width="10" height="22" rx="1" fill="#F59E0B" />
    <rect x="26" y="18" width="12" height="4" rx="1" fill="#D97706" />
    {/* Jar 3 (Herbs Green) */}
    <rect x="42" y="26" width="10" height="24" rx="2" fill="#ECFDF5" />
    <rect x="42" y="32" width="10" height="18" rx="1" fill="#16A34A" />
    <rect x="41" y="22" width="12" height="4" rx="1" fill="#15803D" />
  </svg>
);

/**
 * Heritage / Our Story Book & Seal - Flaticon Flat Style Vector
 */
export const NavOurStoryIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Book Cover */}
    <rect x="12" y="12" width="40" height="44" rx="4" fill="#9A3412" />
    <rect x="14" y="14" width="36" height="40" rx="3" fill="#B45309" />
    {/* Spine Binding */}
    <path d="M12 12H18V56H12C10.9 56 10 55.1 10 54V14C10 12.9 10.9 12 12 12Z" fill="#78350F" />
    <line x1="14" y1="20" x2="14" y2="48" stroke="#FDE68A" strokeWidth="1.5" strokeLinecap="round" />
    {/* Heritage Stamp / Sun Emblem on Cover */}
    <circle cx="34" cy="32" r="10" fill="#FEF3C7" />
    <circle cx="34" cy="32" r="8" fill="#F59E0B" />
    <circle cx="34" cy="32" r="3.5" fill="#78350F" />
    {/* Page Edge Lines */}
    <rect x="48" y="16" width="2" height="36" fill="#FDE68A" />
  </svg>
);

/**
 * Track Order / Express Van - Flaticon Flat Style Vector
 */
export const NavTrackOrderIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Speed Wind Trails */}
    <line x1="6" y1="28" x2="12" y2="28" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="4" y1="36" x2="14" y2="36" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="8" y1="44" x2="13" y2="44" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" />
    {/* Van Cargo Body */}
    <path
      d="M16 20H42V46H16C14.9 46 14 45.1 14 44V22C14 20.9 14.9 20 16 20Z"
      fill="#10B981"
    />
    <path
      d="M38 20H42V46H38V20Z"
      fill="#059669"
    />
    {/* Van Cabin Front */}
    <path
      d="M42 28H50L56 36V44C56 45.1 55.1 46 54 46H42V28Z"
      fill="#34D399"
    />
    {/* Cabin Window */}
    <path
      d="M44 30H49L53 36H44V30Z"
      fill="#ECFDF5"
    />
    {/* Front Headlight */}
    <rect x="54" y="38" width="2" height="4" rx="1" fill="#FEF08A" />
    {/* Wheels */}
    <circle cx="24" cy="47" r="6" fill="#1F2937" />
    <circle cx="24" cy="47" r="2.5" fill="#9CA3AF" />
    <circle cx="48" cy="47" r="6" fill="#1F2937" />
    <circle cx="48" cy="47" r="2.5" fill="#9CA3AF" />
  </svg>
);

/**
 * Master Resolver for Category Vectors
 * Maps spice names to their genuine Flaticon flat-vector icons
 */
export function getCategoryVectorIcon(name: string, className = 'w-5 h-5'): React.ReactElement {
  const lower = (name || '').toLowerCase();
  if (lower.includes('chilli') || lower.includes('mirch') || lower.includes('red') || lower.includes('paprika') || lower.includes('teja') || (lower.includes('pepper') && !lower.includes('black') && !lower.includes('kali'))) {
    return <ChilliIcon className={className} />;
  }
  if (lower.includes('black pepper') || lower.includes('kali mirch') || lower.includes('peppercorn')) {
    return <BlackPepperIcon className={className} />;
  }
  if (lower.includes('cinnamon') || lower.includes('dalchini') || lower.includes('taj')) {
    return <CinnamonIcon className={className} />;
  }
  if (lower.includes('ginger') || lower.includes('adrak') || lower.includes('sonth') || lower.includes('saunth')) {
    return <GingerRootIcon className={className} />;
  }
  if (lower.includes('mustard') || lower.includes('rai') || lower.includes('sarson') || lower.includes('methi') || lower.includes('fenugreek')) {
    return <MustardSeedsIcon className={className} />;
  }
  if (lower.includes('bay') || lower.includes('tejpatta') || lower.includes('tej patta') || lower.includes('patta')) {
    return <BayLeafIcon className={className} />;
  }
  if (lower.includes('flour') || lower.includes('atta') || lower.includes('grain') || lower.includes('wheat') || lower.includes('maida') || lower.includes('besan')) {
    return <FlourSackIcon className={className} />;
  }
  if (lower.includes('chutney') || lower.includes('chatuney') || lower.includes('pickle') || lower.includes('sauce') || lower.includes('achar')) {
    return <ChutneyJarIcon className={className} />;
  }
  if (lower.includes('turmeric') || lower.includes('haldi')) {
    return <TurmericIcon className={className} />;
  }
  if (lower.includes('coriander') || lower.includes('cumin') || lower.includes('jeera') || lower.includes('dhaniya') || lower.includes('seeds') || lower.includes('saunf') || lower.includes('fennel')) {
    return <CorianderSeedsIcon className={className} />;
  }
  if (lower.includes('elaichi') || lower.includes('cardamom')) {
    return <CardamomIcon className={className} />;
  }
  if (lower.includes('clove') || lower.includes('laung') || lower.includes('anise') || lower.includes('khada') || lower.includes('whole')) {
    return <CloveStarIcon className={className} />;
  }
  if (lower.includes('masala') || lower.includes('garam') || lower.includes('blend') || lower.includes('powder') || lower.includes('spice')) {
    return <MasalaBowlIcon className={className} />;
  }
  return <DefaultSpiceIcon className={className} />;
}
