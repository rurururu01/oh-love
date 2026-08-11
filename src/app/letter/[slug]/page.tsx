'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase, type Letter } from '@/lib/supabase';
import { useParams } from 'next/navigation';
import Envelope from '@/components/Envelope';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause } from 'lucide-react';
import html2canvas from 'html2canvas';
export default function LetterPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [letter, setLetter] = useState<Letter | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpened, setIsOpened] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const letterRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const getSpotifyEmbedUrl = (url: string | null | undefined) => {
    if (!url) return null;
    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.hostname.includes('spotify.com')) {
        const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
        if (pathParts[0] === 'track' && pathParts[1]) {
          return `https://open.spotify.com/embed/track/${pathParts[1]}?utm_source=generator`;
        }
      }
    } catch (e) {
      // invalid URL
    }
    return null;
  };

  const getYoutubeEmbedUrl = (url: string | null | undefined) => {
    if (!url) return null;
    try {
      let videoId = '';
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const urlObj = new URL(url);
        if (urlObj.hostname.includes('youtu.be')) {
          videoId = urlObj.pathname.slice(1);
        } else {
          videoId = urlObj.searchParams.get('v') || '';
        }
      }
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
      }
    } catch (e) {
      // invalid url
    }
    return null;
  };

  const getYoutubeVideoId = (url: string | null | undefined) => {
    if (!url) return null;
    try {
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const urlObj = new URL(url);
        if (urlObj.hostname.includes('youtu.be')) {
          return urlObj.pathname.slice(1);
        } else {
          return urlObj.searchParams.get('v');
        }
      }
    } catch (e) {}
    return null;
  };

  const getDirectImageUrl = (url: string | null | undefined) => {
    if (!url) return null;
    try {
      // Handle Google Drive links
      const gdriveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (gdriveMatch && gdriveMatch[1]) {
        return `https://drive.google.com/uc?export=view&id=${gdriveMatch[1]}`;
      }
      const gdriveOpenMatch = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
      if (gdriveOpenMatch && gdriveOpenMatch[1]) {
        return `https://drive.google.com/uc?export=view&id=${gdriveOpenMatch[1]}`;
      }
    } catch (e) {
      // invalid URL
    }
    return url;
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
        if (data.music_url && !getSpotifyEmbedUrl(data.music_url) && !getYoutubeEmbedUrl(data.music_url)) {
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

  const handleDownload = async () => {
    if (!letterRef.current) return;
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(letterRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#fafffb',
        ignoreElements: (element) => element.hasAttribute('data-html2canvas-ignore')
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `surat-dari-${letter?.sender_name || 'seseorang'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error downloading image', error);
      alert('Gagal menyimpan gambar surat.');
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-pink-50 text-red-400">Loading heartbeats...</div>;
  }

  if (!letter) {
    return <div className="min-h-screen flex items-center justify-center bg-pink-50 text-gray-500">Surat tidak ditemukan atau sudah usang.</div>;
  }

  const spotifyEmbedUrl = letter ? getSpotifyEmbedUrl(letter.music_url) : null;
  const youtubeEmbedUrl = letter ? getYoutubeEmbedUrl(letter.music_url) : null;
  const isMp3 = letter && letter.music_url && !spotifyEmbedUrl && !youtubeEmbedUrl;
  const displayImageUrl = letter ? getDirectImageUrl(letter.image_url) : null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-50 via-cyan-50 to-blue-50 flex flex-col items-center justify-center p-4 sm:p-8 overflow-hidden relative selection:bg-cyan-200">
      
      {isMp3 && isOpened && (
        <button 
          onClick={toggleAudio}
          className="fixed top-6 right-6 z-50 bg-white/80 backdrop-blur-md p-3 rounded-full shadow-lg text-blue-600 hover:bg-white transition-all"
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
              <p className="text-cyan-700/60 uppercase tracking-widest text-sm mb-2">You received a letter</p>
              <p className="text-sm text-cyan-600 animate-pulse font-medium">Tap the envelope to open</p>
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
            ref={letterRef}
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-full max-w-2xl bg-[#fafffb] rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,100,200,0.1)] p-8 sm:p-12 border border-cyan-100 relative"
          >
            {/* Dekorasi Kertas */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden rounded-2xl pointer-events-none opacity-20" style={{ backgroundImage: 'radial-gradient(#0ea5e9 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
            
            <div className="mb-12 text-center relative z-10">
              <h1 className="text-3xl sm:text-5xl font-sans font-bold text-blue-900 mb-4 drop-shadow-sm leading-tight sm:leading-tight tracking-tight">Dearest {letter.recipient_name},</h1>
              <div className="w-24 h-1 bg-gradient-to-r from-blue-400 to-cyan-300 mx-auto rounded-full"></div>
            </div>

            {displayImageUrl && !imageError && (
              <div className="mb-10 relative z-10 max-w-md mx-auto group">
                <div className="bg-white p-3 sm:p-4 pb-12 sm:pb-16 shadow-xl rounded-sm transform -rotate-2 group-hover:rotate-0 transition-transform duration-500 border border-gray-100">
                  <img src={displayImageUrl} alt="Memory" className="w-full h-auto object-cover rounded-sm" loading="lazy" onError={() => setImageError(true)} />
                </div>
              </div>
            )}

            <div className="prose prose-cyan max-w-none relative z-10 mt-8 mb-12">
              <p className="text-gray-700 leading-loose font-sans font-medium text-lg sm:text-xl whitespace-pre-wrap break-words">
                {letter.content}
              </p>
            </div>

            <div className="mt-16 text-right relative z-10">
              <p className="text-cyan-600 font-sans font-medium mb-3 text-lg">Yours truly,</p>
              <p className="text-3xl font-sans text-blue-900 font-bold leading-tight">{letter.sender_name}</p>
            </div>

            {spotifyEmbedUrl && (
              <div className="mt-10 relative z-10 w-full max-w-sm mx-auto overflow-hidden rounded-xl shadow-lg border border-gray-100 backdrop-blur-md bg-[#282828] flex items-center justify-center min-h-[152px]">
                {/* Fallback for html2canvas */}
                <div className="absolute text-green-500 font-bold flex flex-col items-center">
                   <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.563.387-.857.207-2.35-1.434-5.305-1.76-8.786-.963-.335.077-.67-.133-.746-.47-.077-.334.132-.67.47-.745 3.808-.87 7.076-.496 9.712 1.115.293.18.386.563.207.856zm1.226-2.736c-.226.368-.7.484-1.07.256-2.686-1.65-6.785-2.13-9.965-1.166-.412.126-.84-.106-.966-.518-.126-.412.106-.84.518-.965 3.632-1.103 8.16-.566 11.228 1.32.368.227.484.7.255 1.073zm.135-2.863c-3.21-1.905-8.498-2.08-11.554-1.15-.494.15-1.015-.128-1.166-.622-.15-.494.128-1.014.622-1.165 3.518-1.07 9.356-.867 13.06 1.332.443.262.59.835.328 1.278-.263.443-.836.59-1.29.327z"/></svg>
                   <span className="mt-2 text-sm text-gray-300">Spotify Track</span>
                </div>
                {/* Real iframe, ignored by html2canvas */}
                <iframe 
                  className="rounded-xl w-full relative z-10"
                  src={spotifyEmbedUrl} 
                  width="100%" 
                  height="152" 
                  frameBorder="0" 
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                  loading="lazy"
                  data-html2canvas-ignore="true"
                ></iframe>
              </div>
            )}

            {youtubeEmbedUrl && (
              <div className="mt-10 relative z-10 w-full max-w-sm mx-auto overflow-hidden rounded-xl shadow-lg border border-gray-100 bg-gray-900">
                <div className="relative pb-[56.25%] h-0">
                  {/* Thumbnail for html2canvas */}
                  <img 
                    src={`https://img.youtube.com/vi/${getYoutubeVideoId(letter.music_url)}/hqdefault.jpg`} 
                    className="absolute top-0 left-0 w-full h-full object-cover opacity-80"
                    alt="YouTube Thumbnail" 
                    crossOrigin="anonymous"
                  />
                  {/* Real iframe, ignored by html2canvas */}
                  <iframe 
                    src={youtubeEmbedUrl}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                    className="absolute top-0 left-0 w-full h-full"
                    data-html2canvas-ignore="true"
                  ></iframe>
                </div>
              </div>
            )}

            <div className="mt-12 flex justify-center w-full relative z-10" data-html2canvas-ignore="true">
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="bg-cyan-600 hover:bg-cyan-700 text-white py-3 px-8 rounded-full shadow-lg font-medium text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isDownloading ? 'Menyimpan...' : '📸 Simpan Surat (Gambar)'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
