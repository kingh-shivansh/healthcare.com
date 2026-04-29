import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { 
  Home as HomeIcon, Info, Pill, Search as UserSearch, PlusCircle, LogOut, Menu, X, HeartPulse, 
  User, MessageSquare, Store, Send, ShieldAlert, UserCircle, Mail, AlertCircle, Copy, Check,
  Phone, Calendar, Package, Clock, Heart, ArrowRight, FileText, Trash2, Edit3, CreditCard,
  Camera, Image
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { GoogleGenAI } from "@google/genai";
import { db, auth } from './lib/firebase';
import { collection, query, where, getDocs, getDoc, addDoc, updateDoc, deleteDoc, doc, onSnapshot, orderBy, serverTimestamp, setDoc } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'firebase/auth';
import { handleFirestoreError, OperationType } from './lib/firebaseUtils';
import { 
  firebaseService, 
  appointmentsRef, 
  ordersRef, 
  labBookingsRef 
} from './services/firebaseService';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

const ai = new GoogleGenAI({ apiKey: (process.env as any).GEMINI_API_KEY });

// --- Types ---
type Language = 'en' | 'hi' | 'ta' | 'bn';

const translations = {
  en: {
    dashboard: "Dashboard",
    findDoctor: "Find Doctor",
    medStore: "Med Store",
    diagnostics: "Diagnostics",
    healthBlogs: "Health Blogs",
    neuralAssistant: "Neural Assistant",
    pharmacopeia: "Pharmacopeia",
    reminders: "Reminders",
    appointments: "Appointments",
    myOrders: "My Orders",
    profile: "Profile",
    logout: "Logout",
    searchPlaceholder: "Search clinical database...",
    welcome: "Welcome to healthcare.com",
    homeRemedyBot: "Home Remedy Bot",
    uploadPhoto: "Upload Photo",
    takePhoto: "Take Photo",
    describeSymptoms: "Describe your symptoms...",
    send: "Send",
    warningAI: "Warning: AI-Generated Content. Not a substitute for professional medical advice.",
    guestMode: "Guest Mode",
    onboarding: "Complete Onboarding",
    clinicalAssistant: "Clinical Assistant Initialized. State your symptoms or upload a photo of the affected area for home remedy suggestions.",
    imageLarge: "Image too large. Please select a file smaller than 5MB.",
    attachedImage: "Attached an image for clinical review.",
    neuralEngineNull: "Neural engine returned null.",
    syncInterrupted: "Communication failure: Sync interrupted.",
    aboutHealthcare: "About Us",
    queue: "Queue",
    inbox: "Inbox",
    myLabTests: "My Lab Tests",
    pathogenicLabs: "Pathogenic Labs",
    medicalReports: "Medical Reports",
  },
  hi: {
    dashboard: "डैशबोर्ड",
    findDoctor: "डॉक्टर खोजें",
    medStore: "मेड स्टोर",
    diagnostics: "डाइग्नोस्टिक्स",
    healthBlogs: "स्वास्थ्य ब्लॉग",
    neuralAssistant: "न्यूरल असिस्टेंट",
    pharmacopeia: "फार्माकोपिया",
    reminders: "अनुस्मारक",
    appointments: "अपॉइंटमेंट",
    myOrders: "मेरे आदेश",
    profile: "प्रोफাইল",
    logout: "लॉगआउट",
    searchPlaceholder: "नैदानिक डेटाबेस खोजें...",
    welcome: "healthcare.com में आपका स्वागत है",
    homeRemedyBot: "घरेलू उपचार बॉट",
    uploadPhoto: "फोटो अपलोड करें",
    takePhoto: "फोटो लें",
    describeSymptoms: "अपने लक्षणों का वर्णन करें...",
    send: "भेজें",
    warningAI: "चेतावनी: AI-जनित सामग्री। पेशेवर चिकित्सा सलाह का विकल्प नहीं है।",
    guestMode: "अतिथि मोड",
    onboarding: "ऑनबोर्डिंग पूरी करें",
    clinicalAssistant: "नैदानिक सहायक शुरू किया गया। घरेलू उपचार सुझावों के लिए अपने लक्षणों को बताएं या प्रभावित क्षेत्र की फोटो अपलोड करें।",
    imageLarge: "छवि बहुत बड़ी है। कृपया 5MB से छोटी फाइल चुनें।",
    attachedImage: "नैदानिक समीक्षा के लिए एक छवि संलग्न की गई।",
    neuralEngineNull: "न्यूरल इंजन ने शून्य लौटाया।",
    syncInterrupted: "संचार विफलता: सिंक बाधित।",
    aboutHealthcare: "हमारे बारे में",
    queue: "कतार",
    inbox: "इनबॉक्स",
    myLabTests: "मेरे लैब परीक्षण",
    pathogenicLabs: "रोगजनक प्रयोगशालाएं",
    medicalReports: "चिकित्सा रिपोर्ट",
  },
  ta: {
    dashboard: "டாஷ்போர்டு",
    findDoctor: "மருத்துவரைத் தேடு",
    medStore: "மருந்துக்கடை",
    diagnostics: "பரிசோதனைகள்",
    healthBlogs: "சுகாதார வலைப்பதிவுகள்",
    neuralAssistant: "நியூரல் அசிஸ்டண்ட்",
    pharmacopeia: "மருந்தியல்",
    reminders: "நினைவூட்டல்கள்",
    appointments: "சந்திப்புகள்",
    myOrders: "எனது ஆர்டர்கள்",
    profile: "சுயவிவரம்",
    logout: "வெளியேறு",
    searchPlaceholder: "மருத்துவ தரவுத்தளத்தைத் தேடு...",
    welcome: "healthcare.com-க்கு உங்களை வரவேற்கிறோம்",
    homeRemedyBot: "வீட்டு வைத்தியம் பாட்",
    uploadPhoto: "புகைப்படத்தைப் பதிவேற்றவும்",
    takePhoto: "புகைப்படம் எடுக்கவும்",
    describeSymptoms: "உங்கள் அறிகுறிகளை விவரிக்கவும்...",
    send: "அனுப்பு",
    warningAI: "எச்சரிக்கை: AI ஆல் உருவாக்கப்பட்ட உள்ளடக்கம். தொழில்முறை மருத்துவ ஆலோசனைக்கு மாற்றாகாது.",
    guestMode: "விருந்தினர் பயன்முறை",
    onboarding: "ஆன்போர்டிங்கை முடிக்கவும்",
    clinicalAssistant: "மருத்துவ உதவியாளர் தொடங்கப்பட்டது. வீட்டு வைத்தியம் பரிந்துரைகளுக்கு உங்கள் அறிகுறிகளைக் கூறவும் அல்லது பாதிக்கப்பட்ட பகுதியின் புகைப்படத்தைப் பதிவேற்றவும்.",
    imageLarge: "படம் மிகவும் பெரியது. தயவுசெய்து 5MB க்கும் குறைவான கோப்பைத் தேர்ந்தெடுக்கவும்.",
    attachedImage: "மருத்துவ ஆய்வுக்கு ஒரு படம் இணைக்கப்பட்டுள்ளது.",
    neuralEngineNull: "நியூரல் என்ஜின் பூஜ்யத்தை வழங்கியது.",
    syncInterrupted: "தகவல் தொடர்பு தோல்வி: ஒத்திசைவு தடைபட்டது.",
    aboutHealthcare: "எங்களைப் பற்றி",
    queue: "வரிசை",
    inbox: "இன்பாக்ஸ்",
    myLabTests: "எனது ஆய்வக சோதனைகள்",
    pathogenicLabs: "நோய்க்கிருமி ஆய்வகங்கள்",
    medicalReports: "மருத்துவ அறிக்கைகள்",
  },
  bn: {
    dashboard: "ড্যাশবোর্ড",
    findDoctor: "ডাক্তার খুঁজুন",
    medStore: "মেড স্টোর",
    diagnostics: "ডায়াগনস্টিকস",
    healthBlogs: "স্বাস্থ্য ব্লগ",
    neuralAssistant: "নিউরাল অ্যাসিস্ট্যান্ট",
    pharmacopeia: "ফার্মাকোপিয়া",
    reminders: "রিমাইন্ডার",
    appointments: "অ্যাপয়েন্টমেন্ট",
    myOrders: "আমার অর্ডার",
    profile: "প্রোফাইল",
    logout: "লগআউট",
    searchPlaceholder: "ক্লিনিকাল ডেটাবেস অনুসন্ধান করুন...",
    welcome: "healthcare.com-এ স্বাগতম",
    homeRemedyBot: "ঘরোয়া প্রতিকার বট",
    uploadPhoto: "ফটো আপলোড করুন",
    takePhoto: "ফটো তুলুন",
    describeSymptoms: "আপনার উপসর্গ বর্ণনা করুন...",
    send: "পাঠান",
    warningAI: "সতর্কতা: AI-দ্বারা তৈরি তথ্য। পেশাদার চিকিৎসা পরামর্শের বিকল্প নয়।",
    guestMode: "গেস্ট মোড",
    onboarding: "অনবোর্ডিং সম্পন্ন করুন",
    clinicalAssistant: "ক্লিনিকাল সহকারী সক্রিয় করা হয়েছে। ঘরোয়া প্রতিকারের পরামর্শের জন্য আপনার লক্ষণগুলি বলুন বা আক্রান্ত স্থানের একটি ছবি আপলোড করুন।",
    imageLarge: "ছবিটি অনেক বড়। অনুগ্রহ করে ৫ মেগাবাইটের কম সাইজের ছবি নির্বাচন করুন।",
    attachedImage: "ক্লিনিকাল পর্যালোচনার জন্য একটি ছবি সংযুক্ত করা হয়েছে।",
    neuralEngineNull: "নিউরাল ইঞ্জিন কিছুই উত্তর দেয়নি।",
    syncInterrupted: "যোগাযোগে ব্যর্থতা।",
    aboutHealthcare: "আমাদের সম্পর্কে",
    queue: "কিউ",
    inbox: "ইনবক্স",
    myLabTests: "আমার ল্যাব পরীক্ষা",
    pathogenicLabs: "প্যাথোজেনিক ল্যাব",
    medicalReports: "মেডিকেল রিপোর্ট",
  },
};

interface UserProfile {
  id: string;
  role: 'patient' | 'doctor' | 'med_store' | 'lab';
  email: string;
  dob?: string;
  dor?: string; // Date of Registration for providers
  name?: string;
  age?: number;
  sex?: string;
  height?: string;
  weight?: string;
  image?: string;
  location?: string;
  lat?: number;
  lng?: number;
  specialization?: string;
  experience?: string;
  experienceYears?: number;
  fee?: number; // Service fee set by provider
  qrCode?: string; // UPI ID or QR image URL
  availability?: string;
  owner_name?: string;
  onboarded: boolean;
  isGuest?: boolean;
  guestId?: string;
}

interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

interface Chat {
  id: string;
  user_id: string;
  doctor_id: string;
  doctor_name: string;
  created_at: string;
}

interface Lab {
  id: string;
  name: string;
  address: string;
  contact: string;
  hours: string;
  owner: string;
  lat: number;
  lng: number;
  distance?: number;
  fee?: number;
}

interface Report {
  id: string;
  user_id: string;
  title: string;
  date: string;
  file_url?: string;
  summary: string;
}

interface Blog {
  id: string;
  title: string;
  author: string;
  content: string;
  date: string;
  category: string;
}

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  experience: string;
  contact: string;
  image: string;
  availability: string;
  location: string;
  lat: number;
  lng: number;
  distance?: number;
  fee?: number;
}

interface Drug {
  id: string;
  name: string;
  dosing: string;
  indications: string;
  reactions: string;
  usage: string;
}

interface Reminder {
  id: string;
  userId: string;
  medicineName: string;
  dosage: string;
  time: string;
  frequency: string;
  active: boolean;
  createdAt: any;
}

interface MedicalStore {
  id: string;
  name: string;
  address: string;
  contact: string;
  hours: string;
  lat: number;
  lng: number;
  distance?: number;
  fee?: number;
}

// --- Utils ---
const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button 
      onClick={(e) => { e.stopPropagation(); handleCopy(); }}
      className={`p-1.5 rounded transition-all flex items-center gap-1 ${copied ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-emerald-100 hover:text-emerald-600'}`}
    >
      {copied ? <span className="text-[8px] font-black uppercase">Copied</span> : <Copy size={10} />}
    </button>
  );
};

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

const BlogContent = ({ content }: { content: string }) => {
  const isHtml = content.trim().startsWith('<') && content.trim().endsWith('>');
  if (isHtml) {
    return (
      <div 
        className="prose prose-slate prose-emerald max-w-none prose-p:my-2 prose-headings:mb-4"
        dangerouslySetInnerHTML={{ __html: content }} 
      />
    );
  }
  return (
    <div className="prose prose-sm max-w-none prose-slate prose-emerald">
      <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
    </div>
  );
};

// --- Components ---

const ExamplePage = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50 text-center">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md p-10 bg-white rounded-3xl shadow-xl border border-slate-100"
      >
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600">
          <HeartPulse size={40} />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Coming Soon</h1>
        <p className="text-slate-600 mb-8 leading-relaxed">
          Sorry, this was an example feature to demonstrate functionality. 
          The live booking and ordering system will be available in the next update!
        </p>
        <button 
          onClick={() => window.history.back()}
          className="px-8 py-3 bg-emerald-600 text-white rounded-full font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95"
        >
          Go Back
        </button>
      </motion.div>
    </div>
  );
};

const MapCenterHandler = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center]);
  return null;
};

const LanguageSelector = ({ current, onChange }: { current: Language, onChange: (l: Language) => void }) => {
  const languages: { code: Language, name: string }[] = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिन्दी' },
    { code: 'ta', name: 'தமிழ்' },
    { code: 'bn', name: 'বাংলা' }
  ];

  return (
    <div className="flex gap-2 p-2 bg-slate-800 rounded-xl mb-4 border border-slate-700 overflow-x-auto scrollbar-hide">
      {languages.map(lang => (
        <button
          key={lang.code}
          onClick={() => onChange(lang.code)}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
            current === lang.code 
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {lang.name}
        </button>
      ))}
    </div>
  );
};

const Logo = ({ className = "w-8 h-8" }: { className?: string }) => {
  const [error, setError] = useState(false);
  const fallbacks = [
    '/logo.png',
    'https://i.ibb.co/vzPBZ4B/healthcare-logo.png',
    'https://ui-avatars.com/api/?name=healthcare.com&background=10b981&color=fff&bold=true'
  ];
  
  const [srcIndex, setSrcIndex] = useState(0);

  const handleError = () => {
    if (srcIndex < fallbacks.length - 1) {
      setSrcIndex(srcIndex + 1);
    } else {
      setError(true);
    }
  };

  return (
    <div className={`${className} bg-emerald-500 rounded-lg flex items-center justify-center overflow-hidden shrink-0 shadow-lg`}>
      <img 
        src={fallbacks[srcIndex]} 
        alt="logo" 
        className="w-full h-full object-contain"
        onError={handleError}
      />
    </div>
  );
};

const InteractiveMap = ({ items, center, userLocation, onSelectAction, onFindMe }: { items: any[], center: [number, number], userLocation?: {lat: number, lng: number} | null, onSelectAction?: (item: any) => void, onFindMe?: () => void }) => {
  const mapCenter = userLocation ? [userLocation.lat, userLocation.lng] as [number, number] : center;
  const icon = L.divIcon({
    html: `<div class="w-6 h-6 bg-emerald-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>
           </div>`,
    className: 'custom-map-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24]
  });

  const userIcon = L.divIcon({
    html: `<div class="w-8 h-8 flex items-center justify-center">
            <div class="absolute w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-lg z-10"></div>
            <div class="absolute w-8 h-8 bg-blue-400 rounded-full animate-ping opacity-40"></div>
           </div>`,
    className: 'user-map-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });

  return (
    <div className="h-[300px] w-full rounded-xl overflow-hidden border border-slate-200 shadow-sm mb-6 z-0 relative group">
      {onFindMe && (
        <button 
          onClick={onFindMe}
          className="absolute top-4 right-4 z-[1000] bg-white p-2 rounded-lg shadow-xl border border-slate-200 text-slate-700 hover:text-emerald-600 transition-all active:scale-95 flex items-center gap-2 group/btn"
        >
          <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
            <HeartPulse size={16} className="text-emerald-500" />
          </motion.div>
          <span className="text-[10px] font-bold uppercase tracking-widest pr-1">Find My Location</span>
        </button>
      )}
      <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapCenterHandler center={mapCenter} />
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
            <Popup>
              <div className="p-1">
                <p className="font-bold text-[11px] text-blue-600">You are here</p>
                <p className="text-[9px] text-slate-500">Your current location</p>
              </div>
            </Popup>
          </Marker>
        )}
        {items.filter(item => item.lat && item.lng).map((item) => (
          <Marker key={item.id} position={[item.lat, item.lng]} icon={icon}>
            <Popup>
              <div className="p-1 min-w-[120px]">
                <p className="font-bold text-[11px] text-slate-900 leading-tight mb-1">{item.name}</p>
                <div className="flex items-center gap-1 text-[9px] text-slate-500 mb-1">
                  <Phone size={8} /> {item.contact}
                </div>
                {item.specialization && (
                   <p className="text-[8px] font-black text-emerald-600 uppercase tracking-tighter">{item.specialization}</p>
                )}
                {item.address && (
                   <p className="text-[8px] text-slate-400 mt-1 max-w-[150px] truncate">{item.address}</p>
                )}
                <div className="mt-2 pt-2 border-t border-slate-50 flex flex-col gap-1">
                   {item.specialization ? (
                     <button 
                       onClick={() => onSelectAction ? onSelectAction(item) : null} 
                       className="text-[9px] font-bold text-white bg-emerald-600 px-2 py-1 rounded text-center hover:bg-emerald-700 transition-colors w-full"
                     >
                       Take Appointment & Chat
                     </button>
                   ) : item.hours ? (
                     <button 
                       onClick={() => onSelectAction ? onSelectAction(item) : null} 
                       className="text-[9px] font-bold text-white bg-emerald-600 px-2 py-1 rounded text-center hover:bg-emerald-700 transition-colors w-full"
                     >
                       {item.owner ? 'Book Lab Test' : 'Order Medicine'}
                     </button>
                   ) : null}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

const Sidebar = ({ onLogout, profile, mobileOpen, setMobileOpen, lang, setLang }: { onLogout: () => void, profile: UserProfile | null, mobileOpen: boolean, setMobileOpen: (open: boolean) => void, lang: Language, setLang: (l: Language) => void }) => {
  const location = useLocation();
  const t = translations[lang];

  const navItems = [
    { name: t.dashboard, path: '/', icon: HomeIcon },
    { name: t.healthBlogs, path: '/blogs', icon: HeartPulse }, 
    { name: t.pharmacopeia, path: '/drugs', icon: Pill },
    { name: t.findDoctor, path: '/doctors', icon: UserSearch, role: 'patient' },
    { name: t.appointments, path: profile?.role === 'doctor' ? '/doctor-appointments' : '/appointments', icon: Calendar },
    { name: t.queue, path: '/store-orders', icon: Package, role: 'store' },
    { name: t.inbox, path: '/lab-bookings', icon: PlusCircle, role: 'lab' },
    { name: t.myOrders, path: '/patient-orders', icon: Package, role: 'patient' },
    { name: t.myLabTests, path: '/patient-labs', icon: PlusCircle, role: 'patient' },
    { name: t.medStore, path: '/stores', icon: Store },
    { name: t.pathogenicLabs, path: '/labs', icon: PlusCircle },
    { name: t.medicalReports, path: '/reports', icon: ShieldAlert, role: 'patient' },
    { name: t.homeRemedyBot, path: '/ask-bot', icon: MessageSquare },
    { name: t.aboutHealthcare, path: '/about', icon: Info },
  ].filter(item => !item.role || item.role === profile?.role);

  return (
    <>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <nav className={`fixed lg:static inset-y-0 left-0 w-64 bg-slate-900 text-slate-300 flex flex-col p-4 shrink-0 transition-transform duration-300 z-50 lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between mb-8 px-2">
          <Link to="/" className="flex items-center gap-2">
            <Logo className="w-8 h-8" />
            <span className="text-white font-semibold text-lg tracking-tight whitespace-nowrap">healthcare.com</span>
          </Link>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <LanguageSelector current={lang} onChange={setLang} />
        
        <div className="flex-1 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => (
            <Link 
              key={item.name}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded cursor-pointer transition-colors ${
                location.pathname === item.path 
                  ? 'bg-emerald-600/20 text-white font-medium' 
                  : 'hover:bg-slate-800'
              }`}
            >
              <item.icon className={`w-4 h-4 ${location.pathname === item.path ? 'opacity-100' : 'opacity-70'}`} />
              <span className="text-sm">{item.name}</span>
            </Link>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-800">
          {profile && (
            <div className="mb-4 flex items-center gap-2 px-2 py-3 bg-slate-800/30 rounded border border-slate-700/50">
               <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0 overflow-hidden">
                  {profile.image ? <img src={profile.image} className="w-full h-full object-cover" /> : profile.name?.[0]?.toUpperCase() || 'U'}
               </div>
               <div className="overflow-hidden">
                  <p className="text-xs font-bold text-white truncate">{profile.name || 'User'}</p>
                  <p className="text-[10px] text-slate-500 truncate uppercase tracking-tighter">{profile.role}</p>
               </div>
            </div>
          )}
          {profile?.isGuest && (
            <div className="mb-4 p-2 bg-amber-500/10 border border-amber-500/20 rounded flex items-center gap-2">
              <AlertCircle className="text-amber-500 shrink-0" size={12} />
              <p className="text-[8px] font-bold text-amber-200 uppercase leading-tight">Data will be deleted on logout</p>
            </div>
          )}
          <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-1">Status: Active</p>
            <button 
              onClick={onLogout}
              className="mt-4 w-full flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-red-400 transition-colors"
            >
              <LogOut size={14} />
              {t.logout}
            </button>
          </div>
        </div>
      </nav>
    </>
  );
};

const LoginPage = ({ onAuthSuccess, session, lang }: { onAuthSuccess: (p: UserProfile) => void, session: any, lang: Language }) => {
  const t = translations[lang];
  console.log("[AUTH DEBUG] LoginPage rendered. Session exists:", !!session?.user, "Email:", session?.user?.email);
  const [step, setStep] = useState(session ? 3 : 1);
  const [email, setEmail] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestIdInput, setGuestIdInput] = useState('');
  const [showGuestIdLogin, setShowGuestIdLogin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [role, setRole] = useState<'patient' | 'doctor' | 'med_store' | 'lab'>('patient');
  const [formData, setFormData] = useState<any>({
    name: '', dob: '', dor: '', age: '', sex: 'male', height: '', weight: '', 
    specialization: '', experience: '', experienceYears: '', availability: '', location: '',
    owner_name: '', image: '', fee: '', qrCode: ''
  });

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return '';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const calculateExperience = (regDate: string) => {
    if (!regDate) return '';
    const today = new Date();
    const reg = new Date(regDate);
    let exp = today.getFullYear() - reg.getFullYear();
    const m = today.getMonth() - reg.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < reg.getDate())) {
      exp--;
    }
    return exp > 0 ? exp : 0;
  };

  useEffect(() => {
    if (formData.dob) {
      const age = calculateAge(formData.dob);
      setFormData(prev => ({ ...prev, age }));
    }
  }, [formData.dob]);

  useEffect(() => {
    if (formData.dor) {
      const exp = calculateExperience(formData.dor);
      setFormData(prev => ({ ...prev, experienceYears: exp }));
    }
  }, [formData.dor]);

  useEffect(() => {
    if (session?.user && step < 3) {
      setStep(3);
    } else if (!session?.user && step > 2 && step !== 5) {
      setStep(1);
    }

    // Auto location trigger for onboarding
    if (step === 4 && (!formData.lat || !formData.lng)) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setFormData(prev => ({ ...prev, lat: pos.coords.latitude, lng: pos.coords.longitude }));
      }, (err) => console.log("Location auto-fill skipped or denied"));
    }
  }, [session, step, formData.lat, formData.lng]);

  const startGuestFlow = () => {
    setStep(5); // New step for guest name collection
  };

  const handleGuestSignup = async () => {
    if (!guestName.trim()) return;
    setLoading(true);
    setError('');
    try {
      const newGuestId = 'guest_' + Math.random().toString(36).substring(2, 11);
      const guestProfile: UserProfile = {
        id: newGuestId,
        email: `${newGuestId}@guest.local`,
        name: guestName,
        onboarded: true,
        isGuest: true,
        role: 'patient'
      };
      
      const response = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(guestProfile)
      });
      
      if (response.ok) {
        onAuthSuccess(guestProfile);
      } else {
        setError("Failed to create temporary session.");
      }
    } catch (err) {
      setError("Guest flow failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    
    try {
      // Use Firebase to find profile by email
      const existingProfile = await firebaseService.getProfileByEmail(email);
      
      if (existingProfile) {
        onAuthSuccess(existingProfile as UserProfile);
      } else {
        // If no profile, we proceed to protocol (role) selection
        setStep(3);
      }
    } catch (err) {
      setError("Identity resolution failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check for existing profile in Firebase
      const existingProfile = await firebaseService.getProfile(user.uid);
      
      if (existingProfile) {
        onAuthSuccess(existingProfile as UserProfile);
      } else {
        // Prep for onboarding
        setStep(3);
      }
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Popup closed. Please try again.');
      } else {
        setError(`Auth Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const profile: UserProfile = {
      id: auth.currentUser?.uid || "user_" + Math.random().toString(36).substring(7),
      email: auth.currentUser?.email || email.trim(),
      role: role,
      ...formData,
      onboarded: true
    };

    try {
      // Save to local API for existing logic
      await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      
      // Save to Firebase
      await firebaseService.saveProfile(profile);
      
      onAuthSuccess(profile);
    } catch (err) {
      console.error("Onboarding saving error:", err);
      onAuthSuccess(profile);
    } finally {
      setLoading(false);
    }
  };

  if (step === 1) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-900 px-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <div className="flex items-center justify-center gap-3 mb-12">
            <Logo className="w-12 h-12" />
            <h1 className="text-2xl font-black text-white tracking-tighter">healthcare.com</h1>
          </div>
          <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-2xl">
            <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-6">Initialize Clinical Session</h2>
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <input 
                type="email" 
                placeholder="Secure Email Identity" 
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-300 text-sm focus:border-emerald-500 outline-none transition-colors"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
              <button disabled={loading} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-all text-xs uppercase tracking-widest shadow-lg shadow-emerald-600/20">
                {loading ? 'Initializing Session...' : 'Sign In / Register'}
              </button>
            </form>
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-700"></span></div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-500"><span className="bg-slate-800 px-2 tracking-widest">OR BORDERLESS AUTH</span></div>
            </div>
            <button onClick={handleGoogleSignIn} className="w-full py-3 bg-white hover:bg-slate-50 text-slate-900 font-bold rounded-lg transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl">
              <img src="https://www.google.com/favicon.ico" className="w-4 h-4" />
              Sign in with Google
            </button>

            <div className="pt-6 border-t border-slate-700/50">
              <button 
                onClick={startGuestFlow}
                className="w-full py-3 border border-emerald-500/30 text-emerald-400 font-bold rounded-lg transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-500/10"
              >
                <UserCircle size={16} />
                Continue as Guest
              </button>
            </div>
            {error && (
              <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                 <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider leading-tight mb-2">{error}</p>
                 {error.includes('auth/unauthorized-domain') && (
                   <p className="text-[9px] text-slate-400 leading-normal">
                     <span className="text-amber-500 font-bold">Fix:</span> Go to Firebase Console &gt; Authentication &gt; Settings &gt; Authorized Domains and add your current domain: <span className="text-white font-mono">{window.location.hostname}</span>
                   </p>
                 )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-900 px-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="text-emerald-500" size={32} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Check Your Intake</h2>
          <p className="text-slate-400 text-sm mb-8">We've sent a secure verification link to <span className="text-emerald-400 font-bold">{email}</span>.</p>
          <button onClick={() => setStep(1)} className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] hover:text-white transition-colors">Re-Enter Credentials</button>
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-900 px-4">
        <div className="w-full max-w-2xl">
          <h2 className="text-xs font-black text-emerald-500 uppercase tracking-[0.4em] mb-4 text-center">Protocol Selection</h2>
          <h1 className="text-3xl font-black text-white text-center mb-12 tracking-tighter leading-none">Indicate your operational role.</h1>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { id: 'patient', label: 'Patient', icon: User, desc: 'Seeking clinical care and tracking' },
              { id: 'doctor', label: 'Doctor', icon: UserSearch, desc: 'Providing expert medical consultation' },
              { id: 'med_store', label: 'Medical Store', icon: Store, desc: 'Supply pharmaceutical inventory' },
              { id: 'lab', label: 'Pathogenic Lab', icon: PlusCircle, desc: 'Processing diagnostic samples' },
            ].map(r => (
              <button 
                key={r.id} 
                onClick={() => { setRole(r.id as any); setStep(4); }}
                className="bg-slate-800 border border-slate-700 p-6 rounded-2xl hover:border-emerald-500 hover:bg-slate-800/50 transition-all text-left group"
              >
                <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center text-slate-400 mb-4 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                  <r.icon size={20} />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">{r.label}</h3>
                <p className="text-[10px] text-slate-500 leading-tight">{r.desc}</p>
              </button>
            ))}
          </div>
          <div className="mt-8 text-center">
             <button onClick={() => setStep(1)} className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-white transition-colors">Return to Identity Gate</button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 5) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-900 px-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md bg-slate-800 p-10 rounded-3xl border border-slate-700 shadow-2xl">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <UserCircle className="text-emerald-500" size={32} />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tighter mb-2">Guest Identity Setup</h2>
            <p className="text-slate-400 text-sm">Please provide a temporary name to proceed.</p>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 ml-1 mb-2 block">Display Name</label>
              <input 
                type="text" 
                value={guestName}
                onChange={e => setGuestName(e.target.value)}
                placeholder="Enter your name"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-5 py-3.5 text-slate-300 text-sm focus:border-emerald-500 outline-none transition-all placeholder:text-slate-600"
              />
            </div>
            
            <button 
              onClick={handleGuestSignup}
              disabled={loading || !guestName.trim()}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl transition-all text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-600/20 disabled:opacity-50"
            >
              {loading ? 'Initializing...' : 'Proceed to Dashboard'}
            </button>
            
            <button 
              onClick={() => setStep(1)}
              className="w-full text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-white transition-colors"
            >
              Cancel Guest Mode
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Step 4: Info Collection
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-900 px-4 overflow-auto py-12">
      <div className="w-full max-w-xl bg-slate-800 border border-slate-700 rounded-3xl p-8 lg:p-12 shadow-2xl">
        <div className="flex items-center justify-between mb-10">
           <h2 className="text-sm font-bold text-white uppercase tracking-widest">Profile Configuration</h2>
           <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-1 rounded uppercase tracking-tighter">{role} mode</span>
        </div>
        <form onSubmit={handleCompleteOnboarding} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Full Legal Name</label>
              <input required className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-300 text-sm focus:border-emerald-500 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Birth Registry (DOB)</label>
              <input required type="date" className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-300 text-sm focus:border-emerald-500 outline-none" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Age (Auto)</label>
              <input readOnly type="number" className="w-full bg-slate-900/10 border border-slate-700/50 rounded-lg px-4 py-2.5 text-slate-500 text-sm outline-none" value={formData.age} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Biological Sex</label>
              <select className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-300 text-sm focus:border-emerald-500 outline-none" value={formData.sex} onChange={e => setFormData({...formData, sex: e.target.value})}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Avatar URL</label>
              <input className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-300 text-sm focus:border-emerald-500 outline-none" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Location Address</label>
              <input className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-300 text-sm focus:border-emerald-500 outline-none" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="City, Area" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Coordinates (Auto-filling...)</label>
              <div className="flex gap-2">
                <input readOnly className="flex-1 bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-500 text-[10px] outline-none" value={formData.lat ? `${formData.lat.toFixed(4)}, ${formData.lng.toFixed(4)}` : 'Detecting...'} />
                <button 
                  type="button"
                  onClick={() => {
                    navigator.geolocation.getCurrentPosition((pos) => {
                      setFormData({ ...formData, lat: pos.coords.latitude, lng: pos.coords.longitude });
                    }, (err) => alert("Please enable location permissions"));
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-lg transition-colors"
                  title="Refresh Location"
                >
                  <UserSearch size={16} />
                </button>
              </div>
            </div>
          </div>

          {role !== 'patient' && (
            <div className="space-y-4 pt-4 border-t border-slate-700/50">
               <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Registration Date (DOR)</label>
                  <input required type="date" className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-300 text-sm focus:border-emerald-500 outline-none" value={formData.dor} onChange={e => setFormData({...formData, dor: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Experience Years (Auto)</label>
                  <input readOnly type="number" className="w-full bg-slate-900/10 border border-slate-700/50 rounded-lg px-4 py-2.5 text-slate-500 text-sm outline-none" value={formData.experienceYears} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Service Fee (₹)</label>
                  <input required type="number" className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-300 text-sm focus:border-emerald-500 outline-none" value={formData.fee} onChange={e => setFormData({...formData, fee: e.target.value})} placeholder="e.g. 500" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">UPI ID for Payments</label>
                  <input required className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-300 text-sm focus:border-emerald-500 outline-none" value={formData.qrCode} onChange={e => setFormData({...formData, qrCode: e.target.value})} placeholder="e.g. name@upi" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Hours of Availability</label>
                <input className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-300 text-sm focus:border-emerald-500 outline-none" value={formData.availability} onChange={e => setFormData({...formData, availability: e.target.value})} placeholder="e.g. 9 AM - 6 PM" />
              </div>
            </div>
          )}

          {role === 'doctor' && (
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Specialization</label>
                <input className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-300 text-sm focus:border-emerald-500 outline-none" value={formData.specialization} onChange={e => setFormData({...formData, specialization: e.target.value})} />
              </div>
            </div>
          )}

          {(role === 'med_store' || role === 'lab') && (
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Registrar/Owner Name</label>
              <input className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-300 text-sm focus:border-emerald-500 outline-none" value={formData.owner_name} onChange={e => setFormData({...formData, owner_name: e.target.value})} />
            </div>
          )}

          <button disabled={loading} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl transition-all text-sm uppercase tracking-[0.2em] shadow-xl shadow-emerald-600/20">
            {loading ? 'Finalizing Sync...' : 'Lock Profile & Proceed'}
          </button>
        </form>
      </div>
    </div>
  );
};

const Header = ({ title, onAddClick, onMenuClick }: { title: string, onAddClick?: () => void, onMenuClick?: () => void }) => (
  <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 shrink-0 shadow-sm z-30">
    <div className="flex items-center gap-3">
      <button onClick={onMenuClick} className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-slate-900 transition-colors">
        <Menu size={20} />
      </button>
      <h1 className="text-xs md:text-sm font-bold text-slate-800 uppercase tracking-widest truncate">{title}</h1>
    </div>
    <div className="flex items-center gap-4">
      {onAddClick && (
        <button 
          onClick={onAddClick}
          className="bg-emerald-600 text-white px-3 md:px-4 py-1.5 rounded text-[9px] md:text-[11px] font-bold uppercase tracking-tight hover:bg-emerald-700 transition-colors whitespace-nowrap"
        >
          <span className="hidden sm:inline">+ Upload New Blog</span>
          <span className="sm:hidden">+ Blog</span>
        </button>
      )}
      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-[10px] border border-slate-200">
        SK
      </div>
    </div>
  </header>
);

const Footer = () => (
  <footer className="h-10 bg-white border-t border-slate-200 flex items-center px-6 text-[10px] text-slate-400 justify-between shrink-0">
    <p>&copy; 2024 healthcare.com | Database: MySQL Local Node Sync | Secure Access Active</p>
    <div className="flex gap-4">
      <span className="flex items-center gap-1">
        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div> 
        Server Status: Healthy
      </span>
      <span>Latency: 14ms</span>
    </div>
  </footer>
);

const BlogCard: React.FC<{ blog: Blog; onClick: () => void; onDelete?: (e: React.MouseEvent) => void }> = ({ blog, onClick, onDelete }) => (
  <motion.article 
    initial={{ opacity: 0, y: 5 }}
    animate={{ opacity: 1, y: 0 }}
    onClick={onClick}
    className="dashboard-card group cursor-pointer hover:border-emerald-500 transition-all active:scale-[0.995]"
  >
    <div className="p-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
          <HeartPulse size={18} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900 leading-tight">
            {blog.title}
          </h3>
          <p className="text-[10px] text-slate-500 font-medium mt-1 uppercase tracking-widest">
            {blog.category} • {blog.author}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {onDelete && (
          <button 
            onClick={onDelete}
            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
            title="Delete Publication"
          >
            <Trash2 size={16} />
          </button>
        )}
        <div className="flex items-center gap-2 text-slate-400 group-hover:text-emerald-500 transition-colors">
          <span className="text-[10px] font-bold uppercase tracking-tighter">View Publication →</span>
        </div>
      </div>
    </div>
  </motion.article>
);

const ReminderCard: React.FC<{ reminder: Reminder; onToggle: () => void; onDelete: () => void }> = ({ reminder, onToggle, onDelete }) => (
  <motion.div 
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    className={`p-4 rounded-xl border transition-all flex items-center justify-between ${reminder.active ? 'bg-white border-slate-100 shadow-sm' : 'bg-slate-50 border-transparent opacity-60'}`}
  >
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${reminder.active ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
        <Pill size={18} />
      </div>
      <div>
        <h4 className="text-xs font-bold text-slate-800">{reminder.medicineName}</h4>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{reminder.dosage}</span>
          <span className="w-1 h-1 bg-slate-300 rounded-full" />
          <span className="text-[9px] font-bold text-emerald-600 flex items-center gap-1">
            <Clock size={10} /> {reminder.time}
          </span>
        </div>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <button 
        onClick={onToggle}
        className={`w-8 h-4 rounded-full relative transition-colors ${reminder.active ? 'bg-emerald-500' : 'bg-slate-300'}`}
      >
        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${reminder.active ? 'left-[18px]' : 'left-0.5'}`} />
      </button>
      <button onClick={onDelete} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors">
        <Trash2 size={14} />
      </button>
    </div>
  </motion.div>
);

const PaymentModal = ({ item, type, isOpen, onClose }: { item: any, type: 'appointment', isOpen: boolean, onClose: () => void }) => {
  const [loading, setLoading] = useState(false);
  const [providerProfile, setProviderProfile] = useState<UserProfile | null>(null);
  
  if (!item) return null;

  const providerId = item.doctorId;
  const rawFee = item?.fee || providerProfile?.fee || 500;
  const fee = typeof rawFee === 'number' ? rawFee : parseFloat(rawFee) || 500;
  const platformFee = fee * 0.1;
  const total = fee + platformFee;
  
  const adminUPI = "shaibyavns@okhdfcbank";
  const adminName = "Shaibya Singh";

  useEffect(() => {
    if (isOpen && providerId) {
      firebaseService.getProfile(providerId).then(p => {
        if (p) setProviderProfile(p as UserProfile);
      }).catch(err => console.error("Failed to fetch provider profile", err));
    }
  }, [isOpen, providerId]);

  const handlePay = async () => {
    setLoading(true);
    try {
      await firebaseService.createPayment({
        requestId: item.id,
        type,
        patientId: item.patientId,
        providerId,
        amount: total,
        platformFee: platformFee,
        status: 'completed',
        method: 'UPI Split Payment',
        createdAt: serverTimestamp()
      });
      
      await updateDoc(doc(db, 'appointments', item.id), { paid: true });
      
      alert(`Payment of ₹${total.toFixed(2)} confirmed! Consultation session unlocked.`);
      onClose();
    } catch (err: any) {
       console.error("Payment failed", err);
       alert("Payment recording failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="font-black text-slate-900 uppercase tracking-tighter">Consultation Payment</h3>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Clinical Protocol Secure</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 bg-white p-2 rounded-full shadow-sm border border-slate-100 hover:bg-red-50 hover:text-red-500 transition-all"><X size={16} /></button>
        </div>

        <div className="p-6 space-y-4">
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Fee</p>
            <p className="text-2xl font-black text-emerald-600 tracking-tighter">₹{total.toFixed(2)}</p>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
               <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Payable to: {adminName}</p>
               <div className="flex items-center justify-between">
                 <code className="text-[10px] font-mono text-slate-700">{adminUPI}</code>
                 <CopyButton text={adminUPI} />
               </div>
            </div>
            {providerProfile?.qrCode && (
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-[9px] font-bold text-blue-400 uppercase mb-1">Provider ID</p>
                <div className="flex items-center justify-between">
                  <code className="text-[10px] font-mono text-blue-700">{providerProfile.qrCode}</code>
                  <CopyButton text={providerProfile.qrCode} />
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={handlePay}
            disabled={loading}
            className="w-full py-4 bg-slate-900 hover:bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Confirm Payment <ArrowRight size={16} /></>}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const ChatRoom = ({ profile }: { profile: UserProfile | null }) => {
  const { chatId } = useParams<{ chatId: string }>();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [chatInfo, setChatInfo] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chatId || !profile) return;

    let unsubscribe: () => void;

    const setupChat = async () => {
      setLoading(true);
      try {
        const chatDoc = await getDoc(doc(db, 'chats', chatId));
        if (chatDoc.exists()) {
          setChatInfo(chatDoc.data());
        }

        const messagesRef = collection(db, 'chats', chatId, 'messages');
        const q = query(messagesRef, orderBy('createdAt', 'asc'));
        
        unsubscribe = onSnapshot(q, (snapshot) => {
          const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setMessages(msgs);
          setLoading(false);
        });
      } catch (err) {
        console.error("Chat setup failed", err);
        setLoading(false);
      }
    };

    setupChat();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [chatId, profile]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !profile || !chatId) return;

    const text = newMessage.trim();
    setNewMessage('');

    try {
      await firebaseService.sendMessage(chatId, {
        senderId: profile.id,
        senderName: profile.name,
        text: text,
      });
    } catch (err) {
      console.error("Send failed", err);
    }
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col bg-slate-50 relative overflow-hidden">
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold overflow-hidden shadow-inner">
            {chatInfo?.doctorImage ? <img src={chatInfo.doctorImage} className="w-full h-full object-cover" /> : <User size={20} />}
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 leading-none">
              {profile?.role === 'doctor' ? 'Clinical Dialogue' : (chatInfo?.doctorName || 'Medical Consultation')}
            </h2>
            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Encrypted Session
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.senderId === profile?.id ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm ${
              msg.senderId === profile?.id ? 'bg-emerald-600 text-white rounded-br-none' : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none'
            }`}>
              <Markdown remarkPlugins={[remarkGfm]}>{msg.text}</Markdown>
              {msg.createdAt && (
                <p className="text-[9px] mt-1 opacity-60 text-right">
                  {msg.createdAt.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                </p>
              )}
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-200 flex gap-2 shadow-lg">
        <input 
          type="text" 
          placeholder="Clinical note..."
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 font-medium"
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
        />
        <button className="w-12 h-12 bg-emerald-600 text-white rounded-xl flex items-center justify-center hover:bg-emerald-700 transition-all active:scale-95">
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

const PatientOrdersPage = ({ profile, onMenuClick, lang }: { profile: UserProfile, onMenuClick?: () => void, lang: Language }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const handleChat = async (order: any) => {
    try {
      const chat = await firebaseService.getOrCreateChat(profile.id, order.storeId, order.storeName, order.storeImage);
      if (chat) navigate(`/chat/${chat.id}`);
    } catch (err) {
      console.error("Chat navigation failed", err);
    }
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await firebaseService.getRequests(profile.id, 'patient', ordersRef, 'storeId');
        setOrders(data || []);
      } catch (err) {
        console.error("Failed to fetch orders", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [profile.id]);

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <Header title="Pharmacy Orders" onMenuClick={onMenuClick} />
      <div className="flex-1 overflow-auto p-4 md:p-6 bg-slate-100/30">
        <div className="max-w-4xl mx-auto space-y-4">
          {loading ? (
             <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-slate-200">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-sm font-bold text-slate-900 mb-1">No Orders Found</h3>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">Your medicine requests will appear here</p>
            </div>
          ) : (
            orders.map(order => (
              <div key={order.id} className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col sm:flex-row items-center gap-5">
                <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden shrink-0">
                  {order.storeImage ? <img src={order.storeImage} className="w-full h-full object-cover" /> : <Store size={24} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-slate-900 truncate">{order.storeName}</h3>
                    <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter bg-emerald-100 text-emerald-700">{order.status}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium mb-2 italic line-clamp-1">{order.reason}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button 
                    onClick={() => handleChat(order)}
                    className="h-10 px-6 bg-emerald-600 text-white rounded-lg flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-700 transition-colors"
                  >
                    <MessageSquare size={14} />
                    Chat Store
                  </button>
                  <div className="h-10 px-4 bg-slate-100 text-slate-500 rounded-lg flex items-center justify-center gap-2 text-[8px] font-black uppercase tracking-tighter">
                    <Check size={12} className="text-emerald-500" />
                    Covered by Platform
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      {/* Removed Payment Modal - Services are now free */}
    </div>
  );
};

const PatientLabBookingsPage = ({ profile, onMenuClick, lang }: { profile: UserProfile, onMenuClick?: () => void, lang: Language }) => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const handleChat = async (booking: any) => {
    try {
      const chat = await firebaseService.getOrCreateChat(profile.id, booking.labId, booking.labName, booking.labImage);
      if (chat) navigate(`/chat/${chat.id}`);
    } catch (err) {
      console.error("Chat navigation failed", err);
    }
  };

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const data = await firebaseService.getRequests(profile.id, 'patient', labBookingsRef, 'labId');
        setBookings(data || []);
      } catch (err) {
        console.error("Failed to fetch bookings", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [profile.id]);

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <Header title="Lab Test Bookings" onMenuClick={onMenuClick} />
      <div className="flex-1 overflow-auto p-4 md:p-6 bg-slate-100/30">
        <div className="max-w-4xl mx-auto space-y-4">
          {loading ? (
             <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : bookings.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-slate-200">
              <PlusCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-sm font-bold text-slate-900 mb-1">No Bookings Found</h3>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">Your diagnostic test bookings will appear here</p>
            </div>
          ) : (
            bookings.map(booking => (
              <div key={booking.id} className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col sm:flex-row items-center gap-5">
                <div className="w-14 h-14 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 overflow-hidden shrink-0">
                  {booking.labImage ? <img src={booking.labImage} className="w-full h-full object-cover" /> : <PlusCircle size={24} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-slate-900 truncate">{booking.labName}</h3>
                    <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter bg-orange-100 text-orange-700">{booking.status}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium mb-2 italic line-clamp-1">{booking.reason}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button 
                    onClick={() => handleChat(booking)}
                    className="h-10 px-6 bg-slate-900 text-white rounded-lg flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-600 transition-colors"
                  >
                    <MessageSquare size={14} />
                    Chat Lab
                  </button>
                  <div className="h-10 px-4 bg-orange-50 text-orange-700 rounded-lg flex items-center justify-center gap-2 text-[8px] font-black uppercase tracking-tighter">
                    <Check size={12} className="text-orange-500" />
                    Free Service
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      {/* Removed Payment Modal - Services are now free */}
    </div>
  );
};

const StoreOrdersPage = ({ profile, onMenuClick, lang }: { profile: UserProfile, onMenuClick?: () => void, lang: Language }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const handleChat = async (order: any) => {
    try {
      const chat = await firebaseService.getOrCreateChat(order.patientId, profile.id, profile.name || 'Store', profile.image || '');
      if (chat) navigate(`/chat/${chat.id}`);
    } catch (err) {
      console.error("Chat navigation failed", err);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'orders', id), { status });
      setOrders(orders.map(o => o.id === id ? { ...o, status } : o));
    } catch (err) {
      console.error("Status update failed", err);
    }
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await firebaseService.getRequests(profile.id, 'provider', ordersRef, 'storeId');
        setOrders(data || []);
      } catch (err) {
        console.error("Failed to fetch orders", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [profile.id]);

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <Header title="Pharmacy Order Queue" onMenuClick={onMenuClick} />
      <div className="flex-1 overflow-auto p-4 md:p-6 bg-slate-100/30">
        <div className="max-w-4xl mx-auto space-y-4">
          {loading ? (
             <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-slate-200">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-sm font-bold text-slate-900 mb-1">No Orders Assigned</h3>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">Incoming prescriptions will appear here</p>
            </div>
          ) : (
            orders.map(order => (
              <div key={order.id} className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col sm:flex-row items-center gap-5">
                <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden shrink-0">
                  <User size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-slate-900 truncate">Patient Order #{order.id.slice(-4)}</h3>
                    <select 
                      value={order.status}
                      onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                      className="px-2 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded border border-emerald-100 outline-none"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="ready">Ready</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium mb-2 italic">{order.reason}</p>
                </div>
                <button 
                  onClick={() => handleChat(order)}
                  className="h-10 px-6 bg-emerald-600 text-white rounded-lg flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-700 transition-colors"
                >
                  <MessageSquare size={14} />
                  Patient Chat
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const LabBookingsQueuePage = ({ profile, onMenuClick, lang }: { profile: UserProfile, onMenuClick?: () => void, lang: Language }) => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const handleChat = async (booking: any) => {
    try {
      const chat = await firebaseService.getOrCreateChat(booking.patientId, profile.id, profile.name || 'Lab', profile.image || '');
      if (chat) navigate(`/chat/${chat.id}`);
    } catch (err) {
      console.error("Chat navigation failed", err);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'labBookings', id), { status });
      setBookings(bookings.map(b => b.id === id ? { ...b, status } : b));
    } catch (err) {
      console.error("Status update failed", err);
    }
  };

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const data = await firebaseService.getRequests(profile.id, 'provider', labBookingsRef, 'labId');
        setBookings(data || []);
      } catch (err) {
        console.error("Failed to fetch bookings", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [profile.id]);

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <Header title="Lab Test Inventory" onMenuClick={onMenuClick} />
      <div className="flex-1 overflow-auto p-4 md:p-6 bg-slate-100/30">
        <div className="max-w-4xl mx-auto space-y-4">
          {loading ? (
             <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : bookings.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-slate-200">
              <PlusCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-sm font-bold text-slate-900 mb-1">No Active Bookings</h3>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">Scheduled test procedures will appear here</p>
            </div>
          ) : (
            bookings.map(booking => (
              <div key={booking.id} className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col sm:flex-row items-center gap-5">
                <div className="w-14 h-14 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 overflow-hidden shrink-0">
                  <User size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-slate-900 truncate">Test Booking #{booking.id.slice(-4)}</h3>
                    <select 
                      value={booking.status}
                      onChange={(e) => handleUpdateStatus(booking.id, e.target.value)}
                      className="px-2 py-1 bg-orange-50 text-orange-700 text-[10px] font-bold rounded border border-orange-100 outline-none"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="sampled">Sample Collected</option>
                      <option value="processing">Processing</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium mb-2 italic">Reason: {booking.reason}</p>
                </div>
                <button 
                  onClick={() => handleChat(booking)}
                  className="h-10 px-6 bg-slate-900 text-white rounded-lg flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-600 transition-colors"
                >
                  <MessageSquare size={14} />
                  Patient Chat
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const DoctorConfirmationModal = ({ 
  appointment, 
  isOpen, 
  onClose, 
  onConfirm 
}: { 
  appointment: any, 
  isOpen: boolean, 
  onClose: () => void, 
  onConfirm: (id: string, updates: any) => void 
}) => {
  const [date, setDate] = useState(appointment?.date || "");
  const [time, setTime] = useState(appointment?.time || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (appointment) {
      setDate(appointment.date);
      setTime(appointment.time);
    }
  }, [appointment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateDoc(doc(db, 'appointments', appointment.id), { 
        date, 
        time, 
        status: 'confirmed',
        confirmedAt: serverTimestamp()
      });
      onConfirm(appointment.id, { date, time, status: 'confirmed' });
      onClose();
    } catch (err) {
      console.error("Confirmation error:", err);
      alert("Failed to confirm appointment.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !appointment) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6">
        <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-6 font-sans">Confirm Clinical Schedule</h2>
        <p className="text-[10px] text-slate-500 mb-6 leading-relaxed">
          Verify or adjust the consultation schedule for <span className="font-bold text-slate-800">{appointment.patientName}</span>.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Confirmed Date</label>
              <input type="date" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-emerald-500" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Confirmed Time</label>
              <input type="time" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-emerald-500" value={time} onChange={e => setTime(e.target.value)} />
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all">
            {loading ? 'Confirming...' : 'Lock Clinical Schedule'}
          </button>
          <button type="button" onClick={onClose} className="w-full py-3 bg-slate-100 text-slate-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all">
            Cancel
          </button>
        </form>
      </motion.div>
    </div>
  );
};

const DoctorAppointmentsPage = ({ profile, onMenuClick, lang }: { profile: UserProfile, onMenuClick?: () => void, lang: Language }) => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedForConfirmation, setSelectedForConfirmation] = useState<any | null>(null);
  const navigate = useNavigate();

  const handleChat = async (apt: any) => {
    try {
      const chat = await firebaseService.getOrCreateChat(apt.patientId, profile.id, profile.name || 'Doctor', profile.image || '');
      if (chat) {
        navigate(`/chat/${chat.id}`);
      }
    } catch (err) {
      console.error("Chat navigation failed", err);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'appointments', id), { status });
      setAppointments(appointments.map(a => a.id === id ? { ...a, status } : a));
    } catch (err) {
      console.error("Status update failed", err);
    }
  };

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const data = await firebaseService.getAppointments(profile.id, 'doctor');
        setAppointments(data || []);
      } catch (err) {
        console.error("Failed to fetch appointments", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, [profile.id]);

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <Header title="Clinical Caseload" onMenuClick={onMenuClick} />
      <div className="flex-1 overflow-auto p-4 md:p-6 bg-slate-100/30">
        <div className="max-w-4xl mx-auto space-y-4">
          {loading ? (
            <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : appointments.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-slate-200">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-sm font-bold text-slate-900 mb-1">No Active Appointments</h3>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">Awaiting patient intake</p>
            </div>
          ) : (
            appointments.map(apt => (
              <div key={apt.id} className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-5 hover:border-emerald-500/50 transition-all shadow-sm">
                <div className="w-14 h-14 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 border border-emerald-100 font-bold text-lg">
                  {apt.patientName ? apt.patientName[0] : 'P'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-slate-900 truncate">Patient: {apt.patientName || 'Anonymous'}</h3>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${
                      apt.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {apt.status}
                    </span>
                    {apt.paid ? (
                      <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter bg-emerald-500 text-white">PAID</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter bg-orange-100 text-orange-600">UNPAID</span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium mb-2 italic">Reason: {apt.reason || 'Not specified'}</p>
                  <div className="flex items-center gap-4 text-[10px] text-slate-500 font-medium">
                    <span className="flex items-center gap-1.5"><Calendar size={12} className="text-slate-400" /> {apt.date ? new Date(apt.date).toLocaleDateString() : 'Date TBD'}</span>
                    <span className="flex items-center gap-1.5"><Clock size={12} className="text-slate-400" /> {apt.time || 'Time TBD'}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 w-full sm:w-auto">
                   <button 
                    onClick={() => handleChat(apt)}
                    className="flex-1 sm:flex-none h-10 px-4 bg-slate-900 text-white rounded-lg flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-600 transition-colors"
                   >
                     <MessageSquare size={14} />
                     Chat
                   </button>
                   {apt.status === 'pending' && (
                     <button 
                      onClick={() => setSelectedForConfirmation(apt)}
                      className="flex-1 sm:flex-none h-10 px-4 bg-emerald-600 text-white rounded-lg flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-700 transition-colors"
                     >
                       <Check size={14} />
                       Finalize Date/Time
                     </button>
                   )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      {selectedForConfirmation && (
        <DoctorConfirmationModal 
          appointment={selectedForConfirmation}
          isOpen={!!selectedForConfirmation}
          onClose={() => setSelectedForConfirmation(null)}
          onConfirm={(id, updates) => {
            setAppointments(appointments.map(a => a.id === id ? { ...a, ...updates } : a));
          }}
        />
      )}
    </div>
  );
};

const BlogsPage = ({ onMenuClick, profile, lang }: { onMenuClick?: () => void, profile: UserProfile | null, lang: Language }) => {
  const t = translations[lang];
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
  const [newBlog, setNewBlog] = useState({ title: '', author: '', content: '', category: 'General' });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/blogs').then(res => res.json()).then(setBlogs);
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      const res = await fetch(`/api/blogs/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBlog)
      });
      const updated = await res.json();
      setBlogs(blogs.map(b => b.id === updated.id ? updated : b));
    } else {
      const res = await fetch('/api/blogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBlog)
      });
      const saved = await res.json();
      setBlogs([saved, ...blogs]);
    }
    setIsModalOpen(false);
    setNewBlog({ title: '', author: '', content: '', category: 'General' });
    setEditingId(null);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to erase this publication?")) return;
    await fetch(`/api/blogs/${id}`, { method: 'DELETE' });
    setBlogs(blogs.filter(b => b.id !== id));
  };

  const handleEdit = (blog: Blog) => {
    setNewBlog({ title: blog.title, author: blog.author, content: blog.content, category: blog.category });
    setEditingId(blog.id);
    setIsModalOpen(true);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <Header title={t.healthBlogs} onAddClick={() => setIsModalOpen(true)} onMenuClick={onMenuClick} />
      <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px]">
        <div className="max-w-5xl mx-auto space-y-6">
          <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 text-center mb-8">
            <h1 className="text-3xl font-black text-slate-900 mb-2">Medical Knowledge Base</h1>
            <p className="text-slate-500 max-w-xl mx-auto">Access verified clinical insights, wellness guides, and research updates from our authorized medical specialists.</p>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {blogs.map((blog) => (
              <div key={blog.id} className="relative group/card">
                <BlogCard 
                  blog={blog} 
                  onClick={() => setSelectedBlog(blog)} 
                  onDelete={(e) => handleDelete(blog.id, e)}
                />
                <button 
                  onClick={(e) => { e.stopPropagation(); handleEdit(blog); }}
                  className="absolute top-4 right-14 p-2 bg-white/80 backdrop-blur shadow-sm rounded-lg opacity-0 group-hover/card:opacity-100 transition-opacity hover:bg-emerald-50 text-emerald-600 border border-slate-100 z-10"
                >
                  <Edit3 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 overflow-hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setIsModalOpen(false); setEditingId(null); setNewBlog({ title: '', author: '', content: '', category: 'General' }); }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl w-full max-w-lg relative z-10 shadow-2xl overflow-hidden shadow-emerald-500/10 border border-emerald-100"
            >
              <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
                <h2 className="text-sm font-bold text-slate-800">{editingId ? 'Edit Publication' : 'Draft New Publication'}</h2>
                <button onClick={() => { setIsModalOpen(false); setEditingId(null); }} className="text-slate-400 hover:text-slate-600">
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleUpload} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-1">Entry Title</label>
                  <input 
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50 text-sm"
                    value={newBlog.title}
                    onChange={e => setNewBlog({...newBlog, title: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-1">Lead Author</label>
                    <input 
                      required
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50 text-sm"
                      value={newBlog.author}
                      onChange={e => setNewBlog({...newBlog, author: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-1">Category</label>
                    <select 
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50 text-sm"
                      value={newBlog.category}
                      onChange={e => setNewBlog({...newBlog, category: e.target.value})}
                    >
                      <option>Heart Health</option>
                      <option>General</option>
                      <option>Neurology</option>
                      <option>Wellness</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-1">Clinical Insight (Markdown Supported)</label>
                  <textarea 
                    required
                    rows={6}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50 text-sm font-mono"
                    value={newBlog.content}
                    onChange={e => setNewBlog({...newBlog, content: e.target.value})}
                  />
                </div>
                <button type="submit" className="w-full py-3 bg-slate-900 text-white rounded-lg font-black text-[11px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg hover:shadow-emerald-500/20">
                  {editingId ? 'Update Publication' : 'Transmit to Database'}
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {selectedBlog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedBlog(null)} className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" />
             <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] relative z-10 shadow-2xl overflow-auto border border-white/20">
                <div className="sticky top-0 bg-white/80 backdrop-blur-sm border-b border-slate-100 p-4 flex items-center justify-between z-20">
                   <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase rounded tracking-widest">PUBLICATION ARCHIVE</span>
                   </div>
                   <button onClick={() => setSelectedBlog(null)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors"><X size={18} /></button>
                </div>
                <div className="p-8 md:p-12 lg:p-16 max-w-2xl mx-auto">
                   <p className="text-emerald-600 font-bold text-[11px] uppercase tracking-[0.3em] mb-4">{selectedBlog.category} • {new Date(selectedBlog.date).toLocaleDateString()}</p>
                   <h1 className="text-3xl font-black text-slate-900 mb-6 tracking-tight leading-none">{selectedBlog.title}</h1>
                   <div className="markdown-body"><BlogContent content={selectedBlog.content} /></div>
                   <div className="mt-12 pt-8 border-t border-slate-100">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 bg-slate-200 rounded-full shrink-0" />
                         <div>
                            <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Verified Author</p>
                            <p className="text-sm font-bold text-slate-900">{selectedBlog.author}</p>
                         </div>
                      </div>
                   </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const HomePage = ({ onMenuClick, profile, reminders, setReminders, setProfile, lang }: { onMenuClick?: () => void, profile: UserProfile | null, reminders: Reminder[], setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>, setProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>, lang: Language }) => {
  const t = translations[lang];
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
  const [newBlog, setNewBlog] = useState({ title: '', author: '', content: '', category: 'General' });
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [newReminder, setNewReminder] = useState({ medicineName: '', dosage: '', time: '', frequency: 'Daily' });
  const [callingAmbulance, setCallingAmbulance] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const docRes = await fetch('/api/doctors');
        const docData = await docRes.json();
        setDoctors(docData);

        const blogData = await firebaseService.getBlogs();
        setBlogs(blogData as Blog[]);

        if (profile) {
          const [chatRes, reportRes] = await Promise.all([
            fetch('/api/chats', { headers: { 'x-user-id': profile.id } }),
            fetch('/api/reports', { headers: { 'x-user-id': profile.id } })
          ]);
          const [chatData, reportData] = await Promise.all([chatRes.json(), reportRes.json()]);
          setChats(chatData);
          setReports(reportData);
        }
      } catch (e) {
        console.error("Dashboard data fetch failed", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [profile]);

  const handleCallAmbulance = () => {
    setCallingAmbulance(true);
    setTimeout(() => {
      setCallingAmbulance(false);
      alert("Emergency services have been notified and are on their way to your last known location.");
    }, 2000);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const saved = await firebaseService.createBlog(newBlog);
      if (saved) setBlogs([saved as Blog, ...blogs]);
      setIsModalOpen(false);
      setNewBlog({ title: '', author: '', content: '', category: 'General' });
    } catch (err) {
      console.error("Failed to upload blog", err);
    }
  };

  const handleTakeAppointment = async (doc: Doctor) => {
    if (!profile) return;
    const chatId = [profile.id, doc.id].sort().join('-');
    await fetch('/api/chats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: chatId,
        user_id: profile.id,
        doctor_id: doc.id,
        doctor_name: doc.name
      })
    });
    navigate(`/chat/${chatId}`);
  };

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    try {
      const saved = await firebaseService.createReminder({ ...newReminder, userId: profile.id, active: true });
      if (saved) setReminders([saved as Reminder, ...reminders]);
      setIsReminderModalOpen(false);
      setNewReminder({ medicineName: '', dosage: '', time: '', frequency: 'Daily' });
    } catch (err) {
      console.error("Failed to add reminder", err);
    }
  };

  const handleToggleReminder = async (id: string) => {
    const reminder = reminders.find(r => r.id === id);
    if (!reminder) return;
    try {
      await firebaseService.updateReminder(id, { active: !reminder.active });
      setReminders(reminders.map(r => r.id === id ? { ...r, active: !reminder.active } : r));
    } catch (err) {
      console.error("Failed to toggle reminder", err);
    }
  };

  const handleDeleteReminder = async (id: string) => {
    try {
      await firebaseService.deleteReminder(id);
      setReminders(reminders.filter(r => r.id !== id));
    } catch (err) {
      console.error("Failed to delete reminder", err);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <Header title={t.dashboard} onAddClick={() => setIsModalOpen(true)} onMenuClick={onMenuClick} />
      <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px]">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Welcome Section */}
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900 leading-tight">{t.welcome.split(' to ')[0]}, {profile?.name || 'User'}</h1>
              <p className="text-sm text-slate-500 font-medium">Your medical profile is 85% complete. Keep it updated for better diagnostics.</p>
            </div>
            <div className="flex gap-2">
              <Link to="/profile" className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors">Complete Profile</Link>
              <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors shadow-lg shadow-emerald-500/20">Write Blog</button>
            </div>
          </section>

          {/* Grid Layout for Active Items */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Main Content Area */}
            <div className="lg:col-span-2 space-y-8">
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Nearby Medical Hubs</h2>
                  <Link to="/doctors" className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest hover:underline">View All Doctors</Link>
                </div>
                <div className="shadow-xl shadow-emerald-500/5 rounded-2xl overflow-hidden border border-slate-100">
                  <InteractiveMap 
                    items={doctors} 
                    center={[25.3176, 82.9739]} 
                    userLocation={profile?.lat && profile?.lng ? { lat: profile.lat, lng: profile.lng } : null}
                    onSelectAction={handleTakeAppointment}
                    onFindMe={() => {
                      if ("geolocation" in navigator) {
                        navigator.geolocation.getCurrentPosition(async (pos) => {
                          const lat = pos.coords.latitude;
                          const lng = pos.coords.longitude;
                          if (profile) {
                            const updatedProfile = { ...profile, lat, lng };
                            try {
                              await firebaseService.saveProfile(updatedProfile);
                              setProfile(updatedProfile);
                              alert("Clinical profile synchronized with current GPS coordinates.");
                            } catch (err) {
                              console.error("Location sync failed:", err);
                              alert("Database synchronization failed. Retrying...");
                            }
                          }
                        });
                      }
                    }}
                  />
                </div>
              </section>

              <section>
                <div className="mb-4">
                  <h2 className="text-[10px] font-bold uppercase text-slate-500 tracking-[0.2em] mb-2 px-1">Recent Publications</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {blogs.slice(0, 4).map((blog) => (
                    <BlogCard key={blog.id} blog={blog} onClick={() => setSelectedBlog(blog)} />
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <Link to="/blogs" className="text-[10px] font-black text-slate-400 hover:text-emerald-600 transition-colors uppercase tracking-[0.2em]">View All Publications →</Link>
                </div>
              </section>
            </div>

            {/* Sidebar Dash Area */}
            <div className="space-y-8">
              <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-[10px] font-bold uppercase text-slate-500 tracking-[0.1em]">Active Conversations</h2>
                  <MessageSquare size={14} className="text-slate-300" />
                </div>
                
                <div className="space-y-3">
                  {chats.length === 0 ? (
                    <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No active chats</p>
                      <p className="text-[9px] text-slate-400 mt-1">Book an appointment to start.</p>
                    </div>
                  ) : (
                    chats.map(chat => (
                      <button 
                        key={chat.id}
                        onClick={() => navigate(`/chat/${chat.id}`)}
                        className="w-full text-left p-3 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group flex items-center gap-3"
                      >
                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                          <User size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">Dr. {chat.doctor_name}</p>
                          <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mt-0.5">Online Now</p>
                        </div>
                        <ArrowRight size={14} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))
                  )}
                </div>
              </section>

              <section className="bg-emerald-600 rounded-2xl p-5 shadow-lg shadow-emerald-500/20 text-white relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-lg font-black leading-tight mb-2">Emergency Hub</h3>
                  <p className="text-xs text-white/80 mb-4 font-medium">Quick access to medical emergency services and ambulances in your area.</p>
                  <button 
                    onClick={handleCallAmbulance}
                    disabled={callingAmbulance}
                    className={`w-full py-2 bg-white text-emerald-600 font-black text-[10px] uppercase tracking-widest rounded-lg hover:shadow-lg transition-shadow flex items-center justify-center gap-2 ${callingAmbulance ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {callingAmbulance ? (
                      <>
                        <div className="w-3 h-3 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                        Transmitting...
                      </>
                    ) : 'Call Ambulance'}
                  </button>
                </div>
                <HeartPulse className="absolute -right-4 -bottom-4 w-24 h-24 text-white/10 rotate-12" />
              </section>

              <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-[10px] font-bold uppercase text-slate-500 tracking-[0.1em]">Medicine Reminders</h2>
                  <button onClick={() => setIsReminderModalOpen(true)} className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors">
                    <PlusCircle size={14} />
                  </button>
                </div>
                <div className="space-y-3">
                  {reminders.length === 0 ? (
                    <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No reminders set</p>
                    </div>
                  ) : (
                    reminders.map(reminder => (
                      <ReminderCard 
                        key={reminder.id} 
                        reminder={reminder} 
                        onToggle={() => handleToggleReminder(reminder.id)}
                        onDelete={() => handleDeleteReminder(reminder.id)}
                      />
                    ))
                  )}
                </div>
              </section>

              <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-[10px] font-bold uppercase text-slate-500 tracking-[0.1em]">Quick Reports</h2>
                  <Link to="/reports" className="text-[10px] font-bold text-emerald-600 hover:underline">Manage All</Link>
                </div>
                <div className="space-y-3">
                  {reports.length === 0 ? (
                    <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No recent reports</p>
                    </div>
                  ) : (
                    reports.slice(0, 3).map(report => (
                      <div 
                        key={report.id}
                        onClick={() => navigate('/reports')}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                           <FileText size={16} className="text-slate-400 shrink-0" />
                           <span className="text-[11px] font-bold text-slate-700 truncate">{report.title}</span>
                        </div>
                        <span className="text-[8px] font-bold text-emerald-600 shrink-0">VIEW</span>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>

          </div>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 overflow-hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl w-full max-w-lg relative z-10 shadow-2xl overflow-hidden shadow-emerald-500/10 border border-emerald-100"
            >
              <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
                <h2 className="text-sm font-bold text-slate-800">Draft New Publication</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleUpload} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-1">Entry Title</label>
                  <input 
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50 text-sm font-bold text-slate-800"
                    placeholder="e.g. Understanding Heart Health"
                    value={newBlog.title}
                    onChange={e => setNewBlog({...newBlog, title: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-1">Lead Author</label>
                    <input 
                      required
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50 text-sm"
                      value={newBlog.author}
                      onChange={e => setNewBlog({...newBlog, author: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-1">Category</label>
                    <select 
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50 text-sm"
                      value={newBlog.category}
                      onChange={e => setNewBlog({...newBlog, category: e.target.value})}
                    >
                      <option>General</option>
                      <option>Heart Health</option>
                      <option>Neurology</option>
                      <option>Nutrition</option>
                      <option>Mental Wellness</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-1">Clinical Insight (Markdown)</label>
                  <textarea 
                    required
                    rows={6}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50 text-sm font-mono resize-none"
                    placeholder="<h1>Protocol</h1><p>Insights go here...</p>"
                    value={newBlog.content}
                    onChange={e => setNewBlog({...newBlog, content: e.target.value})}
                  />
                </div>
                <button type="submit" className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-black text-[11px] uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20">
                  Publish Publication
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {isReminderModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 overflow-hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsReminderModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl w-full max-w-sm relative z-10 shadow-2xl overflow-hidden border border-emerald-100"
            >
              <div className="bg-emerald-50 p-4 border-b border-emerald-100 flex justify-between items-center text-emerald-800">
                <h2 className="text-sm font-bold flex items-center gap-2">
                  <Pill size={16} /> New Medication Reminder
                </h2>
                <button onClick={() => setIsReminderModalOpen(false)} className="text-emerald-400 hover:text-emerald-600">
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleAddReminder} className="p-5 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Medicine Name</label>
                  <input 
                    required
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold text-slate-700"
                    placeholder="e.g. Paracetamol"
                    value={newReminder.medicineName}
                    onChange={e => setNewReminder({...newReminder, medicineName: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Dosage</label>
                    <input 
                      required
                      className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      placeholder="e.g. 500mg"
                      value={newReminder.dosage}
                      onChange={e => setNewReminder({...newReminder, dosage: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Time</label>
                    <input 
                      required
                      type="time"
                      className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      value={newReminder.time}
                      onChange={e => setNewReminder({...newReminder, time: e.target.value})}
                    />
                  </div>
                </div>
                <button type="submit" className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest rounded-lg transition-all shadow-lg shadow-emerald-500/20">
                  Set Reminder
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {selectedBlog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedBlog(null)} className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" />
             <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] relative z-10 shadow-2xl overflow-auto border border-white/20">
                <div className="sticky top-0 bg-white/80 backdrop-blur-sm border-b border-slate-100 p-4 flex items-center justify-between z-20">
                   <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase rounded tracking-widest">PUBLICATION FILE</span>
                   </div>
                   <button onClick={() => setSelectedBlog(null)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors"><X size={18} /></button>
                </div>
                <div className="p-8 md:p-12 lg:p-16 max-w-2xl mx-auto">
                   <p className="text-emerald-600 font-bold text-[11px] uppercase tracking-[0.3em] mb-4">{selectedBlog.category} • {new Date(selectedBlog.date).toLocaleDateString()}</p>
                   <h1 className="text-3xl font-black text-slate-900 mb-6 tracking-tight leading-none">{selectedBlog.title}</h1>
                   <div className="markdown-body"><BlogContent content={selectedBlog.content} /></div>
                   <div className="mt-12 pt-8 border-t border-slate-100">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 bg-slate-200 rounded-full shrink-0" />
                         <div>
                            <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Verified Author</p>
                            <p className="text-sm font-bold text-slate-900">{selectedBlog.author}</p>
                         </div>
                      </div>
                   </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AboutPage = ({ onMenuClick, lang }: { onMenuClick?: () => void, lang: Language }) => {
  const t = translations[lang];
  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
      <Header title={t.aboutHealthcare} onMenuClick={onMenuClick} />
    <div className="flex-1 overflow-auto p-6 md:p-12 lg:p-24 selection:bg-emerald-100">
      <div className="max-w-3xl mx-auto">
        <div className="w-14 h-1 w-14 bg-emerald-500 mb-8" />
        <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-8 leading-none">Redefining health through precision infrastructure.</h2>
        <div className="space-y-6 text-slate-600 leading-relaxed text-sm">
          <p>
            At healthcare.com, we specialize in high-density medical protocol management. Our infrastructure is designed to bridge the gap between clinical complexity and patient-facing accessibility.
          </p>
          <p>
            Our neural-assisted diagnostic engine leverages advanced clinical databases to provide home-remedy suggestions while ensuring professional medical oversight remains at the core of every patient journey.
          </p>
          <p>
            Since our inception, we have processed thousands of clinical interactions, maintaining a zero-trust security model for patient data and a real-time synchronization layer for practitioners.
          </p>
          <p>
            We believe that healthcare should be atomic, precise, and universally accessible. Whether you are searching for a specialized neurologist or a 24/7 medical store, our network is optimized for reliability and speed.
          </p>
          <div className="grid grid-cols-2 gap-12 mt-16 pt-16 border-t border-slate-100">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Our Mission</p>
              <p className="text-base font-bold text-slate-900">Synchronize the world's clinical knowledge into a unified, secure portal.</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Since</p>
              <p className="text-4xl font-black text-slate-900 uppercase">2024</p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

const STATIC_DRUGS: Drug[] = [
  { id: "1", name: "Aspirin", dosing: "81mg daily", indications: "Cardiovascular prevention", reactions: "Tinnitus, Gastritis", usage: "Take with food to minimize gastric irritation." },
  { id: "2", name: "Ibuprofen", dosing: "400mg every 6 hours", indications: "Pain, Inflammation", reactions: "Nausea, Edema", usage: "Maximum 3200mg/day. Use lowest effective dose." },
  { id: "3", name: "Amoxicillin", dosing: "500mg every 8 hours", indications: "Bacterial infections", reactions: "Nausea, Rash", usage: "Complete the full course as prescribed." },
  { id: "4", name: "Metformin", dosing: "500mg twice daily with meals", indications: "Type 2 Diabetes", reactions: "GI upset, Metallic taste", usage: "Take with food to reduce side effects." },
  { id: "5", name: "Atorvastatin", dosing: "20mg once daily", indications: "High cholesterol", reactions: "Muscle pain, Liver enzyme increase", usage: "Take at the same time each day." },
  { id: "6", name: "Lisinopril", dosing: "10mg once daily", indications: "Hypertension", reactions: "Dry cough, Dizziness", usage: "Monitor blood pressure regularly." },
  { id: "7", name: "Levothyroxine", dosing: "50mcg once daily on empty stomach", indications: "Hypothyroidism", reactions: "Heart palpitations, Heat intolerance", usage: "Take 30-60 minutes before breakfast." },
  { id: "8", name: "Amlodipine", dosing: "5mg once daily", indications: "Hypertension, Angina", reactions: "Swelling of ankles, Headache", usage: "May be taken with or without food." },
  { id: "9", name: "Metoprolol", dosing: "50mg once daily", indications: "Hypertension, Heart failure", reactions: "Fatigue, Slow heart rate", usage: "Take with or immediately after a meal." },
  { id: "10", name: "Omeprazole", dosing: "20mg once daily before breakfast", indications: "GERD, Stomach ulcers", reactions: "Headache, Abdominal pain", usage: "Take 30-60 minutes before a meal." },
  { id: "11", name: "Azithromycin", dosing: "500mg once daily for 3 days", indications: "Bacterial infections", reactions: "Nausea, Diarrhea", usage: "Can be taken with or without food." },
  { id: "12", name: "Sertraline", dosing: "50mg once daily", indications: "Depression, Anxiety", reactions: "Nausea, Insomnia", usage: "Take in the morning or evening." },
  { id: "13", name: "Sildenafil", dosing: "50mg 1 hour before activity", indications: "Erectile dysfunction", reactions: "Headache, Flushing", usage: "Do not use with nitrates." },
  { id: "14", name: "Gabapentin", dosing: "300mg three times daily", indications: "Nerve pain, Seizures", reactions: "Dizziness, Drowsiness", usage: "Do not stop abruptly." },
  { id: "15", name: "Prednisone", dosing: "10mg once daily", indications: "Inflammation, Allergies", reactions: "Weight gain, Mood changes", usage: "Take with food in the morning." },
  { id: "16", name: "Warfarin", dosing: "5mg once daily", indications: "Blood clots prevention", reactions: "Bleeding, Bruising", usage: "Monitor INR levels regularly." },
  { id: "17", name: "Alprazolam", dosing: "0.25mg three times daily", indications: "Anxiety, Panic disorders", reactions: "Drowsiness, Slurred speech", usage: "High potential for dependency." },
  { id: "18", name: "Furosemide", dosing: "40mg once daily", indications: "Edema, Heart failure", reactions: "Dehydration, Low potassium", usage: "Take in the morning to avoid nighttime urination." },
  { id: "19", name: "Montelukast", dosing: "10mg once daily in the evening", indications: "Asthma, Seasonal allergies", reactions: "Headache, Behavior changes", usage: "Take even if asthma symptoms are not present." },
  { id: "20", name: "Losartan", dosing: "50mg once daily", indications: "Hypertension", reactions: "Dizziness, Back pain", usage: "Maintain adequate hydration." }
];

const DrugAskBot = ({ lang }: { lang: Language }) => {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = translations[lang];

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Provide complete and detailed medical information about the drug: ${query}. 
          Strictly respond in language: ${lang === 'hi' ? 'Hindi' : lang === 'ta' ? 'Tamil' : lang === 'bn' ? 'Bengali' : 'English'}.
          Include:
          1. Common Uses
          2. Typical Dosage
          3. Standard Side Effects
          4. Important Contraindications/Warnings
          5. Storage and Disposal
          
          Format the response clearly with headings. Keep it professional and clinical.`
      });
      
      setResult(response.text || t.syncInterrupted);
    } catch (err: any) {
      console.error("AI Error:", err);
      setError(`V8.1 Neural Error: ${err.message}. If this persists, please consult a real practitioner.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-emerald-500/5 border border-slate-200 overflow-hidden mb-8">
      <div className="bg-emerald-600 p-6 text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/20 rounded-lg">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-black tracking-tight">V8.1 PHARMA-SYNC AI BOT</h3>
          </div>
          <p className="text-white/80 text-xs font-medium max-w-md">Instantly retrieve verified clinical insights for any pharmaceutical compound using our encrypted neural network.</p>
        </div>
        <HeartPulse className="absolute -right-8 -bottom-8 w-48 h-48 text-white/5 rotate-12" />
      </div>

      <div className="p-6">
        <form onSubmit={handleAsk} className="flex gap-2">
          <div className="relative flex-1">
            <input 
              type="text"
              placeholder="Input chemical compound name (e.g. Atorvastatin)..."
              className="w-full px-4 py-3 pl-11 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm font-medium"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Pill className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className={`px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg flex items-center gap-2 ${loading ? 'opacity-50' : 'hover:bg-emerald-600 active:scale-95'}`}
          >
            {loading ? (
              <>
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analyzing
              </>
            ) : (
              <>
                Sync Data
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <AnimatePresence mode="wait">
          {loading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-6 space-y-4 p-6 bg-slate-50 border border-slate-100 rounded-2xl"
            >
              <div className="h-4 bg-slate-200 rounded w-1/3 animate-pulse" />
              <div className="space-y-2">
                <div className="h-3 bg-slate-200 rounded w-full animate-pulse" />
                <div className="h-3 bg-slate-200 rounded w-full animate-pulse" />
                <div className="h-3 bg-slate-200 rounded w-4/5 animate-pulse" />
              </div>
              <div className="h-4 bg-slate-200 rounded w-1/4 animate-pulse mt-6" />
              <div className="space-y-2">
                <div className="h-3 bg-slate-200 rounded w-full animate-pulse" />
                <div className="h-3 bg-slate-200 rounded w-3/4 animate-pulse" />
              </div>
            </motion.div>
          )}

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs font-bold text-red-700">{error}</p>
            </motion.div>
          )}

          {result && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-6 p-6 bg-slate-50 border border-slate-100 rounded-2xl relative"
            >
              <div className="absolute top-4 right-4 bg-emerald-100 text-emerald-700 text-[9px] font-black px-2 py-1 rounded tracking-[0.2em] uppercase">Verified Result</div>
              <div className="prose prose-slate prose-sm max-w-none">
                <Markdown remarkPlugins={[remarkGfm]}>{result}</Markdown>
              </div>
              <div className="mt-8 pt-4 border-t border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">System Protocol Active</span>
                </div>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(result);
                    alert("Drug details copied to clipboard.");
                  }}
                  className="flex items-center gap-2 text-[10px] font-black text-slate-500 hover:text-emerald-600 transition-colors uppercase tracking-widest"
                >
                  <Copy className="w-3 h-3" />
                  Copy Record
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const DrugGuidePage = ({ onMenuClick, lang }: { onMenuClick?: () => void, lang: Language }) => {
  const t = translations[lang];
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDrugs = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/drugs');
        if (!res.ok) throw new Error(`API error ${res.status}`);
        const data = await res.json();
        setDrugs(data);
      } catch (err: any) {
        console.log("Using static drug fallback database:", err.message);
        setDrugs(STATIC_DRUGS);
      } finally {
        setLoading(false);
      }
    };
    fetchDrugs();
  }, []);

  const filtered = drugs.filter(d => d.name.toLowerCase().includes(search.toLowerCase()) || d.indications.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <Header title={t.pharmacopeia} onMenuClick={onMenuClick} />
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center justify-between font-mono">
        <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider flex items-center gap-2">
           Active Search Filters
           <span className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-[9px] font-black">{filtered.length} RECORDS FOUND</span>
        </div>
        <div className="relative w-64">
           <input 
            type="text"
            placeholder={t.searchPlaceholder}
            className="w-full pl-8 pr-3 py-1.5 rounded bg-white border border-slate-200 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none placeholder:text-slate-400 font-medium"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <UserSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-4 md:p-6 bg-slate-100/30">
        <div className="max-w-7xl mx-auto">
          <DrugAskBot lang={lang} />
          
          <section className="dashboard-card shadow-lg bg-white border border-slate-200 overflow-hidden">
            <div className="card-header bg-slate-50 border-b border-slate-100 px-4 md:px-6 py-3">
              <h2 className="card-title text-[10px] md:text-xs">V2.4 DRUG REGISTRY • {filtered.length} RECORDS</h2>
              <div className="hidden sm:block text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded border border-emerald-100 uppercase tracking-tighter">STABLE CONNECT</div>
            </div>
            <div className="overflow-x-auto">
              {/* Desktop Table View */}
              <table className="hidden md:table w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[9px] uppercase font-bold text-slate-500 tracking-widest">
                    <th className="px-6 py-4">Compound Name</th>
                    <th className="px-6 py-4">Dosage Protocol</th>
                    <th className="px-6 py-4">Clinical Indication</th>
                    <th className="px-6 py-4">Contraindications</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Accessing Drug Registry...</p>
                        </div>
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        No medical records found
                      </td>
                    </tr>
                  ) : (
                    filtered.map(drug => (
                      <tr key={drug.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm" />
                            <span className="font-bold text-slate-900 leading-none text-xs">{drug.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-[11px] text-slate-600 font-medium">{drug.dosing}</td>
                        <td className="px-6 py-4 text-[11px] text-slate-600 leading-tight pr-4">{drug.indications}</td>
                        <td className="px-6 py-4">
                          <span className="inline-block px-2 py-0.5 bg-red-50 text-red-600 text-[9px] font-black rounded border border-red-100 uppercase tracking-tighter max-w-[200px] truncate">
                            {drug.reactions}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-slate-100">
                {loading ? (
                  <div className="py-12 text-center">
                     <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loading Records...</p>
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="py-12 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                     No records available
                  </div>
                ) : (
                  filtered.map(drug => (
                    <div key={drug.id} className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span className="font-bold text-slate-900 text-sm">{drug.name}</span>
                        </div>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-black uppercase rounded">
                          {drug.dosing}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium leading-relaxed italic">{drug.indications}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-red-500 uppercase tracking-widest whitespace-nowrap">Warning:</span>
                        <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[9px] font-black rounded border border-red-100 truncate flex-1">
                          {drug.reactions}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

const GenericBookingModal = ({ 
  item, 
  isOpen, 
  onClose, 
  patientId, 
  title, 
  buttonText, 
  collectionRef, 
  providerIdField,
  providerNameField,
  providerImageField,
  successMessage,
  reasonLabel = "Reason for Visit",
  reasonPlaceholder = "Describe your needs..."
}: { 
  item: any, 
  isOpen: boolean, 
  onClose: () => void, 
  patientId: string, 
  title: string,
  buttonText: string,
  collectionRef: any,
  providerIdField: string,
  providerNameField: string,
  providerImageField: string,
  successMessage: string,
  reasonLabel?: string,
  reasonPlaceholder?: string
}) => {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time) return;

    // Enhanced Time validation within working hours
    const workingHours = item.availability || item.hours;
    if (workingHours) {
      const avail = workingHours.toLowerCase();
      
      // Robust regex for time ranges: "9:00 AM - 5:00 PM", "09:00 - 17:00", "9 AM - 5 PM"
      const timeRangeRegex = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*-\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i;
      const match = avail.match(timeRangeRegex);
      
      if (match) {
        let [_, startH, startM, startAMPM, endH, endM, endAMPM] = match;
        
        const toMinutes = (h: string, m: string | undefined, ampm: string | undefined) => {
          let hour = parseInt(h);
          let minutes = m ? parseInt(m) : 0;
          if (ampm && ampm.toLowerCase() === 'pm' && hour < 12) hour += 12;
          if (ampm && ampm.toLowerCase() === 'am' && hour === 12) hour = 0;
          return hour * 60 + minutes;
        };

        const startTotal = toMinutes(startH, startM, startAMPM);
        const endTotal = toMinutes(endH, endM, endAMPM);
        
        const [selH, selM] = time.split(':').map(Number);
        const selTotal = selH * 60 + selM;
        
        if (selTotal < startTotal || selTotal >= endTotal) {
          alert(`Selected time ${time} is outside this professional's working hours (${workingHours}).`);
          return;
        }
      } else if (avail.includes("on call 24/7") || avail.includes("24/7")) {
        // No restriction
      }
      
      // Day validation
      const selectedDate = new Date(date);
      const day = selectedDate.getDay(); // 0 is Sunday, 6 is Saturday
      
      const isWeekend = day === 0 || day === 6;
      if (avail.includes("mon-fri") && isWeekend) {
        alert("This professional is only available Monday through Friday (Mon-Fri).");
        return;
      }
      if (avail.includes("mon-wed") && (day === 0 || day > 3)) {
        alert("This professional is only available Monday through Wednesday (Mon-Wed).");
        return;
      }
    }

    setLoading(true);
    try {
      await firebaseService.createRequest(collectionRef, {
        [providerIdField]: item.id,
        [providerNameField]: item.name,
        [providerImageField]: item.image || item.icon || "",
        patientId,
        date,
        time,
        reason,
        address: item.location || item.address || "",
        paid: collectionRef !== appointmentsRef, // Only appointments (doctors) require payment
        status: 'pending'
      });
      alert(successMessage + " Digital record finalized.");
      onClose();
      
      // Navigate to respective directory
      const targetPath = collectionRef === appointmentsRef ? '/appointments' : 
                         collectionRef === ordersRef ? '/patient-orders' : '/patient-labs';
      navigate(targetPath);
    } catch (err: any) {
      console.error("Booking error:", err);
      alert(`Booking Failed: ${err.message || "Please check your network and try again."}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="bg-emerald-600 p-6 text-white relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white"><X size={20} /></button>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 overflow-hidden shrink-0 border border-white/20 flex items-center justify-center shrink-0">
              {(item.image || item.icon) ? (
                <img src={item.image || item.icon} className="w-full h-full object-cover" />
              ) : (
                <User size={24} />
              )}
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight">{item.name}</h2>
              <p className="text-emerald-100 text-[10px] font-black uppercase tracking-[0.2em]">{title}</p>
            </div>
          </div>
        </div>
        <form onSubmit={handleBook} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Date</label>
              <input type="date" required min={new Date().toISOString().split('T')[0]} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Time</label>
              <input type="time" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" value={time} onChange={e => setTime(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{reasonLabel}</label>
            <textarea rows={3} placeholder={reasonPlaceholder} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none" value={reason} onChange={e => setReason(e.target.value)} />
          </div>
          <button type="submit" disabled={loading} className={`w-full py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 transition-all ${loading ? 'opacity-50' : 'hover:bg-emerald-600 active:scale-95'}`}>
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : buttonText}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

const BookingModal = ({ doctor, isOpen, onClose, patientId }: { doctor: Doctor, isOpen: boolean, onClose: () => void, patientId: string }) => (
  <GenericBookingModal 
    item={doctor} 
    isOpen={isOpen} 
    onClose={onClose} 
    patientId={patientId} 
    title={doctor.specialization}
    buttonText="Confirm Appointment Request"
    collectionRef={appointmentsRef}
    providerIdField="doctorId"
    providerNameField="doctorName"
    providerImageField="doctorImage"
    successMessage="Appointment requested successfully!"
  />
);

const StoreOrderModal = ({ store, isOpen, onClose, patientId }: { store: any, isOpen: boolean, onClose: () => void, patientId: string }) => (
  <GenericBookingModal 
    item={store} 
    isOpen={isOpen} 
    onClose={onClose} 
    patientId={patientId} 
    title="Medicine Order"
    buttonText="Send Medicine Inquiry"
    collectionRef={ordersRef}
    providerIdField="storeId"
    providerNameField="storeName"
    providerImageField="storeImage"
    successMessage="Medicine inquiry sent successfully!"
    reasonLabel="Order Details / Medicines"
    reasonPlaceholder="List your medicines here..."
  />
);

const LabBookingModal = ({ lab, isOpen, onClose, patientId }: { lab: any, isOpen: boolean, onClose: () => void, patientId: string }) => (
  <GenericBookingModal 
    item={lab} 
    isOpen={isOpen} 
    onClose={onClose} 
    patientId={patientId} 
    title="Lab Test Booking"
    buttonText="Book Diagnostic Test"
    collectionRef={labBookingsRef}
    providerIdField="labId"
    providerNameField="labName"
    providerImageField="labImage"
    successMessage="Lab test booked successfully!"
    reasonLabel="Required Tests"
    reasonPlaceholder="Specify tests (e.g., Blood Sample, X-Ray)..."
  />
);

const FindDoctorPage = ({ profile, onMenuClick, lang }: { profile: UserProfile | null, onMenuClick?: () => void, lang: Language }) => {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [searchName, setSearchName] = useState("");
  const [searchSpecialty, setSearchSpecialty] = useState("");
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<any | null>(null);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const firestoreDocs = await firebaseService.getProfessionals('doctor');
        setDoctors(firestoreDocs || []);
      } catch (err) {
        console.error("Failed to fetch doctors", err);
      }
    };
    fetchDoctors();
    
    if (navigator.geolocation) {
       navigator.geolocation.getCurrentPosition((pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
       }, (err) => console.log('Location access denied', err));
    }
  }, []);

  const processedDoctors = doctors.map(doctor => {
    if (userLocation) {
      return { 
        ...doctor, 
        distance: getDistance(userLocation.lat, userLocation.lng, doctor.lat, doctor.lng) 
      };
    }
    return doctor;
  });

  const specializations = Array.from(new Set(doctors.map(d => d.specialization))).sort();

  const filtered = processedDoctors
    .filter(doctor => 
      doctor.name.toLowerCase().includes(searchName.toLowerCase()) &&
      (searchSpecialty === "" || doctor.specialization === searchSpecialty)
    )
    .sort((a, b) => (a.distance || 0) - (b.distance || 0));

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <Header title="Practitioner Directory" onMenuClick={onMenuClick} />
      
      <div className="bg-slate-50 border-b border-slate-200 px-4 md:px-6 py-3 shrink-0">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 font-mono">
          <div className="relative flex-1 max-w-none sm:max-w-xs">
             <input 
              type="text"
              placeholder="Filter by name..."
              className="w-full pl-8 pr-3 py-1.5 rounded bg-white border border-slate-200 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none placeholder:text-slate-400"
              value={searchName}
              onChange={e => setSearchName(e.target.value)}
            />
            <UserSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
          </div>
          <div className="relative flex-1 max-w-xs">
             <select 
              className="w-full pl-8 pr-3 py-1.5 rounded bg-white border border-slate-200 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none appearance-none font-medium text-slate-700"
              value={searchSpecialty}
              onChange={e => setSearchSpecialty(e.target.value)}
            >
              <option value="">All Specializations</option>
              {specializations.map(spec => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
            <HeartPulse className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 pointer-events-none" />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
            </div>
          </div>
        </div>
        <div className="mt-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
           <Info size={10} className="text-emerald-500" />
           Doctors are ordered by proximity to your current location (Proximity Sync Active)
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 bg-slate-100/30">
        <InteractiveMap 
          items={filtered} 
          center={userLocation ? [userLocation.lat, userLocation.lng] : [25.3176, 82.9739]} 
          userLocation={userLocation}
          onSelectAction={setSelectedDoctor}
          onFindMe={() => {
            if ("geolocation" in navigator) {
              navigator.geolocation.getCurrentPosition((pos) => {
                setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
              });
            }
          }}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(doctor => (
            <motion.div 
              whileHover={{ y: -2 }}
              key={doctor.id}
              className="bg-white rounded-xl border border-slate-200 p-5 flex gap-5 transition-all hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/5 cursor-pointer shadow-sm relative overflow-hidden"
            >
              <div className="w-16 h-16 rounded-xl bg-slate-200 overflow-hidden flex-shrink-0 border border-slate-100 shadow-sm">
                <img src={doctor.image} className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col justify-center overflow-hidden flex-1">
                <h2 className="font-bold text-slate-900 truncate leading-none mb-1.5 text-sm">{doctor.name}</h2>
                <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest mb-3">{doctor.specialization}</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                    <span className="flex items-center gap-1"><Info size={10} /> {doctor.experience}</span>
                    {doctor.distance !== undefined && (
                      <span className="text-emerald-600 font-bold uppercase tracking-tighter">
                        {doctor.distance.toFixed(1)} km away
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 flex items-center gap-1 font-medium italic border-t border-slate-50 pt-2">
                     <span className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
                     {doctor.location}
                  </div>
                  <div className="flex items-center gap-1.5 text-[9px] text-emerald-700 font-black bg-emerald-50 border border-emerald-100 px-2 py-1 rounded w-fit uppercase tracking-tighter">
                    <HeartPulse size={10} />
                    {doctor.availability}
                  </div>
                  {doctor.fee && (
                    <div className="flex items-center gap-1.5 text-[9px] text-blue-700 font-black bg-blue-50 border border-blue-100 px-2 py-1 rounded w-fit uppercase tracking-tighter mt-1">
                      <CreditCard size={10} />
                      Consultation: ₹{(doctor.fee * 1.1).toFixed(2)}
                    </div>
                  )}
                <div className="flex items-center justify-between gap-2 border-t border-slate-50 pt-3">
                    <button 
                      onClick={() => setSelectedDoctor(doctor)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-[10px] font-bold rounded hover:bg-emerald-700 transition-colors shadow-sm"
                    >
                      <Calendar size={12} />
                      Appointment
                    </button>
                    <div className="flex items-center gap-1.5 text-slate-700 font-mono text-[10px] bg-slate-50 px-2 py-1.5 rounded border border-slate-100">
                      <Phone size={12} className="text-emerald-500" />
                      <span>{doctor.contact}</span>
                      <CopyButton text={doctor.contact} />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          <button className="col-span-full py-4 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-slate-50 hover:border-emerald-300 hover:text-emerald-500 transition-all">
            Open Advanced Visualization Layer
          </button>
        </div>
      </div>

      {selectedDoctor && profile && (
        <BookingModal 
          doctor={selectedDoctor} 
          isOpen={!!selectedDoctor} 
          onClose={() => setSelectedDoctor(null)} 
          patientId={profile.id}
        />
      )}
    </div>
  );
};

const MedicalStoresPage = ({ profile, onMenuClick, lang }: { profile: UserProfile | null, onMenuClick?: () => void, lang: Language }) => {
  const [stores, setStores] = useState<any[]>([]);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [selectedStore, setSelectedStore] = useState<any | null>(null);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const firestoreStores = await firebaseService.getProfessionals('med_store');
        setStores(firestoreStores || []);
      } catch (err) {
        console.error("Failed to fetch stores", err);
      }
    };
    fetchStores();
    
    if (navigator.geolocation) {
       navigator.geolocation.getCurrentPosition((pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
       }, (err) => console.log('Location access denied', err));
    }
  }, []);

  const processedStores = stores.map(store => {
    if (userLocation) {
      return { 
        ...store, 
        distance: getDistance(userLocation.lat, userLocation.lng, store.lat, store.lng) 
      };
    }
    return store;
  });

  const sorted = processedStores.sort((a, b) => (a.distance || 0) - (b.distance || 0));

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <Header title="Medical Store Registry" onMenuClick={onMenuClick} />
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 shrink-0 flex items-center justify-between">
        <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider flex items-center gap-2">
           <Info size={10} className="text-emerald-500" />
           Stores are sorted by proximity to your current location (Sync Active)
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6 bg-slate-100/30">
        <InteractiveMap 
          items={sorted} 
          center={userLocation ? [userLocation.lat, userLocation.lng] : [25.3176, 82.9739]} 
          userLocation={userLocation}
          onSelectAction={(store) => setSelectedStore(store)}
          onFindMe={() => {
            if ("geolocation" in navigator) {
              navigator.geolocation.getCurrentPosition((pos) => {
                setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
              });
            }
          }}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map(store => (
            <motion.div 
              whileHover={{ y: -2 }}
              key={store.id}
              className="bg-white rounded-xl border border-slate-200 p-5 flex gap-4 transition-all hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/5 cursor-pointer shadow-sm relative overflow-hidden"
            >
              <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                <Store size={24} />
              </div>
              <div className="flex flex-col justify-center overflow-hidden flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h2 className="font-bold text-slate-900 truncate leading-none text-sm">{store.name}</h2>
                  {store.distance !== undefined && (
                    <span className="text-[9px] text-emerald-600 font-black uppercase whitespace-nowrap ml-2">
                      {store.distance.toFixed(1)} KM
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 truncate mb-1">{store.address}</p>
                <div className="flex items-center gap-1 text-[9px] font-black text-amber-600 uppercase tracking-tighter mb-3 bg-amber-50 px-2 py-1 rounded border border-amber-100 self-start">
                  <CreditCard size={10} />
                  Service Fee: To be decided after list review
                </div>
                <div className="mt-4 pt-3 border-t border-slate-50 flex flex-col gap-2">
                  <button 
                    onClick={() => setSelectedStore(store)}
                    className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-slate-900 text-white text-[10px] font-bold rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
                  >
                    <Package size={14} />
                    Order Medicine
                  </button>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <Phone size={10} className="text-emerald-500" />
                      <span className="text-[10px] font-bold font-mono">{store.contact}</span>
                      <CopyButton text={store.contact} />
                    </div>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[8px] font-black uppercase rounded tracking-tighter">
                      {store.hours}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      {selectedStore && profile && (
        <StoreOrderModal 
          store={selectedStore} 
          isOpen={!!selectedStore} 
          onClose={() => setSelectedStore(null)} 
          patientId={profile.id}
        />
      )}
    </div>
  );
};

const LabsPage = ({ profile, onMenuClick, lang }: { profile: UserProfile | null, onMenuClick?: () => void, lang: Language }) => {
  const [labs, setLabs] = useState<any[]>([]);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [selectedLab, setSelectedLab] = useState<any | null>(null);

  useEffect(() => {
    const fetchLabs = async () => {
      try {
        const firestoreLabs = await firebaseService.getProfessionals('lab');
        setLabs(firestoreLabs || []);
      } catch (err) {
        console.error("Failed to fetch labs", err);
      }
    };
    fetchLabs();
    if (navigator.geolocation) {
       navigator.geolocation.getCurrentPosition((pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
       }, (err) => console.log('Location access denied', err));
    }
  }, []);

  const processedLabs = labs.map(lab => {
    if (userLocation) {
      return { ...lab, distance: getDistance(userLocation.lat, userLocation.lng, lab.lat, lab.lng) };
    }
    return lab;
  });

  const sorted = processedLabs.sort((a, b) => (a.distance || 0) - (b.distance || 0));

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <Header title="Pathogenic Laboratory Registry" onMenuClick={onMenuClick} />
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 shrink-0 flex items-center justify-between">
        <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider flex items-center gap-2">
           <Info size={10} className="text-emerald-500" />
           Laboratories ordered by geographic proximity (Precision Sync)
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6 bg-slate-100/30">
        <InteractiveMap 
          items={sorted} 
          center={userLocation ? [userLocation.lat, userLocation.lng] : [25.3176, 82.9739]} 
          userLocation={userLocation}
          onSelectAction={(lab) => setSelectedLab(lab)}
          onFindMe={() => {
            if ("geolocation" in navigator) {
              navigator.geolocation.getCurrentPosition((pos) => {
                setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
              });
            }
          }}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map(lab => (
            <motion.div 
              whileHover={{ y: -2 }}
              key={lab.id}
              className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col transition-all hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/5 cursor-pointer shadow-sm relative"
            >
              <div className="flex gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 border border-orange-100">
                  <PlusCircle size={24} />
                </div>
                <div className="overflow-hidden">
                   <h2 className="font-bold text-slate-900 truncate text-sm">{lab.name}</h2>
                   <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">{lab.address}</p>
                </div>
              </div>
              <div className="space-y-4 mt-auto">
                <div className="flex justify-between items-center text-[10px] text-slate-500">
                  <span className="font-bold">Owner: {lab.owner}</span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded text-[8px] font-black uppercase text-slate-600">{lab.hours}</span>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 mb-4">
                  <div className="flex items-center gap-1.5 text-[9px] font-black text-amber-600 uppercase tracking-tighter bg-amber-50 px-2 py-1 rounded border border-amber-100">
                    <CreditCard size={12} />
                    Fee: TBD After Review
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <Phone size={10} className="text-emerald-500" />
                    <span className="font-bold text-slate-900 text-[10px] font-mono">{lab.contact}</span>
                    <CopyButton text={lab.contact} />
                  </div>
                  {lab.distance !== undefined && (
                    <span className="text-[10px] font-black text-emerald-600 uppercase">
                      {lab.distance.toFixed(1)} KM AWAY
                    </span>
                  )}
                </div>
                <button 
                  onClick={() => setSelectedLab(lab)}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600/10 text-emerald-600 text-xs font-black uppercase tracking-widest rounded-lg hover:bg-emerald-600 hover:text-white transition-all active:scale-95 border border-emerald-500/20"
                >
                  <Calendar size={14} />
                  Book Lab Test
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      {selectedLab && profile && (
        <LabBookingModal 
          lab={selectedLab} 
          isOpen={!!selectedLab} 
          onClose={() => setSelectedLab(null)} 
          patientId={profile.id}
        />
      )}
    </div>
  );
};

const MedicalReportsPage = ({ profile, onMenuClick, lang }: { profile: UserProfile, onMenuClick?: () => void, lang: Language }) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newReport, setNewReport] = useState({ title: '', summary: '', date: new Date().toISOString().split('T')[0] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchReports = async () => {
      const data = await firebaseService.getReports(profile.id);
      setReports((data as Report[]) || []);
    };
    fetchReports();
  }, [profile.id]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const saved = await firebaseService.createReport({
        ...newReport,
        userId: profile.id,
      });
      if (saved) setReports([saved as Report, ...reports]);
      setIsModalOpen(false);
      setNewReport({ title: '', summary: '', date: new Date().toISOString().split('T')[0] });
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <Header title="Clinical Document Repository" onMenuClick={onMenuClick} />
      <div className="bg-emerald-600 p-4 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between shrink-0 gap-4">
          <div>
            <h2 className="text-white font-bold text-lg tracking-tight leading-none mb-1">Health Records & Findings</h2>
            <p className="text-emerald-100 text-[10px] uppercase font-bold tracking-widest opacity-80">Encrypted Cloud Storage Interface</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full md:w-auto bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all"
          >
             Initialize New Upload
          </button>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6 bg-slate-100/30">
        <div className="max-w-4xl mx-auto space-y-3">
          {reports.length === 0 ? (
            <div className="dashboard-card p-12 text-center border-dashed border-2 border-slate-200">
               <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                  <ShieldAlert size={32} />
               </div>
               <h3 className="text-sm font-bold text-slate-900 mb-1">No Clinical Records Found</h3>
               <p className="text-[10px] text-slate-500 uppercase tracking-widest">Transmit lab reports to begin historical tracking</p>
            </div>
          ) : (
            reports.map(report => (
              <div key={report.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4 hover:border-emerald-500 transition-all cursor-pointer shadow-sm group">
                <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 text-emerald-600 transition-colors">
                  <ShieldAlert size={20} />
                </div>
                <div className="flex-1 overflow-hidden">
                  <h3 className="text-sm font-bold text-slate-900 truncate">{report.title}</h3>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">{new Date(report.date).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right hidden md:block">
                    <p className="text-[10px] text-slate-400 font-medium truncate max-w-[200px]">{report.summary}</p>
                  </div>
                  <button 
                    onClick={() => alert("Secure transmission initiated. Your clinical document PDF is being decrypted and will download shortly.")}
                    className="text-[10px] font-black text-emerald-600 uppercase tracking-tighter shrink-0"
                  >
                    Download PDF →
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-6 flex items-center gap-2">
                   <PlusCircle className="text-emerald-500" size={18} />
                   Upload Clinical Record
                </h2>
                <form onSubmit={handleUpload} className="space-y-4">
                   <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Document Title</label>
                      <input required className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-emerald-500" value={newReport.title} onChange={e => setNewReport({...newReport, title: e.target.value})} placeholder="e.g. Blood Test Result" />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Record Date</label>
                      <input required type="date" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-emerald-500" value={newReport.date} onChange={e => setNewReport({...newReport, date: e.target.value})} />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Clinical Summary</label>
                      <textarea required rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-emerald-500" value={newReport.summary} onChange={e => setNewReport({...newReport, summary: e.target.value})} placeholder="Brief description of findings..." />
                   </div>
                   <button disabled={loading} className="w-full py-3 bg-slate-900 text-white rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center justify-center gap-2">
                       {loading ? 'Processing...' : 'Transmit to Cloud Securely'}
                   </button>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AskBotPage = ({ onMenuClick, lang }: { onMenuClick?: () => void, lang: Language }) => {
  const t = translations[lang];
  const [messages, setMessages] = useState<{ role: 'user' | 'bot' | 'system', content: string, image?: string }[]>([
    { 
      role: 'system', 
      content: t.clinicalAssistant 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedImage, setAttachedImage] = useState<{data: string, mimeType: string} | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert(t.imageLarge);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = (reader.result as string).split(',')[1];
      setAttachedImage({
        data: base64Data,
        mimeType: file.type
      });
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !attachedImage) || isLoading) return;

    const userMessage = input.trim();
    const currentImage = attachedImage;
    const currentPreview = imagePreview;
    
    setInput('');
    setAttachedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    setMessages(prev => [...prev, { 
      role: 'user', 
      content: userMessage || (currentImage ? t.attachedImage : ""),
      image: currentPreview || undefined
    }]);
    setIsLoading(true);

    try {
      const parts: any[] = [];
      if (currentImage) {
        parts.push({
          inlineData: {
            data: currentImage.data,
            mimeType: currentImage.mimeType
          }
        });
      }
      parts.push({ text: userMessage || "Analyze this image for potential medical symptoms and suggest home remedies if applicable." });

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts },
        config: {
          systemInstruction: `You are a medical home remedy bot with visual analysis capabilities.
          1. Strictly respond in the language: ${lang === 'hi' ? 'Hindi' : lang === 'ta' ? 'Tamil' : lang === 'bn' ? 'Bengali' : 'English'}.
          2. If an image is provided, analyze it carefully for visible symptoms (rashes, infections, etc.).
          3. Provide basic, safe home remedies for the identified or minor symptoms.
          4. ALWAYS start and end every response with a strong disclaimer in ${lang} that "Healthcare Bot is an AI and can make mistakes. This information is NOT professional medical advice. PLEASE CONNECT TO A REAL DOCTOR immediately for any serious concerns."
          5. Emphasize that the user should consult a doctor.
          6. If symptoms sound or look serious (e.g. infection spreading rapidly, deep wounds, severe inflammation), urgently advise contacting emergency services and a doctor instead of giving remedies.
          7. Keep responses concise and clinical in tone. Use bullet points for remedies.`
        }
      });

      const botResponse = response.text || t.syncInterrupted;
      setMessages(prev => [...prev, { role: 'bot', content: botResponse }]);
    } catch (error: any) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'bot', content: `System Error: ${error.message}. Please consult a medical professional directly.` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50">
      <Header title={t.homeRemedyBot} onMenuClick={onMenuClick} />
      
      <div className="p-4 bg-red-50 border-b border-red-100 flex items-center gap-3">
        <ShieldAlert className="text-red-600 shrink-0" size={18} />
        <p className="text-[10px] font-bold text-red-800 uppercase tracking-widest leading-tight">
          {t.warningAI}
        </p>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-4">
        {messages.map((msg, i) => (
          <motion.div 
            initial={{ opacity: 0, x: msg.role === 'user' ? 10 : -10 }}
            animate={{ opacity: 1, x: 0 }}
            key={i} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[80%] rounded-2xl p-4 text-xs font-medium shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-emerald-600 text-white rounded-tr-none' 
                  : msg.role === 'system'
                    ? 'bg-slate-200 text-slate-600 text-center w-full rounded-lg italic'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
              }`}
            >
              {msg.image && (
                <div className="mb-2 rounded-lg overflow-hidden border border-white/20">
                  <img src={msg.image} alt="User upload" className="max-w-full h-auto max-h-64 object-cover" />
                </div>
              )}
              <div className="prose prose-sm max-w-none prose-emerald prose-headings:text-inherit prose-p:my-0">
                <Markdown remarkPlugins={[remarkGfm]}>{msg.content}</Markdown>
              </div>
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 rounded-tl-none flex gap-1">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" />
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce delay-75" />
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce delay-150" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 md:p-6 bg-white border-t border-slate-200 shadow-xl">
        <form onSubmit={handleSend} className="max-w-4xl mx-auto">
          {imagePreview && (
            <div className="mb-4 relative inline-block">
              <img src={imagePreview} className="h-20 w-20 object-cover rounded-xl border-2 border-emerald-500 shadow-lg" alt="Preview" />
              <button 
                type="button" 
                onClick={() => {setAttachedImage(null); setImagePreview(null);}}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          )}
          
          <div className="relative flex items-center gap-2">
            <input 
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageSelect}
            />
            
            <div className="flex gap-2 shrink-0">
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 md:p-4 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                title={t.uploadPhoto}
              >
                <Image size={20} />
              </button>
              <button 
                type="button"
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.setAttribute('capture', 'environment');
                    fileInputRef.current.click();
                  }
                }}
                className="p-3 md:p-4 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 md:hidden"
                title={t.takePhoto}
              >
                <Camera size={20} />
              </button>
            </div>

            <div className="relative flex-1">
              <input 
                type="text"
                placeholder={attachedImage ? t.attachedImage : t.describeSymptoms}
                className="w-full pl-4 md:pl-6 pr-12 py-3 md:py-4 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-medium transition-all"
                value={input}
                onChange={e => setInput(e.target.value)}
                disabled={isLoading}
              />
              <button 
                type="submit"
                disabled={isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};


const PatientAppointmentsPage = ({ profile, onMenuClick, lang }: { profile: UserProfile, onMenuClick?: () => void, lang: Language }) => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedForPayment, setSelectedForPayment] = useState<any | null>(null);
  const navigate = useNavigate();

  const handleChat = async (apt: any) => {
    try {
      const chat = await firebaseService.getOrCreateChat(profile.id, apt.doctorId, apt.doctorName, apt.doctorImage);
      if (chat) {
        navigate(`/chat/${chat.id}`);
      }
    } catch (err) {
      console.error("Chat navigation failed", err);
    }
  };

  useEffect(() => {
    if (!profile?.id) return;
    const fetchAppointments = async () => {
      try {
        const data = await firebaseService.getAppointments(profile.id, 'patient');
        setAppointments(data || []);
      } catch (err) {
        console.error("Failed to fetch appointments", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, [profile?.id]);

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <Header title="Clinical Schedule" onMenuClick={onMenuClick} />
      <div className="flex-1 overflow-auto p-4 md:p-6 bg-slate-100/30">
        <div className="max-w-4xl mx-auto space-y-4">
          {loading ? (
            <div className="flex justify-center p-12">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : appointments.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-slate-200">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-sm font-bold text-slate-900 mb-1">No Consultations Active</h3>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">Register a visit in the Practitioner Directory</p>
            </div>
          ) : (
            appointments.map(apt => (
              <div key={apt.id} className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-5 hover:border-emerald-500/50 transition-all shadow-sm group">
                <div className="w-14 h-14 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-100">
                  <img src={apt.doctorImage} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-slate-900 truncate">{apt.doctorName}</h3>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${
                      apt.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : 
                      apt.status === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {apt.status}
                    </span>
                    {apt.paid && (
                      <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter bg-emerald-500 text-white animate-pulse">PAID</span>
                    )}
                  </div>
                  <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mb-2">{apt.specialization}</p>
                  <div className="flex items-center gap-4 text-[10px] text-slate-500 font-medium">
                    <span className="flex items-center gap-1.5"><Calendar size={12} className="text-slate-400" /> {apt.date ? new Date(apt.date).toLocaleDateString() : 'Date TBD'}</span>
                    <span className="flex items-center gap-1.5"><Clock size={12} className="text-slate-400" /> {apt.time || 'Time TBD'}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 w-full sm:w-auto">
                   <button 
                    onClick={() => handleChat(apt)}
                    className="flex-1 sm:flex-none h-10 px-4 bg-slate-900 text-white rounded-lg flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-600 transition-colors"
                   >
                     <MessageSquare size={14} />
                     Chat
                   </button>
                   {!apt.paid ? (
                     <button 
                      onClick={() => setSelectedForPayment(apt)}
                      className="flex-1 sm:flex-none h-10 px-4 bg-emerald-600 text-white rounded-lg flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-700 transition-colors"
                     >
                       <CreditCard size={14} />
                       Pay Fee
                     </button>
                   ) : (
                     <div className="h-10 px-4 bg-emerald-50 text-emerald-700 rounded-lg flex items-center justify-center gap-2 text-[8px] font-black uppercase tracking-tighter">
                       <Check size={12} className="text-emerald-500" />
                       Consultation Active
                     </div>
                   )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      {selectedForPayment && (
        <PaymentModal 
          item={selectedForPayment} 
          type="appointment"
          isOpen={!!selectedForPayment} 
          onClose={() => {
            setSelectedForPayment(null);
            // Refresh
            firebaseService.getAppointments(profile.id, 'patient').then(data => setAppointments(data || []));
          }} 
        />
      )}
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<any>(null);
  const sessionRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('hc_lang') as Language;
    return (['en', 'hi', 'ta', 'bn'].includes(saved) ? saved : 'en') as Language;
  });

  useEffect(() => {
    localStorage.setItem('hc_lang', lang);
  }, [lang]);

  // Medicine Reminder Notifications
  useEffect(() => {
    if (!profile || reminders.length === 0) return;

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const checkReminders = () => {
      const now = new Date();
      const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
      
      reminders.forEach(reminder => {
        // Only notify once per minute
        if (reminder.active && reminder.time === currentTime && now.getSeconds() === 0) {
          if ("Notification" in window && Notification.permission === "granted") {
             new Notification(`Medicine Reminder: ${reminder.medicineName}`, {
              body: `It's time for your ${reminder.dosage} dose.`,
              icon: 'https://ui-avatars.com/api/?name=HC&background=10b981&color=fff'
            });
          }
        }
      });
    };

    const interval = setInterval(checkReminders, 1000); // Check precisely
    return () => clearInterval(interval);
  }, [profile, reminders]);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    let mounted = true;

    const checkUser = async (currSession: any) => {
      if (!mounted) return;
      
      if (!currSession?.user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        // First check Firebase for profile
        const p = await firebaseService.getProfile(currSession.user.id);
        if (mounted) {
          if (p && (p as any).onboarded) {
            setProfile(p as UserProfile);
            
            // Also fetch reminders globally
            const reminderData = await firebaseService.getReminders(currSession.user.id);
            setReminders(reminderData as Reminder[]);
          } else {
            setProfile(null);
          }
        }
      } catch (err) {
        console.error("Profile fetch error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    // Safety timeout: Ensure loading finishes within 12 seconds no matter what
    const safetyTimeout = setTimeout(() => {
      if (mounted) {
        console.log("[AUTH DEBUG] Loading timed out, showing current state...");
        setLoading(false);
      }
    }, 12000);

    // Listen for auth changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (mounted) {
        if (user) {
          const sessionData = { user: { id: user.uid, email: user.email } };
          setSession(sessionData);
          checkUser(sessionData);
        } else {
          setSession(null);
          setProfile(null);
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setProfile(null);
      setSession(null);
      localStorage.clear();
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const handleAuthSuccess = (p: UserProfile) => {
    setProfile(p);
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce delay-75" />
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce delay-150" />
          </div>
          <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold animate-pulse">Syncing Secure Bridge...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <LoginPage onAuthSuccess={handleAuthSuccess} session={session} lang={lang} />;
  }

  return (
    <Router>
      <div className="flex h-screen w-screen bg-slate-100 overflow-hidden font-sans text-[13px] selection:bg-emerald-500/20">
        <Sidebar profile={profile} onLogout={handleLogout} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} lang={lang} setLang={setLang} />
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          <Routes>
            <Route path="/" element={<HomePage profile={profile} reminders={reminders} setReminders={setReminders} setProfile={setProfile} onMenuClick={() => setMobileOpen(true)} lang={lang} />} />
            <Route path="/blogs" element={<BlogsPage profile={profile} onMenuClick={() => setMobileOpen(true)} lang={lang} />} />
            <Route path="/chat/:chatId" element={<ChatRoom profile={profile} />} />
            <Route path="/about" element={<AboutPage onMenuClick={() => setMobileOpen(true)} lang={lang} />} />
            <Route path="/drugs" element={<DrugGuidePage onMenuClick={() => setMobileOpen(true)} lang={lang} />} />
            <Route path="/doctors" element={<FindDoctorPage profile={profile} onMenuClick={() => setMobileOpen(true)} lang={lang} />} />
            <Route path="/stores" element={<MedicalStoresPage profile={profile} onMenuClick={() => setMobileOpen(true)} lang={lang} />} />
            <Route path="/labs" element={<LabsPage profile={profile} onMenuClick={() => setMobileOpen(true)} lang={lang} />} />
            <Route path="/reports" element={<MedicalReportsPage profile={profile} onMenuClick={() => setMobileOpen(true)} lang={lang} />} />
            <Route path="/appointments" element={<PatientAppointmentsPage profile={profile} onMenuClick={() => setMobileOpen(true)} lang={lang} />} />
            <Route path="/patient-orders" element={<PatientOrdersPage profile={profile} onMenuClick={() => setMobileOpen(true)} lang={lang} />} />
            <Route path="/patient-labs" element={<PatientLabBookingsPage profile={profile} onMenuClick={() => setMobileOpen(true)} lang={lang} />} />
            <Route path="/store-orders" element={<StoreOrdersPage profile={profile} onMenuClick={() => setMobileOpen(true)} lang={lang} />} />
            <Route path="/lab-bookings" element={<LabBookingsQueuePage profile={profile} onMenuClick={() => setMobileOpen(true)} lang={lang} />} />
            <Route path="/doctor-appointments" element={<DoctorAppointmentsPage profile={profile} onMenuClick={() => setMobileOpen(true)} lang={lang} />} />
            <Route path="/ask-bot" element={<AskBotPage onMenuClick={() => setMobileOpen(true)} lang={lang} />} />
            <Route path="/example" element={<ExamplePage />} />
          </Routes>
          <Footer />
        </main>
      </div>
    </Router>
  );
}
