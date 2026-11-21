import { getService } from '@/lib/saathi/catalog'

/**
 * Help guides: one page per question people actually type into a search box. Each is tied to a service in the closed Saathi
 * catalog, so the links and "what to keep ready" lists come from verified data, never from this file. Text here only
 * explains the situation in plain words. No helpline numbers, no promised timelines (those differ by state and change).
 */
export interface Guide {
  slug: string
  /** Catalog service this guide points at, or null for the voice-filling explainer (points at /install). */
  serviceId: string | null
  /** Short page title (also the H1). */
  title: { en: string; hi: string }
  /** Meta description, one or two sentences. */
  description: { en: string; hi: string }
  /** Plain-language explanation shown under the title. */
  intro: { en: string; hi: string }
  steps: { en: string[]; hi: string[] }
  faqs: { q: { en: string; hi: string }; a: { en: string; hi: string } }[]
  keywords: { en: string[]; hi: string[] }
}

const sayAndSave = {
  en: 'Tell Awaaz your problem in your own words (Hindi, English and other languages work). It turns it into a clear complaint.',
  hi: 'अपनी समस्या अपनी भाषा में Awaaz को बोलकर बताइए। यह उसे साफ़ शिकायत में बदल देता है।',
}
const keepNumber = {
  en: 'Write down or take a photo of the complaint or registration number you get. You need it to follow up.',
  hi: 'जो शिकायत या रजिस्ट्रेशन नंबर मिले उसे लिख लें या उसकी फोटो ले लें। आगे पूछताछ में यही काम आएगा।',
}

export const GUIDES: readonly Guide[] = [
  {
    slug: 'pension-nahi-aayi-shikayat',
    serviceId: 'cpgrams',
    title: { en: 'Pension has not come: how to complain', hi: 'पेंशन नहीं आई: शिकायत कैसे करें' },
    description: {
      en: 'Pension not credited? What to keep ready and where to complain. Speak your problem and Awaaz helps you fill the form.',
      hi: 'पेंशन खाते में नहीं आई? क्या तैयार रखें और शिकायत कहाँ करें। बोलकर अपनी समस्या बताइए, Awaaz फॉर्म भरने में मदद करता है।',
    },
    intro: {
      en: 'If your pension has stopped or is late, first check with the bank or the office that pays it. If nobody helps, you can send a complaint to the government through the grievance portal. Which office handles it depends on the kind of pension (central, state or provident fund), so name the scheme or office in your complaint.',
      hi: 'अगर आपकी पेंशन रुक गई है या देर से आ रही है, तो पहले बैंक या पेंशन देने वाले दफ़्तर से पूछें। वहाँ सुनवाई न हो तो सरकारी शिकायत पोर्टल पर शिकायत भेज सकते हैं। पेंशन किस तरह की है (केंद्र, राज्य या भविष्य निधि) उससे तय होता है कि कौन सा दफ़्तर देखेगा, इसलिए शिकायत में योजना या दफ़्तर का नाम ज़रूर लिखें।',
    },
    steps: {
      en: ['Check your bank account and passbook, and ask the bank or paying office why it stopped.', sayAndSave.en, 'Open the official portal from the button below and submit it. You press Submit yourself.', keepNumber.en],
      hi: ['बैंक खाता और पासबुक देखें, और बैंक या पेंशन देने वाले दफ़्तर से रुकने की वजह पूछें।', sayAndSave.hi, 'नीचे के बटन से सरकारी पोर्टल खोलें और शिकायत जमा करें। Submit आप खुद दबाते हैं।', keepNumber.hi],
    },
    faqs: [
      {
        q: { en: 'Does Awaaz submit my complaint for me?', hi: 'क्या Awaaz मेरी शिकायत खुद जमा कर देता है?' },
        a: { en: 'No. Awaaz helps you say and fill it. You read everything and press Submit yourself.', hi: 'नहीं। Awaaz बोलने और भरने में मदद करता है। आप सब पढ़ते हैं और Submit खुद दबाते हैं।' },
      },
      {
        q: { en: 'Do I need to give my OTP or password to Awaaz?', hi: 'क्या Awaaz को OTP या पासवर्ड देना पड़ता है?' },
        a: { en: 'Never. Awaaz does not fill passwords, OTPs, Aadhaar, PAN or bank numbers. You type those yourself.', hi: 'कभी नहीं। Awaaz पासवर्ड, OTP, आधार, PAN या बैंक नंबर नहीं भरता। उन्हें आप खुद टाइप करते हैं।' },
      },
    ],
    keywords: {
      en: ['pension nahi aayi', 'pension not received complaint', 'how to complain pension not credited', 'old age pension stopped'],
      hi: ['पेंशन नहीं आई', 'पेंशन शिकायत कैसे करें', 'पेंशन बंद हो गई', 'वृद्धा पेंशन नहीं मिली'],
    },
  },
  {
    slug: 'sarkari-shikayat-kahan-kare',
    serviceId: 'cpgrams',
    title: { en: 'Where to file a complaint against a government office', hi: 'सरकारी दफ़्तर की शिकायत कहाँ करें' },
    description: {
      en: 'Nobody listens at the government office? Where to send a complaint online and how to follow it up. Speak it in your own language.',
      hi: 'सरकारी दफ़्तर में सुनवाई नहीं हो रही? शिकायत ऑनलाइन कहाँ भेजें और आगे कैसे पूछें। अपनी भाषा में बोलकर बताइए।',
    },
    intro: {
      en: 'The central government has one grievance portal where you can send a complaint about a department, scheme or officer. A good complaint says who, where, what happened and what you want done.',
      hi: 'केंद्र सरकार का एक शिकायत पोर्टल है जहाँ आप किसी विभाग, योजना या अधिकारी की शिकायत भेज सकते हैं। अच्छी शिकायत में लिखा होता है: किसने, कहाँ, क्या हुआ और आप क्या चाहते हैं।',
    },
    steps: {
      en: [sayAndSave.en, 'Keep the office name, date and any earlier complaint number ready.', 'Open the official portal from the button below and submit it yourself.', keepNumber.en],
      hi: [sayAndSave.hi, 'दफ़्तर का नाम, तारीख़ और पुरानी शिकायत का नंबर (अगर हो) तैयार रखें।', 'नीचे के बटन से सरकारी पोर्टल खोलें और खुद जमा करें।', keepNumber.hi],
    },
    faqs: [
      {
        q: { en: 'Can I complain about any matter?', hi: 'क्या मैं किसी भी विषय की शिकायत कर सकता हूँ?' },
        a: { en: 'Some matters (for example court cases) are not taken up by the portal. The portal lists what it does not accept.', hi: 'कुछ मामले (जैसे अदालती मामले) पोर्टल पर नहीं लिए जाते। पोर्टल पर बताया गया है कि क्या स्वीकार नहीं होता।' },
      },
    ],
    keywords: {
      en: ['government complaint online', 'cpgrams complaint how to', 'sarkari shikayat kahan kare', 'complaint against government officer'],
      hi: ['सरकारी शिकायत कहाँ करें', 'CPGRAMS पर शिकायत कैसे करें', 'सरकारी दफ़्तर की शिकायत', 'अधिकारी के खिलाफ शिकायत'],
    },
  },
  {
    slug: 'sadak-gaddha-shikayat',
    serviceId: 'awaaz-local-complaint',
    title: { en: 'Pothole or broken road: how to complain', hi: 'सड़क पर गड्ढा: शिकायत कैसे करें' },
    description: {
      en: 'Pothole in your street? Say it once, add a photo and location, and get a tracking ID.',
      hi: 'आपकी गली में गड्ढा है? एक बार बोलिए, फोटो और जगह जोड़िए और ट्रैकिंग ID पाइए।',
    },
    intro: {
      en: 'Roads are looked after by your city, town or village body, and the office differs from place to place. A complaint with a photo and the exact spot is easier to act on. Awaaz writes the complaint from what you say and gives you a tracking ID.',
      hi: 'सड़कों की देखभाल आपका नगर निगम, नगरपालिका या पंचायत करती है, और दफ़्तर हर जगह अलग होता है। फोटो और सही जगह के साथ शिकायत पर कार्रवाई आसान होती है। Awaaz आपकी बात से शिकायत लिखता है और ट्रैकिंग ID देता है।',
    },
    steps: {
      en: ['Tap Start below and describe where the pothole is, in your own words.', 'Add a photo and your location if you want (both optional; the photo has no hidden location data).', 'Check the written complaint and submit it.', 'Note the tracking ID and use Track to see its status.'],
      hi: ['नीचे Start दबाएँ और बताइए कि गड्ढा कहाँ है।', 'चाहें तो फोटो और अपनी जगह जोड़ें (दोनों ज़रूरी नहीं; फोटो में छिपी लोकेशन नहीं रहती)।', 'लिखी हुई शिकायत पढ़ें और जमा करें।', 'ट्रैकिंग ID लिख लें और Track से स्थिति देखें।'],
    },
    faqs: [
      {
        q: { en: 'Is this the city office’s own system?', hi: 'क्या यह नगर निगम का अपना सिस्टम है?' },
        a: { en: 'No. Awaaz is an independent project. It records your complaint and gives you a tracking ID. It does not claim a city office has received it.', hi: 'नहीं। Awaaz एक स्वतंत्र प्रोजेक्ट है। यह आपकी शिकायत दर्ज करता है और ट्रैकिंग ID देता है। यह दावा नहीं करता कि किसी शहर के दफ़्तर को शिकायत मिल गई।' },
      },
    ],
    keywords: {
      en: ['pothole complaint', 'road complaint india', 'gaddha shikayat', 'sadak kharab complaint', 'how to report a pothole'],
      hi: ['सड़क पर गड्ढा शिकायत', 'गड्ढे की शिकायत', 'सड़क खराब शिकायत', 'सड़क की शिकायत कैसे करें'],
    },
  },
  {
    slug: 'nali-kachra-safai-shikayat',
    serviceId: 'awaaz-local-complaint',
    title: { en: 'Blocked drain or garbage: how to complain', hi: 'नाली जाम या कचरा: शिकायत कैसे करें' },
    description: {
      en: 'Drain blocked or garbage not picked up? Say it once and get a tracking ID.',
      hi: 'नाली जाम है या कचरा नहीं उठ रहा? एक बार बोलिए और ट्रैकिंग ID पाइए।',
    },
    intro: {
      en: 'Drains and garbage are handled by your local body. Say where it is, how long it has been like this, and whether it is a health risk. Awaaz writes it up so you do not have to.',
      hi: 'नाली और कचरे की ज़िम्मेदारी स्थानीय निकाय की होती है। बताइए कि कहाँ है, कब से है और क्या इससे बीमारी का ख़तरा है। Awaaz इसे आपके लिए लिख देता है।',
    },
    steps: {
      en: ['Tap Start below and describe the problem and the place.', 'Add a photo if you can.', 'Check and submit the complaint.', 'Keep the tracking ID.'],
      hi: ['नीचे Start दबाएँ और समस्या और जगह बताइए।', 'हो सके तो फोटो जोड़ें।', 'शिकायत पढ़कर जमा करें।', 'ट्रैकिंग ID संभालकर रखें।'],
    },
    faqs: [],
    keywords: {
      en: ['nali band complaint', 'garbage not collected complaint', 'drain blocked complaint india', 'kachra shikayat'],
      hi: ['नाली जाम शिकायत', 'कचरा नहीं उठ रहा शिकायत', 'सफाई की शिकायत', 'गंदगी की शिकायत कैसे करें'],
    },
  },
  {
    slug: 'pani-bijli-nahi-aa-raha-shikayat',
    serviceId: 'awaaz-local-complaint',
    title: { en: 'No water or no electricity: how to complain', hi: 'पानी या बिजली नहीं आ रही: शिकायत कैसे करें' },
    description: {
      en: 'Water supply or power cut problem in your area? Say it once and get a tracking ID.',
      hi: 'आपके इलाके में पानी या बिजली की दिक्कत है? एक बार बोलिए और ट्रैकिंग ID पाइए।',
    },
    intro: {
      en: 'Water and power are supplied by different offices depending on where you live. Say what is wrong, since when, and who else on your street is affected. Awaaz turns it into a complaint with a tracking ID.',
      hi: 'आप कहाँ रहते हैं उसके हिसाब से पानी और बिजली के दफ़्तर अलग होते हैं। बताइए क्या दिक्कत है, कब से है और गली में और किसे परेशानी है। Awaaz इसे ट्रैकिंग ID वाली शिकायत बना देता है।',
    },
    steps: {
      en: ['Tap Start below and describe the problem.', 'Say the place and how many days it has lasted.', 'Check and submit the complaint.', 'Keep the tracking ID.'],
      hi: ['नीचे Start दबाएँ और समस्या बताइए।', 'जगह बताइए और कितने दिन से है।', 'शिकायत पढ़कर जमा करें।', 'ट्रैकिंग ID संभालकर रखें।'],
    },
    faqs: [],
    keywords: {
      en: ['no water supply complaint', 'power cut complaint', 'bijli nahi aa rahi shikayat', 'pani nahi aa raha complaint'],
      hi: ['पानी नहीं आ रहा शिकायत', 'बिजली नहीं आ रही शिकायत', 'बिजली कटौती शिकायत', 'पानी की समस्या शिकायत'],
    },
  },
  {
    slug: 'ration-card-shikayat',
    serviceId: 'ration',
    title: { en: 'Ration card or ration shop problem', hi: 'राशन कार्ड या राशन दुकान की समस्या' },
    description: {
      en: 'New ration card, name change, or grain not given at the ration shop? What to keep ready and where to go.',
      hi: 'नया राशन कार्ड, नाम बदलवाना, या राशन दुकान पर अनाज न मिलना? क्या तैयार रखें और कहाँ जाएँ।',
    },
    intro: {
      en: 'Ration rules and applications are run by your state, so the exact form differs. Start with the national site below to find your state’s page, and keep your documents ready.',
      hi: 'राशन के नियम और आवेदन आपके राज्य के होते हैं, इसलिए फॉर्म अलग-अलग होता है। नीचे की राष्ट्रीय साइट से अपने राज्य का पेज ढूँढें, और काग़ज़ तैयार रखें।',
    },
    steps: {
      en: ['Keep the documents listed below ready.', 'Open the official site from the button below.', 'Use Awaaz on that page to fill the form by voice (browser extension, or the app).', keepNumber.en],
      hi: ['नीचे लिखे काग़ज़ तैयार रखें।', 'नीचे के बटन से सरकारी साइट खोलें।', 'उस पेज पर Awaaz (ब्राउज़र एक्सटेंशन या ऐप) से बोलकर फॉर्म भरें।', keepNumber.hi],
    },
    faqs: [],
    keywords: {
      en: ['ration card complaint', 'ration shop complaint', 'ration card apply online', 'ration nahi mil raha'],
      hi: ['राशन कार्ड शिकायत', 'राशन दुकान की शिकायत', 'राशन कार्ड कैसे बनवाएँ', 'राशन नहीं मिल रहा'],
    },
  },
  {
    slug: 'voice-se-sarkari-form-kaise-bhare',
    serviceId: null,
    title: { en: 'Fill a government form by voice', hi: 'बोलकर सरकारी फॉर्म कैसे भरें' },
    description: {
      en: 'Cannot type or read a long form? Speak your answers in Hindi, English or another language and Awaaz fills the form. You press Submit yourself.',
      hi: 'लंबा फॉर्म पढ़ना या टाइप करना मुश्किल है? हिंदी, अंग्रेज़ी या दूसरी भाषा में बोलकर जवाब दीजिए, Awaaz फॉर्म भर देता है। Submit आप खुद दबाते हैं।',
    },
    intro: {
      en: 'Awaaz reads each question aloud, listens to your answer, and fills the field. It works on any website form through the browser extension, the phone app or a bookmark. It never fills passwords, OTPs or ID numbers and never presses Submit for you.',
      hi: 'Awaaz हर सवाल ज़ोर से पढ़ता है, आपका जवाब सुनता है और खाना भर देता है। यह किसी भी वेबसाइट के फॉर्म पर ब्राउज़र एक्सटेंशन, फोन ऐप या बुकमार्क से चलता है। यह पासवर्ड, OTP या ID नंबर कभी नहीं भरता और आपके लिए Submit नहीं दबाता।',
    },
    steps: {
      en: ['Install Awaaz on your phone or browser (see the install page).', 'Open the form you need.', 'Tap Awaaz and answer each question aloud.', 'Read the filled form, fix anything, then press Submit yourself.'],
      hi: ['अपने फोन या ब्राउज़र में Awaaz इंस्टॉल करें (Install पेज देखें)।', 'जो फॉर्म चाहिए उसे खोलें।', 'Awaaz दबाएँ और हर सवाल का जवाब बोलें।', 'भरा हुआ फॉर्म पढ़ें, ग़लती सुधारें और फिर Submit खुद दबाएँ।'],
    },
    faqs: [
      {
        q: { en: 'Which languages work?', hi: 'कौन सी भाषाएँ चलती हैं?' },
        a: { en: 'Hindi and English are tested most. Other languages depend on what your device’s speech recognition supports.', hi: 'हिंदी और अंग्रेज़ी सबसे ज़्यादा जाँची गई हैं। बाक़ी भाषाएँ आपके फोन या ब्राउज़र की आवाज़ पहचान पर निर्भर हैं।' },
      },
      {
        q: { en: 'Is it free?', hi: 'क्या यह मुफ़्त है?' },
        a: { en: 'Yes. There is no account and no sign-up.', hi: 'हाँ। कोई अकाउंट या साइन-अप नहीं है।' },
      },
    ],
    keywords: {
      en: ['fill government form by voice', 'voice form filling hindi', 'bolkar form bharo', 'voice typing sarkari form', 'form bharna nahi aata'],
      hi: ['बोलकर फॉर्म भरें', 'आवाज़ से फॉर्म भरना', 'सरकारी फॉर्म बोलकर भरें', 'फॉर्म भरना नहीं आता'],
    },
  },
  {
    slug: 'rti-online-kaise-kare',
    serviceId: 'rti',
    title: { en: 'How to file an RTI online', hi: 'RTI ऑनलाइन कैसे दाखिल करें' },
    description: {
      en: 'File a Right to Information request online: what to keep ready and where to go. Speak your question and Awaaz helps you write it.',
      hi: 'सूचना का अधिकार (RTI) ऑनलाइन कैसे दाखिल करें: क्या तैयार रखें और कहाँ जाएँ। अपना सवाल बोलिए, Awaaz लिखने में मदद करता है।',
    },
    intro: {
      en: 'An RTI asks a public office for information in writing. A short, specific question works best. Say your question aloud and Awaaz helps you phrase it.',
      hi: 'RTI में आप किसी सरकारी दफ़्तर से लिखित जानकारी माँगते हैं। छोटा और साफ़ सवाल सबसे अच्छा रहता है। अपना सवाल बोलिए, Awaaz उसे ठीक से लिखने में मदद करता है।',
    },
    steps: {
      en: ['Decide what exactly you want to know and from which office.', 'Keep the documents below ready.', 'Open the official site and fill the form, by voice if you like.', keepNumber.en],
      hi: ['तय करें कि किस दफ़्तर से ठीक-ठीक क्या जानना है।', 'नीचे लिखे काग़ज़ तैयार रखें।', 'सरकारी साइट खोलें और फॉर्म भरें, चाहें तो बोलकर।', keepNumber.hi],
    },
    faqs: [],
    keywords: {
      en: ['rti online kaise kare', 'how to file rti online', 'rti application online india'],
      hi: ['RTI ऑनलाइन कैसे करें', 'आरटीआई कैसे डालें', 'सूचना का अधिकार आवेदन'],
    },
  },
  {
    slug: 'jeevan-pramaan-kaise-banaye',
    serviceId: 'jeevan-pramaan',
    title: { en: 'How to make a Jeevan Pramaan (life certificate)', hi: 'जीवन प्रमाण पत्र कैसे बनाएँ' },
    description: {
      en: 'Pensioners: what a Jeevan Pramaan is, what to keep ready, and where to start.',
      hi: 'पेंशनर्स के लिए: जीवन प्रमाण क्या है, क्या तैयार रखें और कहाँ से शुरू करें।',
    },
    intro: {
      en: 'Pensioners must prove every year that they are alive so the pension continues. Jeevan Pramaan is the digital way to do it, without visiting the pension office.',
      hi: 'पेंशन चालू रखने के लिए पेंशनर को हर साल यह साबित करना होता है कि वे जीवित हैं। जीवन प्रमाण इसका डिजिटल तरीका है, जिसमें पेंशन दफ़्तर जाना ज़रूरी नहीं।',
    },
    steps: {
      en: ['Keep the documents below ready.', 'Open the official site from the button below.', 'Follow the steps there; use Awaaz to fill the form by voice.', keepNumber.en],
      hi: ['नीचे लिखे काग़ज़ तैयार रखें।', 'नीचे के बटन से सरकारी साइट खोलें।', 'वहाँ के चरणों का पालन करें; Awaaz से बोलकर फॉर्म भरें।', keepNumber.hi],
    },
    faqs: [],
    keywords: {
      en: ['jeevan pramaan kaise banaye', 'life certificate for pensioners online', 'digital life certificate'],
      hi: ['जीवन प्रमाण कैसे बनाएँ', 'जीवन प्रमाण पत्र ऑनलाइन', 'पेंशनर जीवन प्रमाण'],
    },
  },
  {
    slug: 'pm-kisan-registration-help',
    serviceId: 'pm-kisan',
    title: { en: 'PM-KISAN: registration and help', hi: 'पीएम-किसान: रजिस्ट्रेशन और मदद' },
    description: {
      en: 'Farmers: what to keep ready for PM-KISAN and where to register or check your details.',
      hi: 'किसानों के लिए: पीएम-किसान के लिए क्या तैयार रखें और कहाँ रजिस्टर करें या जानकारी देखें।',
    },
    intro: {
      en: 'PM-KISAN is an income support scheme for farmer families. Registration and checks are done on its official site.',
      hi: 'पीएम-किसान किसान परिवारों के लिए आय सहायता योजना है। रजिस्ट्रेशन और जाँच इसकी सरकारी साइट पर होती है।',
    },
    steps: {
      en: ['Keep the documents below ready.', 'Open the official site from the button below.', 'Fill the form, by voice if you like.', keepNumber.en],
      hi: ['नीचे लिखे काग़ज़ तैयार रखें।', 'नीचे के बटन से सरकारी साइट खोलें।', 'फॉर्म भरें, चाहें तो बोलकर।', keepNumber.hi],
    },
    faqs: [],
    keywords: {
      en: ['pm kisan registration', 'pm kisan help', 'kisan samman nidhi apply'],
      hi: ['पीएम किसान रजिस्ट्रेशन', 'पीएम किसान सम्मान निधि', 'किसान सम्मान निधि कैसे मिलेगी'],
    },
  },
  {
    slug: 'police-fir-online',
    serviceId: 'police',
    title: { en: 'Police services and online complaint', hi: 'पुलिस सेवाएँ और ऑनलाइन शिकायत' },
    description: {
      en: 'Where to find your state police’s online services and what to keep ready. In an emergency call your local emergency number first.',
      hi: 'अपने राज्य की पुलिस की ऑनलाइन सेवाएँ कहाँ मिलेंगी और क्या तैयार रखें। आपातकाल में पहले अपना स्थानीय आपातकालीन नंबर मिलाएँ।',
    },
    intro: {
      en: 'Awaaz is not for emergencies. If you are in danger, call the emergency number or go to the nearest police station. For non-emergency matters, use the official police services site below.',
      hi: 'Awaaz आपातकाल के लिए नहीं है। अगर आप ख़तरे में हैं तो आपातकालीन नंबर पर फोन करें या नज़दीकी थाने जाएँ। बाक़ी मामलों के लिए नीचे की सरकारी पुलिस सेवा साइट इस्तेमाल करें।',
    },
    steps: {
      en: ['If it is an emergency, call the emergency number now.', 'Keep the documents below ready.', 'Open the official site and follow the steps.', keepNumber.en],
      hi: ['आपातकाल हो तो अभी आपातकालीन नंबर मिलाएँ।', 'नीचे लिखे काग़ज़ तैयार रखें।', 'सरकारी साइट खोलें और चरणों का पालन करें।', keepNumber.hi],
    },
    faqs: [],
    keywords: {
      en: ['online fir india', 'police online complaint', 'police services online'],
      hi: ['ऑनलाइन एफआईआर', 'पुलिस ऑनलाइन शिकायत', 'पुलिस सेवाएँ ऑनलाइन'],
    },
  },
  {
    slug: 'consumer-complaint-helpline',
    serviceId: 'consumer',
    title: { en: 'Consumer complaint: where to go', hi: 'उपभोक्ता शिकायत: कहाँ जाएँ' },
    description: {
      en: 'Cheated by a seller or got a bad product or service? Where to complain and what to keep ready.',
      hi: 'दुकानदार ने धोखा दिया या ख़राब सामान या सेवा मिली? शिकायत कहाँ करें और क्या तैयार रखें।',
    },
    intro: {
      en: 'The National Consumer Helpline takes complaints about products and services. Keep the bill or order proof and the seller’s details.',
      hi: 'राष्ट्रीय उपभोक्ता हेल्पलाइन सामान और सेवाओं की शिकायतें लेती है। बिल या ऑर्डर का सबूत और विक्रेता की जानकारी तैयार रखें।',
    },
    steps: {
      en: ['Keep the documents below ready.', 'Open the official site from the button below.', 'Describe the problem by voice or by typing.', keepNumber.en],
      hi: ['नीचे लिखे काग़ज़ तैयार रखें।', 'नीचे के बटन से सरकारी साइट खोलें।', 'समस्या बोलकर या टाइप करके बताएँ।', keepNumber.hi],
    },
    faqs: [],
    keywords: {
      en: ['consumer complaint online india', 'consumer helpline complaint', 'cheated by shopkeeper complaint'],
      hi: ['उपभोक्ता शिकायत', 'उपभोक्ता हेल्पलाइन', 'दुकानदार ने धोखा दिया शिकायत'],
    },
  },
  {
    slug: 'eshram-card-kaise-banaye',
    serviceId: 'eshram',
    title: { en: 'e-Shram card for unorganised workers', hi: 'असंगठित मज़दूरों के लिए ई-श्रम कार्ड' },
    description: {
      en: 'Daily-wage and unorganised workers: what e-Shram is, what to keep ready, and where to register.',
      hi: 'दिहाड़ी और असंगठित मज़दूरों के लिए: ई-श्रम क्या है, क्या तैयार रखें और कहाँ रजिस्टर करें।',
    },
    intro: {
      en: 'e-Shram is a national database of unorganised workers. You register on the official site.',
      hi: 'ई-श्रम असंगठित मज़दूरों का राष्ट्रीय डेटाबेस है। रजिस्ट्रेशन सरकारी साइट पर होता है।',
    },
    steps: {
      en: ['Keep the documents below ready.', 'Open the official site from the button below.', 'Fill the form, by voice if you like.', keepNumber.en],
      hi: ['नीचे लिखे काग़ज़ तैयार रखें।', 'नीचे के बटन से सरकारी साइट खोलें।', 'फॉर्म भरें, चाहें तो बोलकर।', keepNumber.hi],
    },
    faqs: [],
    keywords: {
      en: ['e shram card registration', 'eshram card kaise banaye', 'labour card online'],
      hi: ['ई-श्रम कार्ड कैसे बनाएँ', 'ई श्रम रजिस्ट्रेशन', 'मज़दूर कार्ड ऑनलाइन'],
    },
  },
  {
    slug: 'vridha-vidhwa-pension-band-ho-gayi',
    serviceId: 'cpgrams',
    title: { en: 'Old age or widow pension stopped: what to do', hi: 'वृद्धा या विधवा पेंशन बंद हो गई: क्या करें' },
    description: {
      en: 'Old age, widow or other scheme pension stopped or not coming? What to check first and where to complain.',
      hi: 'वृद्धा, विधवा या दूसरी योजना की पेंशन बंद हो गई या नहीं आ रही? पहले क्या देखें और शिकायत कहाँ करें।',
    },
    intro: {
      en: 'These pensions are run by your state, so the rules differ. Check three things first: whether the money went to a different or closed bank account, whether your Aadhaar or bank details need to be linked or updated, and whether a yearly life or identity check is pending. If none of that explains it, send a complaint and name the scheme.',
      hi: 'ये पेंशन आपके राज्य की होती हैं, इसलिए नियम अलग-अलग हैं। पहले तीन बातें देखें: पैसा किसी दूसरे या बंद बैंक खाते में तो नहीं गया, आधार या बैंक की जानकारी जुड़वानी या सुधरवानी तो नहीं है, और सालाना जीवन या पहचान की जाँच बाकी तो नहीं है। इनसे वजह न मिले तो योजना का नाम लिखकर शिकायत भेजें।',
    },
    steps: {
      en: ['Check your passbook and ask the bank whether any money came in.', 'Ask the office that runs your state’s pension scheme if a form or check is pending.', sayAndSave.en, 'Open the official portal from the button below and submit it yourself.', keepNumber.en],
      hi: ['पासबुक देखें और बैंक से पूछें कि कोई पैसा आया या नहीं।', 'अपने राज्य की पेंशन योजना चलाने वाले दफ़्तर से पूछें कि कोई फॉर्म या जाँच बाकी है क्या।', sayAndSave.hi, 'नीचे के बटन से सरकारी पोर्टल खोलें और खुद जमा करें।', keepNumber.hi],
    },
    faqs: [
      {
        q: { en: 'Which office decides this?', hi: 'यह कौन सा दफ़्तर तय करता है?' },
        a: { en: 'It depends on your state’s scheme. Name the scheme and your district in the complaint.', hi: 'यह आपके राज्य की योजना पर निर्भर है। शिकायत में योजना का नाम और अपना ज़िला लिखें।' },
      },
    ],
    keywords: {
      en: ['vridha pension band ho gayi', 'old age pension stopped', 'widow pension not coming', 'vidhwa pension nahi aa rahi'],
      hi: ['वृद्धा पेंशन बंद हो गई', 'विधवा पेंशन नहीं आ रही', 'पेंशन बंद क्या करें', 'वृद्धावस्था पेंशन शिकायत'],
    },
  },
  {
    slug: 'form-bharna-nahi-aata',
    serviceId: null,
    title: { en: 'Cannot read or fill a form? Fill it by speaking', hi: 'फॉर्म भरना नहीं आता? बोलकर भरें' },
    description: {
      en: 'If you cannot read or type a long form, speak your answers and Awaaz fills it for you. Free, no account. A helper app for people who find forms hard.',
      hi: 'अगर लंबा फॉर्म पढ़ना या टाइप करना नहीं आता, तो बोलकर जवाब दीजिए और Awaaz फॉर्म भर देता है। मुफ़्त, बिना अकाउंट। जिन्हें फॉर्म मुश्किल लगते हैं उनके लिए।',
    },
    intro: {
      en: 'Many people can speak clearly but find forms hard to read or type. Awaaz asks each question aloud and fills in your spoken answer. You can also ask a family member to sit with you: you speak, and you both check the filled form before you press Submit.',
      hi: 'कई लोग साफ़ बोल लेते हैं पर फॉर्म पढ़ना या टाइप करना उन्हें मुश्किल लगता है। Awaaz हर सवाल ज़ोर से पूछता है और आपका बोला हुआ जवाब भर देता है। परिवार का कोई सदस्य साथ बैठ सकता है: आप बोलें और Submit दबाने से पहले दोनों भरा हुआ फॉर्म जाँच लें।',
    },
    steps: {
      en: ['Install Awaaz on your phone (see the install page).', 'Open the form you need.', 'Tap Awaaz and speak your answers one by one.', 'Check the filled form with someone you trust, then press Submit yourself.'],
      hi: ['अपने फोन पर Awaaz इंस्टॉल करें (Install पेज देखें)।', 'जो फॉर्म चाहिए उसे खोलें।', 'Awaaz दबाएँ और एक-एक करके जवाब बोलें।', 'किसी भरोसेमंद व्यक्ति के साथ भरा हुआ फॉर्म जाँचें, फिर Submit खुद दबाएँ।'],
    },
    faqs: [
      {
        q: { en: 'Can someone steal my details?', hi: 'क्या कोई मेरी जानकारी चुरा सकता है?' },
        a: { en: 'Awaaz never asks for passwords, OTPs, Aadhaar, PAN or bank numbers. You type those yourself. Read the privacy page for details.', hi: 'Awaaz पासवर्ड, OTP, आधार, PAN या बैंक नंबर कभी नहीं माँगता। वे आप खुद टाइप करते हैं। विस्तार के लिए गोपनीयता पेज पढ़ें।' },
      },
    ],
    keywords: {
      en: ['form bharna nahi aata', 'app to fill form for illiterate', 'help filling government form', 'voice app for people who cannot read'],
      hi: ['फॉर्म भरना नहीं आता', 'अनपढ़ के लिए फॉर्म भरने वाला ऐप', 'सरकारी फॉर्म भरने में मदद', 'बोलकर फॉर्म भरने वाला ऐप'],
    },
  },
  {
    slug: 'cpgrams-complaint-status-kaise-dekhe',
    serviceId: 'cpgrams',
    title: { en: 'How to check your government complaint status', hi: 'सरकारी शिकायत की स्थिति कैसे देखें' },
    description: {
      en: 'Filed a complaint on the government grievance portal? Keep the registration number and use it to check what happened.',
      hi: 'सरकारी शिकायत पोर्टल पर शिकायत की थी? रजिस्ट्रेशन नंबर संभालकर रखें और उसी से स्थिति देखें।',
    },
    intro: {
      en: 'When you submit a complaint on the portal you get a registration number. That number is how you follow up, so write it down or photograph it the same minute. The status is checked on the official portal itself.',
      hi: 'पोर्टल पर शिकायत जमा करते ही आपको एक रजिस्ट्रेशन नंबर मिलता है। आगे पूछताछ इसी नंबर से होती है, इसलिए उसी समय उसे लिख लें या फोटो ले लें। स्थिति सरकारी पोर्टल पर ही देखी जाती है।',
    },
    steps: {
      en: ['Find the registration number you noted when you filed.', 'Open the official portal from the button below.', 'Look for the option to check status and enter that number.', 'If nothing has moved for a long time, you can send a reminder or file again, naming the earlier number.'],
      hi: ['शिकायत करते समय जो रजिस्ट्रेशन नंबर लिखा था उसे ढूँढें।', 'नीचे के बटन से सरकारी पोर्टल खोलें।', 'स्थिति देखने का विकल्प ढूँढें और वही नंबर डालें।', 'बहुत समय तक कुछ न हो तो याद दिलाएँ या पुराना नंबर लिखकर दोबारा शिकायत करें।'],
    },
    faqs: [],
    keywords: {
      en: ['cpgrams complaint status', 'check grievance status online', 'shikayat ka status kaise dekhe'],
      hi: ['शिकायत की स्थिति कैसे देखें', 'CPGRAMS स्टेटस', 'शिकायत नंबर से स्टेटस'],
    },
  },
  {
    slug: 'aadhaar-update-kaise-kare',
    serviceId: 'aadhaar',
    title: { en: 'Update your Aadhaar address or mobile number', hi: 'आधार में पता या मोबाइल नंबर कैसे बदलें' },
    description: {
      en: 'Where to update or download your Aadhaar and what to keep ready. Awaaz never asks for your Aadhaar number.',
      hi: 'आधार अपडेट या डाउनलोड कहाँ करें और क्या तैयार रखें। Awaaz आपका आधार नंबर कभी नहीं माँगता।',
    },
    intro: {
      en: 'The official myAadhaar site is where you update an address, download your Aadhaar or check the status of an update. You will need to type your own Aadhaar number and the OTP yourself: Awaaz does not fill those.',
      hi: 'आधार का पता बदलना, आधार डाउनलोड करना या अपडेट की स्थिति देखना सरकारी myAadhaar साइट पर होता है। अपना आधार नंबर और OTP आपको खुद टाइप करना होगा: Awaaz इन्हें नहीं भरता।',
    },
    steps: {
      en: ['Keep the documents below ready.', 'Open the official site from the button below.', 'Type your Aadhaar number and OTP yourself.', keepNumber.en],
      hi: ['नीचे लिखे काग़ज़ तैयार रखें।', 'नीचे के बटन से सरकारी साइट खोलें।', 'अपना आधार नंबर और OTP खुद टाइप करें।', keepNumber.hi],
    },
    faqs: [],
    keywords: {
      en: ['aadhaar address update online', 'aadhaar mobile number change', 'download aadhaar'],
      hi: ['आधार में पता बदलें', 'आधार मोबाइल नंबर अपडेट', 'आधार डाउनलोड कैसे करें'],
    },
  },
  {
    slug: 'esanjeevani-online-doctor',
    serviceId: 'esanjeevani',
    title: { en: 'Talk to a doctor online for free (e-Sanjeevani)', hi: 'मुफ़्त ऑनलाइन डॉक्टर से बात करें (ई-संजीवनी)' },
    description: {
      en: 'Government online doctor consultation from home. What to keep ready and where to start. For emergencies, go to the nearest hospital.',
      hi: 'घर बैठे सरकारी ऑनलाइन डॉक्टर परामर्श। क्या तैयार रखें और कहाँ से शुरू करें। आपातकाल में नज़दीकी अस्पताल जाएँ।',
    },
    intro: {
      en: 'e-Sanjeevani lets you talk to a doctor by video or call without travelling. It is not for emergencies. If it is serious, go to the nearest hospital.',
      hi: 'ई-संजीवनी से आप बिना सफ़र किए वीडियो या कॉल पर डॉक्टर से बात कर सकते हैं। यह आपातकाल के लिए नहीं है। हालत गंभीर हो तो नज़दीकी अस्पताल जाएँ।',
    },
    steps: {
      en: ['If it is an emergency, go to the nearest hospital now.', 'Keep the items below ready.', 'Open the official site from the button below.', 'Follow the steps to register and wait for the doctor.'],
      hi: ['आपातकाल हो तो अभी नज़दीकी अस्पताल जाएँ।', 'नीचे लिखी चीज़ें तैयार रखें।', 'नीचे के बटन से सरकारी साइट खोलें।', 'रजिस्टर करने के चरण पूरे करें और डॉक्टर का इंतज़ार करें।'],
    },
    faqs: [],
    keywords: {
      en: ['esanjeevani online doctor', 'free online doctor consultation india', 'government telemedicine'],
      hi: ['ई-संजीवनी ऑनलाइन डॉक्टर', 'मुफ़्त डॉक्टर परामर्श ऑनलाइन', 'घर बैठे डॉक्टर से बात'],
    },
  },
  {
    slug: 'street-light-kharab-shikayat',
    serviceId: 'awaaz-local-complaint',
    title: { en: 'Street light not working: how to complain', hi: 'स्ट्रीट लाइट खराब है: शिकायत कैसे करें' },
    description: {
      en: 'Street light broken or off in your lane? Say where it is, add a photo, and get a tracking ID.',
      hi: 'आपकी गली की स्ट्रीट लाइट खराब है या बंद है? बताइए कहाँ है, फोटो जोड़िए और ट्रैकिंग ID पाइए।',
    },
    intro: {
      en: 'Street lights are looked after by your local body, and the office differs by town. A complaint that names the exact pole or landmark and how long it has been dark is easier to act on. Awaaz writes it from what you say.',
      hi: 'स्ट्रीट लाइट की देखभाल आपका स्थानीय निकाय करता है, और दफ़्तर हर शहर में अलग होता है। जिस शिकायत में खंभे या पहचान की जगह और बंद रहने के दिन लिखे हों, उस पर काम करना आसान होता है। Awaaz आपकी बात से शिकायत लिख देता है।',
    },
    steps: {
      en: ['Tap Start below and say where the light is and since when it has been off.', 'Add a photo if you can, taken in daylight so the pole is visible.', 'Check the written complaint and submit it.', 'Keep the tracking ID.'],
      hi: ['नीचे Start दबाएँ और बताइए कि लाइट कहाँ है और कब से बंद है।', 'हो सके तो फोटो जोड़ें, दिन में खींचें ताकि खंभा दिखे।', 'लिखी हुई शिकायत पढ़कर जमा करें।', 'ट्रैकिंग ID संभालकर रखें।'],
    },
    faqs: [],
    keywords: {
      en: ['street light not working complaint', 'streetlight kharab shikayat', 'street light band hai complaint kaise kare'],
      hi: ['स्ट्रीट लाइट खराब शिकायत', 'गली की बत्ती बंद शिकायत', 'स्ट्रीट लाइट की शिकायत कैसे करें'],
    },
  },
  {
    slug: 'nagar-nigam-shikayat-kaise-kare',
    serviceId: 'awaaz-local-complaint',
    title: { en: 'How to complain to the municipal corporation', hi: 'नगर निगम में शिकायत कैसे करें' },
    description: {
      en: 'Road, drain, garbage, water or light problem in your area? What a good complaint to the local body contains, and how to make one by voice.',
      hi: 'आपके इलाके में सड़क, नाली, कचरे, पानी या बत्ती की समस्या है? नगर निगम को अच्छी शिकायत में क्या लिखें और बोलकर कैसे बनाएँ।',
    },
    intro: {
      en: 'Local problems go to your municipal corporation, municipality or panchayat. Each has its own helpline or app, so check what yours uses. Whichever way you send it, a complaint works best when it says what is wrong, exactly where, since when, and what you want done.',
      hi: 'इलाके की समस्याएँ आपके नगर निगम, नगरपालिका या पंचायत के पास जाती हैं। हर एक की अपनी हेल्पलाइन या ऐप होता है, इसलिए पता करें कि आपका क्या इस्तेमाल करता है। जिस भी तरीके से भेजें, शिकायत तब सबसे अच्छी रहती है जब उसमें लिखा हो कि क्या ख़राब है, ठीक कहाँ, कब से, और आप क्या चाहते हैं।',
    },
    steps: {
      en: ['Note what is wrong, the exact place and a landmark, and since when.', 'Tap Start below and say it in your own words. Awaaz drafts the complaint.', 'Add a photo if you can, then check and submit.', 'Keep the tracking ID, and also find out your local body’s own helpline or app.'],
      hi: ['क्या ख़राब है, ठीक जगह और पहचान, और कब से, यह ध्यान में रखें।', 'नीचे Start दबाएँ और अपने शब्दों में बोलें। Awaaz शिकायत का मसौदा बना देता है।', 'हो सके तो फोटो जोड़ें, फिर पढ़कर जमा करें।', 'ट्रैकिंग ID रखें, और अपने स्थानीय निकाय की हेल्पलाइन या ऐप भी पता कर लें।'],
    },
    faqs: [
      {
        q: { en: 'Does Awaaz send this to the municipal corporation?', hi: 'क्या Awaaz यह नगर निगम को भेजता है?' },
        a: { en: 'No. Awaaz keeps your complaint and gives you a tracking ID. It is not connected to any local body, so also use your local body’s own channel.', hi: 'नहीं। Awaaz आपकी शिकायत दर्ज रखता है और ट्रैकिंग ID देता है। यह किसी स्थानीय निकाय से जुड़ा नहीं है, इसलिए अपने निकाय का अपना माध्यम भी इस्तेमाल करें।' },
      },
    ],
    keywords: {
      en: ['nagar nigam shikayat kaise kare', 'municipal corporation complaint online', 'local body complaint how to'],
      hi: ['नगर निगम में शिकायत कैसे करें', 'नगर निगम शिकायत ऑनलाइन', 'नगरपालिका में शिकायत'],
    },
  },
  {
    slug: 'shikayat-patra-kaise-likhe',
    serviceId: 'awaaz-local-complaint',
    title: { en: 'How to write a complaint letter (and do it by voice)', hi: 'शिकायत पत्र कैसे लिखें (और बोलकर बनाएँ)' },
    description: {
      en: 'What to put in a complaint letter to any office, in order. Or just speak it and Awaaz writes it for you.',
      hi: 'किसी भी दफ़्तर को शिकायत पत्र में क्या-क्या लिखें, क्रम से। या बस बोल दीजिए और Awaaz आपके लिए लिख देता है।',
    },
    intro: {
      en: 'A complaint letter does not need fancy words. Offices act faster on a short letter that is clear about who, where, what happened and what you want. If writing is hard, say it aloud and let Awaaz turn it into a clear complaint.',
      hi: 'शिकायत पत्र में भारी शब्दों की ज़रूरत नहीं होती। जो पत्र साफ़ बताए कि किसने, कहाँ, क्या हुआ और आप क्या चाहते हैं, उस पर दफ़्तर जल्दी ध्यान देता है। लिखना मुश्किल हो तो बोल दीजिए, Awaaz उसे साफ़ शिकायत में बदल देता है।',
    },
    steps: {
      en: ['Address it to the right office or officer, with your name and phone number.', 'Say what happened, with the date and place.', 'Say what you want done.', 'Attach copies of any papers or photos, and keep a copy of the letter.'],
      hi: ['सही दफ़्तर या अधिकारी को संबोधित करें, अपना नाम और फोन नंबर लिखें।', 'क्या हुआ, तारीख़ और जगह के साथ बताएँ।', 'लिखें कि आप क्या कार्रवाई चाहते हैं।', 'ज़रूरी काग़ज़ों या फोटो की प्रतियाँ लगाएँ, और पत्र की एक प्रति अपने पास रखें।'],
    },
    faqs: [],
    keywords: {
      en: ['shikayat patra kaise likhe', 'complaint letter format hindi', 'how to write a complaint letter to an office'],
      hi: ['शिकायत पत्र कैसे लिखें', 'शिकायत पत्र का प्रारूप', 'शिकायत पत्र हिंदी में'],
    },
  },
  {
    slug: 'rti-jawab-nahi-aaya',
    serviceId: 'rti',
    title: { en: 'RTI reply not received: what to do', hi: 'RTI का जवाब नहीं आया: क्या करें' },
    description: {
      en: 'Filed an RTI and got no reply, or an unsatisfactory one? What the next step is and what to keep ready.',
      hi: 'RTI लगाई पर जवाब नहीं आया, या जवाब से संतुष्टि नहीं? अगला कदम क्या है और क्या तैयार रखें।',
    },
    intro: {
      en: 'The RTI law sets a time limit for the office to reply. If the time passes with no reply, or the reply is incomplete, you can send a first appeal to a senior officer in the same department. Your original RTI number and date are needed. The online site shown here is for central government offices. State offices use their own state process.',
      hi: 'RTI कानून में जवाब देने के लिए दफ़्तर को समय सीमा दी गई है। समय निकल जाए और जवाब न आए, या जवाब अधूरा हो, तो आप उसी विभाग के किसी वरिष्ठ अधिकारी को पहली अपील भेज सकते हैं। इसके लिए आपकी मूल RTI का नंबर और तारीख़ चाहिए। यहाँ दिखाई गई ऑनलाइन साइट केंद्र सरकार के दफ़्तरों के लिए है। राज्य के दफ़्तरों की अपनी राज्य प्रक्रिया होती है।',
    },
    steps: {
      en: ['Find your RTI registration number and the date you filed.', 'Check whether you really got no reply, or an incomplete one.', 'Open the official site from the button below and look for the appeal option.', 'Note the appeal number you get.'],
      hi: ['अपनी RTI का रजिस्ट्रेशन नंबर और जमा करने की तारीख़ ढूँढें।', 'देखें कि सच में जवाब नहीं आया या अधूरा आया।', 'नीचे के बटन से सरकारी साइट खोलें और अपील का विकल्प ढूँढें।', 'अपील का जो नंबर मिले उसे लिख लें।'],
    },
    faqs: [],
    keywords: {
      en: ['rti jawab nahi aaya', 'rti reply not received what to do', 'rti first appeal kaise kare'],
      hi: ['RTI का जवाब नहीं आया', 'RTI की पहली अपील कैसे करें', 'आरटीआई जवाब नहीं मिला क्या करें'],
    },
  },
  {
    slug: 'pm-kisan-kist-nahi-aayi',
    serviceId: 'pm-kisan',
    title: { en: 'PM-KISAN payment not received: what to check', hi: 'पीएम-किसान की किस्त नहीं आई: क्या देखें' },
    description: {
      en: 'PM-KISAN instalment not in your account? What to check first and where to look at your payment status.',
      hi: 'पीएम-किसान की किस्त खाते में नहीं आई? पहले क्या देखें और भुगतान की स्थिति कहाँ दिखेगी।',
    },
    intro: {
      en: 'When a payment does not arrive, the cause is often in the details: a wrong or closed bank account, an Aadhaar or bank name that does not match, or a verification step still pending. The official site shows your payment status and lets you correct some details.',
      hi: 'किस्त न आने की वजह अक्सर जानकारी में होती है: बैंक खाता ग़लत या बंद होना, आधार और बैंक में नाम न मिलना, या कोई सत्यापन बाकी होना। सरकारी साइट पर आपकी भुगतान की स्थिति दिखती है और कुछ जानकारी सुधारी जा सकती है।',
    },
    steps: {
      en: ['Check your passbook for the latest credit.', 'Keep the documents below ready.', 'Open the official site from the button below and check your status.', 'If a detail is wrong, correct it there. Awaaz can help you fill the form by voice.'],
      hi: ['पासबुक में पिछली जमा देखें।', 'नीचे लिखे काग़ज़ तैयार रखें।', 'नीचे के बटन से सरकारी साइट खोलें और अपनी स्थिति देखें।', 'कोई जानकारी ग़लत हो तो वहीं सुधारें। Awaaz बोलकर फॉर्म भरने में मदद कर सकता है।'],
    },
    faqs: [],
    keywords: {
      en: ['pm kisan kist nahi aayi', 'pm kisan payment not received', 'pm kisan status check'],
      hi: ['पीएम किसान की किस्त नहीं आई', 'पीएम किसान स्टेटस', 'किसान सम्मान निधि पैसे नहीं आए'],
    },
  },
  {
    slug: 'ppo-number-kya-hota-hai',
    serviceId: 'cpengrams',
    title: { en: 'What is a PPO number and where to find it', hi: 'PPO नंबर क्या होता है और कहाँ मिलेगा' },
    description: {
      en: 'PPO means Pension Payment Order. Why you need the number when you complain about your pension, and where it is usually found.',
      hi: 'PPO यानी पेंशन भुगतान आदेश। पेंशन की शिकायत में यह नंबर क्यों चाहिए और आमतौर पर कहाँ मिलता है।',
    },
    intro: {
      en: 'The Pension Payment Order (PPO) is the order that sets your pension. Its number identifies your pension, so pension offices and portals ask for it. It is usually printed on the pension papers you received on retirement, and on some pension slips. If you cannot find it, ask the bank or office that pays you.',
      hi: 'पेंशन भुगतान आदेश (PPO) वह आदेश है जिससे आपकी पेंशन तय होती है। उसका नंबर आपकी पेंशन की पहचान है, इसलिए पेंशन दफ़्तर और पोर्टल उसे माँगते हैं। वह आमतौर पर रिटायरमेंट पर मिले पेंशन के काग़ज़ों पर और कुछ पेंशन पर्चियों पर छपा होता है। न मिले तो पेंशन देने वाले बैंक या दफ़्तर से पूछें।',
    },
    steps: {
      en: ['Look for the number on your retirement pension papers.', 'If you cannot find it, ask the bank or office that pays your pension.', 'Use it when you file a pension complaint on the official portal.', keepNumber.en],
      hi: ['रिटायरमेंट के पेंशन काग़ज़ों में यह नंबर ढूँढें।', 'न मिले तो पेंशन देने वाले बैंक या दफ़्तर से पूछें।', 'सरकारी पोर्टल पर पेंशन शिकायत करते समय इसे डालें।', keepNumber.hi],
    },
    faqs: [],
    keywords: {
      en: ['ppo number kya hota hai', 'what is ppo number pension', 'ppo number kaise pata kare'],
      hi: ['PPO नंबर क्या होता है', 'पीपीओ नंबर कैसे पता करें', 'पेंशन PPO नंबर'],
    },
  },
  {
    slug: 'ration-card-mein-naam-jodna',
    serviceId: 'ration',
    title: { en: 'Add a name to your ration card', hi: 'राशन कार्ड में नाम कैसे जोड़ें' },
    description: {
      en: 'Newborn, new bride or new family member? What to keep ready to add a name to the ration card and where to start.',
      hi: 'नया बच्चा, नई बहू या परिवार का नया सदस्य? राशन कार्ड में नाम जोड़ने के लिए क्या तैयार रखें और कहाँ से शुरू करें।',
    },
    intro: {
      en: 'Adding or removing a name is handled by your state’s food department, so the form and the papers asked differ. Start at the national site below to find your state’s page, and keep the papers for the person being added ready.',
      hi: 'नाम जोड़ना या हटाना आपके राज्य का खाद्य विभाग करता है, इसलिए फॉर्म और माँगे जाने वाले काग़ज़ अलग-अलग होते हैं। नीचे की राष्ट्रीय साइट से अपने राज्य का पेज ढूँढें और जुड़ने वाले व्यक्ति के काग़ज़ तैयार रखें।',
    },
    steps: {
      en: ['Keep your ration card number and the new member’s Aadhaar or birth papers ready.', 'Open the official site from the button below and find your state’s page.', 'Fill the form, by voice if you like, and type any ID numbers yourself.', keepNumber.en],
      hi: ['अपना राशन कार्ड नंबर और नए सदस्य का आधार या जन्म के काग़ज़ तैयार रखें।', 'नीचे के बटन से सरकारी साइट खोलें और अपने राज्य का पेज ढूँढें।', 'फॉर्म भरें, चाहें तो बोलकर, और ID नंबर खुद टाइप करें।', keepNumber.hi],
    },
    faqs: [],
    keywords: {
      en: ['ration card mein naam kaise jode', 'add name in ration card', 'ration card new member add'],
      hi: ['राशन कार्ड में नाम कैसे जोड़ें', 'राशन कार्ड में बच्चे का नाम जोड़ना', 'राशन कार्ड में नया सदस्य'],
    },
  },
  {
    slug: 'ration-dukandar-ration-nahi-de-raha',
    serviceId: 'ration',
    title: { en: 'Ration shop owner is not giving ration', hi: 'राशन दुकानदार राशन नहीं दे रहा' },
    description: {
      en: 'The ration shop says no stock, gives less, or turns you away? What to note down and where to complain.',
      hi: 'राशन दुकानदार कहता है माल नहीं है, कम देता है, या लौटा देता है? क्या लिखकर रखें और शिकायत कहाँ करें।',
    },
    intro: {
      en: 'Ration shops run under your state’s food department, which also takes complaints. Before you complain, note the shop name or number, the date, what you were told and what you should have received. Names and dates make a complaint much harder to ignore.',
      hi: 'राशन की दुकानें आपके राज्य के खाद्य विभाग के अधीन चलती हैं, और शिकायतें भी वही देखता है। शिकायत से पहले दुकान का नाम या नंबर, तारीख़, आपसे क्या कहा गया और आपको क्या मिलना चाहिए था, यह लिख लें। नाम और तारीख़ वाली शिकायत को अनदेखा करना मुश्किल होता है।',
    },
    steps: {
      en: ['Note the shop, the date, what you were told and what you were due.', 'Keep your ration card number ready.', 'Open the official site from the button below and find your state’s complaint option, or use Saathi to find the right service.', keepNumber.en],
      hi: ['दुकान, तारीख़, आपसे क्या कहा गया और आपको क्या मिलना था, यह लिख लें।', 'अपना राशन कार्ड नंबर तैयार रखें।', 'नीचे के बटन से सरकारी साइट खोलें और अपने राज्य का शिकायत विकल्प ढूँढें, या साथी से सही सेवा पूछें।', keepNumber.hi],
    },
    faqs: [],
    keywords: {
      en: ['ration dukandar ration nahi de raha', 'ration shop not giving ration complaint', 'ration dealer complaint'],
      hi: ['राशन दुकानदार राशन नहीं दे रहा', 'राशन डीलर की शिकायत', 'राशन कम देता है शिकायत'],
    },
  },
  {
    slug: 'abha-card-kaise-banaye',
    serviceId: 'abha',
    title: { en: 'How to make an ABHA health ID', hi: 'आभा हेल्थ आईडी कैसे बनाएँ' },
    description: {
      en: 'What an ABHA health ID is, what you need to make one, and where to start.',
      hi: 'आभा हेल्थ आईडी क्या है, बनाने के लिए क्या चाहिए और कहाँ से शुरू करें।',
    },
    intro: {
      en: 'ABHA is a digital health ID. It keeps your health records in one place, and you choose when to share them with a doctor. You make it on the official site.',
      hi: 'आभा एक डिजिटल हेल्थ आईडी है। इसमें आपके स्वास्थ्य रिकॉर्ड एक जगह रहते हैं, और डॉक्टर को कब दिखाने हैं यह आप तय करते हैं। इसे सरकारी साइट पर बनाया जाता है।',
    },
    steps: {
      en: ['Keep the documents below ready.', 'Open the official site from the button below.', 'Type your Aadhaar or mobile number and the OTP yourself.', keepNumber.en],
      hi: ['नीचे लिखे काग़ज़ तैयार रखें।', 'नीचे के बटन से सरकारी साइट खोलें।', 'आधार या मोबाइल नंबर और OTP खुद टाइप करें।', keepNumber.hi],
    },
    faqs: [],
    keywords: {
      en: ['abha card kaise banaye', 'abha health id registration', 'ayushman bharat health account create'],
      hi: ['आभा कार्ड कैसे बनाएँ', 'आभा हेल्थ आईडी', 'हेल्थ आईडी कार्ड कैसे बनवाएँ'],
    },
  },
]

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug)
}

export type Lang = 'en' | 'hi'

/** Absolute path of a guide page for a language. */
export function guidePath(slug: string, lang: Lang): string {
  return lang === 'hi' ? `/hi/help/${slug}` : `/help/${slug}`
}

/** Resolve the catalog service behind a guide. Throws at build time if a guide points at a missing service. */
export function serviceFor(guide: Guide) {
  if (guide.serviceId === null) return undefined
  const s = getService(guide.serviceId)
  if (!s) throw new Error(`Guide ${guide.slug} points at unknown service ${guide.serviceId}`)
  return s
}
