import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("Starting healthcare.com server...");

const DATA_FILE = path.join(__dirname, "db.json");

// Initial Data
const DEFAULT_DATA = {
  blogs: [
    {
      id: "1",
      title: "Understanding Cardiovascular Health",
      author: "Dr. Sarah Mitchell",
      content: "<h1>Cardiovascular Health</h1><p>Regular cardiovascular exercise is essential for a healthy heart. It helps lower blood pressure, reduce cholesterol levels, and improve overall circulation. Aim for at least 150 minutes of moderate-intensity aerobic activity per week, such as brisk walking, swimming, or cycling.</p><div class='mt-6 p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 text-xs font-bold uppercase'>Clinical Protocol: V4.2</div>",
      date: "2024-04-20T10:00:00Z",
      category: "Heart Health"
    },
    {
      id: "2",
      title: "Neurological Recovery Techniques",
      author: "Dr. Elena Rodriguez",
      content: "<h1>Neurological Recovery</h1><p>Advancements in neuroplasticity are changing how we treat brain injuries and chronic conditions. High-intensity cognitive training combined with motor exercises is showing promising results.</p><div class='mt-6 p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 text-xs font-bold uppercase'>Neuro-Pathway Insight</div>",
      date: "2024-04-21T12:00:00Z",
      category: "Neurology"
    }
  ],
  doctors: [],
  drugs: [
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
  ],
  medicalStores: [],
  labs: [],
  profiles: [],
  reports: [],
  chats: [],
  messages: []
};

// Initialize DB if not exists
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_DATA, null, 2));
}

function readDB() {
  try {
    const content = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(content);
  } catch (e) {
    return DEFAULT_DATA;
  }
}

function writeDB(data: any) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Request logger
  app.use((req, res, next) => {
    console.log(`[SERVER] ${req.method} ${req.url}`);
    next();
  });

  // Health check route
  app.get("/health", (req, res) => {
    res.send("Server is alive");
  });

  // API Routes
  app.get("/auth/callback", (req, res) => {
    res.send(`
      <html>
        <body style="background: #0f172a; color: #94a3b8; font-family: sans-serif; display: flex; items-center: center; justify-content: center; height: 100vh; margin: 0;">
          <div style="text-align: center;">
            <div style="width: 40px; height: 40px; border: 3px solid #10b981; border-top-color: transparent; border-radius: 50%; animate: spin 1s linear infinite; margin: 0 auto 20px;"></div>
            <p style="font-weight: bold; font-size: 14px; letter-spacing: 0.1em; text-transform: uppercase;">Finalizing Clinical Auth...</p>
            <script>
              setTimeout(() => {
                if (window.opener) {
                  window.opener.postMessage({ 
                    type: 'OAUTH_AUTH_SUCCESS', 
                    hash: window.location.hash,
                    search: window.location.search
                  }, '*');
                  window.close();
                } else {
                  window.location.href = '/';
                }
              }, 1000);
            </script>
          </div>
          <style>
            @keyframes spin { to { transform: rotate(360deg); } }
          </style>
        </body>
      </html>
    `);
  });

  app.get("/api/blogs", async (req, res) => {
    const db = readDB();
    res.json(db.blogs);
  });

  app.post("/api/blogs", async (req, res) => {
    const newBlog = {
      ...req.body,
      id: Date.now().toString(),
      date: new Date().toISOString()
    };

    // Fallback/Dual write to local db.json
    const db = readDB();
    db.blogs.unshift(newBlog);
    writeDB(db);
    res.status(201).json(newBlog);
  });

  app.put("/api/blogs/:id", async (req, res) => {
    const updatedBlog = req.body;
    const db = readDB();
    const idx = db.blogs.findIndex((b: any) => b.id === req.params.id);
    if (idx > -1) {
      db.blogs[idx] = { ...db.blogs[idx], ...updatedBlog };
      writeDB(db);
      res.json(db.blogs[idx]);
    } else {
      res.status(404).json({ error: "Blog not found" });
    }
  });

  app.delete("/api/blogs/:id", async (req, res) => {
    const db = readDB();
    db.blogs = db.blogs.filter((b: any) => b.id !== req.params.id);
    writeDB(db);
    res.status(204).send();
  });

  app.get("/api/doctors", async (req, res) => {
    const db = readDB();
    res.json(db.doctors);
  });

  app.get("/api/drugs", async (req, res) => {
    const db = readDB();
    res.json(db.drugs);
  });

  app.get("/api/medical-stores", async (req, res) => {
    const db = readDB();
    res.json(db.medicalStores || []);
  });

  app.get("/api/labs", async (req, res) => {
    const db = readDB();
    res.json(db.labs || []);
  });

  app.get("/api/profiles/:id", async (req, res) => {
    const db = readDB();
    const profile = db.profiles.find((p: any) => p.id === req.params.id);
    res.json(profile || { onboarded: false });
  });

  app.post("/api/profiles", async (req, res) => {
    const db = readDB();
    const idx = db.profiles.findIndex((p: any) => p.id === req.body.id);
    if (idx > -1) db.profiles[idx] = req.body;
    else db.profiles.push(req.body);
    writeDB(db);
    res.json(req.body);
  });

  app.delete("/api/profiles/:id", async (req, res) => {
    console.log(`[SERVER DEBUG] Deleting profile for ID: ${req.params.id}`);
    const db = readDB();
    db.profiles = db.profiles.filter((p: any) => p.id !== req.params.id);
    writeDB(db);
    res.status(204).send();
  });

  app.get("/api/reports", async (req, res) => {
    const db = readDB();
    res.json(db.reports || []);
  });

  app.get("/api/chats", async (req, res) => {
    const userId = req.headers['x-user-id'];
    const db = readDB();
    const userChats = (db.chats || []).filter((c: any) => c.user_id === userId || c.doctor_id === userId);
    res.json(userChats);
  });

  app.post("/api/chats", async (req, res) => {
    const newChat = { ...req.body, id: req.body.id || Date.now().toString(), created_at: new Date().toISOString() };
    const db = readDB();
    db.chats = db.chats || [];
    const idx = db.chats.findIndex((c: any) => c.id === newChat.id);
    if (idx > -1) db.chats[idx] = newChat;
    else db.chats.push(newChat);
    writeDB(db);
    res.json(newChat);
  });

  app.get("/api/messages/:chatId", async (req, res) => {
    const db = readDB();
    const chatMessages = (db.messages || []).filter((m: any) => m.chat_id === req.params.chatId);
    res.json(chatMessages);
  });

  app.post("/api/messages", async (req, res) => {
    const newMessage = { ...req.body, id: Date.now().toString(), created_at: new Date().toISOString() };
    const db = readDB();
    db.messages = db.messages || [];
    db.messages.push(newMessage);
    writeDB(db);
    res.status(201).json(newMessage);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log("Initializing Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: "spa",
    });
    console.log("Vite middleware initialized.");
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`healthcare.com server successfully listening on 0.0.0.0:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  // Global Error Handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("[SERVER ERROR]", err);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  });
}

startServer();
