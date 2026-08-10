'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface EnvelopeProps {
  recipientName: string;
  senderName: string;
  onOpen: () => void;
  onStartOpen?: () => void;
}

export default function Envelope({ recipientName, senderName, onOpen, onStartOpen }: EnvelopeProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => {
    if (isOpen) return; // Mencegah klik ganda
    setIsOpen(true);
    if (onStartOpen) onStartOpen();
    setTimeout(() => {
      onOpen();
    }, 1000);
  };

  return (
    <div className="relative w-full max-w-md mx-auto aspect-[4/3] cursor-pointer" onClick={handleOpen}>
      {/* Bagian Bawah/Belakang Amplop */}
      <div className="absolute inset-0 bg-blue-200 rounded-xl shadow-lg border-2 border-blue-300 flex items-center justify-center overflow-hidden">
        
        {/* Kertas Surat Menyembul */}
        <motion.div 
          className="absolute w-11/12 h-5/6 bg-white top-4 rounded shadow-sm border border-gray-100 flex items-center justify-center"
          initial={{ y: 20 }}
          animate={{ y: isOpen ? -60 : 20 }}
          transition={{ duration: 0.5, delay: isOpen ? 0.3 : 0 }}
        >
           <motion.p 
             initial={{ opacity: 0 }}
             animate={{ opacity: isOpen ? 1 : 0 }}
             transition={{ duration: 0.3, delay: isOpen ? 0.5 : 0 }}
             className="text-cyan-600 font-sans text-sm font-medium mb-12"
           >
             A letter for {recipientName}...
           </motion.p>
        </motion.div>

        {/* Tulisan di Amplop */}
        <div className="absolute bottom-6 w-full z-30 text-center pointer-events-none">
          <h2 className="text-xl font-sans text-blue-900 font-bold mb-0.5 px-4 truncate">To: {recipientName}</h2>
          <p className="text-blue-700/80 text-xs font-medium px-4 truncate">From: {senderName}</p>
        </div>
      </div>

      {/* Flap (Penutup) Amplop Bagian Atas */}
      <motion.div
        className="absolute top-0 w-full h-1/2 bg-blue-300 rounded-t-xl origin-top border-b border-blue-400 z-20"
        style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }}
        initial={{ rotateX: 0 }}
        animate={{ rotateX: isOpen ? 180 : 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
      />
      
      {/* Stiker Segel Hati */}
      <motion.div 
        className="absolute top-[45%] left-1/2 w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white text-xl z-30 shadow-md"
        initial={{ x: '-50%', y: '-50%', scale: 1 }}
        animate={{ 
          x: '-50%', 
          y: '-50%',
          scale: isOpen ? 0 : [1, 1.1, 1],
        }}
        transition={{ 
          scale: isOpen ? { duration: 0.3 } : { repeat: Infinity, duration: 1.5 } 
        }}
      >
        ❤️
      </motion.div>
    </div>
  );
}
