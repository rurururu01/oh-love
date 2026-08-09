'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase, type Letter } from '@/lib/supabase';
import { useParams } from 'next/navigation';
import Envelope from '@/components/Envelope';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause } from 'lucide-react';

export default function LetterPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [letter, setLetter] = useState<Letter | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpened, setIsOpened] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const getSpotifyEmbedUrl = (url: string | null | undefined) => {
    if (!url) return null;
    const match = url.match(/(track|playlist|album)\/([a-zA-Z0-9]+)/);
    if (match) {
      return `https://open.spotify.com/embed/${match[1]}/${match[2]}?utm_source=generator&theme=0`;
    }
    return null;
  };

  useEffect(() => {
    async function fetchLetter() {
      const { data, error } = await supabase
        .from('letters')
        .select('*')
        .eq('slug', slug)
        .single();

      if (!error && data) {
        setLetter(data);
        if (data.music_url && !getSpotifyEmbedUrl(data.music_url)) {
          audioRef.current = new Audio(data.music_url);
          audioRef.current.loop = true;
        }
      }
      setLoading(false);
    }
    fetchLetter();

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [slug]);

  const handleStartOpening = () => {
    if (audioRef.current) {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(e => console.log('Audio play failed', e));
    }
  };

  const handleOpenLetter = () => {
    setIsOpened(true);
  };

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-pink-50 text-red-400">Loading heartbeats...</div>;
  }

  if (!letter) {
    return <div className="min-h-screen flex items-center justify-center bg-pink-50 text-gray-500">Surat tidak ditemukan atau sudah usang.</div>;
  }

  const spotifyEmbedUrl = letter ? getSpotifyEmbedUrl(letter.music_url) : null;
  const isMp3 = letter && letter.music_url && !spotifyEmbedUrl;

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 flex flex-col items-center justify-center p-4 sm:p-8 overflow-hidden relative selection:bg-emerald-200">
      
      {isMp3 && isOpened && (
        <button 
          onClick={toggleAudio}
          className="fixed top-6 right-6 z-50 bg-white/80 backdrop-blur-md p-3 rounded-full shadow-lg text-emerald-600 hover:bg-white transition-all"
        >
          {isPlaying ? <Pause size={24} /> : <Play size={24} />}
        </button>
      )}

      <AnimatePresence mode="wait">
        {!isOpened ? (
          <motion.div
            key="envelope"
            exit={{ opacity: 0, scale: 0.8, y: 100 }}
            transition={{ duration: 0.5 }}
            className="w-full"
          >
            <div className="text-center mb-8">
              <p className="text-emerald-700/60 uppercase tracking-widest text-sm mb-2">You received a letter</p>
              <p className="text-sm text-emerald-500 animate-pulse font-medium">Tap the envelope to open</p>
            </div>
            <Envelope 
              senderName={letter.sender_name} 
              recipientName={letter.recipient_name} 
              onStartOpen={handleStartOpening}
              onOpen={handleOpenLetter} 
            />
          </motion.div>
        ) : (
          <motion.div
            key="letter-content"
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-full max-w-2xl bg-[#fafffb] rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] p-8 sm:p-12 border border-emerald-100 relative"
          >
            {/* Dekorasi Kertas */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden rounded-2xl pointer-events-none opacity-30" style={{ backgroundImage: 'radial-gradient(#10b981 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
            
            <div className="mb-12 text-center relative z-10">
              <h1 className="text-3xl sm:text-5xl font-serif text-gray-800 mb-4 drop-shadow-sm leading-tight sm:leading-tight">Dearest {letter.recipient_name},</h1>
              <div className="w-24 h-1 bg-emerald-200 mx-auto rounded-full"></div>
            </div>

            {letter.image_url && (
              <div className="mb-10 relative z-10 max-w-md mx-auto group">
                <div className="bg-white p-3 sm:p-4 pb-12 sm:pb-16 shadow-xl rounded-sm transform -rotate-2 group-hover:rotate-0 transition-transform duration-500 border border-gray-100">
                  <img src={letter.image_url} alt="Memory" className="w-full h-auto object-cover rounded-sm" />
                </div>
              </div>
            )}

            <div className="prose prose-emerald max-w-none relative z-10 mt-8 mb-12">
              <p className="text-gray-700 leading-loose font-serif text-lg sm:text-xl whitespace-pre-wrap break-words">
                {letter.content}
              </p>
            </div>

            <div className="mt-16 text-right relative z-10">
              <p className="text-emerald-500 font-serif italic mb-3 text-lg">Yours truly,</p>
              <p className="text-3xl font-serif text-gray-800 font-bold leading-tight">{letter.sender_name}</p>
            </div>

            {spotifyEmbedUrl && (
              <div className="mt-16 pt-8 border-t border-emerald-100 relative z-10">
                <p className="text-xs text-center text-emerald-500 uppercase tracking-widest font-semibold mb-4">Dedicated Song</p>
                <div className="bg-white/50 backdrop-blur p-2 rounded-2xl shadow-sm border border-emerald-50">
                  <iframe 
                    style={{ borderRadius: '12px' }} 
                    src={spotifyEmbedUrl} 
                    width="100%" 
                    height="152" 
                    frameBorder="0" 
                    allowFullScreen={false}
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                    loading="lazy"
                  ></iframe>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
