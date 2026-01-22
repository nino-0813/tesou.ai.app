
import React, { useState, useRef, useCallback } from 'react';
import { Camera, RotateCcw, CheckCircle2, Share2, Star, ArrowRight, Upload, Image as ImageIcon } from 'lucide-react';
import { AppState, ZodiacSign, AnalysisResult } from './types';
import { ZODIAC_LIST, CATEGORY_ICONS } from './constants';
import { analyzePalm } from './services/openaiService';
import RadarChart from './components/RadarChart';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>('landing');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [selectedZodiac, setSelectedZodiac] = useState<ZodiacSign | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [loadingMsg, setLoadingMsg] = useState('手相を解析中...');
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = async () => {
    setState('capture');
    // Camera is started in the effect or when the component mounts in 'capture' state
    // But we need to ensure we try to get the stream
    setTimeout(initCamera, 100);
  };

  const initCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      // alert('カメラの起動に失敗しました。');
      // Don't change state back immediately, let user choose upload
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 直ちに反応を出す（圧縮中に無反応に見えないように）
    setIsUploading(true);
    setCapturedImage(null);
    setState('capture');

    // 画像を圧縮してJPEGに変換
    const img = new Image();
    const reader = new FileReader();

    const finalize = () => {
      setIsUploading(false);
      // 同じファイルを再選択できるようにリセット
      if (event.target) event.target.value = '';
    };

    reader.onerror = () => {
      finalize();
      alert('画像の読み込みに失敗しました。別の画像をお試しください。');
      setState('landing');
    };

    img.onerror = () => {
      finalize();
      alert('画像の読み込みに失敗しました。別の画像をお試しください。');
      setState('landing');
    };

    reader.onload = (e) => {
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // 最大サイズを制限（例: 1024px）
        const maxSize = 1024;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height *= maxSize / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width *= maxSize / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        // JPEGとしてDataURLを取得（品質0.8）
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(dataUrl);
        finalize();
      };
    };

    reader.readAsDataURL(file);
  };

  const triggerFileUpload = () => {
    const input = fileInputRef.current;
    if (!input) return;
    // 同じ画像を選び直しても反応するように
    input.value = '';
    input.click();
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
        // Stop camera
        const stream = videoRef.current.srcObject as MediaStream;
        stream?.getTracks().forEach(track => track.stop());
      }
    }
  };

  const resetCapture = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleStartAnalysis = async () => {
    if (!capturedImage || !selectedZodiac) return;
    
    setState('loading');
    const messages = [
      '星の並びを確認しています...',
      '生命線の深さを測定中...',
      'あなたの運命の転換点を探しています...',
      '2026年の幸運をシミュレーション中...',
    ];
    
    let msgIdx = 0;
    const interval = setInterval(() => {
      msgIdx = (msgIdx + 1) % messages.length;
      setLoadingMsg(messages[msgIdx]);
    }, 2500);

    try {
      const result = await analyzePalm(capturedImage, selectedZodiac);
      setAnalysisResult(result);
      setState('result');
    } catch (error) {
      alert('解析中にエラーが発生しました。もう一度お試しください。');
      setState('landing');
    } finally {
      clearInterval(interval);
    }
  };

  return (
    <div 
      className="min-h-screen relative flex flex-col items-center p-4 bg-image-container"
      style={{
        backgroundImage: "url('/images/background.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="celestial-bg"></div>
      <div className="stars"></div>

      {/* Main Container */}
      <div className={`w-full max-w-md flex flex-col items-center relative z-10 ${state === 'landing' ? 'justify-center min-h-screen' : ''}`}>
        
        {/* Landing Page */}
        {state === 'landing' && (
          <div className="w-full flex flex-col items-center space-y-10 animate-in fade-in slide-in-from-bottom-10 duration-1000 pt-16">
            
            {/* Title Section */}
            <div className="relative text-center px-4">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-purple-900/40 blur-[60px] rounded-full pointer-events-none"></div>
              
              <p className="text-purple-300 tracking-[0.2em] text-sm mb-4 font-serif opacity-80">
                — 運命を読み解く —
              </p>
              
              <h1 className="relative text-5xl md:text-7xl font-serif font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-yellow-100 via-yellow-300 to-yellow-600 drop-shadow-[0_2px_10px_rgba(234,179,8,0.3)]">
                <span className="block text-3xl md:text-4xl mb-3 text-purple-100 font-light tracking-widest opacity-90">2026年</span>
                <span className="whitespace-nowrap">あなたを鑑定</span>
              </h1>
              
              <div className="h-px w-24 bg-gradient-to-r from-transparent via-yellow-500 to-transparent mx-auto my-6 opacity-50"></div>
              
              <p className="relative text-purple-200 font-serif text-sm md:text-base tracking-widest leading-relaxed opacity-90">
                手相 <span className="text-yellow-500 mx-1">×</span> 星座<br/>
                <span className="text-xs mt-1 block opacity-70">今知りたい運勢を完全再現</span>
              </p>
            </div>

            {/* Badges - Premium Look */}
            <div className="flex justify-center gap-6 w-full max-w-md px-6">
              {[
                { label: 'SERIES TOTAL', value: '300万DL', sub: '突破' },
                { label: 'AI ANALYSIS', value: '99.8%', sub: '精度' }
              ].map((badge, i) => (
                <div key={i} className="flex-1 relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-600/20 to-purple-900/40 rounded-sm blur-sm group-hover:blur-md transition-all duration-500"></div>
                  <div className="relative border border-white/10 border-t-white/20 border-l-white/20 bg-black/40 backdrop-blur-md p-4 text-center rounded-sm">
                    <p className="text-[9px] text-yellow-500/80 tracking-[0.2em] mb-1 font-serif">{badge.label}</p>
                    <div className="flex items-baseline justify-center gap-1 font-serif text-white">
                      <span className="text-xl md:text-2xl font-medium bg-gradient-to-b from-white via-white to-gray-400 bg-clip-text text-transparent">{badge.value}</span>
                      <span className="text-[10px] text-gray-400">{badge.sub}</span>
                    </div>
                  </div>
                  {/* Corner accents */}
                  <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-yellow-500/50"></div>
                  <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-yellow-500/50"></div>
                </div>
              ))}
            </div>

            {/* Categories - Jewel Icons Image */}
            <div className="w-full max-w-2xl px-2 py-4 flex justify-center">
               <div className="relative w-full h-24 md:h-32 overflow-hidden">
                 <img 
                   src="/images/jewel-icons.png" 
                   alt="運勢カテゴリー" 
                   className="w-full h-full object-cover object-center drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] opacity-90 hover:opacity-100 transition-opacity duration-500 scale-110"
                 />
               </div>
            </div>

            <button 
              onClick={() => setShowActionSheet(true)}
              className="mt-4 w-full max-w-xs py-4 px-8 bg-transparent border border-white/20 rounded-sm font-serif text-lg text-white tracking-[0.2em] hover:bg-white/5 hover:border-yellow-500/50 hover:text-yellow-100 transition-all duration-500 flex items-center justify-center gap-4 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <span className="relative z-10 font-light">鑑定を始める</span>
              <span className="w-4 h-px bg-yellow-500 group-hover:w-8 transition-all"></span>
            </button>

            {/* Action Sheet Overlay */}
            {showActionSheet && (
              <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowActionSheet(false)}>
                <div className="w-full max-w-md bg-gray-900/90 border-t border-white/10 rounded-t-3xl p-6 pb-10 space-y-4 animate-in slide-in-from-bottom-full duration-300" onClick={e => e.stopPropagation()}>
                  <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-4"></div>
                  <h3 className="text-center text-white font-serif mb-6">鑑定方法を選択</h3>
                  
                  <button 
                    onClick={() => { setShowActionSheet(false); startCamera(); }}
                    className="w-full py-4 bg-gradient-to-r from-purple-900/50 to-blue-900/50 border border-white/10 rounded-xl flex items-center justify-center gap-3 text-white hover:bg-white/5 transition active:scale-95"
                  >
                    <Camera className="w-5 h-5 text-purple-300" />
                    <span>カメラで撮影する</span>
                  </button>
                  
                  <button 
                    onClick={() => { triggerFileUpload(); setTimeout(() => setShowActionSheet(false), 0); }}
                    className="w-full py-4 bg-gradient-to-r from-gray-800/50 to-gray-700/50 border border-white/10 rounded-xl flex items-center justify-center gap-3 text-white hover:bg-white/5 transition active:scale-95"
                  >
                    <ImageIcon className="w-5 h-5 text-blue-300" />
                    <span>アルバムから選択</span>
                  </button>
                  
                  <button 
                    onClick={() => setShowActionSheet(false)}
                    className="w-full py-3 mt-2 text-gray-400 text-sm"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Camera/Capture Screen */}
        {state === 'capture' && (
          <div className="w-full space-y-6">
            <h2 className="text-center text-2xl font-bold">手相を撮影してください</h2>
            
            <div className="relative aspect-[3/4] w-full bg-black rounded-3xl overflow-hidden glass-morphism">
              {isUploading ? (
                <div className="w-full h-full flex items-center justify-center">
                  <p className="text-white/70 text-sm">画像を読み込み中...</p>
                </div>
              ) : !capturedImage ? (
                <>
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-64 h-80 palm-overlay rounded-[100px] border-white/30 flex items-center justify-center">
                      <p className="text-white/50 text-sm rotate-90">ガイドに合わせてください</p>
                    </div>
                  </div>
                </>
              ) : (
                <img src={capturedImage} className="w-full h-full object-cover" />
              )}
            </div>

            <div className="flex justify-center gap-6">
              {!capturedImage ? (
                <button 
                  onClick={capturePhoto}
                  className="w-20 h-20 rounded-full bg-white border-4 border-purple-500 flex items-center justify-center transform active:scale-90 transition shadow-xl"
                >
                  <Camera className="w-10 h-10 text-purple-600" />
                </button>
              ) : (
                <>
                  <button 
                    onClick={resetCapture}
                    className="px-6 py-3 glass-morphism rounded-full flex items-center gap-2 hover:bg-white/10 transition"
                  >
                    <RotateCcw className="w-5 h-5" /> 撮り直す
                  </button>
                  <button 
                    onClick={() => setState('zodiac')}
                    className="px-8 py-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full font-bold flex items-center gap-2 shadow-lg glow-purple"
                  >
                    次へ <CheckCircle2 className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Zodiac Selection */}
        {state === 'zodiac' && (
          <div className="w-full space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold">最後に、星座を選択</h2>
              <p className="text-purple-300 text-sm mt-2">手相と星座を掛け合わせ、多角的に鑑定します</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {ZODIAC_LIST.map(z => (
                <button
                  key={z.id}
                  onClick={() => setSelectedZodiac(z.name as ZodiacSign)}
                  className={`p-4 rounded-2xl glass-morphism flex flex-col items-center gap-2 transition-all border-2 ${
                    selectedZodiac === z.name ? 'border-yellow-400 bg-white/20 scale-105' : 'border-transparent'
                  }`}
                >
                  <span className="text-3xl">{z.icon}</span>
                  <span className="text-xs font-medium">{z.name}</span>
                </button>
              ))}
            </div>

            <button
              disabled={!selectedZodiac}
              onClick={handleStartAnalysis}
              className={`w-full py-5 rounded-full font-bold text-xl shadow-lg transition transform active:scale-95 flex items-center justify-center gap-3 ${
                selectedZodiac ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black glow-purple' : 'bg-gray-600 opacity-50 cursor-not-allowed'
              }`}
            >
              鑑定結果を見る
            </button>
          </div>
        )}

        {/* Loading State */}
        {state === 'loading' && (
          <div className="mt-20 flex flex-col items-center gap-10">
            <div className="relative w-48 h-48 flex items-center justify-center">
              <div className="absolute inset-0 border-t-2 border-purple-500 rounded-full animate-spin"></div>
              <div className="absolute inset-4 border-r-2 border-blue-400 rounded-full animate-spin-slow"></div>
              <Star className="w-12 h-12 text-yellow-300 animate-pulse" />
            </div>
            <div className="text-center space-y-3">
              <p className="text-2xl font-bold animate-pulse">{loadingMsg}</p>
              <p className="text-sm text-purple-300">鑑定結果を作成しています...</p>
            </div>
          </div>
        )}

        {/* Result Page */}
        {state === 'result' && analysisResult && (
          <div className="w-full space-y-6 animate-in fade-in duration-1000 pb-20">
            {/* Header Result Card */}
            <div className="glass-morphism p-6 space-y-4 text-center">
              <div className="flex justify-center gap-2">
                <span className="px-3 py-1 bg-purple-600 rounded-full text-[10px] uppercase font-bold tracking-widest">Palmistry × Horoscope</span>
              </div>
              <h2 className="text-2xl font-bold text-yellow-400">{analysisResult.title}</h2>
              <p className="text-sm font-light leading-relaxed text-purple-100">{analysisResult.summary}</p>
            </div>

            {/* Radar Chart Section */}
            <div className="glass-morphism p-4">
              <h3 className="text-center text-xs font-bold text-purple-300 mb-2 uppercase tracking-widest">性格・本質のチャート</h3>
              <RadarChart data={analysisResult.radarData} />
            </div>

            {/* Hand Analysis Details */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-purple-300 uppercase tracking-widest px-1">主要三線の解析結果</h3>
              <div className="grid gap-3">
                {[
                  { name: '感情線', color: 'bg-pink-500', text: analysisResult.detectedLines.heartLine },
                  { name: '知能線', color: 'bg-blue-500', text: analysisResult.detectedLines.headLine },
                  { name: '生命線', color: 'bg-green-500', text: analysisResult.detectedLines.lifeLine },
                ].map((line, i) => (
                  <div key={i} className="glass-morphism p-4 flex gap-4">
                    <div className={`w-1 h-auto rounded-full ${line.color}`}></div>
                    <div>
                      <span className="text-xs font-bold block mb-1">{line.name}</span>
                      <p className="text-sm text-purple-100">{line.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Detailed Categories */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-purple-300 uppercase tracking-widest px-1">運勢テーマ別鑑定</h3>
              {Object.entries(analysisResult.categories).map(([key, content]) => (
                <div key={key} className="glass-morphism p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-600/30 rounded-lg">
                      {CATEGORY_ICONS[key]}
                    </div>
                    <span className="font-bold text-lg">{content.label}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-purple-100 font-light">
                    {content.text}
                  </p>
                </div>
              ))}
            </div>

            {/* Share & Actions */}
            <div className="flex flex-col gap-4">
              <button 
                className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg"
                onClick={() => alert('シェア機能は現在準備中です。結果をスクリーンショットして友達に共有しましょう！')}
              >
                <Share2 className="w-5 h-5" /> SNSで結果をシェア
              </button>
              <button 
                onClick={() => setState('landing')}
                className="w-full py-4 glass-morphism rounded-2xl font-bold text-sm text-purple-300 hover:text-white transition"
              >
                トップに戻る
              </button>
            </div>
          </div>
        )}

      </div>

      <canvas ref={canvasRef} className="hidden" />
      <input 
        type="file" 
        ref={fileInputRef} 
        accept="image/*" 
        className="hidden" 
        onChange={handleFileUpload}
      />
    </div>
  );
};

export default App;
