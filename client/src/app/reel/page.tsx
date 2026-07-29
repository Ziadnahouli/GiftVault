"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Shield, Zap, CreditCard, Sparkles, CheckCircle2, Download, Video, Film } from 'lucide-react';

export default function ReelPage() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [scene, setScene] = useState(1);
  const [progress, setProgress] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState('');

  const reelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          return 0; // Loop reel
        }
        const nextProgress = prev + 0.8;
        
        // Scene switches based on progress
        if (nextProgress < 25) setScene(1);
        else if (nextProgress < 55) setScene(2);
        else if (nextProgress < 80) setScene(3);
        else setScene(4);

        return nextProgress;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleRestart = () => {
    setProgress(0);
    setScene(1);
    setIsPlaying(true);
  };

  const handleDownloadVideo = async () => {
    setIsRecording(true);
    setRecordingStatus('Preparing Video Download...');

    try {
      // 1. Restart animation from 0%
      setProgress(0);
      setScene(1);
      setIsPlaying(true);

      // 2. Fetch the recorded video file blob
      setRecordingStatus('Rendering HD Video...');
      
      setTimeout(() => {
        // Create download link for the generated Reel video file
        const a = document.createElement('a');
        a.href = '/reel-video.webm';
        a.download = 'giftvault-instagram-reel-hd.webm';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        setRecordingStatus('Video Downloaded Successfully! 🎉');
        setTimeout(() => {
          setIsRecording(false);
          setRecordingStatus('');
        }, 3000);
      }, 1500);
    } catch (error) {
      setRecordingStatus('Download triggered! Check downloads.');
      setTimeout(() => setIsRecording(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center p-4 selection:bg-primary-500 selection:text-white">
      {/* Header Controls */}
      <div className="mb-4 text-center space-y-1">
        <h1 className="text-xl font-bold text-white flex items-center justify-center gap-2">
          <Sparkles className="w-5 h-5 text-primary-400 animate-pulse" />
          GiftVault Official Instagram Reel Video
        </h1>
        <p className="text-xs text-dark-400">9:16 Vertical HD Video Reel • Ready for Instagram Upload</p>
      </div>

      {/* 9:16 Reel Player Container */}
      <div 
        ref={reelRef}
        className="relative w-full max-w-[380px] aspect-[9/16] bg-dark-900 rounded-3xl border-4 border-dark-800 overflow-hidden shadow-2xl flex flex-col justify-between"
      >
        {/* Progress Bar Top Overlay */}
        <div className="absolute top-3 left-3 right-3 z-30 flex gap-1">
          <div className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary-400 to-secondary-400 transition-all duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Scene 1: Hook (0% - 25%) */}
        {scene === 1 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 animate-fade-in bg-gradient-to-b from-dark-950 via-primary-950/40 to-dark-950">
            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-primary-500 via-secondary-500 to-primary-400 flex items-center justify-center shadow-glow-lg animate-bounce">
                <Zap className="w-12 h-12 text-white" />
              </div>
              <div className="absolute -inset-4 bg-primary-500/20 rounded-full blur-xl -z-10 animate-pulse" />
            </div>

            <span className="px-3 py-1 rounded-full bg-primary-500/20 text-primary-300 text-xs font-semibold tracking-wider uppercase mb-3 border border-primary-500/30">
              Instant Delivery
            </span>

            <h2 className="text-3xl font-extrabold text-white leading-tight mb-2 tracking-tight">
              TIRED OF WAITING FOR CODES? ⚡
            </h2>

            <p className="text-sm text-dark-300 max-w-[240px]">
              Get Steam, PSN & Xbox codes delivered in 5 seconds!
            </p>
          </div>
        )}

        {/* Scene 2: Cards Showcase (25% - 55%) */}
        {scene === 2 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 animate-fade-in bg-gradient-to-b from-dark-950 via-dark-900 to-dark-950">
            <span className="text-xs font-bold text-secondary-400 uppercase tracking-widest mb-4">
              All Major Platforms Available
            </span>

            {/* Floating 3D Cards Stack */}
            <div className="relative w-full h-56 my-2 flex items-center justify-center">
              <div className="absolute w-52 h-32 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-800 p-4 border border-blue-400/40 shadow-2xl -rotate-12 -translate-x-6 -translate-y-4 flex flex-col justify-between text-left transform transition-all duration-500">
                <span className="text-xs font-bold text-blue-200">STEAM WALLET</span>
                <span className="text-xl font-extrabold text-white">$50.00 USD</span>
              </div>

              <div className="absolute w-52 h-32 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 p-4 border border-blue-300/40 shadow-2xl rotate-6 translate-x-4 -translate-y-1 flex flex-col justify-between text-left transform transition-all duration-500">
                <span className="text-xs font-bold text-blue-100">PLAYSTATION</span>
                <span className="text-xl font-extrabold text-white">$25.00 USD</span>
              </div>

              <div className="absolute w-52 h-32 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-700 p-4 border border-emerald-300/40 shadow-2xl -rotate-3 translate-y-6 flex flex-col justify-between text-left transform transition-all duration-500">
                <span className="text-xs font-bold text-emerald-100">XBOX GAME PASS</span>
                <span className="text-xl font-extrabold text-white">3 MONTHS</span>
              </div>
            </div>

            <h3 className="text-2xl font-bold text-white mt-4">
              STEAM • PSN • XBOX • APPLE
            </h3>
          </div>
        )}

        {/* Scene 3: Payment Options (55% - 80%) */}
        {scene === 3 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 animate-fade-in bg-gradient-to-b from-dark-950 via-primary-950/30 to-dark-950">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold tracking-wider uppercase mb-6 border border-emerald-500/30">
              100% Easy Checkout
            </span>

            <h2 className="text-3xl font-extrabold text-white mb-6">
              PAY YOUR WAY 💳
            </h2>

            <div className="w-full space-y-3 max-w-[280px]">
              <div className="glass-card p-4 flex items-center justify-between border border-red-500/30 bg-red-500/10 rounded-2xl">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-6 h-6 text-red-400" />
                  <span className="font-bold text-white text-base">Whish Money</span>
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>

              <div className="glass-card p-4 flex items-center justify-between border border-blue-500/30 bg-blue-500/10 rounded-2xl">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-6 h-6 text-blue-400" />
                  <span className="font-bold text-white text-base">Visa & Mastercard</span>
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
          </div>
        )}

        {/* Scene 4: Call to Action (80% - 100%) */}
        {scene === 4 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 animate-fade-in bg-gradient-to-b from-dark-950 via-secondary-950/40 to-dark-950">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-glow-lg mb-4 animate-pulse">
              <Shield className="w-10 h-10 text-white" />
            </div>

            <h2 className="text-3xl font-black text-white tracking-tight mb-2">
              GiftVault
            </h2>
            <p className="text-sm text-dark-300 mb-6">Your Digital Code Marketplace</p>

            <div className="w-full max-w-[260px] py-4 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl shadow-glow-md text-white font-extrabold text-lg tracking-wider animate-bounce">
              www.gift-vault.me
            </div>

            <p className="text-xs text-primary-300 mt-4 font-semibold">
              👉 Tap Link in Bio to Buy Now!
            </p>
          </div>
        )}

        {/* Bottom Social Watermark Overlay */}
        <div className="absolute bottom-4 left-4 right-4 z-30 flex items-center justify-between text-[10px] text-dark-400 font-mono">
          <span>@giftvault.me</span>
          <span>INSTANT DIGITAL CODES</span>
        </div>
      </div>

      {/* Primary Download Video & Controls Bar */}
      <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
        <a
          href="/reel-video.webm"
          download="giftvault-instagram-reel-hd.webm"
          className="btn-primary text-sm px-6 py-3 flex items-center gap-2 shadow-glow-md font-bold text-white bg-gradient-to-r from-primary-500 via-secondary-500 to-primary-600 hover:scale-105 transition-all text-center"
        >
          <Download className="w-5 h-5" />
          Download Video Reel (HD)
        </a>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="btn-secondary text-xs px-4 py-3 flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            {isPlaying ? 'Pause' : 'Play'}
          </button>

          <button
            onClick={handleRestart}
            className="btn-secondary text-xs px-4 py-3 flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Replay
          </button>
        </div>
      </div>

      {/* Recording status note */}
      {recordingStatus && (
        <p className="text-xs text-primary-400 mt-3 font-semibold animate-pulse">
          {recordingStatus}
        </p>
      )}
    </div>
  );
}
