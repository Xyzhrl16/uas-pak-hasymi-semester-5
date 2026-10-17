import React, { useState } from 'react';
import {
  Bot,
  Sparkles,
  Send,
  Calculator,
  Wheat,
  Scale,
  Lightbulb,
  MessageSquare,
  HelpCircle,
  TrendingUp,
  ShieldCheck,
  Check,
  Copy,
} from 'lucide-react';
import { BusinessProfile, GrainStock, Product } from '../types';
import { formatRupiah, formatWeight } from '../services/storage';

interface AiAssistantTabProps {
  profile: BusinessProfile;
  grainStock: GrainStock;
  products: Product[];
}

export const AiAssistantTab: React.FC<AiAssistantTabProps> = ({
  profile,
  grainStock,
  products,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'calculator' | 'chat'>('calculator');

  // Calculator inputs
  const [calcGrainType, setCalcGrainType] = useState('Gabah Kering Panen (GKP)');
  const [calcMoisture, setCalcMoisture] = useState<number>(19.5);
  const [calcMarketRicePrice, setCalcMarketRicePrice] = useState<number>(14500);
  const [calcMillingCost, setCalcMillingCost] = useState<number>(750);
  const [calcBranPrice, setCalcBranPrice] = useState<number>(4500);
  const [calcTargetMarginPercent, setCalcTargetMarginPercent] = useState<number>(12);

  // Live calculation results
  const [isCalcLoading, setIsCalcLoading] = useState(false);
  const [calcResult, setCalcResult] = useState<{
    maxPurchasePrice: number;
    projectedRiceKgPerTon: number;
    projectedBranKgPerTon: number;
    explanation: string;
  } | null>(null);

  // Chat consultant state
  const [chatPrompt, setChatPrompt] = useState('');
  const [chatMessages, setChatMessages] = useState<
    { sender: 'user' | 'ai'; text: string; time: string }[]
  >([
    {
      sender: 'ai',
      text: `Halo! Saya Asisten AI Penggilingan Padi & Beras ${profile.name}.
Saya siap membantu Anda menghitung batas aman harga beli gabah, rekomendasi rafaksi mutu gabah, solusi mesin polisher beras patah, hingga pembuatan draf pesan pelanggan.

Silakan pilih topik cepat di bawah atau ajukan pertanyaan spesifik Anda!`,
      time: 'Baru saja',
    },
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const quickChips = [
    'Kenapa beras banyak patah dan menir saat giling?',
    'Berapa batas potongan rafaksi adil untuk gabah basah KA 22%?',
    'Lebih untung mana: Upah tunai Rp 600/kg atau ambil dedak (bawon)?',
    'Tips menyetel jarak rubber roll & saringan polisher',
    'Draf WhatsApp penagihan kasbon beras yang ramah dan sopan',
  ];

  // Handle calculator submit
  const handleRunCalculator = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCalcLoading(true);

    try {
      // Local mathematical base calculation:
      // Rendemen estimasi beras: 64% - (excess moisture * 0.5)
      const excessMoisture = Math.max(0, calcMoisture - 14.0);
      const estRiceRendemen = Math.max(55, Math.min(66, 64 - excessMoisture * 0.45));
      const estBranRendemen = 9.0;

      // Revenue per 1 kg gabah = (estRiceRendemen% * market rice price) + (estBranRendemen% * bran price)
      const revenuePerKgGabah =
        (estRiceRendemen / 100) * calcMarketRicePrice + (estBranRendemen / 100) * calcBranPrice;

      // Deduct milling & drying cost
      const netRevenueBeforeMargin = revenuePerKgGabah - calcMillingCost;

      // Max purchase price = netRevenue / (1 + targetMargin%)
      const maxPrice = Math.round(netRevenueBeforeMargin / (1 + calcTargetMarginPercent / 100));

      // Call AI to provide expert commentary
      const prompt = `Analisis kelayakan pembelian gabah:
- Jenis Gabah: ${calcGrainType}
- Kadar Air: ${calcMoisture}% (Standar SNI GKG 14%)
- Harga Jual Beras Pasar: Rp ${calcMarketRicePrice}/kg
- Harga Dedak/Katul: Rp ${calcBranPrice}/kg
- Biaya Operasional (giling + jemur): Rp ${calcMillingCost}/kg
- Target Keuntungan: ${calcTargetMarginPercent}%
- Hasil hitungan matematis batas beli aman: Rp ${maxPrice}/kg.

Berikan penjelasan singkat (maksimal 2 paragraf) tentang resiko susut bobot gabah jenis ini dan saran negosiasi harga terbaik ke petani agar saling menguntungkan.`;

      const res = await fetch('/api/ai/rice-consultant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();

      setCalcResult({
        maxPurchasePrice: maxPrice,
        projectedRiceKgPerTon: Math.round(estRiceRendemen * 10),
        projectedBranKgPerTon: Math.round(estBranRendemen * 10),
        explanation:
          data.text ||
          `Batas aman harga beli gabah adalah Rp ${maxPrice}/kg. Dengan kadar air ${calcMoisture}%, susut bobot setelah penjemuran diproyeksikan berkisar ${(
            excessMoisture * 1.1
          ).toFixed(1)}%. Pastikan menerapkan potongan rafaksi yang sepadan saat menimbang.`,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsCalcLoading(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || chatPrompt;
    if (!text.trim() || isChatLoading) return;

    const userMsg = {
      sender: 'user' as const,
      text: text.trim(),
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatPrompt('');
    setIsChatLoading(true);

    try {
      const context = {
        namaKilang: profile.name,
        stokGudangGabah: grainStock,
        daftarProduk: products.map((p) => ({ nama: p.name, harga: p.pricePerUnit, stok: p.stockUnit })),
      };

      const res = await fetch('/api/ai/rice-consultant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text, context }),
      });

      const data = await res.json();
      const aiReply =
        data.text ||
        'Maaf, terjadi kendala saat menghubungi asisten AI. Silakan coba kembali sesaat lagi.';

      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: aiReply,
          time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (e) {
      console.error(e);
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: 'Terjadi gangguan jaringan saat menghubungi server AI. Silakan ulangi pertanyaan Anda.',
          time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleCopyText = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-5 rounded-2xl shadow-md border border-slate-700 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-emerald-500 flex items-center justify-center text-slate-950 shadow-lg">
            <Bot className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">Asisten AI Operasional Penggilingan Padi</h2>
              <span className="text-[10px] font-semibold bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full">
                Gemini 3.8 Flash
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Konsultan cerdas agribisnis: kalkulator rendemen, batas harga beli gabah, kendali mutu rafaksi, dan solusi
              mesin penggilingan.
            </p>
          </div>
        </div>

        <div className="flex bg-slate-800/90 p-1 rounded-xl text-xs font-semibold border border-slate-700 self-start md:self-auto">
          <button
            onClick={() => setActiveSubTab('calculator')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-colors ${
              activeSubTab === 'calculator'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            Kalkulator Batas Harga Beli
          </button>
          <button
            onClick={() => setActiveSubTab('chat')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-colors ${
              activeSubTab === 'chat'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Konsultasi AI Langsung
          </button>
        </div>
      </div>

      {/* Mode 1: Safe Purchase Price & Rendemen Simulator */}
      {activeSubTab === 'calculator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Input Parameters */}
          <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
            <h3 className="font-bold text-sm text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Scale className="w-4 h-4 text-amber-600" />
              Parameter Simulasi Pembelian Gabah
            </h3>

            <form onSubmit={handleRunCalculator} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Kategori Gabah</label>
                  <select
                    value={calcGrainType}
                    onChange={(e) => setCalcGrainType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="Gabah Kering Panen (GKP)">Gabah Kering Panen (GKP)</option>
                    <option value="Gabah Kering Giling (GKG)">Gabah Kering Giling (GKG)</option>
                    <option value="Gabah Basah Panen Sawah">Gabah Basah Panen Sawah</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Kadar Air Uji (% Tester)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="11"
                      max="32"
                      value={calcMoisture}
                      onChange={(e) => setCalcMoisture(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                      required
                    />
                    <span className="absolute right-3 top-2 text-slate-400">%</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Harga Jual Beras di Pasar</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="100"
                      value={calcMarketRicePrice}
                      onChange={(e) => setCalcMarketRicePrice(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                      required
                    />
                    <span className="absolute right-3 top-2 text-slate-400">Rp/kg</span>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Harga Jual Dedak/Katul Super</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="100"
                      value={calcBranPrice}
                      onChange={(e) => setCalcBranPrice(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                      required
                    />
                    <span className="absolute right-3 top-2 text-slate-400">Rp/kg</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Biaya Giling & Jemur per Kg Gabah
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="50"
                      value={calcMillingCost}
                      onChange={(e) => setCalcMillingCost(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                      required
                    />
                    <span className="absolute right-3 top-2 text-slate-400">Rp/kg</span>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Target Margin Laba Kilang</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="1"
                      min="5"
                      max="35"
                      value={calcTargetMarginPercent}
                      onChange={(e) => setCalcTargetMarginPercent(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                      required
                    />
                    <span className="absolute right-3 top-2 text-slate-400">%</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isCalcLoading}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50"
              >
                <Sparkles className={`w-4 h-4 ${isCalcLoading ? 'animate-spin' : ''}`} />
                <span>{isCalcLoading ? 'Menghitung dengan AI...' : 'Hitung Batas Aman Harga Beli Gabah'}</span>
              </button>
            </form>
          </div>

          {/* Right: Calculation Results & AI Commentary */}
          <div className="lg:col-span-6 space-y-4">
            {calcResult ? (
              <div className="bg-white rounded-xl border border-slate-200 shadow-md p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Rekomendasi Batas Beli Aman (Anti-Rugi)
                  </span>
                  <span className="text-[11px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                    Margin Target: {calcTargetMarginPercent}%
                  </span>
                </div>

                {/* Main Price Recommendation */}
                <div className="bg-gradient-to-br from-amber-50 to-emerald-50 p-4 rounded-xl border border-amber-200 text-center">
                  <span className="text-xs text-slate-600 block">Maksimal Harga Beli Gabah Petani:</span>
                  <div className="text-3xl font-black text-slate-900 font-mono mt-1">
                    {formatRupiah(calcResult.maxPurchasePrice)}
                    <span className="text-sm font-semibold text-slate-500"> / kg</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Jika Anda menawar di bawah harga ini, keuntungan kilang Anda akan lebih tebal dari target{' '}
                    {calcTargetMarginPercent}%.
                  </p>
                </div>

                {/* Rendemen per 1 Ton Gabah */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-[11px]">Hasil Beras / 1 Ton Gabah:</span>
                    <strong className="text-base text-emerald-700 font-mono">
                      {formatWeight(calcResult.projectedRiceKgPerTon)}
                    </strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-[11px]">Hasil Dedak / 1 Ton Gabah:</span>
                    <strong className="text-base text-amber-700 font-mono">
                      {formatWeight(calcResult.projectedBranKgPerTon)}
                    </strong>
                  </div>
                </div>

                {/* AI Explanation Commentary */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-1">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                    Ulasan Ahli AI:
                  </div>
                  <p className="whitespace-pre-line text-slate-600">{calcResult.explanation}</p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-8 text-center text-slate-400 space-y-3">
                <Calculator className="w-12 h-12 mx-auto text-slate-300" />
                <h4 className="font-bold text-slate-700 text-sm">Simulasi Batas Beli Gabah Belum Dijalankan</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Isi parameter kadar air dan harga pasar di sebelah kiri, lalu klik &quot;Hitung Batas Aman&quot; untuk
                  mencegah risiko rugi saat fluktuasi panen raya.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mode 2: Chat Consultant with Gemini 3.8 Flash */}
      {activeSubTab === 'chat' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-md overflow-hidden flex flex-col h-[600px]">
          {/* Quick Prompt Chips */}
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2 overflow-x-auto scrollbar-none">
            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 whitespace-nowrap">
              <Lightbulb className="w-3 h-3 text-amber-500" />
              Pertanyaan Cepat:
            </span>
            {quickChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(chip)}
                className="px-2.5 py-1 bg-white hover:bg-amber-100 hover:text-amber-900 hover:border-amber-300 border border-slate-200 rounded-lg text-xs text-slate-700 whitespace-nowrap transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Chat Messages Log */}
          <div className="p-5 flex-1 overflow-y-auto space-y-4 bg-slate-50/50">
            {chatMessages.map((msg, idx) => {
              const isAi = msg.sender === 'ai';
              return (
                <div key={idx} className={`flex gap-3 ${isAi ? 'justify-start' : 'justify-end'}`}>
                  {isAi && (
                    <div className="w-8 h-8 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div className="relative group max-w-2xl">
                    <div
                      className={`p-4 rounded-2xl text-xs leading-relaxed ${
                        isAi
                          ? 'bg-white text-slate-800 border border-slate-200 shadow-xs whitespace-pre-line'
                          : 'bg-emerald-600 text-white rounded-tr-none'
                      }`}
                    >
                      {msg.text}
                    </div>

                    <div
                      className={`text-[10px] text-slate-400 mt-1 flex items-center gap-2 ${
                        isAi ? 'justify-start' : 'justify-end'
                      }`}
                    >
                      <span>{msg.time}</span>
                      {isAi && (
                        <button
                          onClick={() => handleCopyText(msg.text, idx)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-700 flex items-center gap-0.5 transition-opacity"
                        >
                          {copiedIndex === idx ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>{copiedIndex === idx ? 'Tersalin' : 'Salin'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {isChatLoading && (
              <div className="flex gap-3 justify-start items-center">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 animate-spin" />
                </div>
                <div className="bg-white p-3 rounded-2xl border border-slate-200 text-xs text-slate-500 shadow-xs flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                  <span>Asisten AI sedang menyusun jawaban operasional...</span>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input Bar */}
          <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
            <input
              type="text"
              placeholder="Tanyakan masalah rendemen gabah, mesin penggilingan, atau draf pesan WA..."
              value={chatPrompt}
              onChange={(e) => setChatPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!chatPrompt.trim() || isChatLoading}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md flex items-center gap-1.5 transition-transform active:scale-[0.98] disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Kirim</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
