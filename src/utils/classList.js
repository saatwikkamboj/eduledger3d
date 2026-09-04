// Full class taxonomy: Pre-Primary through Senior Secondary.
export const CLASS_LIST = [
  'Nursery', 'LKG', 'UKG',
  '1st', '2nd', '3rd', '4th', '5th',
  '6th', '7th', '8th', '9th', '10th',
  '11th', '12th',
];

export const SENIOR_SECONDARY = ['11th', '12th'];

export function isSeniorSecondary(className) {
  return SENIOR_SECONDARY.includes(className);
}

export const SECTIONS = ['A', 'B', 'C', 'D', 'E'];
