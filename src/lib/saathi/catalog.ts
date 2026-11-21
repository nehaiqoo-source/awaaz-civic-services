import type { Category } from '@/lib/grievance/schema'

/**
 * Closed, hand-curated list of services Saathi can recommend. The model may only ever pick ids from this list, and the
 * page renders text and links from here (never from model output), so a recommendation cannot carry an invented URL.
 *
 * Every external URL was fetched and returned HTTP 200 on `verifiedOn`. Portals that could not be reached from the
 * build environment (PM-JAY, NSAP, National Scholarship Portal, Swachhata app, PMGSY OMMS) are intentionally NOT listed.
 */
export interface Service {
  id: string
  /** 'awaaz' = handled inside this app (internal path). 'official' = a government portal. */
  kind: 'awaaz' | 'official'
  category: Category
  name: { en: string; hi: string }
  why: { en: string; hi: string }
  documents: { en: string[]; hi: string[] }
  /** https URL on an allowlisted government host, or an internal path starting with "/". */
  url: string
  /** Lower-case words/phrases in English, Devanagari and Romanized Hindi. */
  keywords: string[]
  verifiedOn: string
}

export const VERIFIED_ON = '2026-11-19'

export const ALLOWED_HOSTS = [
  'pgportal.gov.in',
  'pmkisan.gov.in',
  'eshram.gov.in',
  'nfsa.gov.in',
  'impds.nic.in',
  'consumerhelpline.gov.in',
  'digitalpolice.gov.in',
  'jeevanpramaan.gov.in',
  'rtionline.gov.in',
  'web.umang.gov.in',
  'myaadhaar.uidai.gov.in',
  'jaljeevanmission.gov.in',
  'esanjeevani.mohfw.gov.in',
  'abha.abdm.gov.in',
  'swachhbharatmission.ddws.gov.in',
  'www.india.gov.in',
  'igod.gov.in',
  'pensionersportal.gov.in',
  'www.epfindia.gov.in',
] as const

/**
 * Fallbacks for when a portal's own link does not open (down, blocked, or not loading inside the phone app). Both are the
 * Government of India's own directories (HTTP 200 on VERIFIED_ON): the person lands on a main site and finds the service there.
 */
export const FALLBACK_PORTALS = [
  { url: 'https://www.india.gov.in/', name: { en: 'National Portal of India (india.gov.in)', hi: 'भारत का राष्ट्रीय पोर्टल (india.gov.in)' } },
  { url: 'https://igod.gov.in/', name: { en: 'Government directory (igod.gov.in)', hi: 'सरकारी निदेशिका (igod.gov.in)' } },
] as const

export const SERVICES: readonly Service[] = [
  {
    id: 'awaaz-local-complaint',
    kind: 'awaaz',
    category: 'other',
    name: { en: 'File a local complaint here (by voice)', hi: 'अपनी शिकायत यहीं बोलकर दर्ज करें' },
    why: {
      en: 'Roads, streetlights, water, drains, garbage and power cuts are handled by your local body. Speak it once here and get a tracking ID.',
      hi: 'सड़क, बत्ती, पानी, नाली, कचरा और बिजली की समस्या आपके स्थानीय विभाग देखते हैं। यहाँ एक बार बोलें और ट्रैकिंग ID पाएँ।',
    },
    documents: { en: ['Place or landmark', 'A photo (optional)'], hi: ['जगह या पहचान', 'एक फोटो (ज़रूरी नहीं)'] },
    url: '/grievance',
    keywords: [
      'gaddha', 'gadda', 'गड्ढा', 'गड्ढे', 'pothole', 'road', 'sadak', 'सड़क', 'streetlight', 'street light', 'batti', 'बत्ती',
      'nali', 'naali', 'नाली', 'sewage', 'drain', 'gutter', 'kachra', 'कचरा', 'garbage', 'waste', 'गंदगी', 'gandagi',
      'pani nahi', 'paani nahi', 'पानी नहीं', 'water supply', 'no water', 'tap', 'नल', 'pipeline', 'leak', 'leakage',
      'bijli nahi', 'बिजली नहीं', 'power cut', 'transformer', 'light nahi', 'voltage', 'mohalla', 'गली', 'gali', 'colony',
    ],
    verifiedOn: VERIFIED_ON,
  },
  {
    id: 'cpgrams',
    kind: 'official',
    category: 'other',
    name: { en: 'Government grievance portal (CPGRAMS)', hi: 'सरकारी शिकायत पोर्टल (CPGRAMS)' },
    why: {
      en: 'Use this when a government office, scheme or pension has not helped you. Your complaint goes to the department concerned and you can track it.',
      hi: 'जब किसी सरकारी दफ़्तर, योजना या पेंशन में सुनवाई न हो रही हो तब इसे इस्तेमाल करें। शिकायत संबंधित विभाग को जाती है और आप उसे ट्रैक कर सकते हैं।',
    },
    documents: { en: ['Mobile number', 'Details of the office or scheme', 'Earlier complaint number, if any'], hi: ['मोबाइल नंबर', 'दफ़्तर या योजना की जानकारी', 'पुरानी शिकायत का नंबर, अगर हो'] },
    url: 'https://pgportal.gov.in/',
    keywords: [
      'complaint', 'shikayat', 'शिकायत', 'grievance', 'nobody listens', 'sunwai', 'सुनवाई', 'officer', 'adhikari', 'अधिकारी',
      'office', 'daftar', 'दफ्तर', 'दफ़्तर', 'bribe', 'rishwat', 'रिश्वत', 'corruption', 'bhrashtachar', 'भ्रष्टाचार', 'delay',
      'pension nahi', 'pension nahi aayi', 'पेंशन नहीं', 'pension not received', 'scheme not received', 'paise nahi aaye', 'पैसे नहीं आए',
    ],
    verifiedOn: VERIFIED_ON,
  },
  {
    id: 'ration',
    kind: 'official',
    category: 'ration_welfare',
    name: { en: 'Ration card and food grains (NFSA)', hi: 'राशन कार्ड और अनाज (NFSA)' },
    why: {
      en: 'For a new ration card, a name change, or problems getting grain at the ration shop. Rules and the application are run by your state.',
      hi: 'नया राशन कार्ड, नाम बदलना या राशन दुकान पर अनाज न मिलने की समस्या के लिए। आवेदन और नियम आपके राज्य के होते हैं।',
    },
    documents: { en: ['Aadhaar of family members', 'Address proof', 'Income proof if asked', 'Existing ration card number'], hi: ['परिवार के सदस्यों का आधार', 'पते का प्रमाण', 'माँगने पर आय प्रमाण', 'मौजूदा राशन कार्ड नंबर'] },
    url: 'https://nfsa.gov.in/',
    keywords: ['ration', 'राशन', 'ration card', 'राशन कार्ड', 'anaaj', 'anaj', 'अनाज', 'gehu', 'गेहूं', 'chawal', 'चावल', 'ration shop', 'dukan', 'fair price', 'nfsa'],
    verifiedOn: VERIFIED_ON,
  },
  {
    id: 'ration-portability',
    kind: 'official',
    category: 'ration_welfare',
    name: { en: 'Take ration in another state (One Nation One Ration Card)', hi: 'दूसरे राज्य में राशन लेना (एक देश एक राशन कार्ड)' },
    why: {
      en: 'If you have moved for work, check how to collect your ration from a shop where you live now.',
      hi: 'अगर आप काम के लिए दूसरी जगह गए हैं, तो जानें कि अपना राशन वहीं की दुकान से कैसे लें।',
    },
    documents: { en: ['Ration card number', 'Aadhaar linked to the card'], hi: ['राशन कार्ड नंबर', 'कार्ड से जुड़ा आधार'] },
    url: 'https://impds.nic.in/',
    keywords: ['migrant', 'migrated', 'dusre rajya', 'दूसरे राज्य', 'another state', 'portability', 'one nation one ration', 'mera ration', 'बाहर काम', 'bahar kaam', 'shift', 'moved to'],
    verifiedOn: VERIFIED_ON,
  },
  {
    id: 'pm-kisan',
    kind: 'official',
    category: 'ration_welfare',
    name: { en: 'PM-KISAN (income support for farmers)', hi: 'पीएम-किसान (किसानों को आय सहायता)' },
    why: {
      en: 'For farmer families: register, check your payment status, or fix details such as bank account and Aadhaar.',
      hi: 'किसान परिवारों के लिए: पंजीकरण, भुगतान की स्थिति देखना, या बैंक खाता और आधार की जानकारी ठीक करना।',
    },
    documents: { en: ['Aadhaar', 'Bank account number and IFSC', 'Land record details', 'Mobile number'], hi: ['आधार', 'बैंक खाता नंबर और IFSC', 'ज़मीन के कागज़ की जानकारी', 'मोबाइल नंबर'] },
    url: 'https://pmkisan.gov.in/',
    keywords: ['kisan', 'किसान', 'farmer', 'khet', 'खेत', 'fasal', 'फसल', 'pm kisan', 'samman nidhi', 'सम्मान निधि', 'kheti', 'खेती', 'installment', 'kist', 'किस्त'],
    verifiedOn: VERIFIED_ON,
  },
  {
    id: 'eshram',
    kind: 'official',
    category: 'ration_welfare',
    name: { en: 'e-Shram (register as an unorganised worker)', hi: 'ई-श्रम (असंगठित मज़दूर पंजीकरण)' },
    why: {
      en: 'For daily-wage and informal workers: register once and get a worker card that links you to welfare benefits.',
      hi: 'दिहाड़ी और असंगठित मज़दूरों के लिए: एक बार पंजीकरण करें और कल्याण योजनाओं से जुड़ने वाला कार्ड पाएँ।',
    },
    documents: { en: ['Aadhaar', 'Mobile number linked to Aadhaar', 'Bank account details'], hi: ['आधार', 'आधार से जुड़ा मोबाइल नंबर', 'बैंक खाते की जानकारी'] },
    url: 'https://eshram.gov.in/',
    keywords: ['mazdoor', 'मज़दूर', 'मजदूर', 'labour', 'labor', 'worker', 'dihadi', 'दिहाड़ी', 'rickshaw', 'रिक्शा', 'construction worker', 'majdoor', 'e-shram', 'eshram', 'ई-श्रम'],
    verifiedOn: VERIFIED_ON,
  },
  {
    id: 'jeevan-pramaan',
    kind: 'official',
    category: 'ration_welfare',
    name: { en: 'Jeevan Pramaan (life certificate for pensioners)', hi: 'जीवन प्रमाण (पेंशनभोगियों का जीवन प्रमाणपत्र)' },
    why: {
      en: 'Pensioners must prove every year that they are alive. This gives a digital certificate so the pension does not stop.',
      hi: 'पेंशनभोगियों को हर साल जीवित होने का प्रमाण देना होता है। इससे डिजिटल प्रमाणपत्र मिलता है ताकि पेंशन न रुके।',
    },
    documents: { en: ['Aadhaar', 'Pension payment order (PPO) number', 'Bank or pension account details', 'Mobile number'], hi: ['आधार', 'पेंशन भुगतान आदेश (PPO) नंबर', 'बैंक या पेंशन खाते की जानकारी', 'मोबाइल नंबर'] },
    url: 'https://jeevanpramaan.gov.in/',
    keywords: ['pension', 'पेंशन', 'pension stopped', 'pension band', 'pension ruk', 'पेंशन बंद', 'पेंशन रुक', 'life certificate', 'jeevan pramaan', 'जीवन प्रमाण', 'pensioner', 'पेंशनर', 'retired', 'retire', 'ppo', 'jivit praman', 'जीवित प्रमाण'],
    verifiedOn: VERIFIED_ON,
  },
  {
    id: 'rti',
    kind: 'official',
    category: 'other',
    name: { en: 'Right to Information (RTI Online)', hi: 'सूचना का अधिकार (RTI ऑनलाइन)' },
    why: {
      en: 'To ask a central government office in writing why something is pending or for a record. State offices use their own state RTI process.',
      hi: 'किसी केंद्र सरकार के दफ़्तर से लिखित में पूछने के लिए कि काम क्यों अटका है, या कोई रिकॉर्ड माँगने के लिए। राज्य के दफ़्तरों के लिए राज्य की अपनी RTI प्रक्रिया है।',
    },
    documents: { en: ['Clear question you want answered', 'Name of the office', 'Fee payment method (small fee; some people are exempt)'], hi: ['आपका स्पष्ट सवाल', 'दफ़्तर का नाम', 'शुल्क देने का तरीका (छोटा शुल्क; कुछ लोगों को छूट)'] },
    url: 'https://rtionline.gov.in/',
    keywords: ['rti', 'right to information', 'सूचना का अधिकार', 'jankari', 'जानकारी माँगना', 'kab tak', 'कब तक', 'no reply', 'jawab nahi', 'जवाब नहीं', 'reply nahi', 'file stuck', 'file atki', 'फाइल अटकी'],
    verifiedOn: VERIFIED_ON,
  },
  {
    id: 'consumer',
    kind: 'official',
    category: 'other',
    name: { en: 'National Consumer Helpline', hi: 'राष्ट्रीय उपभोक्ता हेल्पलाइन' },
    why: {
      en: 'For being overcharged, refused a refund, cheated on a bill or sold a faulty product or service.',
      hi: 'ज़्यादा पैसे लिए जाने, रिफंड न मिलने, बिल में धोखे या खराब सामान/सेवा बेचे जाने पर।',
    },
    documents: { en: ['Bill or receipt', 'Name of the seller or company', 'What went wrong and when'], hi: ['बिल या रसीद', 'दुकान या कंपनी का नाम', 'क्या गड़बड़ हुई और कब'] },
    url: 'https://consumerhelpline.gov.in/',
    keywords: ['refund', 'bill zyada', 'bill jyada', 'बिल ज़्यादा', 'बिल ज्यादा', 'overcharge', 'overcharged', 'cheated', 'dhokha', 'धोखा', 'fraud', 'consumer', 'उपभोक्ता', 'faulty', 'kharab saman', 'खराब सामान', 'bijli bill', 'बिजली बिल', 'electricity bill'],
    verifiedOn: VERIFIED_ON,
  },
  {
    id: 'police',
    kind: 'official',
    category: 'police_safety',
    name: { en: 'Police citizen services', hi: 'पुलिस नागरिक सेवाएँ' },
    why: {
      en: 'For reporting a lost item, checking a report, or other citizen services. In an emergency or danger, call your local emergency number first. Services differ by state.',
      hi: 'सामान खोने की रिपोर्ट, रिपोर्ट की स्थिति देखने या अन्य नागरिक सेवाओं के लिए। आपात स्थिति या खतरे में पहले अपना स्थानीय आपातकालीन नंबर मिलाएँ। सेवाएँ राज्य के अनुसार अलग हैं।',
    },
    documents: { en: ['Details of what happened, place and time', 'ID proof', 'Mobile number'], hi: ['क्या हुआ, जगह और समय की जानकारी', 'पहचान पत्र', 'मोबाइल नंबर'] },
    url: 'https://digitalpolice.gov.in/',
    keywords: ['police', 'पुलिस', 'fir', 'chori', 'चोरी', 'theft', 'stolen', 'lost', 'kho gaya', 'खो गया', 'gum', 'गुम', 'threat', 'dhamki', 'धमकी', 'harass', 'unsafe', 'thana', 'थाना'],
    verifiedOn: VERIFIED_ON,
  },
  {
    id: 'aadhaar',
    kind: 'official',
    category: 'ration_welfare',
    name: { en: 'myAadhaar (update, download, check status)', hi: 'myAadhaar (अपडेट, डाउनलोड, स्थिति)' },
    why: {
      en: 'To update your address or mobile number, download your Aadhaar, or check the status of an update.',
      hi: 'पता या मोबाइल नंबर अपडेट करने, आधार डाउनलोड करने या अपडेट की स्थिति देखने के लिए।',
    },
    documents: { en: ['Aadhaar number', 'Mobile number linked to Aadhaar (for OTP)', 'Address proof for an address change'], hi: ['आधार नंबर', 'आधार से जुड़ा मोबाइल (OTP के लिए)', 'पता बदलने के लिए पते का प्रमाण'] },
    url: 'https://myaadhaar.uidai.gov.in/',
    keywords: ['aadhaar', 'aadhar', 'आधार', 'address change', 'pata badlo', 'पता बदल', 'mobile link', 'update aadhaar', 'download aadhaar', 'uidai'],
    verifiedOn: VERIFIED_ON,
  },
  {
    id: 'umang',
    kind: 'official',
    category: 'other',
    name: { en: 'UMANG (many government services in one place)', hi: 'उमंग (कई सरकारी सेवाएँ एक जगह)' },
    why: {
      en: 'Pension, provident fund, certificates and many other services from different departments in one app and website.',
      hi: 'पेंशन, भविष्य निधि (PF), प्रमाणपत्र और कई विभागों की सेवाएँ एक ही ऐप और वेबसाइट पर।',
    },
    documents: { en: ['Mobile number', 'Aadhaar or other ID for some services'], hi: ['मोबाइल नंबर', 'कुछ सेवाओं के लिए आधार या अन्य पहचान'] },
    url: 'https://web.umang.gov.in/',
    keywords: ['umang', 'उमंग', 'pf', 'provident fund', 'पीएफ', 'certificate', 'praman patra', 'प्रमाणपत्र', 'digilocker', 'all services', 'sab seva'],
    verifiedOn: VERIFIED_ON,
  },
  {
    id: 'water-mission',
    kind: 'official',
    category: 'water_supply',
    name: { en: 'Tap water for rural homes (Jal Jeevan Mission)', hi: 'ग्रामीण घरों में नल का पानी (जल जीवन मिशन)' },
    why: {
      en: 'To find out whether your village has tap connections under the mission. For a broken or dry tap, file a local complaint here as well.',
      hi: 'यह जानने के लिए कि आपके गाँव में मिशन के तहत नल कनेक्शन है या नहीं। टूटे या सूखे नल की शिकायत यहाँ भी दर्ज करें।',
    },
    documents: { en: ['Village / panchayat name', 'Household details'], hi: ['गाँव / पंचायत का नाम', 'घर की जानकारी'] },
    url: 'https://jaljeevanmission.gov.in/',
    keywords: ['nal connection', 'नल कनेक्शन', 'har ghar jal', 'हर घर जल', 'tap connection', 'jal jeevan', 'जल जीवन', 'gaon mein pani', 'गाँव में पानी', 'village water', 'handpump', 'हैंडपंप'],
    verifiedOn: VERIFIED_ON,
  },
  {
    id: 'esanjeevani',
    kind: 'official',
    category: 'public_health',
    name: { en: 'e-Sanjeevani (free online doctor)', hi: 'ई-संजीवनी (मुफ़्त ऑनलाइन डॉक्टर)' },
    why: {
      en: 'Talk to a doctor from home by video or call. For emergencies go to the nearest hospital.',
      hi: 'घर बैठे वीडियो या कॉल पर डॉक्टर से बात करें। आपातकाल में नज़दीकी अस्पताल जाएँ।',
    },
    documents: { en: ['Mobile number', 'Your symptoms and any old prescriptions'], hi: ['मोबाइल नंबर', 'लक्षण और पुरानी पर्चियाँ'] },
    url: 'https://esanjeevani.mohfw.gov.in/',
    keywords: ['doctor', 'dr', 'डॉक्टर', 'bimar', 'बीमार', 'bukhar', 'बुखार', 'fever', 'dawai', 'दवा', 'medicine', 'illness', 'sick', 'consultation', 'ilaj', 'इलाज', 'hospital', 'अस्पताल'],
    verifiedOn: VERIFIED_ON,
  },
  {
    id: 'abha',
    kind: 'official',
    category: 'public_health',
    name: { en: 'ABHA health ID (Ayushman Bharat Digital Mission)', hi: 'आभा हेल्थ आईडी (आयुष्मान भारत डिजिटल मिशन)' },
    why: {
      en: 'A digital health ID to keep your health records in one place and share them with doctors when you choose.',
      hi: 'आपके स्वास्थ्य रिकॉर्ड एक जगह रखने और अपनी मर्ज़ी से डॉक्टर को दिखाने के लिए डिजिटल हेल्थ आईडी।',
    },
    documents: { en: ['Aadhaar or mobile number', 'Mobile number for OTP'], hi: ['आधार या मोबाइल नंबर', 'OTP के लिए मोबाइल नंबर'] },
    url: 'https://abha.abdm.gov.in/',
    keywords: ['abha', 'आभा', 'health id', 'health card', 'ayushman', 'आयुष्मान', 'health record', 'swasthya card', 'स्वास्थ्य कार्ड'],
    verifiedOn: VERIFIED_ON,
  },
  {
    id: 'sbm',
    kind: 'official',
    category: 'sanitation_waste',
    name: { en: 'Swachh Bharat Mission (toilets and sanitation)', hi: 'स्वच्छ भारत मिशन (शौचालय और सफाई)' },
    why: {
      en: 'To learn about toilet support and village sanitation. For garbage or drains in your street, file a local complaint here.',
      hi: 'शौचालय सहायता और गाँव की सफाई की जानकारी के लिए। गली के कचरे या नाली की शिकायत यहाँ दर्ज करें।',
    },
    documents: { en: ['Aadhaar', 'Bank account details', 'Household and village details'], hi: ['आधार', 'बैंक खाते की जानकारी', 'घर और गाँव की जानकारी'] },
    url: 'https://swachhbharatmission.ddws.gov.in/',
    keywords: ['shauchalay', 'शौचालय', 'toilet', 'latrine', 'swachh bharat', 'स्वच्छ भारत', 'open defecation', 'safai', 'सफाई', 'sanitation'],
    verifiedOn: VERIFIED_ON,
  },
  {
    id: 'cpengrams',
    kind: 'official',
    category: 'ration_welfare',
    name: { en: 'Central government pensioners: pension complaint (CPENGRAMS)', hi: 'केंद्र सरकार के पेंशनर: पेंशन शिकायत (CPENGRAMS)' },
    why: {
      en: 'For people who retired from a central government job and have a problem with their pension, for example it has stopped or is wrong.',
      hi: 'जो लोग केंद्र सरकार की नौकरी से रिटायर हुए हैं और पेंशन में दिक्कत है, जैसे रुक गई या गलत आ रही है।',
    },
    documents: { en: ['PPO number', 'Bank account details', 'Mobile number', 'Details of the problem'], hi: ['PPO नंबर', 'बैंक खाते की जानकारी', 'मोबाइल नंबर', 'समस्या की जानकारी'] },
    url: 'https://pensionersportal.gov.in/',
    keywords: ['cpengrams', 'ppo', 'central pension', 'central government pension', 'retired', 'retirement', 'pensioner', 'pensioners', 'पेंशनर', 'रिटायर', 'सेवानिवृत्त', 'ppo number'],
    verifiedOn: VERIFIED_ON,
  },
  {
    id: 'epfo',
    kind: 'official',
    category: 'ration_welfare',
    name: { en: 'Provident fund (EPFO) and EPFO pension', hi: 'भविष्य निधि (EPFO) और EPFO पेंशन' },
    why: {
      en: 'For provident fund (PF) money and the pension paid from a private or company job through EPFO.',
      hi: 'निजी या कंपनी की नौकरी की भविष्य निधि (PF) और EPFO से मिलने वाली पेंशन के लिए।',
    },
    documents: { en: ['UAN (universal account number)', 'PPO number, if you get a pension', 'Bank account details'], hi: ['UAN (यूनिवर्सल अकाउंट नंबर)', 'PPO नंबर, अगर पेंशन मिलती है', 'बैंक खाते की जानकारी'] },
    url: 'https://www.epfindia.gov.in/',
    keywords: ['epfo', 'pf', 'provident fund', 'uan', 'eps', 'pf nikalna', 'pf withdrawal', 'पीएफ', 'भविष्य निधि', 'ईपीएफओ', 'company pension', 'private job pension'],
    verifiedOn: VERIFIED_ON,
  },
]

export function getService(id: string): Service | undefined {
  return SERVICES.find((s) => s.id === id)
}

/** True for an internal path or an https URL on an allowlisted government host. */
export function isAllowedServiceUrl(url: string): boolean {
  if (url.startsWith('/') && !url.startsWith('//')) return true
  try {
    const u = new URL(url)
    return u.protocol === 'https:' && !u.username && !u.password && (ALLOWED_HOSTS as readonly string[]).includes(u.hostname)
  } catch {
    return false
  }
}
