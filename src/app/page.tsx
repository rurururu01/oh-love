'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [createdUrl, setCreatedUrl] = useState('');
  
  const [formData, setFormData] = useState({
    senderName: '',
    recipientName: '',
    content: '',
    musicUrl: '',
    imageUrl: '',
  });

  const generateSlug = () => Math.random().toString(36).substring(2, 8);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const slug = generateSlug();

    const { error } = await supabase
      .from('letters')
      .insert([
        {
          slug,
          sender_name: formData.senderName,
          recipient_name: formData.recipientName,
          content: formData.content,
          music_url: formData.musicUrl,
          image_url: formData.imageUrl,
        }
      ]);

    setLoading(false);

    if (error) {
      alert('Gagal membuat surat: ' + error.message);
    } else {
      const baseUrl = window.location.origin;
      setCreatedUrl(`${baseUrl}/letter/${slug}`);
    }
  };

  return (
    <main className="min-h-screen bg-pink-50 flex items-center justify-center p-4 selection:bg-pink-300">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-white rounded-3xl shadow-xl overflow-hidden"
      >
        <div className="bg-red-400 p-8 text-center">
          <h1 className="text-3xl font-serif text-white mb-2">Digital Love Letters</h1>
          <p className="text-red-100 text-sm">Send a piece of your heart across the web.</p>
        </div>

        {createdUrl ? (
          <div className="p-8 text-center">
            <div className="text-5xl mb-4">💌</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Suratmu Siap Dikirim!</h3>
            <p className="text-gray-600 mb-6 text-sm">Copy link di bawah ini dan bagikan ke dia.</p>
            
            <div className="bg-gray-100 p-3 rounded-lg break-all border border-gray-200 text-sm font-mono text-gray-800 mb-4 selection:bg-blue-200">
              {createdUrl}
            </div>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(createdUrl);
                  alert('Tersalin ke clipboard!');
                }}
                className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-medium transition-colors shadow-md shadow-red-500/30"
              >
                Copy Link
              </button>

              <a 
                href={`https://wa.me/?text=${encodeURIComponent(`Ada surat cinta digital untukmu dari ${formData.senderName}! 💌 Buka di sini: ${createdUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-medium transition-colors shadow-md shadow-green-500/30 flex items-center justify-center gap-2"
              >
                Kirim via WhatsApp
              </a>
            </div>

            <button onClick={() => setCreatedUrl('')} className="mt-6 text-sm text-gray-500 hover:text-gray-800 w-full text-center">
              Buat surat lagi
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Dari</label>
                <input required type="text" placeholder="Namamu" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-400 focus:border-transparent outline-none transition-all"
                  value={formData.senderName} onChange={e => setFormData({...formData, senderName: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Untuk</label>
                <input required type="text" placeholder="Namanya" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-400 focus:border-transparent outline-none transition-all"
                  value={formData.recipientName} onChange={e => setFormData({...formData, recipientName: e.target.value})} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Pesanmu</label>
              <textarea required rows={5} placeholder="Tuliskan perasaanmu di sini..." className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-400 focus:border-transparent outline-none transition-all resize-none"
                value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">URL Musik (Opsional)</label>
                <input type="url" placeholder="https://.../song.mp3" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-400 focus:border-transparent outline-none transition-all text-sm"
                  value={formData.musicUrl} onChange={e => setFormData({...formData, musicUrl: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">URL Foto (Opsional)</label>
                <input type="url" placeholder="https://.../photo.jpg" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-400 focus:border-transparent outline-none transition-all text-sm"
                  value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} />
              </div>
            </div>

            <button 
              disabled={loading}
              type="submit" 
              className="w-full bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white py-4 rounded-xl font-semibold text-lg transition-colors mt-2 shadow-lg shadow-red-500/30 flex justify-center items-center gap-2"
            >
              {loading ? 'Menyegel Surat...' : 'Segel & Buat Link'}
            </button>
          </form>
        )}
      </motion.div>
    </main>
  );
}
