import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisReport } from '../types';

function fileToGenerativePart(base64: string, mimeType: string) {
  return {
    inlineData: {
      data: base64,
      mimeType
    },
  };
}

const calculateAgeInMonths = (birthDate: string): number => {
    const birth = new Date(birthDate);
    const today = new Date();
    let months = (today.getFullYear() - birth.getFullYear()) * 12;
    months -= birth.getMonth();
    months += today.getMonth();
    return months <= 0 ? 0 : months;
};

export async function analyzeSleepEnvironment(
  imageBase64: string,
  imageMimeType: string,
  birthDate: string
): Promise<AnalysisReport> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

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
        // Fix: responseMimeType과 responseSchema만 사용 (Google Search 제거)
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
    
    const parsedResult = JSON.parse(jsonText) as AnalysisReport;
    
    // Supplement references from grounding metadata if API doesn't populate the schema field
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
       const groundReferences = response.candidates[0].groundingMetadata.groundingChunks
        .filter(chunk => chunk.web && chunk.web.uri && chunk.web.title)
        .map(chunk => ({
            title: chunk.web!.title!,
            uri: chunk.web!.uri!
        }));
      
      // Merge and deduplicate references
      const allRefs = [...(parsedResult.references || []), ...groundReferences];
      const uniqueRefs = Array.from(new Map(allRefs.map(item => [item.uri, item])).values());
      parsedResult.references = uniqueRefs;
    }

    return parsedResult;

  } catch (error) {
    console.error("Error analyzing image with Gemini:", error);
    if (error instanceof SyntaxError) {
        throw new Error("AI가 예상치 못한 형식으로 응답했습니다. 다시 시도해 주세요.");
    }
    throw new Error("AI 분석에 실패했습니다. 이미지를 확인하고 다시 시도해 주세요.");
  }
}