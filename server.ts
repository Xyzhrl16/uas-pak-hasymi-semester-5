import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
const port = 3000;

app.use(express.json());

// Initialize Gemini API client with required User-Agent header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// AI endpoints for Rice Mill & Rice Trading
app.post('/api/ai/rice-consultant', async (req, res) => {
  try {
    const { prompt, context } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt wajib diisi' });
    }

    const systemInstruction = `Anda adalah Asisten Pakar Operasional Usaha Penggilingan Padi (Rice Milling Unit - RMU) dan Tata Niaga Beras di Indonesia.
Keahlian Anda meliputi:
1. Analisis mutu gabah (GKP / GKG, kadar air, kadar hampa/kotoran, butir hijau, butir kapur, butir kuning/rusak, dan perhitungan rafaksi timbangan).
2. Estimasi rendemen giling beras (rendemen normal: 60-65% beras kepala/pecah, 8-10% dedak halus/bekatul, 2-4% menir, 20-25% sekam).
3. Analisis harga beli gabah aman agar penggilingan untung, memperhitungkan ongkos giling, biaya pengeringan (jemur/dryer), dan harga jual beras di pasar.
4. Perbandingan efisiensi skema upah giling (Upah Tunai per kg vs Potong Hasil/Bawon Dedak).
5. Pembuatan draf pesan WhatsApp yang sopan, santun khas budaya agraris Indonesia, untuk penagihan hutang/piutang atau informasi nota timbangan gabah/beras.
6. Berikan jawaban dalam Bahasa Indonesia yang singkat, jelas, padat, berorientasi praktis, dan ramah pengguna (gunakan poin-poin terstruktur).`;

    const fullPrompt = context
      ? `Konteks Data Operasional Saat Ini:
${JSON.stringify(context, null, 2)}

Pertanyaan/Instruksi:
${prompt}`
      : prompt;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: fullPrompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    return res.json({ text: response.text });
  } catch (error: any) {
    console.error('Error calling Gemini API:', error);
    return res.status(500).json({
      error: error?.message || 'Gagal memproses permintaan asisten AI',
      fallback: 'Maaf, terjadi kendala saat menghubungi asisten AI. Silakan gunakan perhitungan manual.',
    });
  }
});

// AI endpoint for intelligent business report narrative
app.post('/api/ai/report-analysis', async (req, res) => {
  try {
    const { summaryData } = req.body;

    const prompt = `Analisis data operasional dan keuangan penggilingan padi berikut:
${JSON.stringify(summaryData, null, 2)}

Buat ringkasan eksekutif singkat (maksimal 3 paragraf pendek) mengenai:
1. Performa penjualan beras & dedak serta jasa giling.
2. Kondisi kas, stok bahan baku (gabah), stok beras & dedak.
3. Kesehatan piutang/kasbon dan saran tindakan efisiensi biaya operasional (solar, listrik, dll).
Gunakan bahasa Indonesia yang profesional, memotivasi, dan mudah dipahami pemilik usaha penggilingan padi desa/kota.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'Anda adalah konsultan keuangan dan operasional agribisnis perberasan.',
        temperature: 0.5,
      },
    });

    return res.json({ analysis: response.text });
  } catch (error: any) {
    console.error('Error generating report analysis:', error);
    return res.status(500).json({
      error: error?.message || 'Gagal menganalisis laporan',
    });
  }
});

// Setup Vite dev server or static files
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, port: 3000, host: '0.0.0.0' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Penggilingan Padi POS Server running at http://0.0.0.0:${port}`);
  });
}

startServer();
