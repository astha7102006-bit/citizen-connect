
import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const TEXT = {
  en: {
    title: 'Track Complaint Escalation',
    subtitle: 'Time-bound accountability tracker with automated escalation',
    placeholder: 'Enter Complaint ID',
    track: 'Track',
    searching: 'Searching...',
    auto: 'Auto-escalates in',
    days: 'days',
    progress: 'Citizen Accountability Progress',
    completed: 'Completed',
    level1: 'Level 1: Grievance Officer',
    desc1: 'Complaint assigned to local ward officer. Time limit: 7 days.',
    level2: 'Level 2: First Appellate Authority',
    desc2: 'Automatic escalation triggered if unresolved in 7 days.',
    level3: 'Level 3: Vigilance Commission / Lokayukta',
    desc3: 'Independent anti-corruption review with penalty powers.',
    level4: 'Final Action & Redressal',
    desc4: 'Compliance report filed and redress completed.',
    day1: 'Day 1 - 7',
    day2: 'Day 8 - 15',
    day3: 'Day 16 - 30',
    notFound: 'Could not find this complaint. Showing demo information.',
    demoDepartment: 'Public Works Department (PWD)',
    demoDescription: 'Complaint record shown in demonstration mode.',
    demoOfficer: 'Grievance Redressal Officer',
    department: 'Department',
    officer: 'Responsible officer',
    filed: 'Filed on',
  },
  hi: {
    title: 'शिकायत की स्थिति ट्रैक करें',
    subtitle: 'समयबद्ध जवाबदेही और स्वचालित शिकायत अग्रेषण',
    placeholder: 'शिकायत आईडी दर्ज करें',
    track: 'ट्रैक करें',
    searching: 'खोज रहे हैं...',
    auto: 'स्वतः आगे भेजने में',
    days: 'दिन',
    progress: 'नागरिक जवाबदेही की प्रगति',
    completed: 'पूरा हुआ',
    level1: 'स्तर 1: शिकायत अधिकारी',
    desc1: 'शिकायत स्थानीय वार्ड अधिकारी को सौंपी गई। समय सीमा: 7 दिन।',
    level2: 'स्तर 2: प्रथम अपीलीय प्राधिकरण',
    desc2: '7 दिनों में समाधान न होने पर शिकायत स्वतः आगे भेजी जाएगी।',
    level3: 'स्तर 3: सतर्कता आयोग / लोकायुक्त',
    desc3: 'भ्रष्टाचार की स्वतंत्र जाँच और दंडात्मक कार्रवाई।',
    level4: 'अंतिम कार्रवाई और समाधान',
    desc4: 'अनुपालन रिपोर्ट जमा करके शिकायत का समाधान किया गया।',
    day1: 'दिन 1 - 7',
    day2: 'दिन 8 - 15',
    day3: 'दिन 16 - 30',
    notFound: 'शिकायत नहीं मिली। प्रदर्शन के लिए उदाहरण जानकारी दिखाई जा रही है।',
    demoDepartment: 'लोक निर्माण विभाग',
    demoDescription: 'यह शिकायत रिकॉर्ड प्रदर्शन मोड में दिखाया जा रहा है।',
    demoOfficer: 'शिकायत निवारण अधिकारी',
    department: 'विभाग',
    officer: 'जिम्मेदार अधिकारी',
    filed: 'दर्ज करने की तारीख',
  },
  bn: {
    title: 'অভিযোগের অগ্রগতি দেখুন',
    subtitle: 'সময়সীমাবদ্ধ জবাবদিহি ও স্বয়ংক্রিয় অগ্রগতি',
    placeholder: 'অভিযোগের আইডি লিখুন',
    track: 'ট্র্যাক করুন',
    searching: 'খোঁজা হচ্ছে...',
    auto: 'স্বয়ংক্রিয়ভাবে অগ্রসর হতে বাকি',
    days: 'দিন',
    progress: 'নাগরিক জবাবদিহির অগ্রগতি',
    completed: 'সম্পন্ন',
    level1: 'স্তর ১: অভিযোগ কর্মকর্তা',
    desc1: 'অভিযোগ স্থানীয় ওয়ার্ড কর্মকর্তার কাছে পাঠানো হয়েছে। সময়সীমা: ৭ দিন।',
    level2: 'স্তর ২: প্রথম আপিল কর্তৃপক্ষ',
    desc2: '৭ দিনের মধ্যে সমাধান না হলে অভিযোগ স্বয়ংক্রিয়ভাবে এগোবে।',
    level3: 'স্তর ৩: সতর্কতা কমিশন / লোকায়ুক্ত',
    desc3: 'দুর্নীতির স্বাধীন পর্যালোচনা ও শাস্তিমূলক ব্যবস্থা।',
    level4: 'চূড়ান্ত পদক্ষেপ ও নিষ্পত্তি',
    desc4: 'সম্মতি প্রতিবেদন জমা দিয়ে অভিযোগ নিষ্পত্তি করা হয়েছে।',
    day1: 'দিন ১ - ৭',
    day2: 'দিন ৮ - ১৫',
    day3: 'দিন ১৬ - ৩০',
    notFound: 'অভিযোগ পাওয়া যায়নি। নমুনা তথ্য দেখানো হচ্ছে।',
    demoDepartment: 'জনপূর্ত বিভাগ',
    demoDescription: 'প্রদর্শনের জন্য অভিযোগের নমুনা তথ্য দেখানো হচ্ছে।',
    demoOfficer: 'অভিযোগ নিষ্পত্তি কর্মকর্তা',
    department: 'বিভাগ',
    officer: 'দায়িত্বপ্রাপ্ত কর্মকর্তা',
    filed: 'দাখিলের তারিখ',
  },
  te: {
    title: 'ఫిర్యాదు పురోగతిని ట్రాక్ చేయండి',
    subtitle: 'గడువుతో కూడిన జవాబుదారీతనం మరియు స్వయంచాలక ఎస్కలేషన్',
    placeholder: 'ఫిర్యాదు ID నమోదు చేయండి',
    track: 'ట్రాక్ చేయండి',
    searching: 'వెతుకుతోంది...',
    auto: 'స్వయంచాలక ఎస్కలేషన్‌కు',
    days: 'రోజులు',
    progress: 'పౌరుల జవాబుదారీతనం పురోగతి',
    completed: 'పూర్తయింది',
    level1: 'స్థాయి 1: ఫిర్యాదుల అధికారి',
    desc1: 'ఫిర్యాదు స్థానిక వార్డు అధికారికి కేటాయించబడింది. గడువు: 7 రోజులు.',
    level2: 'స్థాయి 2: మొదటి అప్పీల్ అధికారి',
    desc2: '7 రోజుల్లో పరిష్కారం కాకపోతే ఫిర్యాదు స్వయంచాలకంగా ముందుకు వెళ్తుంది.',
    level3: 'స్థాయి 3: విజిలెన్స్ కమిషన్ / లోకాయుక్త',
    desc3: 'అవినీతిపై స్వతంత్ర సమీక్ష మరియు చర్యలు.',
    level4: 'చివరి చర్య మరియు పరిష్కారం',
    desc4: 'అనుసరణ నివేదిక సమర్పించి పరిష్కారం పూర్తిచేయబడింది.',
    day1: 'రోజు 1 - 7',
    day2: 'రోజు 8 - 15',
    day3: 'రోజు 16 - 30',
    notFound: 'ఫిర్యాదు కనుగొనబడలేదు. నమూనా సమాచారం చూపబడుతోంది.',
    demoDepartment: 'ప్రజా పనుల శాఖ',
    demoDescription: 'ప్రదర్శన కోసం ఫిర్యాదు నమూనా చూపబడుతోంది.',
    demoOfficer: 'ఫిర్యాదుల పరిష్కార అధికారి',
    department: 'శాఖ',
    officer: 'బాధ్యతగల అధికారి',
    filed: 'దాఖలు చేసిన తేదీ',
  },
  mr: {
    title: 'तक्रारीची स्थिती तपासा',
    subtitle: 'वेळबद्ध जबाबदारी आणि स्वयंचलित पुढील कार्यवाही',
    placeholder: 'तक्रार आयडी टाका',
    track: 'तपासा',
    searching: 'शोधत आहे...',
    auto: 'स्वयंचलित पुढील कार्यवाहीसाठी',
    days: 'दिवस',
    progress: 'नागरिक जबाबदारीची प्रगती',
    completed: 'पूर्ण',
    level1: 'स्तर 1: तक्रार अधिकारी',
    desc1: 'तक्रार स्थानिक प्रभाग अधिकाऱ्याकडे दिली आहे. मुदत: 7 दिवस.',
    level2: 'स्तर 2: प्रथम अपील प्राधिकरण',
    desc2: '7 दिवसांत निराकरण न झाल्यास तक्रार आपोआप पुढे पाठवली जाईल.',
    level3: 'स्तर 3: दक्षता आयोग / लोकायुक्त',
    desc3: 'भ्रष्टाचाराची स्वतंत्र तपासणी आणि कारवाई.',
    level4: 'अंतिम कारवाई आणि निवारण',
    desc4: 'अनुपालन अहवाल सादर करून तक्रारीचे निराकरण केले.',
    day1: 'दिवस 1 - 7',
    day2: 'दिवस 8 - 15',
    day3: 'दिवस 16 - 30',
    notFound: 'तक्रार सापडली नाही. नमुना माहिती दाखवली आहे.',
    demoDepartment: 'सार्वजनिक बांधकाम विभाग',
    demoDescription: 'प्रात्यक्षिकासाठी तक्रारीची नमुना माहिती दाखवली आहे.',
    demoOfficer: 'तक्रार निवारण अधिकारी',
    department: 'विभाग',
    officer: 'जबाबदार अधिकारी',
    filed: 'दाखल केल्याची तारीख',
  },
  ta: {
    title: 'புகார் நிலையைப் பின்தொடரவும்',
    subtitle: 'காலக்கெடுவுடன் கூடிய பொறுப்புணர்வும் தானியங்கி மேல்முறையீடும்',
    placeholder: 'புகார் அடையாள எண்ணை உள்ளிடவும்',
    track: 'பின்தொடர்',
    searching: 'தேடப்படுகிறது...',
    auto: 'தானாக அடுத்த நிலைக்குச் செல்ல',
    days: 'நாட்கள்',
    progress: 'குடிமக்கள் பொறுப்புணர்வு முன்னேற்றம்',
    completed: 'முடிந்தது',
    level1: 'நிலை 1: புகார் அலுவலர்',
    desc1: 'புகார் உள்ளூர் வார்டு அலுவலருக்கு ஒதுக்கப்பட்டது. காலக்கெடு: 7 நாட்கள்.',
    level2: 'நிலை 2: முதல் மேல்முறையீட்டு அதிகாரி',
    desc2: '7 நாட்களில் தீர்வு இல்லையெனில் புகார் தானாக அடுத்த நிலைக்குச் செல்லும்.',
    level3: 'நிலை 3: கண்காணிப்பு ஆணையம் / லோக் ஆயுக்தா',
    desc3: 'ஊழல் குறித்த சுயாதீன ஆய்வும் நடவடிக்கையும்.',
    level4: 'இறுதி நடவடிக்கை மற்றும் தீர்வு',
    desc4: 'இணக்க அறிக்கை சமர்ப்பிக்கப்பட்டு புகார் தீர்க்கப்பட்டது.',
    day1: 'நாள் 1 - 7',
    day2: 'நாள் 8 - 15',
    day3: 'நாள் 16 - 30',
    notFound: 'புகாரைக் கண்டறிய முடியவில்லை. மாதிரி தகவல் காட்டப்படுகிறது.',
    demoDepartment: 'பொதுப்பணித் துறை',
    demoDescription: 'விளக்கத்திற்காக மாதிரி புகார் தகவல் காட்டப்படுகிறது.',
    demoOfficer: 'புகார் தீர்வு அலுவலர்',
    department: 'துறை',
    officer: 'பொறுப்பு அலுவலர்',
    filed: 'பதிவு செய்த தேதி',
  },
  gu: {
    title: 'ફરિયાદની સ્થિતિ ટ્રૅક કરો',
    subtitle: 'સમયમર્યાદાવાળી જવાબદારી અને સ્વચાલિત આગળની કાર્યવાહી',
    placeholder: 'ફરિયાદ ID દાખલ કરો',
    track: 'ટ્રૅક કરો',
    searching: 'શોધી રહ્યું છે...',
    auto: 'સ્વચાલિત આગળની કાર્યવાહી માટે',
    days: 'દિવસ',
    progress: 'નાગરિક જવાબદારીની પ્રગતિ',
    completed: 'પૂર્ણ',
    level1: 'સ્તર 1: ફરિયાદ અધિકારી',
    desc1: 'ફરિયાદ સ્થાનિક વોર્ડ અધિકારીને સોંપાઈ છે. સમયમર્યાદા: 7 દિવસ.',
    level2: 'સ્તર 2: પ્રથમ અપીલ સત્તાધિકારી',
    desc2: '7 દિવસમાં ઉકેલ ન આવે તો ફરિયાદ આપમેળે આગળ વધશે.',
    level3: 'સ્તર 3: સતર્કતા આયોગ / લોકાયુક્ત',
    desc3: 'ભ્રષ્ટાચારની સ્વતંત્ર સમીક્ષા અને કાર્યવાહી.',
    level4: 'અંતિમ કાર્યવાહી અને નિવારણ',
    desc4: 'અનુપાલન અહેવાલ રજૂ કરીને ફરિયાદનું નિરાકરણ થયું.',
    day1: 'દિવસ 1 - 7',
    day2: 'દિવસ 8 - 15',
    day3: 'દિવસ 16 - 30',
    notFound: 'ફરિયાદ મળી નથી. નમૂનાની માહિતી બતાવવામાં આવી રહી છે.',
    demoDepartment: 'જાહેર બાંધકામ વિભાગ',
    demoDescription: 'પ્રદર્શન માટે ફરિયાદની નમૂનાની માહિતી બતાવવામાં આવે છે.',
    demoOfficer: 'ફરિયાદ નિવારણ અધિકારી',
    department: 'વિભાગ',
    officer: 'જવાબદાર અધિકારી',
    filed: 'નોંધણી તારીખ',
  },
  kn: {
    title: 'ದೂರಿನ ಸ್ಥಿತಿಯನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ',
    subtitle: 'ಸಮಯಮಿತ ಹೊಣೆಗಾರಿಕೆ ಮತ್ತು ಸ್ವಯಂಚಾಲಿತ ಮೇಲ್ದರ್ಜೆಗೇರಿಕೆ',
    placeholder: 'ದೂರಿನ ID ನಮೂದಿಸಿ',
    track: 'ಟ್ರ್ಯಾಕ್ ಮಾಡಿ',
    searching: 'ಹುಡುಕಲಾಗುತ್ತಿದೆ...',
    auto: 'ಸ್ವಯಂಚಾಲಿತ ಮೇಲ್ದರ್ಜೆಗೇರಿಕೆಗೆ',
    days: 'ದಿನಗಳು',
    progress: 'ನಾಗರಿಕ ಹೊಣೆಗಾರಿಕೆಯ ಪ್ರಗತಿ',
    completed: 'ಪೂರ್ಣಗೊಂಡಿದೆ',
    level1: 'ಹಂತ 1: ದೂರು ಅಧಿಕಾರಿ',
    desc1: 'ದೂರನ್ನು ಸ್ಥಳೀಯ ವಾರ್ಡ್ ಅಧಿಕಾರಿಗೆ ನೀಡಲಾಗಿದೆ. ಗಡುವು: 7 ದಿನಗಳು.',
    level2: 'ಹಂತ 2: ಮೊದಲ ಮೇಲ್ಮನವಿ ಪ್ರಾಧಿಕಾರ',
    desc2: '7 ದಿನಗಳಲ್ಲಿ ಪರಿಹಾರವಾಗದಿದ್ದರೆ ದೂರು ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಮುಂದುವರಿಯುತ್ತದೆ.',
    level3: 'ಹಂತ 3: ಜಾಗೃತ ಆಯೋಗ / ಲೋಕಾಯುಕ್ತ',
    desc3: 'ಭ್ರಷ್ಟಾಚಾರದ ಸ್ವತಂತ್ರ ಪರಿಶೀಲನೆ ಮತ್ತು ಕ್ರಮ.',
    level4: 'ಅಂತಿಮ ಕ್ರಮ ಮತ್ತು ಪರಿಹಾರ',
    desc4: 'ಅನುಸರಣೆ ವರದಿ ಸಲ್ಲಿಸಿ ದೂರನ್ನು ಪರಿಹರಿಸಲಾಗಿದೆ.',
    day1: 'ದಿನ 1 - 7',
    day2: 'ದಿನ 8 - 15',
    day3: 'ದಿನ 16 - 30',
    notFound: 'ದೂರು ಕಂಡುಬಂದಿಲ್ಲ. ಮಾದರಿ ಮಾಹಿತಿ ತೋರಿಸಲಾಗುತ್ತಿದೆ.',
    demoDepartment: 'ಸಾರ್ವಜನಿಕ ಕಾಮಗಾರಿಗಳ ಇಲಾಖೆ',
    demoDescription: 'ಪ್ರದರ್ಶನಕ್ಕಾಗಿ ಮಾದರಿ ದೂರು ಮಾಹಿತಿಯನ್ನು ತೋರಿಸಲಾಗಿದೆ.',
    demoOfficer: 'ದೂರು ಪರಿಹಾರ ಅಧಿಕಾರಿ',
    department: 'ಇಲಾಖೆ',
    officer: 'ಜವಾಬ್ದಾರ ಅಧಿಕಾರಿ',
    filed: 'ಸಲ್ಲಿಸಿದ ದಿನಾಂಕ',
  },
  ml: {
    title: 'പരാതിയുടെ നില പരിശോധിക്കുക',
    subtitle: 'സമയപരിധിയോടെയുള്ള ഉത്തരവാദിത്തവും സ്വയമേവ ഉയർത്തലും',
    placeholder: 'പരാതി ഐഡി നൽകുക',
    track: 'പരിശോധിക്കുക',
    searching: 'തിരയുന്നു...',
    auto: 'സ്വയമേവ അടുത്ത ഘട്ടത്തിലേക്ക് പോകാൻ',
    days: 'ദിവസങ്ങൾ',
    progress: 'പൗര ഉത്തരവാദിത്ത പുരോഗതി',
    completed: 'പൂർത്തിയായി',
    level1: 'നില 1: പരാതി ഉദ്യോഗസ്ഥൻ',
    desc1: 'പരാതി പ്രാദേശിക വാർഡ് ഉദ്യോഗസ്ഥന് നൽകി. സമയപരിധി: 7 ദിവസം.',
    level2: 'നില 2: ആദ്യ അപ്പീൽ അതോറിറ്റി',
    desc2: '7 ദിവസത്തിനുള്ളിൽ പരിഹരിച്ചില്ലെങ്കിൽ പരാതി സ്വയമേവ മുന്നോട്ട് പോകും.',
    level3: 'നില 3: വിജിലൻസ് കമ്മീഷൻ / ലോകായുക്ത',
    desc3: 'അഴിമതിയെക്കുറിച്ചുള്ള സ്വതന്ത്ര പരിശോധനയും നടപടിയും.',
    level4: 'അന്തിമ നടപടിയും പരിഹാരവും',
    desc4: 'അനുസരണ റിപ്പോർട്ട് സമർപ്പിച്ച് പരാതി പരിഹരിച്ചു.',
    day1: 'ദിവസം 1 - 7',
    day2: 'ദിവസം 8 - 15',
    day3: 'ദിവസം 16 - 30',
    notFound: 'പരാതി കണ്ടെത്താനായില്ല. മാതൃകാ വിവരം കാണിക്കുന്നു.',
    demoDepartment: 'പൊതുമരാമത്ത് വകുപ്പ്',
    demoDescription: 'പ്രദർശനത്തിനായി മാതൃകാ പരാതി വിവരം കാണിക്കുന്നു.',
    demoOfficer: 'പരാതി പരിഹാര ഉദ്യോഗസ്ഥൻ',
    department: 'വകുപ്പ്',
    officer: 'ഉത്തരവാദപ്പെട്ട ഉദ്യോഗസ്ഥൻ',
    filed: 'സമർപ്പിച്ച തീയതി',
  },
  pa: {
    title: 'ਸ਼ਿਕਾਇਤ ਦੀ ਸਥਿਤੀ ਟ੍ਰੈਕ ਕਰੋ',
    subtitle: 'ਸਮੇਂ-ਬੱਧ ਜਵਾਬਦੇਹੀ ਅਤੇ ਆਪਣੇ ਆਪ ਅਗਲੇ ਪੱਧਰ ਤੇ ਭੇਜਣਾ',
    placeholder: 'ਸ਼ਿਕਾਇਤ ID ਦਰਜ ਕਰੋ',
    track: 'ਟ੍ਰੈਕ ਕਰੋ',
    searching: 'ਖੋਜ ਜਾਰੀ ਹੈ...',
    auto: 'ਆਪਣੇ ਆਪ ਅਗਲੇ ਪੱਧਰ ਤੇ ਜਾਣ ਲਈ',
    days: 'ਦਿਨ',
    progress: 'ਨਾਗਰਿਕ ਜਵਾਬਦੇਹੀ ਦੀ ਪ੍ਰਗਤੀ',
    completed: 'ਪੂਰਾ ਹੋਇਆ',
    level1: 'ਪੱਧਰ 1: ਸ਼ਿਕਾਇਤ ਅਧਿਕਾਰੀ',
    desc1: 'ਸ਼ਿਕਾਇਤ ਸਥਾਨਕ ਵਾਰਡ ਅਧਿਕਾਰੀ ਨੂੰ ਸੌਂਪੀ ਗਈ। ਸਮਾਂ ਸੀਮਾ: 7 ਦਿਨ।',
    level2: 'ਪੱਧਰ 2: ਪਹਿਲੀ ਅਪੀਲ ਅਥਾਰਟੀ',
    desc2: '7 ਦਿਨਾਂ ਵਿੱਚ ਹੱਲ ਨਾ ਹੋਣ ਤੇ ਸ਼ਿਕਾਇਤ ਆਪਣੇ ਆਪ ਅੱਗੇ ਭੇਜੀ ਜਾਵੇਗੀ।',
    level3: 'ਪੱਧਰ 3: ਵਿਜੀਲੈਂਸ ਕਮਿਸ਼ਨ / ਲੋਕਾਯੁਕਤ',
    desc3: 'ਭ੍ਰਿਸ਼ਟਾਚਾਰ ਦੀ ਸੁਤੰਤਰ ਜਾਂਚ ਅਤੇ ਕਾਰਵਾਈ।',
    level4: 'ਅੰਤਿਮ ਕਾਰਵਾਈ ਅਤੇ ਨਿਪਟਾਰਾ',
    desc4: 'ਪਾਲਣਾ ਰਿਪੋਰਟ ਜਮ੍ਹਾਂ ਕਰਕੇ ਸ਼ਿਕਾਇਤ ਦਾ ਨਿਪਟਾਰਾ ਕੀਤਾ ਗਿਆ।',
    day1: 'ਦਿਨ 1 - 7',
    day2: 'ਦਿਨ 8 - 15',
    day3: 'ਦਿਨ 16 - 30',
    notFound: 'ਸ਼ਿਕਾਇਤ ਨਹੀਂ ਮਿਲੀ। ਨਮੂਨੇ ਦੀ ਜਾਣਕਾਰੀ ਦਿਖਾਈ ਜਾ ਰਹੀ ਹੈ।',
    demoDepartment: 'ਲੋਕ ਨਿਰਮਾਣ ਵਿਭਾਗ',
    demoDescription: 'ਦਿਖਾਵੇ ਲਈ ਨਮੂਨੇ ਦੀ ਸ਼ਿਕਾਇਤ ਜਾਣਕਾਰੀ ਦਿਖਾਈ ਗਈ ਹੈ।',
    demoOfficer: 'ਸ਼ਿਕਾਇਤ ਨਿਵਾਰਣ ਅਧਿਕਾਰੀ',
    department: 'ਵਿਭਾਗ',
    officer: 'ਜ਼ਿੰਮੇਵਾਰ ਅਧਿਕਾਰੀ',
    filed: 'ਦਰਜ ਕਰਨ ਦੀ ਮਿਤੀ',
  },
  ur: {
    title: 'شکایت کی صورتحال دیکھیں',
    subtitle: 'وقت کی پابندی کے ساتھ جواب دہی اور خودکار اگلا مرحلہ',
    placeholder: 'شکایت کی آئی ڈی درج کریں',
    track: 'دیکھیں',
    searching: 'تلاش جاری ہے...',
    auto: 'خودکار اگلے مرحلے میں جانے میں',
    days: 'دن',
    progress: 'شہری جواب دہی کی پیش رفت',
    completed: 'مکمل',
    level1: 'مرحلہ 1: شکایات افسر',
    desc1: 'شکایت مقامی وارڈ افسر کو دی گئی۔ مدت: 7 دن۔',
    level2: 'مرحلہ 2: پہلی اپیل اتھارٹی',
    desc2: '7 دن میں حل نہ ہونے پر شکایت خودکار طور پر آگے بڑھے گی۔',
    level3: 'مرحلہ 3: نگرانی کمیشن / لوک آیکت',
    desc3: 'بدعنوانی کا آزادانہ جائزہ اور کارروائی۔',
    level4: 'حتمی کارروائی اور ازالہ',
    desc4: 'تعمیل رپورٹ جمع کر کے شکایت حل کر دی گئی۔',
    day1: 'دن 1 - 7',
    day2: 'دن 8 - 15',
    day3: 'دن 16 - 30',
    notFound: 'شکایت نہیں ملی۔ نمونے کی معلومات دکھائی جا رہی ہیں۔',
    demoDepartment: 'محکمہ تعمیرات عامہ',
    demoDescription: 'نمائش کے لیے شکایت کی نمونہ معلومات دکھائی جا رہی ہیں۔',
    demoOfficer: 'شکایت ازالہ افسر',
    department: 'محکمہ',
    officer: 'ذمہ دار افسر',
    filed: 'درج کرنے کی تاریخ',
  },
  or: {
    title: 'ଅଭିଯୋଗର ସ୍ଥିତି ଯାଞ୍ଚ କରନ୍ତୁ',
    subtitle: 'ସମୟସୀମା ମଧ୍ୟରେ ଉତ୍ତରଦାୟିତ୍ୱ ଓ ସ୍ୱୟଂଚାଳିତ ପଦକ୍ଷେପ',
    placeholder: 'ଅଭିଯୋଗ ID ଦିଅନ୍ତୁ',
    track: 'ଯାଞ୍ଚ କରନ୍ତୁ',
    searching: 'ଖୋଜା ଚାଲିଛି...',
    auto: 'ସ୍ୱୟଂଚାଳିତ ପଦକ୍ଷେପ ପାଇଁ',
    days: 'ଦିନ',
    progress: 'ନାଗରିକ ଉତ୍ତରଦାୟିତ୍ୱର ପ୍ରଗତି',
    completed: 'ସମାପ୍ତ',
    level1: 'ସ୍ତର 1: ଅଭିଯୋଗ ଅଧିକାରୀ',
    desc1: 'ଅଭିଯୋଗ ସ୍ଥାନୀୟ ୱାର୍ଡ ଅଧିକାରୀଙ୍କୁ ଦିଆଯାଇଛି। ସମୟସୀମା: 7 ଦିନ।',
    level2: 'ସ୍ତର 2: ପ୍ରଥମ ଅପିଲ୍ କର୍ତ୍ତୃପକ୍ଷ',
    desc2: '7 ଦିନ ମଧ୍ୟରେ ସମାଧାନ ନହେଲେ ଅଭିଯୋଗ ଆଗକୁ ବଢ଼ିବ।',
    level3: 'ସ୍ତର 3: ଭିଜିଲାନ୍ସ କମିଶନ / ଲୋକାୟୁକ୍ତ',
    desc3: 'ଦୁର୍ନୀତିର ସ୍ୱାଧୀନ ଯାଞ୍ଚ ଓ ପଦକ୍ଷେପ।',
    level4: 'ଅନ୍ତିମ ପଦକ୍ଷେପ ଓ ସମାଧାନ',
    desc4: 'ଅନୁପାଳନ ରିପୋର୍ଟ ଦାଖଲ କରି ଅଭିଯୋଗ ସମାଧାନ କରାଗଲା।',
    day1: 'ଦିନ 1 - 7',
    day2: 'ଦିନ 8 - 15',
    day3: 'ଦିନ 16 - 30',
    notFound: 'ଅଭିଯୋଗ ମିଳିଲା ନାହିଁ। ନମୁନା ସୂଚନା ଦେଖାଯାଉଛି।',
    demoDepartment: 'ଲୋକ ନିର୍ମାଣ ବିଭାଗ',
    demoDescription: 'ପ୍ରଦର୍ଶନ ପାଇଁ ନମୁନା ଅଭିଯୋଗ ସୂଚନା ଦେଖାଯାଉଛି।',
    demoOfficer: 'ଅଭିଯୋଗ ସମାଧାନ ଅଧିକାରୀ',
    department: 'ବିଭାଗ',
    officer: 'ଦାୟିତ୍ୱପ୍ରାପ୍ତ ଅଧିକାରୀ',
    filed: 'ଦାଖଲ ତାରିଖ',
  },
  as: {
    title: 'অভিযোগৰ স্থিতি অনুসৰণ কৰক',
    subtitle: 'সময়সীমাবদ্ধ দায়বদ্ধতা আৰু স্বয়ংক্ৰিয় পৰৱৰ্তী পদক্ষেপ',
    placeholder: 'অভিযোগৰ ID দিয়ক',
    track: 'অনুসৰণ কৰক',
    searching: 'বিচৰা হৈছে...',
    auto: 'স্বয়ংক্ৰিয়ভাৱে আগবাঢ়িবলৈ',
    days: 'দিন',
    progress: 'নাগৰিকৰ দায়বদ্ধতাৰ অগ্ৰগতি',
    completed: 'সম্পূৰ্ণ',
    level1: 'স্তৰ 1: অভিযোগ বিষয়া',
    desc1: 'অভিযোগ স্থানীয় ৱাৰ্ড বিষয়াক দিয়া হৈছে। সময়সীমা: 7 দিন।',
    level2: 'স্তৰ 2: প্ৰথম আপীল কৰ্তৃপক্ষ',
    desc2: '7 দিনত সমাধান নহ’লে অভিযোগ স্বয়ংক্ৰিয়ভাৱে আগবাঢ়িব।',
    level3: 'স্তৰ 3: ভিজিলেন্স আয়োগ / লোকায়ুক্ত',
    desc3: 'দুৰ্নীতিৰ স্বতন্ত্ৰ পৰ্যালোচনা আৰু ব্যৱস্থা।',
    level4: 'চূড়ান্ত ব্যৱস্থা আৰু সমাধান',
    desc4: 'অনুপালন প্ৰতিবেদন দাখিল কৰি অভিযোগ সমাধান কৰা হৈছে।',
    day1: 'দিন 1 - 7',
    day2: 'দিন 8 - 15',
    day3: 'দিন 16 - 30',
    notFound: 'অভিযোগ পোৱা নগ’ল। নমুনা তথ্য দেখুওৱা হৈছে।',
    demoDepartment: 'লোক নিৰ্মাণ বিভাগ',
    demoDescription: 'প্ৰদৰ্শনৰ বাবে নমুনা অভিযোগৰ তথ্য দেখুওৱা হৈছে।',
    demoOfficer: 'অভিযোগ নিষ্পত্তি বিষয়া',
    department: 'বিভাগ',
    officer: 'দায়িত্বশীল বিষয়া',
    filed: 'দাখিলৰ তাৰিখ',
  },
  sa: {
    title: 'परिवादस्य स्थितिं पश्यन्तु',
    subtitle: 'समयबद्धम् उत्तरदायित्वम् स्वचालितं च अग्रे प्रेषणम्',
    placeholder: 'परिवादस्य ID लिखन्तु',
    track: 'अनुसरणं कुर्वन्तु',
    searching: 'अन्वेषणं क्रियते...',
    auto: 'स्वचालिताग्रे प्रेषणाय',
    days: 'दिनानि',
    progress: 'नागरिकउत्तरदायित्वस्य प्रगतिः',
    completed: 'सम्पन्नम्',
    level1: 'स्तरः १: परिवादाधिकारी',
    desc1: 'परिवादः स्थानीयवार्ड-अधिकरिणे समर्पितः। समयसीमा: ७ दिनानि।',
    level2: 'स्तरः २: प्रथमः अपीलप्राधिकारी',
    desc2: '७ दिनेषु समाधानं न चेत् परिवादः स्वयमेव अग्रे प्रेष्यते।',
    level3: 'स्तरः ३: सतर्कतायोगः / लोकायुक्तः',
    desc3: 'भ्रष्टाचारस्य स्वतन्त्रपरीक्षणं कार्यवाही च।',
    level4: 'अन्तिमकार्यवाही समाधानं च',
    desc4: 'अनुपालनप्रतिवेदनं समर्प्य परिवादः समाधीयते।',
    day1: 'दिनम् १ - ७',
    day2: 'दिनम् ८ - १५',
    day3: 'दिनम् १६ - ३०',
    notFound: 'परिवादः न प्राप्तः। उदाहरणसूचना प्रदर्श्यते।',
    demoDepartment: 'लोकनिर्माणविभागः',
    demoDescription: 'प्रदर्शनार्थं परिवादस्य उदाहरणसूचना प्रदर्श्यते।',
    demoOfficer: 'परिवादनिवारणाधिकारी',
    department: 'विभागः',
    officer: 'उत्तरदायी अधिकारी',
    filed: 'समर्पणदिनाङ्कः',
  },
};

const STAGE_KEYS = [
  ['level1', 'desc1', 'day1'],
  ['level2', 'desc2', 'day2'],
  ['level3', 'desc3', 'day3'],
  ['level4', 'desc4', 'completed'],
];

export default function TrackStatusModal({
  isOpen,
  onClose,
  isDark,
  initialId = '',
}) {
  const { currentLang } = useLanguage();
  const lang = TEXT[currentLang] || TEXT.en;

  const [complaintId, setComplaintId] = useState(
    initialId || 'CC-2026-DL-28491'
  );
  const [searchedRecord, setSearchedRecord] = useState({
    id: 'CC-2026-DL-28491',
    department: 'Municipal Corporation & Civic Services',
    description:
      'Illegal demolition threat and extortion by ward inspection officers without statutory notice under Section 343.',
    filedDate: '15 Oct 2026',
    stage: 2,
    daysToAutoEscalate: 3,
    nodalOfficer: 'Shri R. K. Sharma (Deputy Commissioner, Ward 14)',
  });
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchNotFound, setSearchNotFound] = useState(false);

  useEffect(() => {
    if (initialId) {
      setComplaintId(initialId);
    }
  }, [initialId]);

  if (!isOpen) return null;

  const stages = STAGE_KEYS.map(([title, desc, time]) => ({
    title: lang[title],
    desc: lang[desc],
    time: lang[time],
  }));

  const handleSearch = async (e) => {
    e.preventDefault();
    const query = complaintId.trim();
    if (!query) return;

    setSearchLoading(true);
    setSearchNotFound(false);

    try {
      const res = await fetch(
        `/api/complaints/reference/${encodeURIComponent(query)}`
      );
      const json = await res.json();

      if (res.ok && json.data?.complaint) {
        const c = json.data.complaint;

        setSearchedRecord({
          id: c.referenceNumber,
          department:
            c.department?.name || lang.demoDepartment,
          description: c.title || lang.demoDescription,
          filedDate: c.filedAt
            ? new Date(c.filedAt).toLocaleDateString(currentLang, {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })
            : '',
          stage: Math.max(0, Math.min(3, Number(c.stage || 1))),
          daysToAutoEscalate: c.slaDaysRemaining ?? 7,
          nodalOfficer: c.stageName || lang.demoOfficer,
        });

        setSearchLoading(false);
        return;
      }
    } catch {
      // Show the demo fallback below if the API is unavailable.
    }

    setSearchNotFound(true);
    setSearchedRecord({
      id: query.toUpperCase(),
      department: lang.demoDepartment,
      description: lang.demoDescription,
      filedDate: new Date().toLocaleDateString(currentLang, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      stage: 1,
      daysToAutoEscalate: 7,
      nodalOfficer: lang.demoOfficer,
    });
    setSearchLoading(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="track-modal-title"
    >
      <div
        className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8 shadow-2xl relative border ${
          isDark
            ? 'bg-slate-900/95 border-sky-400/20 text-white'
            : 'bg-white/95 border-slate-200 text-slate-900'
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-500/20 text-slate-400 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-6 pr-8">
          <div className="w-10 h-10 rounded-xl bg-sky-600 flex items-center justify-center text-white">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h2 id="track-modal-title" className="text-xl font-bold">
              {lang.title}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {lang.subtitle}
            </p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <div
            className={`flex-1 flex items-center px-4 rounded-xl border ${
              isDark
                ? 'bg-slate-800/80 border-slate-700'
                : 'bg-slate-50 border-slate-300'
            }`}
          >
            <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
            <input
              type="text"
              value={complaintId}
              onChange={(e) => setComplaintId(e.target.value)}
              placeholder={lang.placeholder}
              aria-label={lang.placeholder}
              className="w-full min-w-0 py-2.5 bg-transparent text-sm focus:outline-none font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={searchLoading}
            className="bg-sky-600 hover:bg-sky-700 disabled:opacity-60 px-5 py-2.5 rounded-xl text-white font-semibold text-sm cursor-pointer"
          >
            {searchLoading ? lang.searching : lang.track}
          </button>
        </form>

        {searchNotFound && (
          <p className="text-sm text-amber-500 mb-4" role="status">
            {lang.notFound}
          </p>
        )}

        {searchedRecord && (
          <div className="space-y-6">
            <div
              className={`p-4 rounded-2xl border ${
                isDark
                  ? 'bg-slate-800/40 border-slate-700/60'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className="text-xs font-mono font-bold text-orange-500">
                  {searchedRecord.id}
                </span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {lang.auto} {searchedRecord.daysToAutoEscalate} {lang.days}
                </span>
              </div>

              <h4 className="text-sm font-bold">
                {searchedRecord.department}
              </h4>
              <p className="text-xs mt-1 leading-relaxed opacity-80">
                {searchedRecord.description}
              </p>

              <div className="mt-3 space-y-1 text-xs opacity-80">
                <p>
                  <strong>{lang.filed}:</strong>{' '}
                  {searchedRecord.filedDate}
                </p>
                <p>
                  <strong>{lang.officer}:</strong>{' '}
                  {searchedRecord.nodalOfficer}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider opacity-70">
                {lang.progress}
              </span>

              <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-300 dark:before:bg-slate-700">
                {stages.map((stage, i) => {
                  const isDone = i < searchedRecord.stage;
                  const isCurrent = i === searchedRecord.stage;

                  return (
                    <div key={i} className="relative">
                      <div
                        className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          isDone
                            ? 'bg-emerald-500 text-white'
                            : isCurrent
                            ? 'bg-orange-500 text-white ring-4 ring-orange-500/20'
                            : isDark
                            ? 'bg-slate-800 text-slate-500 border border-slate-700'
                            : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          i + 1
                        )}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span
                            className={`text-sm font-bold ${
                              isCurrent
                                ? 'text-orange-500'
                                : isDone
                                ? ''
                                : 'opacity-60'
                            }`}
                          >
                            {stage.title}
                          </span>
                          <span className="text-[11px] font-semibold opacity-70">
                            {stage.time}
                          </span>
                        </div>
                        <p
                          className={`text-xs mt-0.5 opacity-80 ${
                            !isCurrent && !isDone ? 'opacity-50' : ''
                          }`}
                        >
                          {stage.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
