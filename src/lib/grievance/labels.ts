import type { Category, Urgency } from './schema'

export const CATEGORY_LABELS: Record<Category, { en: string; hi: string }> = {
  water_supply: { en: 'Water supply', hi: 'पानी की आपूर्ति' },
  sanitation_waste: { en: 'Sanitation & waste', hi: 'सफाई और कचरा' },
  roads_streetlights: { en: 'Roads & streetlights', hi: 'सड़क और बत्ती' },
  electricity: { en: 'Electricity', hi: 'बिजली' },
  public_health: { en: 'Public health', hi: 'सार्वजनिक स्वास्थ्य' },
  ration_welfare: { en: 'Ration & welfare', hi: 'राशन और योजनाएँ' },
  police_safety: { en: 'Police & safety', hi: 'पुलिस और सुरक्षा' },
  other: { en: 'Other', hi: 'अन्य' },
}

export const URGENCY_LABELS: Record<Urgency, { en: string; hi: string }> = {
  low: { en: 'Low', hi: 'सामान्य' },
  medium: { en: 'Medium', hi: 'मध्यम' },
  high: { en: 'High', hi: 'अत्यावश्यक' },
}

/** BCP-47 tags accepted by the browser Speech Recognition API. Support varies by browser. */
export const SPEECH_LANGUAGES: ReadonlyArray<{ tag: string; label: string }> = [
  { tag: 'hi-IN', label: 'हिन्दी' },
  { tag: 'en-IN', label: 'English' },
  { tag: 'bn-IN', label: 'বাংলা' },
  { tag: 'mr-IN', label: 'मराठी' },
  { tag: 'gu-IN', label: 'ગુજરાતી' },
  { tag: 'ta-IN', label: 'தமிழ்' },
  { tag: 'te-IN', label: 'తెలుగు' },
  { tag: 'kn-IN', label: 'ಕನ್ನಡ' },
  { tag: 'ml-IN', label: 'മലയാളം' },
  { tag: 'pa-IN', label: 'ਪੰਜਾਬੀ' },
]
