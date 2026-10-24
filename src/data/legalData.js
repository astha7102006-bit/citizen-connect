/**
 * CitizenConnect — Legal Guidance & Free Legal Aid Data Repository
 *
 * All lawyer listings and simulated contacts are STRICTLY FICTIONAL for demonstration purposes.
 * Statutory references (RTI Act 2005, Legal Services Authorities Act 1987, etc.) and
 * official government portal links are real public resources for citizen reference.
 *
 * DISCLAIMER: General information only, not legal advice. Does not promise a legal outcome.
 */

export const LEGAL_DISCLAIMER_EN =
  'General information, not legal advice. Does not promise a legal outcome. Procedural requirements vary by state and jurisdiction. Always verify requirements with designated legal authorities.';

export const LEGAL_DISCLAIMER_HI =
  'सामान्य सूचना, कानूनी सलाह नहीं। किसी कानूनी परिणाम का वादा नहीं किया जाता। प्रक्रियात्मक आवश्यकताएं राज्य और क्षेत्राधिकार के अनुसार भिन्न हो सकती हैं। हमेशा संबंधित कानूनी प्राधिकरण से पुष्टि करें।';

// ─── 1. STATUTORY & INSTITUTIONAL REMEDIES ────────────────────────────────────
export const STATUTORY_REMEDIES = [
  {
    id: 'rti_application',
    category: 'RTI',
    title: 'Right to Information (RTI) Application',
    titleHi: 'सूचना का अधिकार (RTI) आवेदन',
    provision: 'Section 6(1) of the RTI Act, 2005',
    provisionHi: 'सूचना का अधिकार अधिनियम, 2005 की धारा 6(1)',
    relevantCategories: ['all', 'bribe', 'delay', 'duties', 'refusal'],
    relevantStages: [1, 2, 3],
    timeframe: '30 Days Mandatory Response (48 Hrs for Life/Liberty)',
    timeframeHi: '30 दिन अनिवार्य प्रतिक्रिया (जीवन/स्वतंत्रता के लिए 48 घंटे)',
    officialSource: 'RTI Online Portal (Govt. of India)',
    officialSourceUrl: 'https://rtionline.gov.in',
    summary:
      'If official reasons for delay or inaction are not disclosed, file an RTI application to inspect file notings, movement registers, and official correspondence.',
    summaryHi:
      'यदि देरी या कार्रवाई न करने का आधिकारिक कारण नहीं बताया गया है, तो फ़ाइल नोटिंग्स, मूवमेंट रजिस्टर और पत्राचार की जांच के लिए आरटीआई आवेदन दाखिल करें।',
    generalSteps: [
      'Identify the Public Information Officer (PIO) or Central PIO of the concerned department.',
      'Draft a clear, factual query seeking specific documents (e.g. daily progress report, reasons for delay).',
      'Pay prescribed fee (₹10 for Central Ministries; BPL cardholders exempt from fees).',
      'Submit online via rtionline.gov.in or send by Registered/Speed Post with postal order.',
    ],
    generalStepsHi: [
      'संबंधित विभाग के जन सूचना अधिकारी (PIO) की पहचान करें।',
      'विशिष्ट दस्तावेज़ों की मांग करते हुए एक स्पष्ट प्रश्न तैयार करें (जैसे दैनिक प्रगति रिपोर्ट)।',
      'निर्धारित शुल्क का भुगतान करें (केंद्र सरकार के लिए ₹10; गरीबी रेखा से नीचे वाले नागरिकों के लिए निःशुल्क)।',
      'rtionline.gov.in के माध्यम से ऑनलाइन या पंजीकृत डाक द्वारा जमा करें।',
    ],
    documentsChecklist: [
      'RTI Application in prescribed format',
      'Application fee receipt / Indian Postal Order (IPO) or BPL card copy',
      'Copies of prior complaint acknowledgement or reference numbers',
    ],
    documentsChecklistHi: [
      'निर्धारित प्रारूप में आरटीआई आवेदन',
      'आवेदन शुल्क रसीद / पोस्टल ऑर्डर या बीपीएल कार्ड प्रति',
      'पूर्व शिकायत पावती या संदर्भ संख्या की प्रतियां',
    ],
    deadlinesVerified:
      'PIO must respond within 30 days of receipt. If life or liberty is involved, response required within 48 hours. First Appeal must be filed within 30 days of deadline expiry.',
    deadlinesVerifiedHi:
      'पीआईओ को प्राप्ति के 30 दिनों के भीतर जवाब देना होगा। यदि जीवन या स्वतंत्रता से जुड़ा मामला है, तो 48 घंटों में। प्रथम अपील 30 दिनों के भीतर की जानी चाहिए।',
  },
  {
    id: 'rti_appeal',
    category: 'RTI_APPEAL',
    title: 'First Statutory Appeal Under RTI',
    titleHi: 'आरटीआई के तहत प्रथम वैधानिक अपील',
    provision: 'Section 19(1) of the RTI Act, 2005',
    provisionHi: 'सूचना का अधिकार अधिनियम, 2005 की धारा 19(1)',
    relevantCategories: ['all', 'bribe', 'delay', 'duties'],
    relevantStages: [2, 3],
    timeframe: '30 to 45 Days Appellate Decision',
    timeframeHi: '30 से 45 दिनों में अपीलीय निर्णय',
    officialSource: 'Central Information Commission (CIC)',
    officialSourceUrl: 'https://cic.gov.in',
    summary:
      'If the PIO rejects your RTI without valid statutory exemption or fails to reply within 30 days, escalate directly to the designated First Appellate Authority (FAA).',
    summaryHi:
      'यदि पीआईओ बिना वैध कारण आरटीआई खारिज करता है या 30 दिनों में उत्तर नहीं देता है, तो नामित प्रथम अपीलीय प्राधिकारी (FAA) के समक्ष अपील करें।',
    generalSteps: [
      'Obtain name and designation of the First Appellate Authority (senior officer in the same department).',
      'Draft appeal memo stating date of initial RTI, non-receipt of reply or grounds of dissatisfaction.',
      'No appeal fee is required for Central government First Appeals.',
      'Submit within 30 days from the date when response was due or received.',
    ],
    generalStepsHi: [
      'प्रथम अपीलीय प्राधिकारी का विवरण प्राप्त करें।',
      'अपील ज्ञापन तैयार करें जिसमें पूर्व आरटीआई की तिथि और असंतोष के कारण दर्ज हों।',
      'केंद्र सरकार की प्रथम अपील के लिए कोई शुल्क आवश्यक नहीं है।',
      'जवाब की निर्धारित तिथि समाप्त होने के 30 दिनों के भीतर जमा करें।',
    ],
    documentsChecklist: [
      'Copy of original RTI Section 6(1) application',
      'Proof of dispatch / speed post tracking or online registration receipt',
      'Copy of PIO reply (if any received)',
    ],
    documentsChecklistHi: [
      'मूल आरटीआई आवेदन की प्रति',
      'डाक प्रेषण रसीद या ऑनलाइन पंजीकरण रसीद',
      'पीआईओ के उत्तर की प्रति (यदि प्राप्त हुआ हो)',
    ],
    deadlinesVerified:
      'FAA must decide the appeal within 30 days (extendable up to 45 days with recorded reasons). Second appeal to CIC/SIC within 90 days of FAA order.',
    deadlinesVerifiedHi:
      'प्रथम अपीलीय अधिकारी को 30 दिनों (अधिकतम 45 दिनों) में निर्णय देना होगा। केंद्रीय सूचना आयोग में दूसरी अपील 90 दिनों में की जा सकती है।',
  },
  {
    id: 'cpgrams',
    category: 'CPGRAMS',
    title: 'CPGRAMS Central Public Grievance Redressal',
    titleHi: 'सीपीजीआरएएमएस (CPGRAMS) केंद्रीय लोक शिकायत निवारण',
    provision: 'Administrative Grievance Portal (DARPG, Govt. of India)',
    provisionHi: 'प्रशासनिक शिकायत निवारण पोर्टल (DARPG, भारत सरकार)',
    relevantCategories: ['delay', 'duties', 'refusal', 'misbehaviour'],
    relevantStages: [1, 2],
    timeframe: '30 Days Standard Grievance Resolution Window',
    timeframeHi: '30 दिन मानक शिकायत निवारण समय-सीमा',
    officialSource: 'DARPG CPGRAMS Portal',
    officialSourceUrl: 'https://pgportal.gov.in',
    summary:
      'National integrated portal connecting Central ministries, departments, public sector banks, and state governments for escalating administrative defaults.',
    summaryHi:
      'केंद्रीय मंत्रालयों, बैंकों और राज्य सरकारों के खिलाफ प्रशासनिक शिकायतों के लिए राष्ट्रीय एकीकृत पोर्टल।',
    generalSteps: [
      'Register account with mobile number and email on pgportal.gov.in.',
      'Select relevant Ministry / Department / State Government from directory.',
      'Enter concise grievance text and upload supporting documents (PDF up to 4MB).',
      'Obtain unique registration number (e.g. PMOPG/...) and track online status.',
    ],
    generalStepsHi: [
      'pgportal.gov.in पर मोबाइल नंबर से पंजीकरण करें।',
      'संबंधित मंत्रालय/विभाग/राज्य सरकार चुनें।',
      'शिकायत का संक्षिप्त विवरण लिखें और संबंधित दस्तावेज़ अपलोड करें।',
      'पंजीकरण संख्या प्राप्त कर ऑनलाइन स्थिति ट्रैक करें।',
    ],
    documentsChecklist: [
      'Grievance summary narrative',
      'Proof of earlier representation to local department',
      'Receipts or correspondence with date and official reference',
    ],
    documentsChecklistHi: [
      'शिकायत का संक्षिप्त विवरण',
      'स्थानीय विभाग को दिए गए पूर्व पत्र का प्रमाण',
      'आधिकारिक संदर्भ और दिनांक वाली रसीदें',
    ],
    deadlinesVerified:
      'DARPG guidelines mandate redressal within a maximum target of 30 days. Citizen feedback and appeal mechanism available if resolution is unsatisfactory.',
    deadlinesVerifiedHi:
      'डीएआरपीआईजी दिशानिर्देशों के तहत अधिकतम 30 दिनों में निवारण का लक्ष्य है। असंतोषजनक समाधान पर अपील की सुविधा है।',
  },
  {
    id: 'right_to_services',
    category: 'RTS',
    title: 'State Right to Public Services (RTS) Guarantee',
    titleHi: 'राज्य लोक सेवा गारंटी (Right to Services) अधिनियम',
    provision: 'State-specific Public Services Guarantee Acts (in 20+ Indian States)',
    provisionHi: 'राज्य लोक सेवा गारंटी अधिनियम (20 से अधिक राज्यों में लागू)',
    relevantCategories: ['delay', 'refusal', 'duties'],
    relevantStages: [1, 2],
    timeframe: 'Service-Specific Statutory Limits (typically 7 to 30 Days)',
    timeframeHi: 'सेवा-विशिष्ट वैधानिक सीमाएं (आमतौर पर 7 से 30 दिन)',
    officialSource: 'Department of Administrative Reforms / State RTS Portals',
    officialSourceUrl: 'https://aaplesarkar.mahaonline.gov.in',
    summary:
      'Statutory guarantee ensuring government services (certificates, mutations, utility connections) are delivered within fixed statutory days, with penalties on defaulting officials.',
    summaryHi:
      'सरकारी सेवाएं (प्रमाणपत्र, दाखिल-खारिज, बिजली-पानी कनेक्शन) निर्धारित दिनों में प्रदान करने की कानूनी गारंटी, चूक करने वाले अधिकारियों पर जुर्माने का प्रावधान।',
    generalSteps: [
      'Check whether the applied service is notified under your State RTS schedule.',
      'Ensure you possess the official acknowledgment slip containing application date and unique tracking ID.',
      'If statutory timeline lapses without delivery, file First Appeal under RTS to the designated appellate officer.',
      'Claim statutory compensation/penalty against defaulting officer if delay was unjustified.',
    ],
    generalStepsHi: [
      'जांचें कि क्या आपकी सेवा राज्य लोक सेवा गारंटी अनुसूची में अधिसूचित है।',
      'आवेदन रसीद और ट्रैकिंग आईडी सुरक्षित रखें।',
      'समय सीमा समाप्त होने पर नामित अपीलीय अधिकारी के पास प्रथम अपील करें।',
      'अनुचित देरी होने पर दोषी अधिकारी से वैधानिक हर्जाने की मांग करें।',
    ],
    documentsChecklist: [
      'Official application submission receipt with date and time stamp',
      'Copy of State RTS notification for the applied service',
      'Identity and address verification documents',
    ],
    documentsChecklistHi: [
      'तारीख और मुहर सहित आधिकारिक आवेदन प्राप्ति रसीद',
      'संबंधित सेवा की राज्य आरटीएस अधिसूचना की प्रति',
      'पहचान और पते का प्रमाण',
    ],
    deadlinesVerified:
      'Fixed statutory timeline per service (e.g., Caste Certificate: 15-21 days; Income Certificate: 15 days; Electricity meter: 7-15 days depending on state rules).',
    deadlinesVerifiedHi:
      'प्रत्येक सेवा के लिए निश्चित वैधानिक समय सीमा (जैसे जाति प्रमाणपत्र 15-21 दिन; आय प्रमाणपत्र 15 दिन)।',
  },
  {
    id: 'acb_vigilance',
    category: 'ACB',
    title: 'State Anti-Corruption Bureau (ACB) / State Vigilance',
    titleHi: 'राज्य भ्रष्टाचार निरोधक ब्यूरो (ACB) / सतर्कता विभाग',
    provision: 'Prevention of Corruption Act, 1988 (as amended in 2018)',
    provisionHi: 'भ्रष्टाचार निवारण अधिनियम, 1988 (2018 संशोधन सहित)',
    relevantCategories: ['bribe', 'corruption'],
    relevantStages: [1, 2, 3],
    timeframe: 'Immediate for Trap Operations; Preliminary Enquiry within statutory manual',
    timeframeHi: 'ट्रैप ऑपरेशन के लिए तत्काल; वैधानिक मैनुअल के तहत प्रारंभिक जांच',
    officialSource: 'Central Vigilance Commission (CVC)',
    officialSourceUrl: 'https://cvc.gov.in',
    summary:
      'Specialized police wing empowered to lay traps and register FIRs against public servants demanding bribes or amassing disproportionate assets.',
    summaryHi:
      'रिश्वत मांगने वाले या आय से अधिक संपत्ति अर्जित करने वाले लोक सेवकों के खिलाफ जाल बिछाने (ट्रैप) और प्राथमिकी दर्ज करने वाली विशेष पुलिस शाखा।',
    generalSteps: [
      'Do NOT pay the demanded bribe. Immediate reporting is critical for trap legality.',
      'Approach nearest ACB unit or call the State Anti-Corruption toll-free helpline (often 1064).',
      'Provide written complaint detailing official name, post, office address, and exact demand.',
      'Cooperate with ACB officers for phenolphthalein/chemical trap or audio-video electronic trap.',
    ],
    generalStepsHi: [
      'मांगी गई रिश्वत का भुगतान न करें। कानूनी ट्रैप के लिए तत्काल शिकायत आवश्यक है।',
      'निकटतम एसीबी कार्यालय से संपर्क करें या टोल-फ्री 1064 पर कॉल करें।',
      'अधिकारी का नाम, पद और रिश्वत की मांग का विवरण देते हुए लिखित शिकायत दें।',
      'रासायनिक या इलेक्ट्रॉनिक ट्रैप ऑपरेशन में अधिकारियों का सहयोग करें।',
    ],
    documentsChecklist: [
      'Written complaint with specific details of demand and circumstance',
      'Audio / video / message recordings of bribe solicitation (if available)',
      'Government documents / applications being held hostage by the official',
    ],
    documentsChecklistHi: [
      'रिश्वत की मांग और परिस्थितियों का लिखित विवरण',
      'मांग से जुड़े ऑडियो/वीडियो/मैसेज रिकॉर्डिंग (यदि उपलब्ध हों)',
      'संबंधित सरकारी आवेदन या दस्तावेज़ जो रोके गए हैं',
    ],
    deadlinesVerified:
      'Trap actions must be initiated before bribe transfer takes place. Preliminary enquiry under PC Act Section 17A where applicable.',
    deadlinesVerifiedHi:
      'रिश्वत हस्तांतरण से पूर्व ट्रैप कार्रवाई शुरू होनी चाहिए। आवश्यकता पड़ने पर धारा 17A के तहत प्रारंभिक जांच।',
  },
  {
    id: 'lokayukta',
    category: 'LOKAYUKTA',
    title: 'State Lokayukta / Lokpal Ombudsman',
    titleHi: 'राज्य लोकायुक्त / लोकपाल लोकपाल',
    provision: 'State Lokayukta Acts & The Lokpal and Lokayuktas Act, 2013',
    provisionHi: 'राज्य लोकायुक्त अधिनियम और लोकपाल तथा लोकायुक्त अधिनियम, 2013',
    relevantCategories: ['bribe', 'corruption', 'duties'],
    relevantStages: [2, 3],
    timeframe: 'Statutory Inquiry with Search & Seizure Powers',
    timeframeHi: 'तलाशी और जब्ती शक्तियों के साथ वैधानिक जांच',
    officialSource: 'Lokpal of India Official Portal',
    officialSourceUrl: 'https://lokpal.gov.in',
    summary:
      'Independent statutory anti-corruption authority with independent investigative police wing, with jurisdiction over ministers, MLAs, and public servants.',
    summaryHi:
      'मंत्रियों, विधायकों और लोक सेवकों के भ्रष्टाचार की जांच करने वाला स्वतंत्र वैधानिक निकाय जिसमें स्वतंत्र जांच विंग होती है।',
    generalSteps: [
      'Obtain statutory complaint format from the state Lokayukta Registrar office or official portal.',
      'Execute a sworn affidavit on non-judicial stamp paper affirming all stated facts are true.',
      'Specify allegations of corruption, abuse of power, or deliberate maladministration.',
      'Submit to Registrar, Office of the Lokayukta, personally or via registered post.',
    ],
    generalStepsHi: [
      'लोकायुक्त पोर्टल या कार्यालय से वैधानिक शिकायत प्रारूप प्राप्त करें।',
      'गैर-न्यायिक स्टांप पेपर पर शपथ पत्र (एफिडेविट) निष्पादित करें।',
      'भ्रष्टाचार, पद के दुरुपयोग या कुप्रशासन का ठोस विवरण दें।',
      'लोकायुक्त कार्यालय के रजिस्ट्रार को व्यक्तिगत रूप से या डाक से जमा करें।',
    ],
    documentsChecklist: [
      'Statutory Complaint Form with sworn verification affidavit',
      'Documentary evidence showing official misconduct',
      'Proof of identity and residential address of complainant',
    ],
    documentsChecklistHi: [
      'शपथ पत्र सहित वैधानिक शिकायत पत्र',
      'अधिकारी के कदाचार को प्रमाणित करने वाले दस्तावेज़',
      'शिकायतकर्ता का पहचान व निवास प्रमाण',
    ],
    deadlinesVerified:
      'Statutory limitation period: Typically within 5 years of the date of the alleged action/incident (Section 53 Lokpal Act / respective state Lokayukta acts).',
    deadlinesVerifiedHi:
      'वैधानिक सीमा: घटना की तिथि से आमतौर पर 5 वर्ष के भीतर (लोकपाल अधिनियम धारा 53)।',
  },
  {
    id: 'police_complaints_authority',
    category: 'PCA',
    title: 'Police Complaints Authority (PCA)',
    titleHi: 'पुलिस शिकायत प्राधिकरण (Police Complaints Authority)',
    provision: 'State Police Acts / Prakash Singh Directives (Supreme Court of India, 2006)',
    provisionHi: 'राज्य पुलिस अधिनियम / प्रकाश सिंह बनाम भारत संघ (सर्वोच्च न्यायालय, 2006)',
    relevantCategories: ['police', 'refusal', 'misbehaviour', 'duties'],
    relevantStages: [1, 2, 3],
    timeframe: 'Independent Investigation into Police Misconduct',
    timeframeHi: 'पुलिस कदाचार की स्वतंत्र जांच',
    officialSource: 'Ministry of Home Affairs / State Home Dept PCA Directory',
    officialSourceUrl: 'https://mha.gov.in',
    summary:
      'Independent judicial body at District and State level headed by retired judges to investigate serious police misconduct, refusal to register FIR, and custodial atrocities.',
    summaryHi:
      'सेवानिवृत्त न्यायाधीश की अध्यक्षता में जिला और राज्य स्तर पर पुलिस कदाचार, एफआईआर दर्ज न करने और हिरासत में प्रताड़ना की जांच करने वाली स्वतंत्र संस्था।',
    generalSteps: [
      'First send formal complaint to the District Superintendent of Police (SP) or Commissioner.',
      'If no action within 15–30 days, submit formal complaint to the District Police Complaints Authority (DPCA).',
      'For allegations involving officers of DSP rank and above, submit to State Police Complaints Authority (SPCA).',
      'Appear for inquiry hearings when summoned with original documents and witnesses.',
    ],
    generalStepsHi: [
      'सर्वप्रथम पुलिस अधीक्षक (एसपी) या पुलिस आयुक्त को लिखित शिकायत भेजें।',
      'कार्रवाई न होने पर जिला पुलिस शिकायत प्राधिकरण (DPCA) में आवेदन करें।',
      'डीएसपी और उससे ऊपर के अधिकारियों के खिलाफ राज्य स्तर के प्राधिकरण (SPCA) में जाएं।',
      'मूल दस्तावेज़ों और गवाहों के साथ जांच सुनवाई में उपस्थित हों।',
    ],
    documentsChecklist: [
      'Original copy of police complaint sent with receiving stamp / postal proof',
      'Medical examination report or MLC (if physical harm or injury occurred)',
      'Photographs, CCTV footage, or witness statements',
    ],
    documentsChecklistHi: [
      'प्राप्ति मुहर या डाक रसीद सहित मूल पुलिस शिकायत की प्रति',
      'मेडिकल जांच रिपोर्ट या एमएलसी (यदि शारीरिक चोट पहुंची हो)',
      'फोटो, सीसीटीवी फुटेज या चश्मदीदों के बयान',
    ],
    deadlinesVerified:
      'Must generally be filed within 60 to 180 days of the incident (varies by State Police Act rules). Refusal to register FIR must be accompanied by proof of representation to SP.',
    deadlinesVerifiedHi:
      'घटना के 60 से 180 दिनों के भीतर शिकायत की जानी चाहिए। एफआईआर न दर्ज करने पर एसपी को दिए पत्र का प्रमाण आवश्यक है।',
  },
  {
    id: 'human_rights_commission',
    category: 'SHRC_NHRC',
    title: 'State / National Human Rights Commission (SHRC / NHRC)',
    titleHi: 'राज्य / राष्ट्रीय मानवाधिकार आयोग (SHRC / NHRC)',
    provision: 'Protection of Human Rights Act, 1993 (Section 12)',
    provisionHi: 'मानवाधिकार संरक्षण अधिनियम, 1993 (धारा 12)',
    relevantCategories: ['police', 'misbehaviour', 'refusal'],
    relevantStages: [2, 3],
    timeframe: 'Statutory Inquiry with Quasi-Judicial Powers',
    timeframeHi: 'अर्ध-न्यायिक शक्तियों के साथ वैधानिक जांच',
    officialSource: 'National Human Rights Commission (NHRC)',
    officialSourceUrl: 'https://nhrc.nic.in',
    summary:
      'Autonomous commission investigating human dignity violations, illegal detention, denial of emergency medical care, and custodial torture by public officials.',
    summaryHi:
      'मानव गरिमा के हनन, अवैध हिरासत, आपातकालीन चिकित्सा से इनकार और सरकारी अधिकारियों द्वारा यातना की जांच करने वाला स्वायत्त आयोग।',
    generalSteps: [
      'File petition online via NHRC HRCNet portal (hrcnet.nic.in) or by post.',
      'No court fee or legal stamp is required for filing complaints before NHRC/SHRC.',
      'State specific details: date, place, names of responsible officials, and rights violated.',
      'Track case using the assigned Commission Diary Number.',
    ],
    generalStepsHi: [
      'hrcnet.nic.in पर ऑनलाइन या डाक द्वारा याचिका प्रस्तुत करें।',
      'मानवाधिकार आयोग में शिकायत के लिए कोई कोर्ट फीस नहीं लगती।',
      'घटना की तिथि, स्थान, दोषी अधिकारियों का नाम और उल्लिखित अधिकारों का विवरण दें।',
      'आवंटित डायरी नंबर के माध्यम से केस ट्रैक करें।',
    ],
    documentsChecklist: [
      'Detailed petition stating facts and human rights violation',
      'Medical records, injury certificates, or hospital discharge summaries',
      'Proof of complaint previously lodged with police/administrative authorities',
    ],
    documentsChecklistHi: [
      'मानवाधिकार हनन का विवरण देती विस्तृत याचिका',
      'चिकित्सा रिपोर्ट, चोट प्रमाणपत्र या अस्पताल का विवरण',
      'पुलिस या प्रशासन को पहले दी गई शिकायत की प्रतियां',
    ],
    deadlinesVerified:
      'STATUTORY LIMITATION: Complaint must be filed within 1 YEAR from the date of the incident (Section 36(2) of the Protection of Human Rights Act, 1993).',
    deadlinesVerifiedHi:
      'वैधानिक सीमा: घटना की तिथि से 1 वर्ष के भीतर शिकायत दर्ज होनी चाहिए (मानवाधिकार संरक्षण अधिनियम की धारा 36(2))।',
  },
  {
    id: 'court_writ_mandamus',
    category: 'JUDICIAL',
    title: 'High Court Writ Petition (Writ of Mandamus)',
    titleHi: 'उच्च न्यायालय रिट याचिका (परमादेश रिट - Mandamus)',
    provision: 'Article 226 of the Constitution of India',
    provisionHi: 'भारत का संविधान का अनुच्छेद 226',
    relevantCategories: ['delay', 'refusal', 'duties'],
    relevantStages: [3],
    timeframe: 'Judicial Adjudication & Binding Prerogative Order',
    timeframeHi: 'न्यायिक निर्णय और बाध्यकारी संवैधानिक आदेश',
    officialSource: 'High Court of Delhi / Respective State High Courts',
    officialSourceUrl: 'https://delhihighcourt.nic.in',
    summary:
      'Constitutional prerogative writ issued by the High Court directing a public body or official to perform a mandatory statutory duty they have failed or refused to perform.',
    summaryHi:
      'उच्च न्यायालय द्वारा जारी संवैधानिक रिट जो किसी सरकारी विभाग या अधिकारी को उसके वैधानिक कर्तव्य का पालन करने का बाध्यकारी आदेश देती है।',
    generalSteps: [
      'Issue formal legal notice through advocate giving the department 15–30 days to perform duty.',
      'If authority remains inactive, draft Writ Petition under Article 226 with advocate / DLSA counsel.',
      'Establish violation of legal right and failure of mandatory statutory duty by the respondent.',
      'File petition before High Court Registry with affidavit and supporting documents.',
    ],
    generalStepsHi: [
      'वकील के माध्यम से विभाग को 15-30 दिनों की वैधानिक सूचना (लीगल नोटिस) भेजें।',
      'कार्रवाई न होने पर अनुच्छेद 226 के तहत रिट याचिका तैयार करें।',
      'अधिकारी द्वारा कानूनी कर्तव्य के उल्लंघन और अधिकार के हनन को स्पष्ट करें।',
      'हलफनामे और संलग्नकों के साथ उच्च न्यायालय में याचिका दाखिल करें।',
    ],
    documentsChecklist: [
      'Copy of legal notice issued with postal delivery confirmation receipts',
      'Certified copies of all prior representations and administrative rejection letters',
      'Supporting documentary evidence of statutory entitlement',
      'Vakalatnama authorizing legal representation',
    ],
    documentsChecklistHi: [
      'स्पीड पोस्ट रसीद सहित भेजे गए लीगल नोटिस की प्रति',
      'पूर्व में दिए गए सभी आवेदनों और अस्वीकृति पत्रों की प्रमाणित प्रतियां',
      'वैधानिक अधिकार सिद्ध करने वाले दस्तावेज़',
      'वकालतनामा',
    ],
    deadlinesVerified:
      'Should be filed without unreasonable delay (Doctrine of Laches; typically within 60–90 days of final administrative inaction or rejection order).',
    deadlinesVerifiedHi:
      'बिना किसी अनुचित देरी के (आमतौर पर अंतिम प्रशासनिक इनकार के 60 से 90 दिनों के भीतर) दायर की जानी चाहिए।',
  },
];

// ─── 2. SECTION 12 LEGAL SERVICES AUTHORITIES ACT, 1987 CRITERIA ────────────
export const SECTION_12_CATEGORIES = [
  {
    id: 'women_children',
    sectionRef: 'Section 12(c)',
    label: 'Women & Children',
    labelHi: 'महिलाएं और बच्चे',
    description:
      'All women and children (under 18 years) are entitled to free legal aid irrespective of financial status.',
    descriptionHi:
      'सभी महिलाएं और 18 वर्ष से कम आयु के बच्चे आय सीमा के बिना निःशुल्क कानूनी सहायता के हकदार हैं।',
    docsNeeded: 'Age proof for child / Self-declaration / Identity proof',
    docsNeededHi: 'आयु प्रमाण / स्व-घोषणा / पहचान पत्र',
  },
  {
    id: 'sc_st',
    sectionRef: 'Section 12(a)',
    label: 'Scheduled Castes & Scheduled Tribes',
    labelHi: 'अनुसूचित जाति (SC) और अनुसूचित जनजाति (ST)',
    description:
      'Members of Scheduled Castes and Scheduled Tribes are statutorily entitled to free legal services.',
    descriptionHi:
      'अनुसूचित जाति एवं जनजाति के नागरिक कानूनन निःशुल्क विधिक सेवाओं के पात्र हैं।',
    docsNeeded: 'Caste Certificate issued by competent revenue authority',
    docsNeededHi: 'सक्षम राजस्व प्राधिकारी द्वारा जारी जाति प्रमाणपत्र',
  },
  {
    id: 'disability',
    sectionRef: 'Section 12(d)',
    label: 'Persons with Disabilities',
    labelHi: 'दिव्यांगजन (Persons with Disabilities)',
    description:
      'Persons with mental illness, physical impairment, or disability as defined under RPwD Act.',
    descriptionHi:
      'मानसिक या शारीरिक दिव्यांगता वाले व्यक्ति निःशुल्क कानूनी सहायता के पात्र हैं।',
    docsNeeded: 'Disability Certificate / UDID card',
    docsNeededHi: 'दिव्यांगता प्रमाणपत्र / यूडीआईडी कार्ड',
  },
  {
    id: 'trafficking_begar',
    sectionRef: 'Section 12(g)',
    label: 'Victims of Trafficking & Begar',
    labelHi: 'मानव तस्करी और बंधुआ मजदूरी के पीड़ित',
    description:
      'Victims of trafficking in human beings or forced labour (begar) under Article 23 of the Constitution.',
    descriptionHi:
      'मानव तस्करी या बंधुआ मजदूरी से पीड़ित व्यक्ति सीधे विधिक सहायता के पात्र हैं।',
    docsNeeded: 'Self-declaration or recommendation from rescue NGO / Police report',
    docsNeededHi: 'स्व-घोषणा या बचाव संस्था / पुलिस की रिपोर्ट',
  },
  {
    id: 'disaster_violence',
    sectionRef: 'Section 12(e)',
    label: 'Disaster & Atrocity Victims',
    labelHi: 'आपदा, जातीय हिंसा और अत्याचार पीड़ित',
    description:
      'Victims of mass disaster, ethnic violence, caste atrocities, flood, drought, earthquake, or industrial disaster.',
    descriptionHi:
      'प्राकृतिक आपदा, जातीय हिंसा, अत्याचार, बाढ़ या औद्योगिक आपदा से प्रभावित नागरिक।',
    docsNeeded: 'Certificate or relief registration from District Collector / Revenue Dept',
    docsNeededHi: 'जिलाधिकारी या राहत विभाग द्वारा जारी प्रमाणपत्र',
  },
  {
    id: 'industrial_workman',
    sectionRef: 'Section 12(f)',
    label: 'Industrial Workmen',
    labelHi: 'औद्योगिक श्रमिक (Workmen)',
    description:
      'Industrial workers as defined under the Industrial Disputes Act, 1947.',
    descriptionHi:
      'औद्योगिक विवाद अधिनियम के तहत परिभाषित श्रमिक निःशुल्क विधिक सेवा के हकदार हैं।',
    docsNeeded: 'Employment card / ESI card / Trade union membership / Pay slip',
    docsNeededHi: 'कर्मचारी कार्ड / ईएसआई कार्ड / वेतन पर्ची',
  },
  {
    id: 'custody',
    sectionRef: 'Section 12(g)',
    label: 'Persons in Custody',
    labelHi: 'हिरासत में रखे गए व्यक्ति (बंदी)',
    description:
      'Persons in judicial or police custody, protective home, juvenile observation home, or psychiatric hospital.',
    descriptionHi:
      'न्यायिक या पुलिस हिरासत, बाल सुधार गृह या मानसिक स्वास्थ्य केंद्र में रखे गए व्यक्ति।',
    docsNeeded: 'Custody certificate from jail superintendent or remand sheet',
    docsNeededHi: 'जेल अधीक्षक या रिमांड पत्र से प्रमाणपत्र',
  },
  {
    id: 'income_limit',
    sectionRef: 'Section 12(h)',
    label: 'Citizens Below Prescribed Income Limits',
    labelHi: 'निर्धारित आय सीमा से कम आय वाले नागरिक',
    description:
      'Citizens whose annual income is less than the statutory threshold fixed by the respective State Government.',
    descriptionHi:
      'ऐसे नागरिक जिनकी वार्षिक आय राज्य सरकार द्वारा निर्धारित वैधानिक सीमा से कम है।',
    docsNeeded: 'Income certificate issued by Tehsildar / BPL Ration Card / Income Affidavit',
    docsNeededHi: 'तहसीलदार द्वारा जारी आय प्रमाणपत्र / बीपीएल राशन कार्ड',
  },
];

// ─── 3. VERIFIED FREE LEGAL ASSISTANCE CHANNELS ─────────────────────────────
export const FREE_LEGAL_CHANNELS = [
  {
    id: 'dlsa',
    name: 'District Legal Services Authority (DLSA)',
    nameHi: 'जिला विधिक सेवा प्राधिकरण (DLSA)',
    tag: 'Statutory Body (Every District Court)',
    tagHi: 'वैधानिक निकाय (प्रत्येक जिला न्यायालय)',
    contact: 'Visit Front Office, District Court Complex',
    contactHi: 'जिला न्यायालय परिसर में स्थित फ्रंट ऑफिस जाएं',
    website: 'https://nalsa.gov.in',
    description:
      'Located inside every District Court across India. Provides empaneled legal aid advocates, drafting assistance, and court fee exemption under Section 12.',
    descriptionHi:
      'पूरे भारत में प्रत्येक जिला न्यायालय परिसर में स्थित। धारा 12 के तहत निःशुल्क वकील, ड्राफ्टिंग और कोर्ट फीस छूट प्रदान करता है।',
    steps: [
      'Visit the DLSA Front Office in your District Court complex.',
      'Fill out Form A (Application for Legal Aid) available at the counter.',
      'Attach Section 12 category proof or income document.',
      'Member Secretary reviews and assigns an empaneled advocate within 7-10 working days.',
    ],
    stepsHi: [
      'अपने जिला न्यायालय परिसर में डीएलएसए फ्रंट ऑफिस जाएं।',
      'काउंटर पर उपलब्ध फॉर्म ए (विधिक सहायता आवेदन) भरें।',
      'धारा 12 श्रेणी का प्रमाण या आय प्रमाणपत्र संलग्न करें।',
      'सचिव द्वारा जांच के बाद 7-10 दिनों में पैनल वकील नियुक्त किया जाता है।',
    ],
    documents: [
      'Legal Aid Application Form (Form A)',
      'Aadhaar / Voter ID / Proof of Identity',
      'Category proof (Caste/Disability/Income Certificate or BPL Card)',
      'Copies of complaint and relevant court / official papers',
    ],
  },
  {
    id: 'nalsa_helpline',
    name: 'NALSA 24x7 National Helpline (15100)',
    nameHi: 'नालसा 24x7 राष्ट्रीय हेल्पलाइन (15100)',
    tag: 'National Toll-Free Assistance',
    tagHi: 'राष्ट्रीय टोल-फ्री सहायता',
    contact: '15100 (Toll Free, Pan-India)',
    contactHi: '15100 (टोल-फ्री, पूरे भारत में)',
    website: 'https://nalsa.gov.in/services/legal-aid/legal-aid-helpline',
    description:
      'Round-the-clock national telephone helpline by National Legal Services Authority providing immediate legal advice, dispute guidance, and DLSA linkage.',
    descriptionHi:
      'राष्ट्रीय विधिक सेवा प्राधिकरण द्वारा 24 घंटे संचालित टोल-फ्री हेल्पलाइन जो तत्काल कानूनी परामर्श और स्थानीय डीएलएसए से जोड़ती है।',
    steps: [
      'Dial 15100 from any mobile or landline anywhere in India.',
      'Select your preferred regional language.',
      'Explain your complaint to the duty legal aid counsel.',
      'Receive advice and a referral tracking number to your local DLSA.',
    ],
    stepsHi: [
      'भारत में किसी भी फोन से 15100 डायल करें।',
      'अपनी पसंदीदा भाषा चुनें।',
      'ड्यूटी वकील को अपनी शिकायत बताएं।',
      'सलाह और स्थानीय डीएलएसए का रेफरल नंबर प्राप्त करें।',
    ],
    documents: ['Keep complaint reference numbers and dates handy during the call'],
  },
  {
    id: 'tele_law',
    name: 'Tele-Law (Department of Justice)',
    nameHi: 'टेली-लॉ (न्याय विभाग, भारत सरकार)',
    tag: 'Digital Legal Tele-Consultation',
    tagHi: 'डिजिटल विधिक परामर्श सेवा',
    contact: 'Visit nearest Common Service Centre (CSC) or tele-law.in',
    contactHi: 'निकटतम सीएससी केंद्र जाएं या tele-law.in पर जाएं',
    website: 'https://tele-law.in',
    description:
      'Initiative linking citizens in rural and semi-urban areas to panel advocates via video conferencing and telephone through local Village Level Entrepreneurs (VLEs).',
    descriptionHi:
      'ग्रामीण और अर्ध-शहरी क्षेत्रों के नागरिकों को स्थानीय सीएससी केंद्रों के माध्यम से पैनल वकीलों से वीडियो कॉन्फ्रेंसिंग द्वारा जोड़ने वाली पहल।',
    steps: [
      'Visit nearest CSC center or log in directly to tele-law.in / Tele-Law Mobile App.',
      'VLE registers your details and schedules a video / phone appointment with a panel lawyer.',
      'Free of cost for Section 12 eligible categories (nominal ₹30 fee for others).',
      'Consult advocate at scheduled time and receive advice on legal remedies.',
    ],
    stepsHi: [
      'निकटतम सीएससी केंद्र जाएं या tele-law.in पर लॉग इन करें।',
      'वीएलई आपका विवरण दर्ज कर पैनल वकील के साथ समय तय करेगा।',
      'धारा 12 के पात्र नागरिकों के लिए पूरी तरह निःशुल्क।',
      'निर्धारित समय पर वकील से वीडियो या फोन पर परामर्श लें।',
    ],
    documents: ['Identity proof', 'Complaint narrative summary', 'Prior representations'],
  },
  {
    id: 'nyaya_bandhu',
    name: 'Nyaya Bandhu (Pro Bono Legal Services)',
    nameHi: 'न्याय बंधु (प्रो बोनो लीगल सर्विसेज)',
    tag: 'Department of Justice Pro Bono Program',
    tagHi: 'न्याय विभाग का निःस्वार्थ कानूनी सेवा कार्यक्रम',
    contact: 'Nyaya Bandhu Mobile App (Android / iOS) / pro-bono.in',
    contactHi: 'न्याय बंधु मोबाइल ऐप या pro-bono.in',
    website: 'https://www.pro-bono.in',
    description:
      'Connects registered practising advocates willing to provide pro bono legal service with marginalized litigants seeking representation in High Courts and Supreme Court.',
    descriptionHi:
      'उच्च न्यायालयों और सर्वोच्च न्यायालय में निःशुल्क पैरवी करने के इच्छुक वकीलों को जरूरतमंद नागरिकों से जोड़ने वाला सरकारी मंच।',
    steps: [
      'Download Nyaya Bandhu mobile app and register as an applicant.',
      'Upload Section 12 category proof and case documents.',
      'Algorithm matches case with registered pro-bono advocates based on jurisdiction.',
      'Advocate reviews file and accepts voluntary pro bono representation.',
    ],
    stepsHi: [
      'न्याय बंधु ऐप डाउनलोड कर आवेदक के रूप में पंजीकरण करें।',
      'धारा 12 श्रेणी का प्रमाण और केस के दस्तावेज़ अपलोड करें।',
      'प्रणाली आपके मामले को उपयुक्त प्रो-बोनो वकील से मिलाती है।',
      'वकील द्वारा मामला स्वीकार करने पर निःशुल्क पैरवी शुरू होती है।',
    ],
    documents: ['Category eligibility certificate', 'Case brief and impugned orders'],
  },
  {
    id: 'law_clinic',
    name: 'University & Law School Legal Aid Clinics',
    nameHi: 'विधि विश्वविद्यालय एवं लॉ कॉलेज लीगल एड क्लिनिक',
    tag: 'Bar Council of India Mandated Clinics',
    tagHi: 'बीसीआई मान्यता प्राप्त विधि क्लिनिक',
    contact: 'Contact nearest National Law University (NLU) Legal Aid Cell',
    contactHi: 'निकटतम राष्ट्रीय विधि विश्वविद्यालय के लीगल एड सेल से संपर्क करें',
    website: 'http://www.barcouncilofindia.org',
    description:
      'Free community clinics run by faculty and senior law students under Bar Council of India guidelines, offering legal drafting, RTI drafting, and counseling.',
    descriptionHi:
      'बार काउंसिल ऑफ इंडिया के नियमों के तहत कानून के प्राध्यापकों और छात्रों द्वारा संचालित क्लिनिक, जो ड्राफ्टिंग और परामर्श प्रदान करते हैं।',
    steps: [
      'Locate the Legal Aid Clinic of the nearest Law Faculty or NLU.',
      'Submit written application detailing administrative grievance or rights violation.',
      'Student paralegals assist in drafting RTI applications and statutory appeals under faculty supervision.',
    ],
    stepsHi: [
      'निकटतम लॉ यूनिवर्सिटी के लीगल एड क्लिनिक से संपर्क करें।',
      'अपनी समस्या का लिखित विवरण प्रस्तुत करें।',
      'प्राध्यापकों की देखरेख में छात्र आरटीआई और अपील का ड्राफ्ट तैयार करने में मदद करते हैं।',
    ],
    documents: ['Complaint summary and copies of correspondence'],
  },
];

// ─── 4. FICTIONAL DEMO LAWYERS DIRECTORY ────────────────────────────────────
// Explicitly marked FICTIONAL DEMO LISTINGS for demonstration only.
export const FICTIONAL_LAWYERS = [
  {
    id: 'dem-law-1',
    name: 'Adv. Meera Swaminathan',
    designation: 'Senior Panel Advocate, DLSA Central',
    court: 'Delhi High Court & Consumer Commission',
    city: 'New Delhi',
    state: 'Delhi',
    specialisation: 'RTI & Administrative Law',
    feeModel: 'Government legal aid', // 'Government legal aid' | 'Free consultation' | 'Paid'
    languages: ['English', 'Hindi', 'Tamil'],
    consultationFormat: 'In-Person & Online Video',
    experienceYears: 14,
    freeConsultationsGiven: 142,
    rating: 4.9,
    phone: '15100 Ext 402 (Demo)',
    email: 'adv.meera.demo@citizenconnect.internal',
    about:
      'Empaneled with DLSA Central for constitutional writ petitions, public utility defaults, and Right to Information appellate litigation.',
    isFictionalDemo: true,
  },
  {
    id: 'dem-law-2',
    name: 'Adv. Harpreet Singh Sodhi',
    designation: 'Legal Aid Counsel, NALSA Roster',
    court: 'Punjab & Haryana High Court',
    city: 'Chandigarh',
    state: 'Punjab & Haryana',
    specialisation: 'Civil Rights & Police Accountability',
    feeModel: 'Government legal aid',
    languages: ['English', 'Hindi', 'Punjabi'],
    consultationFormat: 'In-Person & Phone',
    experienceYears: 18,
    freeConsultationsGiven: 289,
    rating: 4.8,
    phone: '15100 Ext 408 (Demo)',
    email: 'adv.harpreet.demo@citizenconnect.internal',
    about:
      'Advocates before Police Complaints Authority and High Court in cases of unlawful detention, refusal to register FIR, and custodial violations.',
    isFictionalDemo: true,
  },
  {
    id: 'dem-law-3',
    name: 'Adv. Shreya Deshpande',
    designation: 'Pro-Bono Constitutional & Anti-Graft Advocate',
    court: 'Bombay High Court & State Lokayukta',
    city: 'Mumbai',
    state: 'Maharashtra',
    specialisation: 'Anti-Corruption & Vigilance',
    feeModel: 'Free consultation',
    languages: ['English', 'Hindi', 'Marathi'],
    consultationFormat: 'Online Video & Written Opinion',
    experienceYears: 11,
    freeConsultationsGiven: 198,
    rating: 4.9,
    phone: '+91 98200 00001 (Demo)',
    email: 'adv.shreya.demo@citizenconnect.internal',
    about:
      'Specialises in State Lokayukta complaints, ACB coordination, whistleblower protection affidavits, and Right to Public Services escalation.',
    isFictionalDemo: true,
  },
  {
    id: 'dem-law-4',
    name: 'Adv. K. Venkataraghavan',
    designation: 'State Legal Services Authority (SLSA) Panelist',
    court: 'Madras High Court & State Human Rights Commission',
    city: 'Chennai',
    state: 'Tamil Nadu',
    specialisation: 'Municipal & Consumer Grievances',
    feeModel: 'Government legal aid',
    languages: ['English', 'Tamil', 'Telugu'],
    consultationFormat: 'In-Person',
    experienceYears: 16,
    freeConsultationsGiven: 215,
    rating: 4.9,
    phone: '15100 Ext 421 (Demo)',
    email: 'adv.kvenkat.demo@citizenconnect.internal',
    about:
      'Extensive litigation experience in municipal corruption, hospital medical negligence claims, and education entitlement disputes.',
    isFictionalDemo: true,
  },
  {
    id: 'dem-law-5',
    name: 'Adv. Ananya Roy',
    designation: 'Private Advocate & Pro-Bono Counsel',
    court: 'Calcutta High Court',
    city: 'Kolkata',
    state: 'West Bengal',
    specialisation: 'Anti-Corruption & Vigilance',
    feeModel: 'Paid',
    languages: ['English', 'Hindi', 'Bengali'],
    consultationFormat: 'Online Video & In-Person',
    experienceYears: 9,
    freeConsultationsGiven: 64,
    rating: 4.7,
    phone: '+91 98300 00002 (Demo)',
    email: 'adv.ananya.demo@citizenconnect.internal',
    about:
      'Private counsel offering subsidized initial consultation for public procurement transparency disputes and vigilance defense.',
    isFictionalDemo: true,
  },
  {
    id: 'dem-law-6',
    name: 'Adv. Rajeshwar Prasad Shukla',
    designation: 'Senior Appellate Counsel, Lucknow Bench',
    court: 'Allahabad High Court (Lucknow Bench)',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    specialisation: 'Civil Rights & Police Accountability',
    feeModel: 'Free consultation',
    languages: ['Hindi', 'English'],
    consultationFormat: 'Phone & In-Person',
    experienceYears: 22,
    freeConsultationsGiven: 310,
    rating: 4.8,
    phone: '+91 94150 00003 (Demo)',
    email: 'adv.rajeshwar.demo@citizenconnect.internal',
    about:
      'Handles Section 156(3) CrPC/BNSS judicial magistrate petitions, writ of habeas corpus, and land revenue mutation disputes.',
    isFictionalDemo: true,
  },
  {
    id: 'dem-law-7',
    name: 'Adv. Farhan Qureshi',
    designation: 'DLSA Panelist & Criminal Defense Counsel',
    court: 'City Civil & Sessions Court, Bengaluru',
    city: 'Bengaluru',
    state: 'Karnataka',
    specialisation: 'Municipal & Consumer Grievances',
    feeModel: 'Government legal aid',
    languages: ['English', 'Kannada', 'Hindi', 'Urdu'],
    consultationFormat: 'In-Person & Online Video',
    experienceYears: 8,
    freeConsultationsGiven: 122,
    rating: 4.7,
    phone: '15100 Ext 433 (Demo)',
    email: 'adv.farhan.demo@citizenconnect.internal',
    about:
      'Assists citizens under Karnataka Sakala Services Act and Bangalore Water Supply / BBMP grievance appeals.',
    isFictionalDemo: true,
  },
  {
    id: 'dem-law-8',
    name: 'Adv. Dr. Vandana Aggarwal',
    designation: 'Supreme Court & High Court Senior Advocate',
    court: 'Supreme Court of India & Delhi High Court',
    city: 'New Delhi',
    state: 'Delhi',
    specialisation: 'RTI & Administrative Law',
    feeModel: 'Paid',
    languages: ['English', 'Hindi'],
    consultationFormat: 'Written Legal Opinion & Online Video',
    experienceYears: 25,
    freeConsultationsGiven: 78,
    rating: 5.0,
    phone: '+91 98110 00004 (Demo)',
    email: 'adv.vandana.demo@citizenconnect.internal',
    about:
      'Supreme Court advocate handling public interest litigations (PILs) on institutional transparency and electoral integrity.',
    isFictionalDemo: true,
  },
];
