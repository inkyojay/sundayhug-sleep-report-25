import React, { useState, useRef, useCallback } from 'react';
import { analyzeSleepEnvironment } from './services/geminiService';
import { saveSleepAnalysis, supabase } from './services/supabaseService';
import { generateAllSlidesFromScreen, slidesToBase64Array } from './services/imageService';
import { AnalysisReport, FeedbackItem } from './types';
import { UploadIcon, BabyIcon, HighRiskIcon, MediumRiskIcon, LowRiskIcon, InfoIcon, ChevronDownIcon } from './components/icons';

// Helper to convert a file to a base64 string
const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
  });

// Helper to calculate age in months
const calculateAgeInMonths = (birthDate: string): number => {
  const birth = new Date(birthDate);
  const today = new Date();
  let months = (today.getFullYear() - birth.getFullYear()) * 12;
  months -= birth.getMonth();
  months += today.getMonth();
  return months <= 0 ? 0 : months;
};

// Helper to get the appropriate icon component based on risk level
const getRiskIcon = (riskLevel: FeedbackItem['riskLevel']) => {
  const iconProps = { className: "h-6 w-6" };
  switch (riskLevel) {
    case 'High':
      return <HighRiskIcon {...iconProps} />;
    case 'Medium':
      return <MediumRiskIcon {...iconProps} />;
    case 'Low':
      return <LowRiskIcon {...iconProps} />;
    case 'Info':
      return <InfoIcon {...iconProps} />;
    default:
      return null;
  }
};

// Helper to get Tailwind CSS color classes based on risk level
const getRiskColorClasses = (riskLevel: FeedbackItem['riskLevel']) => {
  switch (riskLevel) {
    case 'High':
      return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-400', pin: 'bg-red-500' };
    case 'Medium':
      return { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-400', pin: 'bg-yellow-500' };
    case 'Low':
      return { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-400', pin: 'bg-green-500' };
    case 'Info':
    default:
      return { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-400', pin: 'bg-blue-500' };
  }
};

// Main App Component
export default function App() {
  const [image, setImage] = useState<string | null>(null); // Data URL for preview
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);
  const [birthDate, setBirthDate] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [instagramId, setInstagramId] = useState<string>('');
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFeedbackId, setActiveFeedbackId] = useState<number | null>(null);
  const [isGeneratingSlides, setIsGeneratingSlides] = useState<boolean>(false);
  const [referencesOpen, setReferencesOpen] = useState<boolean>(false);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드할 수 있습니다.');
      return;
    }
    setError(null);
    setImage(URL.createObjectURL(file));
    setImageMimeType(file.type);
    const base64 = await toBase64(file);
    setImageBase64(base64);
  }, []);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  }, [handleImageUpload]);

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  }, [handleImageUpload]);

  const handleAnalyze = async () => {
    if (!imageBase64 || !imageMimeType) {
      setError('분석할 이미지를 선택해주세요.');
      return;
    }
    if (!birthDate) {
      setError('아기의 생년월일을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setReport(null);

    try {
      const result = await analyzeSleepEnvironment(imageBase64, imageMimeType, birthDate);
      setReport(result);
      
      // 인스타그램 슬라이드 생성 및 Supabase 저장
      setIsSaving(true);
      try {
        const ageInMonths = calculateAgeInMonths(birthDate);
        
        // 이미지 요소 생성
        const img = new Image();
        img.src = image!;
        await new Promise((resolve) => { img.onload = resolve; });
        
        // 인스타그램 슬라이드 생성 (화면에서 직접 캡처)
        const slides = await generateAllSlidesFromScreen(result);
        const slideBase64Array = slidesToBase64Array(slides);
        
        // 분석 결과 + 슬라이드 함께 저장 (전화번호, 인스타그램 ID 포함)
        const savedAnalysisId = await saveSleepAnalysis(
          result, 
          birthDate, 
          ageInMonths, 
          imageBase64, 
          slideBase64Array,
          phoneNumber || null,
          instagramId || null
        );
        setAnalysisId(savedAnalysisId);
        console.log('분석 결과 및 슬라이드가 Supabase에 저장되었습니다:', savedAnalysisId);
      } catch (saveError) {
        console.error('Supabase 저장 오류:', saveError);
        // 저장 실패해도 분석 결과는 표시
        setError('분석은 완료되었지만 데이터 저장에 실패했습니다. 다시 시도해주세요.');
      } finally {
        setIsSaving(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setImage(null);
    setImageBase64(null);
    setImageMimeType(null);
    setBirthDate('');
    setReport(null);
    setError(null);
    setIsLoading(false);
    setActiveFeedbackId(null);
    setReferencesOpen(false);
    setAnalysisId(null);
    setIsSaving(false);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };
  
  const handleDownloadSlides = async () => {
    if (!report || !image || !analysisId) return;
    setIsGeneratingSlides(true);
    try {
        // Supabase에서 슬라이드 데이터 가져오기
        const { data, error } = await supabase
          .from('sleep_analyses')
          .select('report_slides')
          .eq('id', analysisId)
          .single();
        
        if (error || !data?.report_slides) {
          throw new Error('저장된 슬라이드를 찾을 수 없습니다.');
        }
        
        // Base64 배열을 다운로드 가능한 형태로 변환
        const slideBase64Array = data.report_slides as string[];
        
        // 각 슬라이드 다운로드
        slideBase64Array.forEach((slideBase64, index) => {
            const link = document.createElement('a');
            link.href = `data:image/png;base64,${slideBase64}`;
            link.download = `수면분석리포트_${index + 1}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // 다운로드 간격 (동시 다운로드 방지)
            if (index < slideBase64Array.length - 1) {
                setTimeout(() => {}, 200);
            }
        });
        
        alert(`✅ 총 ${slideBase64Array.length}장의 슬라이드가 다운로드되었습니다!\n인스타그램 최적화 사이즈: 1080x1350px`);
    } catch (e) {
        console.error("슬라이드 다운로드 중 오류 발생:", e);
        setError("슬라이드를 다운로드하는 데 실패했습니다. 다시 시도해주세요.");
    } finally {
        setIsGeneratingSlides(false);
    }
};


  const today = new Date().toISOString().split('T')[0];

  const renderUploadForm = () => (
    <div className="w-full max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-lg">
      <div
        className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 hover:bg-slate-50 transition-colors"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
        {image ? (
          <img src={image} alt="Preview" className="max-h-60 mx-auto rounded-lg" />
        ) : (
          <div className="flex flex-col items-center text-slate-500">
            <UploadIcon className="h-12 w-12 mb-4" />
            <p className="font-semibold">이미지를 드래그 앤 드롭하거나 클릭하여 업로드하세요</p>
            <p className="text-sm">아기가 자고 있는 환경 사진을 올려주세요</p>
          </div>
        )}
      </div>
      <div className="mt-6 space-y-4">
        <div>
          <label htmlFor="birthdate" className="block text-sm font-medium text-slate-700 mb-2 flex items-center">
            <BabyIcon className="h-5 w-5 mr-2 text-slate-400" />
            아기 생년월일
          </label>
          <input
            type="date"
            id="birthdate"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            max={today}
            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-2">
            📞 전화번호 (선택사항)
          </label>
          <input
            type="tel"
            id="phone"
            placeholder="010-1234-5678"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        
        <div>
          <label htmlFor="instagram" className="block text-sm font-medium text-slate-700 mb-2">
            📸 인스타그램 ID (선택사항)
          </label>
          <input
            type="text"
            id="instagram"
            placeholder="@your_instagram_id"
            value={instagramId}
            onChange={(e) => setInstagramId(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>
      <button
        onClick={handleAnalyze}
        disabled={!image || !birthDate || isLoading}
        className="w-full mt-8 bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
      >
        수면 환경 분석하기
      </button>
    </div>
  );

  const renderReport = () => report && (
    <div className="w-full max-w-7xl mx-auto bg-white p-8 rounded-2xl shadow-lg">
        <div className="flex flex-wrap gap-4 mb-6 items-center">
            <button onClick={handleReset} className="bg-slate-200 text-slate-800 font-bold py-2 px-4 rounded-lg hover:bg-slate-300 transition-colors">
                새로 분석하기
            </button>
            <button onClick={handleDownloadSlides} disabled={isGeneratingSlides} className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-slate-400 transition-colors">
                {isGeneratingSlides ? '슬라이드 생성 중...' : '📸 인스타그램 슬라이드 다운로드'}
            </button>
            {isSaving && (
                <span className="text-sm text-slate-600 flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mr-2"></div>
                    데이터 저장 중...
                </span>
            )}
            {analysisId && !isSaving && (
                <span className="text-sm text-green-600">✓ 데이터 저장 완료 (ID: {analysisId.substring(0, 8)}...)</span>
            )}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="w-full">
                <div className="report-image-container relative inline-block w-full align-top">
                    <img src={image!} alt="분석된 수면 환경" className="w-full h-auto rounded-lg block" />
                    {report.feedbackItems.map(item => (
                        <div
                            key={item.id}
                            className={`absolute w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-sm cursor-pointer transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${getRiskColorClasses(item.riskLevel).pin} ${activeFeedbackId === item.id ? 'scale-150 ring-4 ring-white' : 'scale-100'}`}
                            style={{ left: `${item.x}%`, top: `${item.y}%` }}
                            onMouseEnter={() => setActiveFeedbackId(item.id)}
                            onMouseLeave={() => setActiveFeedbackId(null)}
                            title={item.title}
                        >
                            {item.id}
                        </div>
                    ))}
                </div>
            </div>
            <div>
                <h2 className="text-2xl font-bold mb-4">분석 리포트</h2>
                <div className="bg-slate-100 p-4 rounded-lg mb-6">
                    <h3 className="font-bold text-slate-800 mb-2">종합 요약</h3>
                    <p className="text-slate-600">{report.summary}</p>
                </div>
                <div className="space-y-4">
                    {report.feedbackItems.map(item => {
                        const colors = getRiskColorClasses(item.riskLevel);
                        return (
                            <div
                                key={item.id}
                                className={`p-4 border-l-4 rounded-r-lg ${colors.bg} ${colors.border} ${activeFeedbackId === item.id ? 'ring-2 ring-indigo-400' : ''}`}
                                onMouseEnter={() => setActiveFeedbackId(item.id)}
                                onMouseLeave={() => setActiveFeedbackId(null)}
                            >
                                <div className="flex items-center mb-2">
                                    <span className={`mr-3 ${colors.text}`}>{getRiskIcon(item.riskLevel)}</span>
                                    <h4 className={`font-bold ${colors.text}`}>{item.id}. {item.title} ({item.riskLevel})</h4>
                                </div>
                                <p className={`text-sm ${colors.text}`}>{item.feedback}</p>
                            </div>
                        );
                    })}
                </div>
                <div className="mt-8 border-t pt-6">
                    <button 
                        onClick={() => setReferencesOpen(!referencesOpen)}
                        className="w-full flex justify-between items-center text-left text-slate-800 font-bold py-2"
                    >
                        <h3>참고 자료</h3>
                        <ChevronDownIcon className={`w-5 h-5 transition-transform duration-300 ${referencesOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {referencesOpen && (
                        <ul className="list-disc list-inside space-y-2 mt-4 pl-2">
                            {report.references.map((ref, index) => (
                                <li key={index} className="text-sm">
                                    <a href={ref.uri} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                                        {ref.title}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    </div>
  );

  return (
    <div className="bg-slate-100 min-h-screen font-sans text-slate-800 p-4 sm:p-8">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-extrabold text-slate-900">AI 아기 수면 환경 분석기</h1>
        <p className="text-slate-600 mt-2">Gemini AI를 사용하여 아기의 수면 공간 안전을 점검하세요.</p>
      </header>
      <main>
        {isLoading && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-slate-600 font-semibold">AI가 이미지를 분석하고 있습니다. 잠시만 기다려주세요...</p>
          </div>
        )}
        {error && (
          <div className="w-full max-w-2xl mx-auto bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative" role="alert">
            <strong className="font-bold">오류 발생: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        {!isLoading && (report ? renderReport() : renderUploadForm())}
      </main>
    </div>
  );
}
