import fs from 'fs';

const drugNames = [
    "Aspirin", "Ibuprofen", "Acetaminophen", "Amoxicillin", "Lisinopril", "Metformin", "Atorvastatin", "Levothyroxine", "Amlodipine", "Metoprolol",
    "Omeprazole", "Simvastatin", "Losartan", "Albuterol", "Gabapentin", "Hydrochlorothiazide", "Sertraline", "Furosemide", "Fluticasone", "Amoxicillin/Clavulanate",
    "Cyclobenzaprine", "Ciprofloxacin", "Pantoprazole", "Zolpidem", "Meloxicam", "Prednisone", "Tramadol", "Tamsulosin", "Duloxetine", "Bupropion",
    "Venlafaxine", "Ranitidine", "Escitalopram", "Oxycodone", "Azithromycin", "Amphetamine/Dextroamphetamine", "Lorazepam", "Allopurinol", "Paroxetine", "Warfarin",
    "Quetiapine", "Montelukast", "Clonazepam", "Clopidogrel", "Glipizide", "Valacyclovir", "Fluconazole", "Carvedilol", "Pregabalin", "Sulfamethoxazole/Trimethoprim",
    "Sildenafil", "Tadalafil", "Citalopram", "Zopiclone", "Diazepam", "Lamotrigine", "Levoxa", "Spironolactone", "Doxycycline", "Naproxen",
    "Fenofibrate", "Oxybutynin", "Atenolol", "Cetirizine", "Metronidazole", "Fluoxetine", "Pravastatin", "Cephalexin", "Trazodone", "Rosuvastatin",
    "Sumatriptan", "Valsartan", "Celecoxib", "Mirtazapine", "Baclofen", "Buspirone", "Hydroxyzine", "Aripiprazole", "Olanzapine", "Topiramate",
    "Finasteride", "Donepezil", "Memantine", "Ondansetron", "Loperamide", "Ranitidine", "Famotidine", "Lansoprazole", "Budesonide", "Advair",
    "Ventolin", "Symbicort", "Januvia", "Victoza", "Lantus", "Humalog", "Novolog", "Metoprolol Succinate", "Ramipril", "Enalapril",
    "Valsartan/HCTZ", "Losartan/HCTZ", "Amlodipine/Valsartan", "Simvastatin/Ezetimibe", "Diltiazem", "Verapamil", "Nifedipine", "Isosorbide", "Nitro", "Hydralazine",
    "Digoxin", "Warfarin", "Rivaroxaban", "Apixaban", "Dabigatran", "Enoxaparin", "Heparin", "Clopidogrel", "Ticagrelor", "Prasugrel",
    "Aspirin", "Ibuprofen", "Naproxen", "Celecoxib", "Diclofenac", "Etodolac", "Indomethacin", "Ketorolac", "Meloxicam", "Nabumetone",
    "Piroxicam", "Sulindac", "Tramadol", "Codeine", "Hydrocodone", "Morphine", "Oxycodone", "Hydromorphone", "Fentanyl", "Methadone",
    "Naltrexone", "Buprenorphine", "Naloxone", "Gabapentin", "Pregabalin", "Baclofen", "Cyclobenzaprine", "Tizanidine", "Methocarbamol", "Carisoprodol"
];

const generatedDrugs = drugNames.map((name, i) => ({
    id: (i + 3).toString(),
    name: name,
    dosing: `${Math.floor(Math.random() * 500) + 10}mg ${['daily', 'twice daily', 'every 8 hours', 'as needed'][Math.floor(Math.random() * 4)]}`,
    indications: "General health management and clinical intervention",
    reactions: "Mild discomfort, nausea, or dizziness",
    usage: "Take as prescribed by your medical professional."
}));

const existingData = JSON.parse(fs.readFileSync('db.json', 'utf-8'));

// Combine with existing 2 drugs
const allDrugs = [
    {
        "id": "1",
        "name": "Paracetamol",
        "dosing": "500mg-1g every 4-6 hours as needed (Max 4g/day)",
        "indications": "Mild to moderate pain, Fever",
        "reactions": "Rarely: Skin rashes, blood disorders, liver damage if overdosed",
        "usage": "Take with water, with or without food. Avoid alcohol."
    },
    {
        "id": "2",
        "name": "Amoxicillin",
        "dosing": "250mg-500mg every 8 hours",
        "indications": "Bacterial infections",
        "reactions": "Diarrhea, nausea, skin rash, allergic reactions",
        "usage": "Complete the full course as prescribed even if symptoms improve."
    },
    ...generatedDrugs
];

const doctors = [
    {
      "id": "1",
      "name": "Dr. James Wilson",
      "specialization": "Cardiologist",
      "experience": "15 years",
      "contact": "james.wilson@healthcare.plus",
      "image": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=200&h=200&fit=crop",
      "availability": "Available Mon-Fri 9 AM - 5 PM",
      "location": "Northside Medical Plaza",
      "lat": 34.0522,
      "lng": -118.2437
    },
    {
      "id": "2",
      "name": "Dr. Elena Rodriguez",
      "specialization": "Neurologist",
      "experience": "12 years",
      "contact": "elena.r@healthcare.plus",
      "image": "https://images.unsplash.com/photo-1594824476967-48c8b964273f?q=80&w=200&h=200&fit=crop",
      "availability": "On Call 24/7",
      "location": "Central Health Institute",
      "lat": 34.0722,
      "lng": -118.2637
    },
    {
      "id": "3",
      "name": "Dr. David Chen",
      "specialization": "Pediatrician",
      "experience": "8 years",
      "contact": "d.chen@healthcare.plus",
      "image": "https://images.unsplash.com/photo-1537368910025-700350fe46c7?q=80&w=200&h=200&fit=crop",
      "availability": "Mon-Wed 8 AM - 4 PM",
      "location": "West Valley Clinic",
      "lat": 34.0122,
      "lng": -118.2937
    }
];

const blogs = [
    {
      "id": "1",
      "title": "Understanding Cardiovascular Health",
      "author": "Dr. Sarah Mitchell",
      "content": "<h1>Cardiovascular Health</h1><p>Regular cardiovascular exercise is essential for a healthy heart...</p><div class='style-tab'>Clinical Protocol: V4.2</div>",
      "date": "2024-04-20T10:00:00Z",
      "category": "Heart Health"
    },
    {
      "id": "2",
      "title": "Mental Wellness in Modern Times",
      "author": "Dr. Alan Grant",
      "content": "<h1>Mental Wellness</h1><p>Modern lifestyles often neglect psychological recovery...</p><div class='style-tab'>Neuro-Psych Registry</div>",
      "date": "2024-04-21T09:00:00Z",
      "category": "Wellness"
    }
];

fs.writeFileSync('db.json', JSON.stringify({ blogs, doctors, drugs: allDrugs }, null, 2));
console.log('Database updated with 150+ drugs and updated doctor locations.');
