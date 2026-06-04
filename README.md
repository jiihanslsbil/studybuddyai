📚 Study Buddy - AI Learning Assistant
Study Buddy adalah platform web cerdas yang membantu pelajar mengoptimalkan waktu belajar mereka. Dengan memanfaatkan kecerdasan buatan, aplikasi ini dapat merangkum materi yang tebal, menghasilkan kuis interaktif secara otomatis, dan menyusun jadwal belajar yang terstruktur.


🌟 Fitur Utama
1. Smart Material Summarizer: Ekstraksi informasi dan ringkasan otomatis dari dokumen PDF/TXT. AI juga bertugas menjelaskan konsep yang rumit menjadi bahasa yang sederhana.
2. Quiz & Flashcard Generator: Pembuatan soal pilihan ganda, benar/salah, essay, dan flashcard secara instan langsung dari materi yang diunggah.
3. Smart Study Planner: Penjadwalan belajar dinamis berbasis AI yang menyesuaikan dengan waktu luang dan tenggat waktu ujian pengguna.
4. Secure Authentication: Sistem login dan pendaftaran dengan enkripsi sandi untuk menjaga privasi data belajar pengguna.

🛠️Tech Stack

Frontend: React + Vite + Tailwind CSS

Backend: Node.js + Express

Database: Supabase (PostgreSQL)

AI: Groq API (llama3-8b-8192)

⚙️Setup
1. Supabase
  Buat project di supabase.com
   Buka SQL Editor, jalankan isi file backend/supabase_schema.sql
  Salin URL dan API keys dari Settings > API
2. Groq API
   Daftar di console.groq.com
  Buat API key baru

🚀 Panduan Instalasi (Development)
1. Clone repository ini ke mesin lokal kamu menggunakan perintah git clone.
2. Buka terminal dan masuk ke direktori frontend. Jalankan npm install untuk mengunduh seluruh dependensi antarmuka pengguna.
3. Buka terminal baru dan masuk ke direktori backend. Buat virtual environment dan jalankan pip install -r requirements.txt.
4. Salin file .env.example menjadi .env di folder backend, lalu masukkan API Key AI yang digunakan (misalnya OpenAI API Key) serta kredensial database kamu.
5. Jalankan server backend dan frontend secara bersamaan untuk memulai proses development.

1. Backend
```
cd backend
cp .env.example .env
# Edit .env dengan credentials kamu
npm install
npm run dev
```
```
2. Frontend
cd frontend
npm install
npm run dev
```

📲Akses
https://studybuddyai-teal.vercel.app/
