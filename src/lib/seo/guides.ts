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
      en: 'Pension not credited? What to keep ready and where to complain, explained in simple words. Speak your problem and Awaaz helps you fill the form.',
      hi: 'पेंशन खाते में नहीं आई? क्या तैयार रखें और शिकायत कहाँ करें, आसान भाषा में। बोलकर अपनी समस्या बताइए, Awaaz फॉर्म भरने में मदद करता है।',
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
      en: 'Pothole in your street? Say it once, add a photo and location, and get a tracking ID. Explained simply, in Hindi and English.',
      hi: 'आपकी गली में गड्ढा है? एक बार बोलिए, फोटो और जगह जोड़िए और ट्रैकिंग ID पाइए। हिंदी और अंग्रेज़ी में आसान तरीका।',
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
      en: 'Drain blocked or garbage not picked up? Say it once and get a tracking ID. Simple steps in Hindi and English.',
      hi: 'नाली जाम है या कचरा नहीं उठ रहा? एक बार बोलिए और ट्रैकिंग ID पाइए। हिंदी और अंग्रेज़ी में आसान तरीका।',
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
      en: 'Water supply or power cut problem in your area? Say it once and get a tracking ID. Plain steps in Hindi and English.',
      hi: 'आपके इलाके में पानी या बिजली की दिक्कत है? एक बार बोलिए और ट्रैकिंग ID पाइए। हिंदी और अंग्रेज़ी में आसान तरीका।',
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
      en: 'e-Shram is a national database of unorganised workers. Registering is free on the official site.',
      hi: 'ई-श्रम असंगठित मज़दूरों का राष्ट्रीय डेटाबेस है। सरकारी साइट पर रजिस्ट्रेशन मुफ़्त है।',
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
