'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase, type Letter } from '@/lib/supabase';
import { useParams } from 'next/navigation';
import Envelope from '@/components/Envelope';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
export default function LetterPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [letter, setLetter] = useState<Letter | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpened, setIsOpened] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [musicTitle, setMusicTitle] = useState<string | null>(null);
  const [musicThumbnail, setMusicThumbnail] = useState<string | null>(null);
  const [proxiedImageUrl, setProxiedImageUrl] = useState<string | null>(null);
  
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
        if (data.music_url) {
          if (!getSpotifyEmbedUrl(data.music_url) && !getYoutubeEmbedUrl(data.music_url)) {
            audioRef.current = new Audio(data.music_url);
            audioRef.current.loop = true;
          } else {
            try {
              const res = await fetch(`/api/oembed?url=${encodeURIComponent(data.music_url)}`);
              if (res.ok) {
                const oembedData = await res.json();
                if (oembedData.title) setMusicTitle(oembedData.title);
                if (oembedData.thumbnail_base64) setMusicThumbnail(oembedData.thumbnail_base64);
              }
            } catch (e) {
              console.error('Failed to fetch music title', e);
            }
          }
        }
        
        const directImg = getDirectImageUrl(data.image_url);
        if (directImg) {
          try {
            const res = await fetch(`/api/image-proxy?url=${encodeURIComponent(directImg)}`);
            if (res.ok) {
              const proxyData = await res.json();
              if (proxyData.base64) {
                setProxiedImageUrl(proxyData.base64);
              } else {
                setProxiedImageUrl(directImg);
              }
            } else {
              setProxiedImageUrl(directImg);
            }
          } catch (e) {
            console.error('Failed to proxy image', e);
            setProxiedImageUrl(directImg);
          }
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
      // Small delay to ensure any layout shifts are done
      await new Promise(resolve => setTimeout(resolve, 100));
      const dataUrl = await htmlToImage.toPng(letterRef.current, {
        cacheBust: true,
        backgroundColor: '#fafffb',
        pixelRatio: 2,
        filter: (node) => {
          const el = node as HTMLElement;
          return !el.hasAttribute?.('data-html2canvas-ignore');
        }
      });

      // Create an image element from the captured data URL
      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      // Calculate 9:16 dimensions
      const targetRatio = 9 / 16;
      const imgRatio = img.width / img.height;
      
      let canvasWidth = img.width;
      let canvasHeight = img.height;

      if (imgRatio > targetRatio) {
        // Image is wider than 9:16 (too short), so we increase height
        canvasHeight = img.width / targetRatio;
      } else {
        // Image is taller than 9:16 (too long), so we increase width
        canvasWidth = img.height * targetRatio;
      }

      // Create a canvas with the 9:16 dimensions
      const canvas = document.createElement('canvas');
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      // Draw background (matching the website's gradient colors roughly)
      const gradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
      gradient.addColorStop(0, '#f0f9ff'); // sky-50
      gradient.addColorStop(0.5, '#ecfeff'); // cyan-50
      gradient.addColorStop(1, '#eff6ff'); // blue-50
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Draw the captured image centered on the new canvas
      const x = (canvasWidth - img.width) / 2;
      const y = (canvasHeight - img.height) / 2;
      ctx.drawImage(img, x, y);

      const finalDataUrl = canvas.toDataURL('image/png');

      const link = document.createElement('a');
      link.download = `surat-dari-${letter?.sender_name || 'seseorang'}.png`;
      link.href = finalDataUrl;
      link.click();
    } catch (error) {
      console.error('Error downloading image', error);
      alert('Gagal menyimpan gambar surat. Coba screenshot manual jika masih error.');
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
            className="w-full max-w-2xl bg-[#fafffb] rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,100,200,0.1)] p-6 sm:p-8 border border-cyan-100 relative"
          >
            {/* Dekorasi Kertas */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden rounded-2xl pointer-events-none opacity-20" style={{ backgroundImage: 'radial-gradient(#0ea5e9 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
            
            <div className="mb-6 text-center relative z-10">
              <h1 className="text-2xl sm:text-4xl font-sans font-bold text-blue-900 mb-2 drop-shadow-sm leading-tight sm:leading-tight tracking-tight">Dearest {letter.recipient_name},</h1>
              <div className="w-24 h-1 bg-gradient-to-r from-blue-400 to-cyan-300 mx-auto rounded-full"></div>
            </div>

            {displayImageUrl && !imageError && (
              <div className="mb-6 relative z-10 max-w-sm mx-auto group">
                <div className="bg-white p-3 sm:p-4 pb-8 sm:pb-10 shadow-xl rounded-sm transform -rotate-2 group-hover:rotate-0 transition-transform duration-500 border border-gray-100">
                  <img src={proxiedImageUrl || displayImageUrl} alt="Memory" className="w-full h-auto object-cover rounded-sm" loading="lazy" onError={() => setImageError(true)} />
                </div>
              </div>
            )}

            <div className="prose prose-cyan max-w-none relative z-10 mt-6 mb-6">
              <p className="text-gray-700 leading-relaxed font-sans font-medium text-base sm:text-lg whitespace-pre-wrap break-words">
                {letter.content}
              </p>
            </div>

            <div className="mt-8 text-right relative z-10">
              <p className="text-cyan-600 font-sans font-medium mb-1 text-base">Yours truly,</p>
              <p className="text-2xl font-sans text-blue-900 font-bold leading-tight">{letter.sender_name}</p>
            </div>

            {spotifyEmbedUrl && (
              <div className="mt-6 relative z-10 w-full max-w-sm mx-auto overflow-hidden rounded-xl shadow-lg border border-gray-100 backdrop-blur-md bg-[#282828] min-h-[152px]">
                {/* Fallback for html-to-image */}
                <div className="absolute inset-0 bg-[#282828] z-0 p-3 flex flex-col justify-between overflow-hidden">
                  <div className="flex items-center gap-3">
                    {musicThumbnail ? (
                      <img src={musicThumbnail} alt="Album Art" className="w-14 h-14 rounded object-cover shadow-sm" crossOrigin="anonymous" />
                    ) : (
                      <div className="w-14 h-14 bg-[#1a1a1a] rounded flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-gray-500"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.563.387-.857.207-2.35-1.434-5.305-1.76-8.786-.963-.335.077-.67-.133-.746-.47-.077-.334.132-.67.47-.745 3.808-.87 7.076-.496 9.712 1.115.293.18.386.563.207.856zm1.226-2.736c-.226.368-.7.484-1.07.256-2.686-1.65-6.785-2.13-9.965-1.166-.412.126-.84-.106-.966-.518-.126-.412.106-.84.518-.965 3.632-1.103 8.16-.566 11.228 1.32.368.227.484.7.255 1.073zm.135-2.863c-3.21-1.905-8.498-2.08-11.554-1.15-.494.15-1.015-.128-1.166-.622-.15-.494.128-1.014.622-1.165 3.518-1.07 9.356-.867 13.06 1.332.443.262.59.835.328 1.278-.263.443-.836.59-1.29.327z"/></svg>
                      </div>
                    )}
                    <div className="flex-1 overflow-hidden">
                      <p className="text-white font-bold text-sm truncate">{musicTitle || "Spotify Track"}</p>
                      <button className="mt-1 flex items-center gap-1 text-white border border-[#4d4d4d] rounded-full px-2 py-0.5 hover:bg-[#333] transition-colors">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
                        <span className="text-[10px] font-bold">Save on Spotify</span>
                      </button>
                    </div>
                    <div className="self-start relative z-10 p-1">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="#1ed760"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.563.387-.857.207-2.35-1.434-5.305-1.76-8.786-.963-.335.077-.67-.133-.746-.47-.077-.334.132-.67.47-.745 3.808-.87 7.076-.496 9.712 1.115.293.18.386.563.207.856zm1.226-2.736c-.226.368-.7.484-1.07.256-2.686-1.65-6.785-2.13-9.965-1.166-.412.126-.84-.106-.966-.518-.126-.412.106-.84.518-.965 3.632-1.103 8.16-.566 11.228 1.32.368.227.484.7.255 1.073zm.135-2.863c-3.21-1.905-8.498-2.08-11.554-1.15-.494.15-1.015-.128-1.166-.622-.15-.494.128-1.014.622-1.165 3.518-1.07 9.356-.867 13.06 1.332.443.262.59.835.328 1.278-.263.443-.836.59-1.29.327z"/></svg>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-4 w-full">
                    <span className="text-[10px] text-[#a7a7a7]">0:00</span>
                    <div className="flex-1 h-1 bg-[#4d4d4d] rounded-full overflow-hidden">
                      <div className="w-0 h-full bg-white rounded-full"></div>
                    </div>
                    <span className="text-[10px] text-[#a7a7a7]">3:53</span>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="white" className="ml-1"><circle cx="12" cy="12" r="10"/><path d="M10 8l6 4-6 4V8z" fill="black"/></svg>
                  </div>
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
              <div className="mt-6 relative z-10 w-full max-w-sm mx-auto overflow-hidden rounded-xl shadow-lg border border-gray-100 bg-gray-900">
                <div className="relative pb-[56.25%] h-0">
                  {/* Fallback for html2canvas */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500 font-bold bg-gray-900 z-0">
                     <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M21.582 6.186a2.506 2.506 0 00-1.762-1.766C18.265 4 12 4 12 4s-6.264 0-7.82.42a2.506 2.506 0 00-1.76 1.766C2 7.74 2 12 2 12s0 4.26.42 5.814a2.506 2.506 0 001.76 1.766C5.736 20 12 20 12 20s6.265 0 7.82-.42a2.506 2.506 0 001.762-1.766C22 16.26 22 12 22 12s0-4.26-.418-5.814zM9.993 15.582v-7.146l6.236 3.573-6.236 3.573z"/></svg>
                     <span className="mt-2 text-sm text-gray-300 px-4 text-center">{musicTitle || "YouTube Video"}</span>
                  </div>
                  {/* Real iframe, ignored by html2canvas */}
                  <iframe 
                    src={youtubeEmbedUrl}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                    className="absolute top-0 left-0 w-full h-full z-10"
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
