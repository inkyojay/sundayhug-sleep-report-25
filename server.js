import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import { generateAllSlides } from './services/serverSlideService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const distDir = path.join(__dirname, 'dist');

const app = express();

// JSON 파싱 미들웨어
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS 설정 (n8n 연동을 위해)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Supabase 클라이언트 초기화
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ugzwgegkvxcczwiottej.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnendnZWdrdnhjY3p3aW90dGVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3MTI2NzAsImV4cCI6MjA3NzI4ODY3MH0._ezV2r8kAvjIlovx6U_L0XzW9nWtSR0MY-RpMISPK38';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Gemini API 초기화
const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
console.log('🔑 API 키 상태:', {
  hasGEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
  hasAPI_KEY: !!process.env.API_KEY,
  apiKeyLength: apiKey ? apiKey.length : 0,
  apiKeyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : '없음'
});
if (!apiKey) {
  console.warn('⚠️  GEMINI_API_KEY가 설정되지 않았습니다. API 기능이 작동하지 않을 수 있습니다.');
}
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// ========== 헬퍼 함수 ==========

function fileToGenerativePart(base64, mimeType) {
  return {
    inlineData: {
      data: base64,
      mimeType
    },
  };
}

function calculateAgeInMonths(birthDate) {
  const birth = new Date(birthDate);
  const today = new Date();
  let months = (today.getFullYear() - birth.getFullYear()) * 12;
  months -= birth.getMonth();
  months += today.getMonth();
  return months <= 0 ? 0 : months;
}

async function analyzeSleepEnvironment(imageBase64, imageMimeType, birthDate) {
  if (!ai) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }

  const ageInMonths = calculateAgeInMonths(birthDate);

  const prompt = `당신은 신생아 및 24개월 미만 영유아를 위한 세계 최고 수준의 소아 수면 안전 전문가입니다.
제공된 아기 수면 환경 이미지를 분석해 주세요. 이 아기는 생후 약 ${ageInMonths}개월입니다.
당신의 임무는 잠재적 위험 요소를 식별하고, 아기의 수면 자세를 평가하며, 상세한 안전 보고서를 제공하는 것입니다.
피드백은 반드시 미국소아과학회(American Academy of Pediatrics)와 같은 신뢰할 수 있는 기관의 안전 수면 가이드라인에 근거해야 합니다.

분석에는 다음 핵심 영역이 포함되어야 합니다:
1.  **수면 공간:** 바닥이 단단하고 평평한가? 침대/아기 침대에 부드러운 물건이 없는가?
2.  **침구:** 헐렁한 담요, 베개, 범퍼 가드, 봉제 인형 등이 있는가?
3.  **수면 자세:** 아기가 등을 대고 자고 있는가? (바로 눕혀 재우기).
4.  **주변 환경:** 근처에 전선, 덮개가 없는 콘센트, 침대 안으로 떨어질 수 있는 물건 등 위험 요소가 있는가?
5.  **아기 옷차림:** 아기가 옷을 너무 많이 입었는가? 머리를 덮는 것이 있는가?

**매우 중요:** 식별된 각 피드백 항목에 대해, 이미지에서 해당 위험 요소가 있는 정확한 위치에 핀을 표시해야 합니다. 이를 위해 **반드시** 0과 100 사이의 x 및 y 좌표를 제공해야 합니다. (예: 왼쪽 상단은 x:0, y:0 이고, 오른쪽 하단은 x:100, y:100 입니다.) 모든 'feedbackItems' 배열의 객체에는 유효한 x, y 좌표가 포함되어야 합니다.

**riskLevel 값은 반드시 다음 중 하나여야 합니다**: "High", "Medium", "Low", "Info" (정확히 이 영문 단어만 사용, 대소문자 정확히 일치)

최종 결과물은 **반드시** 아래 구조를 엄격하게 따르는 단일 원시 JSON 객체여야 합니다. JSON 객체 앞뒤에 \`\`\`json과 같은 추가 텍스트, 주석, 마크다운 서식을 절대 추가하지 마세요. 모든 텍스트 값(summary, title, feedback 등)은 한국어로 작성되어야 하지만, riskLevel은 반드시 영문으로 작성해야 합니다.
`;

  const imagePart = fileToGenerativePart(imageBase64, imageMimeType);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, { text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            feedbackItems: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.NUMBER },
                  x: { type: Type.NUMBER },
                  y: { type: Type.NUMBER },
                  title: { type: Type.STRING },
                  feedback: { type: Type.STRING },
                  riskLevel: { type: Type.STRING },
                },
              },
            },
            references: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  uri: { type: Type.STRING },
                },
              },
            },
          },
        },
      },
    });

    let jsonText = response.text.trim();
    // Clean up potential markdown fences and other text
    const startIndex = jsonText.indexOf('{');
    const endIndex = jsonText.lastIndexOf('}');
    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
      jsonText = jsonText.substring(startIndex, endIndex + 1);
    }
    
    const parsedResult = JSON.parse(jsonText);
    
    // Supplement references from grounding metadata if API doesn't populate the schema field
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      const groundReferences = response.candidates[0].groundingMetadata.groundingChunks
        .filter(chunk => chunk.web && chunk.web.uri && chunk.web.title)
        .map(chunk => ({
          title: chunk.web.title,
          uri: chunk.web.uri
        }));
      
      // Merge and deduplicate references
      const allRefs = [...(parsedResult.references || []), ...groundReferences];
      const uniqueRefs = Array.from(new Map(allRefs.map(item => [item.uri, item])).values());
      parsedResult.references = uniqueRefs;
    }

    return parsedResult;

  } catch (error) {
    console.error("❌ Error analyzing image with Gemini:", error);
    console.error("📋 Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      status: error.status,
      statusCode: error.statusCode,
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      } : undefined
    });
    
    if (error instanceof SyntaxError) {
      throw new Error("AI가 예상치 못한 형식으로 응답했습니다. 다시 시도해 주세요.");
    }
    
    // 더 자세한 에러 메시지 제공
    const errorMessage = error.message || 'Unknown error';
    const errorCode = error.code || error.status || error.statusCode || '';
    
    console.error("🔍 에러 분석:", {
      errorMessage,
      errorCode,
      includesAPIKey: errorMessage.includes('API key') || errorMessage.includes('authentication'),
      includesInvalid: errorMessage.includes('invalid') || errorMessage.includes('format'),
      includesSize: errorMessage.includes('size') || errorMessage.includes('too large')
    });
    
    if (errorMessage.includes('API key') || errorMessage.includes('authentication') || errorCode === 401 || errorCode === 403) {
      console.error("🚨 API 키 인증 실패 - API 키 상태:", {
        hasApiKey: !!apiKey,
        apiKeyLength: apiKey ? apiKey.length : 0,
        apiKeyPrefix: apiKey ? apiKey.substring(0, 15) + '...' : '없음'
      });
      throw new Error(`API 키 인증에 실패했습니다. 서버 설정을 확인해주세요. (에러 코드: ${errorCode || 'N/A'}, 메시지: ${errorMessage})`);
    }
    if (errorMessage.includes('invalid') || errorMessage.includes('format')) {
      throw new Error("이미지 형식이 올바르지 않습니다. JPEG, PNG 형식의 이미지를 사용해주세요.");
    }
    if (errorMessage.includes('size') || errorMessage.includes('too large')) {
      throw new Error("이미지 크기가 너무 큽니다. 더 작은 이미지를 사용해주세요.");
    }
    
    throw new Error(`AI 분석에 실패했습니다: ${errorMessage}. 이미지를 확인하고 다시 시도해 주세요.`);
  }
}

// ========== API 엔드포인트 ==========

/**
 * POST /api/analyze
 * 이미지 분석 API (n8n 연동용)
 * 
 * Request Body:
 * {
 *   "imageBase64": "data:image/jpeg;base64,...",
 *   "birthDate": "2024-01-15",
 *   "phoneNumber": "010-1234-5678" (선택사항),
 *   "instagramId": "@instagram_id" (선택사항)
 * }
 */
app.post('/api/analyze', async (req, res) => {
  try {
    const { imageBase64, birthDate, phoneNumber, instagramId } = req.body;

    // 입력 검증
    if (!imageBase64) {
      return res.status(400).json({
        success: false,
        error: 'imageBase64 is required'
      });
    }

    if (!birthDate) {
      return res.status(400).json({
        success: false,
        error: 'birthDate is required (format: YYYY-MM-DD)'
      });
    }

    // Base64 데이터에서 MIME 타입 추출
    let imageData = imageBase64;
    let mimeType = 'image/jpeg'; // 기본값

    if (imageBase64.startsWith('data:')) {
      const matches = imageBase64.match(/data:([^;]+);base64,(.+)/);
      if (matches) {
        mimeType = matches[1];
        imageData = matches[2];
      }
    }

    // Gemini API로 분석 수행
    const analysisResult = await analyzeSleepEnvironment(
      imageData,
      mimeType,
      birthDate
    );

    // 성공 응답 (전화번호와 인스타그램 ID 포함)
    res.json({
      success: true,
      data: {
        ...analysisResult,
        phoneNumber: phoneNumber || null,
        instagramId: instagramId || null
      }
    });

  } catch (error) {
    console.error('Analysis API Error:', error);
    console.error('Error stack:', error.stack);
    console.error('Request body:', {
      hasImageBase64: !!req.body.imageBase64,
      imageBase64Length: req.body.imageBase64?.length,
      birthDate: req.body.birthDate,
      phoneNumber: req.body.phoneNumber,
      instagramId: req.body.instagramId
    });
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * POST /api/analyze-from-url
 * 이미지 URL을 받아서 분석 및 저장 (n8n 연동용 - Tally 이미지 처리)
 * 
 * Request Body:
 * {
 *   "imageUrl": "https://storage.tally.so/private/image.jpeg?...",
 *   "birthDate": "2024-01-15",
 *   "phoneNumber": "010-1234-5678" (선택사항),
 *   "instagramId": "@instagram_id" (선택사항)
 * }
 */
app.post('/api/analyze-from-url', async (req, res) => {
  try {
    const { imageUrl, birthDate, phoneNumber, instagramId } = req.body;

    // 입력 검증
    if (!imageUrl || !birthDate) {
      return res.status(400).json({
        success: false,
        error: 'imageUrl and birthDate are required'
      });
    }

    console.log('📥 이미지 URL 분석 요청 받음');
    console.log('  - 이미지 URL:', imageUrl.substring(0, 100) + '...');
    console.log('  - 생년월일:', birthDate);
    console.log('  - 전화번호:', phoneNumber || '없음');
    console.log('  - 인스타그램 ID:', instagramId || '없음');
    console.log('  - API 키 상태:', {
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey ? apiKey.length : 0
    });

    // 이미지 URL에서 이미지 다운로드
    const imageResponse = await fetch(imageUrl);
    
    if (!imageResponse.ok) {
      throw new Error(`이미지 다운로드 실패: ${imageResponse.status} ${imageResponse.statusText}`);
    }

    // 바이너리 데이터로 변환
    const imageBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(imageBuffer);
    
    // MIME 타입 확인
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
    
    console.log('이미지 다운로드 성공:', {
      크기: buffer.length,
      MIME타입: contentType
    });
    
    // Base64로 변환
    const base64String = buffer.toString('base64');

    // 분석 수행
    const analysisResult = await analyzeSleepEnvironment(
      base64String,
      contentType,
      birthDate
    );

    const ageInMonths = calculateAgeInMonths(birthDate);

    // 슬라이드 생성
    console.log('📊 슬라이드 생성 시작...');
    let reportSlides = null;
    try {
      const slides = await generateAllSlides(analysisResult, base64String);
      reportSlides = slides;
      console.log(`✅ 슬라이드 생성 완료: ${slides.length}개`);
    } catch (slideError) {
      console.error('⚠️ 슬라이드 생성 실패:', slideError);
      // 슬라이드 생성 실패해도 분석 결과는 저장
    }

    // Supabase에 저장
    const { data: savedAnalysis, error: saveError } = await supabase
      .from('sleep_analyses')
      .insert({
        image_base64: base64String,
        birth_date: birthDate,
        age_in_months: ageInMonths,
        summary: analysisResult.summary,
        report_slides: reportSlides,
        phone_number: phoneNumber || null,
        instagram_id: instagramId || null
      })
      .select()
      .single();

    if (saveError) {
      throw new Error(`데이터 저장 실패: ${saveError.message}`);
    }

    // 피드백 항목 저장
    if (analysisResult.feedbackItems && analysisResult.feedbackItems.length > 0) {
      const feedbackItems = analysisResult.feedbackItems.map(item => ({
        sleep_analysis_id: savedAnalysis.id,
        x: item.x,
        y: item.y,
        title: item.title,
        feedback: item.feedback,
        risk_level: item.riskLevel
      }));

      const { error: feedbackError } = await supabase
        .from('sleep_analysis_feedback_items')
        .insert(feedbackItems);

      if (feedbackError) {
        console.error('피드백 항목 저장 오류:', feedbackError);
      }
    }

    // 참고 자료 저장
    if (analysisResult.references && analysisResult.references.length > 0) {
      const references = analysisResult.references.map(ref => ({
        sleep_analysis_id: savedAnalysis.id,
        title: ref.title,
        uri: ref.uri
      }));

      const { error: refError } = await supabase
        .from('sleep_analysis_references')
        .insert(references);

      if (refError) {
        console.error('참고 자료 저장 오류:', refError);
      }
    }

    res.json({
      success: true,
      data: {
        ...analysisResult,
        phoneNumber: phoneNumber || null,
        instagramId: instagramId || null
      },
      analysisId: savedAnalysis.id
    });

  } catch (error) {
    console.error('❌ 이미지 URL 분석 API 오류:', error);
    console.error('📋 오류 상세:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      status: error.status
    });
    
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    const statusCode = error.status || error.statusCode || 500;
    
    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? {
        stack: error.stack,
        code: error.code,
        status: error.status
      } : undefined
    });
  }
});

/**
 * POST /api/analyze-and-save
 * 이미지 분석 후 Supabase에 저장 (n8n 연동용)
 * 
 * Request Body:
 * {
 *   "imageBase64": "data:image/jpeg;base64,...",
 *   "birthDate": "2024-01-15",
 *   "phoneNumber": "010-1234-5678" (선택사항),
 *   "instagramId": "@instagram_id" (선택사항)
 * }
 */
app.post('/api/analyze-and-save', async (req, res) => {
  try {
    const { imageBase64, birthDate, phoneNumber, instagramId } = req.body;

    // 입력 검증
    if (!imageBase64 || !birthDate) {
      return res.status(400).json({
        success: false,
        error: 'imageBase64 and birthDate are required'
      });
    }

    // Base64 데이터에서 MIME 타입 추출
    let imageData = imageBase64;
    let mimeType = 'image/jpeg';

    if (imageBase64.startsWith('data:')) {
      const matches = imageBase64.match(/data:([^;]+);base64,(.+)/);
      if (matches) {
        mimeType = matches[1];
        imageData = matches[2];
      }
    }

    // 분석 수행
    const analysisResult = await analyzeSleepEnvironment(
      imageData,
      mimeType,
      birthDate
    );

    const ageInMonths = calculateAgeInMonths(birthDate);

    // Supabase에 저장
    const { data: savedAnalysis, error: saveError } = await supabase
      .from('sleep_analyses')
      .insert({
        image_base64: imageData,
        birth_date: birthDate,
        age_in_months: ageInMonths,
        summary: analysisResult.summary,
        report_slides: null,
        phone_number: phoneNumber || null,
        instagram_id: instagramId || null
      })
      .select()
      .single();

    if (saveError) {
      throw new Error(`Failed to save analysis: ${saveError.message}`);
    }

    // 피드백 항목 저장
    if (analysisResult.feedbackItems && analysisResult.feedbackItems.length > 0) {
      const feedbackItems = analysisResult.feedbackItems.map((item, index) => ({
        analysis_id: savedAnalysis.id,
        item_id: item.id || index + 1,
        x_coordinate: item.x,
        y_coordinate: item.y,
        title: item.title,
        feedback: item.feedback,
        risk_level: item.riskLevel
      }));

      const { error: feedbackError } = await supabase
        .from('sleep_analysis_feedback_items')
        .insert(feedbackItems);

      if (feedbackError) {
        console.error('Failed to save feedback items:', feedbackError);
      }
    }

    // 참고 자료 저장
    if (analysisResult.references && analysisResult.references.length > 0) {
      const references = analysisResult.references.map((ref) => ({
        analysis_id: savedAnalysis.id,
        title: ref.title,
        uri: ref.uri
      }));

      const { error: refError } = await supabase
        .from('sleep_analysis_references')
        .insert(references);

      if (refError) {
        console.error('Failed to save references:', refError);
      }
    }

    // 저장된 데이터 다시 조회
    const { data: fullAnalysis, error: fetchError } = await supabase
      .from('sleep_analyses')
      .select(`
        *,
        sleep_analysis_feedback_items (*),
        sleep_analysis_references (*)
      `)
      .eq('id', savedAnalysis.id)
      .single();

    if (fetchError) {
      console.error('Failed to fetch full analysis:', fetchError);
    }

    res.json({
      success: true,
      data: fullAnalysis || savedAnalysis
    });

  } catch (error) {
    console.error('Analyze and Save API Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * POST /api/analysis/:id/generate-slides
 * 분석 결과의 슬라이드 생성 (n8n 연동용)
 * 
 * URL 파라미터:
 * - id: 분석 ID (analysisId)
 */
app.post('/api/analysis/:id/generate-slides', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Analysis ID is required'
      });
    }

    // Supabase에서 분석 결과 조회
    const { data: analysis, error: fetchError } = await supabase
      .from('sleep_analyses')
      .select('id, image_base64, summary')
      .eq('id', id)
      .single();

    if (fetchError || !analysis) {
      return res.status(404).json({
        success: false,
        error: 'Analysis not found'
      });
    }

    // 피드백 항목 조회
    const { data: feedbackItems } = await supabase
      .from('sleep_analysis_feedback_items')
      .select('id, x, y, title, feedback, risk_level')
      .eq('sleep_analysis_id', id)
      .order('id');

    // 분석 결과 재구성
    const analysisResult = {
      summary: analysis.summary,
      feedbackItems: (feedbackItems || []).map(item => ({
        id: item.id,
        x: item.x,
        y: item.y,
        title: item.title,
        feedback: item.feedback,
        riskLevel: item.risk_level
      })),
      references: []
    };

    // 슬라이드 생성
    console.log(`📊 슬라이드 생성 시작 (분석 ID: ${id})...`);
    const slides = await generateAllSlides(analysisResult, analysis.image_base64);
    console.log(`✅ 슬라이드 생성 완료: ${slides.length}개`);

    // Supabase에 슬라이드 저장
    const { error: updateError } = await supabase
      .from('sleep_analyses')
      .update({ report_slides: slides })
      .eq('id', id);

    if (updateError) {
      throw new Error(`슬라이드 저장 실패: ${updateError.message}`);
    }

    res.json({
      success: true,
      data: {
        analysisId: id,
        slideCount: slides.length,
        message: '슬라이드가 성공적으로 생성되었습니다.'
      }
    });

  } catch (error) {
    console.error('슬라이드 생성 API 오류:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    });
  }
});

/**
 * GET /api/analysis/:id/slides
 * 분석 결과의 슬라이드 조회 (n8n 연동용)
 * 
 * URL 파라미터:
 * - id: 분석 ID (analysisId)
 */
app.get('/api/analysis/:id/slides', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Analysis ID is required'
      });
    }

    // Supabase에서 슬라이드 조회
    const { data: analysis, error } = await supabase
      .from('sleep_analyses')
      .select('id, report_slides, instagram_id, phone_number, created_at')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`슬라이드 조회 실패: ${error.message}`);
    }

    if (!analysis) {
      return res.status(404).json({
        success: false,
        error: 'Analysis not found'
      });
    }

    if (!analysis.report_slides || analysis.report_slides.length === 0) {
      return res.status(404).json({
        success: false,
        error: '슬라이드가 아직 생성되지 않았습니다.'
      });
    }

    res.json({
      success: true,
      data: {
        analysisId: analysis.id,
        slides: analysis.report_slides, // Base64 문자열 배열
        slideCount: analysis.report_slides.length,
        instagramId: analysis.instagram_id,
        phoneNumber: analysis.phone_number,
        createdAt: analysis.created_at
      }
    });

  } catch (error) {
    console.error('슬라이드 조회 API 오류:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    });
  }
});

/**
 * GET /api/health
 * 헬스 체크 엔드포인트
 */
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    geminiConfigured: !!apiKey
  });
});

// ========== 정적 파일 서빙 ==========

// 정적 파일 서빙 (프로덕션 빌드)
app.use(express.static(distDir));

// SPA 라우팅: 모든 요청을 index.html로 리다이렉트
app.get('*', (req, res) => {
  // API 경로는 제외
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      error: 'API endpoint not found'
    });
  }

  // 정적 파일 서빙
  const filePath = path.join(distDir, req.path === '/' ? 'index.html' : req.path);
  
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      // 파일이 없으면 index.html 서빙 (SPA fallback)
      res.sendFile(path.join(distDir, 'index.html'));
    } else {
      res.sendFile(filePath);
    }
  });
});

// 서버 시작
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running at http://0.0.0.0:${PORT}/`);
  console.log(`📡 API endpoints available at http://0.0.0.0:${PORT}/api/`);
  console.log(`🔍 Health check: http://0.0.0.0:${PORT}/api/health`);
  console.log(`🌐 Web app available at http://0.0.0.0:${PORT}/`);
});
