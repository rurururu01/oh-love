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

  const getSpotifyEmbedUrl = (url: string | null) => {
    if (!url) return null;
    const match = url.match(/spotify\.com\/(track|playlist|album)\/([a-zA-Z0-9]+)/);
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
    <main className="min-h-screen bg-pink-50 flex flex-col items-center justify-center p-4 sm:p-8 overflow-hidden relative">
      
      {isMp3 && isOpened && (
        <button 
          onClick={toggleAudio}
          className="fixed top-6 right-6 z-50 bg-white/80 backdrop-blur-md p-3 rounded-full shadow-lg text-red-500 hover:bg-white transition-all"
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
              <p className="text-gray-500 uppercase tracking-widest text-sm mb-2">You received a letter</p>
              <p className="text-sm text-red-400 animate-pulse">Tap the envelope to open</p>
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
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-full max-w-2xl bg-[#fcf9f2] rounded-md shadow-2xl p-8 sm:p-12 border border-gray-200"
            style={{ backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)', backgroundSize: '24px 24px' }}
          >
            <div className="mb-10 text-center">
              <h1 className="text-3xl sm:text-4xl font-serif text-gray-800 mb-2">Dearest {letter.recipient_name},</h1>
            </div>

            {letter.image_url && (
              <div className="mb-8 rounded-xl overflow-hidden shadow-md max-w-md mx-auto transform -rotate-2 hover:rotate-0 transition-transform duration-300">
                <img src={letter.image_url} alt="Memory" className="w-full h-auto object-cover border-4 border-white" />
              </div>
            )}

            <div className="prose prose-red max-w-none">
              <p className="text-gray-700 leading-relaxed font-serif text-lg whitespace-pre-wrap">
                {letter.content}
              </p>
            </div>

            <div className="mt-16 text-right">
              <p className="text-gray-500 font-serif italic mb-2">Yours truly,</p>
              <p className="text-2xl font-serif text-gray-800 font-bold">{letter.sender_name}</p>
            </div>

            {spotifyEmbedUrl && (
              <div className="mt-12 pt-8 border-t border-red-100">
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
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
