'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import imageCompression from 'browser-image-compression';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [createdUrl, setCreatedUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState({
    senderName: '',
    recipientName: '',
    recipientWa: [''],
    content: '',
    musicUrl: '',
    imageUrl: '',
  });

  const generateSlug = () => Math.random().toString(36).substring(2, 8);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const slug = generateSlug();
    let finalImageUrl = formData.imageUrl;

    if (imageFile) {
      setLoading(true);
      
      try {
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1200,
          useWebWorker: true,
          initialQuality: 0.8
        };
        const compressedFile = await imageCompression(imageFile, options);

        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${slug}-${Date.now()}.${fileExt}`;
        
        const { data, error: uploadError } = await supabase.storage
          .from('images')
          .upload(fileName, compressedFile);
          
        if (uploadError) {
          alert('Gagal mengunggah foto: ' + uploadError.message);
          setLoading(false);
          return;
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from('images')
          .getPublicUrl(fileName);
          
        finalImageUrl = publicUrl;
      } catch (error) {
        alert('Gagal memproses foto: ' + (error as Error).message);
        setLoading(false);
        return;
      }
    }

    const { error } = await supabase
      .from('letters')
      .insert([
        {
          slug,
          sender_name: formData.senderName,
          recipient_name: formData.recipientName,
          content: formData.content,
          music_url: formData.musicUrl,
          image_url: finalImageUrl,
        }
      ]);

    if (!error) {
      const baseUrl = window.location.origin;
      const letterUrl = `${baseUrl}/letter/${slug}`;
      setCreatedUrl(letterUrl);
      
      // Kirim WA via API secara otomatis jika nomor diisi
      const validNumbers = formData.recipientWa.filter(num => num.trim() !== '');
      if (validNumbers.length > 0) {
        try {
          await fetch('/api/send-wa', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              target: validNumbers.join(','), // Gabungkan nomor dengan koma
              message: `Ada surat cinta digital untukmu dari ${formData.senderName}! 💌 Buka di sini: ${letterUrl}`
            })
          });
        } catch (err) {
          console.error(`Gagal mengirim WA otomatis`, err);
        }
      }
    } else {
      alert('Gagal membuat surat: ' + error.message);
    }
    
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-sky-50 flex items-center justify-center p-4 sm:p-8 selection:bg-blue-200">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-white rounded-3xl shadow-xl overflow-hidden"
      >
        <div className="relative p-8 text-center sm:p-10 overflow-hidden bg-blue-900">
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-50 mix-blend-overlay"
            style={{ backgroundImage: "url('/kkn-bg.jpg')" }}
          ></div>
          <div className="relative z-10">
            <h1 className="text-3xl sm:text-4xl font-sans font-bold text-white mb-3 leading-tight drop-shadow-lg">Little Message for Tunas Harmoni</h1>
            <p className="text-sky-50 text-sm sm:text-base font-medium drop-shadow-md">Send a piece of your heart</p>
          </div>
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
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white py-3 px-4 rounded-xl font-medium transition-colors shadow-md shadow-blue-500/30"
              >
                Copy Link
              </button>
            </div>


          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Nomor WA Penerima</label>
                {formData.recipientWa.map((wa, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input 
                      required={index === 0} 
                      type="text" 
                      placeholder="Contoh: 081234567890" 
                      className="w-full p-3 bg-green-50 border border-green-200 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-transparent outline-none transition-all text-gray-900 placeholder-gray-400"
                      value={wa} 
                      onChange={e => {
                        const newWa = [...formData.recipientWa];
                        newWa[index] = e.target.value;
                        setFormData({...formData, recipientWa: newWa});
                      }} 
                    />
                    {formData.recipientWa.length > 1 && (
                      <button 
                        type="button"
                        onClick={() => {
                          const newWa = formData.recipientWa.filter((_, i) => i !== index);
                          setFormData({...formData, recipientWa: newWa});
                        }}
                        className="p-3 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors shrink-0 font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                {formData.recipientWa.length < 25 && (
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, recipientWa: [...formData.recipientWa, '']})}
                    className="mt-1 text-sm text-green-600 font-semibold hover:text-green-700 flex items-center gap-1 transition-colors"
                  >
                    + Tambah Nomor ({formData.recipientWa.length}/25)
                  </button>
                )}
                <p className="text-xs text-gray-400 mt-2">Bot akan otomatis mengirimkan link ke nomor-nomor ini.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Dari</label>
                <input required type="text" placeholder="Namamu" className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition-all text-gray-900 placeholder-gray-400"
                  value={formData.senderName} onChange={e => setFormData({...formData, senderName: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Untuk</label>
                <input required type="text" placeholder="Namanya" className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition-all text-gray-900 placeholder-gray-400"
                  value={formData.recipientName} onChange={e => setFormData({...formData, recipientName: e.target.value})} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Pesanmu</label>
              <textarea required rows={5} placeholder="Tuliskan pesanmu di sini..." className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition-all resize-none text-gray-900 placeholder-gray-400 leading-relaxed"
                value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">URL Musik (Opsional)</label>
                <input type="url" placeholder="https://.../song.mp3" className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition-all text-sm text-gray-900 placeholder-gray-400"
                  value={formData.musicUrl} onChange={e => setFormData({...formData, musicUrl: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Foto (Opsional)</label>
                <div className="space-y-2">
                  <input type="file" accept="image/*" className="w-full p-2 bg-white border border-gray-200 rounded-xl text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all"
                    onChange={e => setImageFile(e.target.files?.[0] || null)} />
                  <p className="text-xs text-gray-400 text-center font-medium">ATAU paste URL gambar:</p>
                  <input type="url" placeholder="https://.../photo.jpg" className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition-all text-sm text-gray-900 placeholder-gray-400 disabled:opacity-50 disabled:bg-gray-100"
                    value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} disabled={!!imageFile} />
                </div>
              </div>
            </div>

            <button 
              disabled={loading}
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 disabled:from-blue-300 disabled:to-cyan-300 text-white py-4 rounded-xl font-semibold text-lg transition-colors mt-6 shadow-lg shadow-blue-500/30 flex justify-center items-center gap-2"
            >
              {loading ? 'Menyegel Surat...' : 'Segel & Buat Link'}
            </button>
          </form>
        )}
      </motion.div>
    </main>
  );
}
