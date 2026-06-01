# Study Buddy - AI Learning Assistant

Web app untuk mahasiswa dengan 3 fitur utama berbasis AI (Groq).

## Tech Stack
- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: Supabase (PostgreSQL)
- **AI**: Groq API (llama3-8b-8192)

## Setup

### 1. Supabase
1. Buat project di [supabase.com](https://supabase.com)
2. Buka SQL Editor, jalankan isi file `backend/supabase_schema.sql`
3. Salin URL dan API keys dari Settings > API

### 2. Groq API
1. Daftar di [console.groq.com](https://console.groq.com)
2. Buat API key baru

### 3. Backend
```bash
cd backend
cp .env.example .env
# Edit .env dengan credentials kamu
npm install
npm run dev
```

### 4. Frontend
```bash
cd frontend
npm install
npm run dev
```

## Akses
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## Fitur
1. **Smart Material Summarizer** - Upload PDF/TXT, AI merangkum otomatis
2. **Quiz & Flashcard Generator** - Generate soal dari materi
3. **Smart Study Planner** - Jadwal belajar otomatis berbasis AI
4. **Auth** - Login/Register dengan username & password
