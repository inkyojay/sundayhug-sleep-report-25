import html2canvas from 'html2canvas';
import { AnalysisReport } from '../types';

export interface SlideData {
  canvas: HTMLCanvasElement;
  dataUrl: string;
  blob: Blob;
}

const INSTAGRAM_WIDTH = 1080;
const INSTAGRAM_HEIGHT = 1350;

/**
 * HTML 요소를 인스타그램 최적화 이미지로 변환
 */
async function elementToImage(element: HTMLElement): Promise<SlideData> {
  const canvas = await html2canvas(element, {
    width: INSTAGRAM_WIDTH,
    height: INSTAGRAM_HEIGHT,
    scale: 2, // 고해상도
    backgroundColor: '#ffffff',
    logging: false,
    useCORS: true,
  });

  const dataUrl = canvas.toDataURL('image/png');
  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/png', 1.0);
  });

  return { canvas, dataUrl, blob };
}

/**
 * 슬라이드 0: 인트로 페이지 (썬데이허그 스타일)
 */
export async function createSlide0(): Promise<SlideData> {
  const container = document.createElement('div');
  container.style.width = `${INSTAGRAM_WIDTH}px`;
  container.style.height = `${INSTAGRAM_HEIGHT}px`;
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.backgroundColor = '#F5F1E8'; // 베이지 크림색
  container.style.padding = '60px';
  container.style.boxSizing = 'border-box';
  container.style.fontFamily = 'Arial, sans-serif';
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.justifyContent = 'space-between';

  const html = `
    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
      <div style="font-size: 28px; color: #2d2d2d; font-weight: 500;">@sundayhug.kr</div>
      <div style="font-size: 28px; color: #2d2d2d; font-weight: 500;">1/10</div>
    </div>
    
    <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
      <div style="font-size: 42px; color: #6B4E3D; font-weight: 500; margin-bottom: 50px; letter-spacing: -1px;">
        썬데이허그와 함께하는
      </div>
      
      <div style="font-size: 90px; color: #2d2d2d; font-weight: 900; line-height: 1.2; margin-bottom: 80px; letter-spacing: -2px;">
        우리아기<br>안전한 수면환경<br>만들기
      </div>
      
      <div style="background: #2d3748; color: white; padding: 24px 60px; border-radius: 50px; font-size: 32px; font-weight: 500;">
        수면 환경 분석 레포트
      </div>
    </div>
  `;
  
  container.innerHTML = html;
  document.body.appendChild(container);

  const result = await elementToImage(container);
  document.body.removeChild(container);
  
  return result;
}

/**
 * 슬라이드 1: 분석된 이미지 (번호 핀 포함)
 */
export async function createSlide1(
  imageElement: HTMLImageElement,
  feedbackItems: AnalysisReport['feedbackItems']
): Promise<SlideData> {
  const container = document.createElement('div');
  container.style.width = `${INSTAGRAM_WIDTH}px`;
  container.style.height = `${INSTAGRAM_HEIGHT}px`;
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.backgroundColor = '#F5F1E8';
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.padding = '60px';
  container.style.boxSizing = 'border-box';

  // 헤더
  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.marginBottom = '30px';
  
  const account = document.createElement('div');
  account.style.fontSize = '28px';
  account.style.color = '#2d2d2d';
  account.style.fontWeight = '500';
  account.textContent = '@sundayhug.kr';
  
  const pageNum = document.createElement('div');
  pageNum.style.fontSize = '28px';
  pageNum.style.color = '#2d2d2d';
  pageNum.style.fontWeight = '500';
  pageNum.textContent = '2/10';
  
  header.appendChild(account);
  header.appendChild(pageNum);
  container.appendChild(header);

  // 제목
  const title = document.createElement('div');
  title.style.fontSize = '52px';
  title.style.fontWeight = 'bold';
  title.style.color = '#2d2d2d';
  title.style.marginBottom = '30px';
  title.textContent = '종합 요약';
  container.appendChild(title);

  // 이미지 래퍼 (중앙 정렬용)
  const imageWrapper = document.createElement('div');
  imageWrapper.style.flex = '1';
  imageWrapper.style.display = 'flex';
  imageWrapper.style.justifyContent = 'center';
  imageWrapper.style.alignItems = 'center';
  imageWrapper.style.position = 'relative';
  
  // 이미지 컨테이너
  const imageContainer = document.createElement('div');
  imageContainer.style.position = 'relative';
  imageContainer.style.width = '900px';
  imageContainer.style.height = '900px';
  imageContainer.style.backgroundColor = 'white';
  imageContainer.style.borderRadius = '20px';
  imageContainer.style.overflow = 'hidden';
  imageContainer.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
  
  // 이미지
  const img = imageElement.cloneNode(true) as HTMLImageElement;
  img.style.width = '100%';
  img.style.height = '100%';
  img.style.objectFit = 'cover';
  img.style.objectPosition = 'center';
  imageContainer.appendChild(img);

  // 핀 추가
  feedbackItems.forEach(item => {
    const pin = document.createElement('div');
    pin.style.position = 'absolute';
    pin.style.left = `${item.x}%`;
    pin.style.top = `${item.y}%`;
    pin.style.width = '56px';
    pin.style.height = '56px';
    pin.style.borderRadius = '50%';
    pin.style.fontSize = '32px';
    pin.style.fontWeight = 'bold';
    pin.style.color = '#ffffff';
    pin.style.transform = 'translate(-50%, -50%)';
    pin.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.4)';
    pin.style.border = '3px solid white';
    pin.style.lineHeight = '50px'; // 정확한 라인 높이
    pin.style.textAlign = 'center';
    pin.style.fontFamily = 'Arial, Helvetica, sans-serif';
    pin.style.paddingTop = '0';
    pin.style.verticalAlign = 'middle';
    
    const bgColors: Record<string, string> = {
      High: '#FF6B6B',
      Medium: '#FFB74D',
      Low: '#66BB6A',
      Info: '#42A5F5',
    };
    pin.style.backgroundColor = bgColors[item.riskLevel] || '#42A5F5';
    pin.innerHTML = `<span style="display: inline-block; line-height: 1; transform: translateY(-2px);">${item.id}</span>`;
    imageContainer.appendChild(pin);
  });

  imageWrapper.appendChild(imageContainer);
  container.appendChild(imageWrapper);
  document.body.appendChild(container);

  const result = await elementToImage(container);
  document.body.removeChild(container);
  
  return result;
}

/**
 * 슬라이드 2: 종합 요약
 */
export async function createSlide2(summary: string): Promise<SlideData> {
  const container = document.createElement('div');
  container.style.width = `${INSTAGRAM_WIDTH}px`;
  container.style.height = `${INSTAGRAM_HEIGHT}px`;
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.backgroundColor = '#F5F1E8';
  container.style.padding = '60px';
  container.style.boxSizing = 'border-box';
  container.style.fontFamily = 'Arial, sans-serif';

  const html = `
    <div style="height: 100%; display: flex; flex-direction: column;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
        <div style="font-size: 28px; color: #2d2d2d; font-weight: 500;">@sundayhug.kr</div>
        <div style="font-size: 28px; color: #2d2d2d; font-weight: 500;">3/10</div>
      </div>
      
      <div style="font-size: 52px; font-weight: bold; color: #2d2d2d; margin-bottom: 50px; text-align: left;">
        종합 요약
      </div>
      
      <div style="flex: 1; background: white; border-radius: 20px; padding: 50px; box-shadow: 0 2px 20px rgba(0, 0, 0, 0.08);">
        <div style="font-size: 32px; line-height: 1.8; color: #2d2d2d; word-break: keep-all;">
          ${summary}
        </div>
      </div>
    </div>
  `;
  
  container.innerHTML = html;
  document.body.appendChild(container);

  const result = await elementToImage(container);
  document.body.removeChild(container);
  
  return result;
}

/**
 * 슬라이드 3+: 개별 피드백 항목 (한 슬라이드에 2개씩)
 */
export async function createFeedbackSlide(
  items: AnalysisReport['feedbackItems'],
  startIndex: number,
  slideNumber: number
): Promise<SlideData> {
  const container = document.createElement('div');
  container.style.width = `${INSTAGRAM_WIDTH}px`;
  container.style.height = `${INSTAGRAM_HEIGHT}px`;
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.backgroundColor = '#F5F1E8';
  container.style.padding = '60px';
  container.style.boxSizing = 'border-box';
  container.style.fontFamily = 'Arial, sans-serif';

  const displayItems = items.slice(startIndex, startIndex + 2);
  
  const itemsHtml = displayItems.map(item => {
    const bgColors: Record<string, string> = {
      High: '#FFE5E5',
      Medium: '#FFF4E5',
      Low: '#E8F5E9',
      Info: '#E3F2FD',
    };
    const borderColors: Record<string, string> = {
      High: '#FF6B6B',
      Medium: '#FFB74D',
      Low: '#66BB6A',
      Info: '#42A5F5',
    };
    const textColors: Record<string, string> = {
      High: '#C62828',
      Medium: '#E65100',
      Low: '#2E7D32',
      Info: '#1565C0',
    };

    return `
      <div style="background: ${bgColors[item.riskLevel]}; border-left: 8px solid ${borderColors[item.riskLevel]}; border-radius: 20px; padding: 35px; margin-bottom: 25px;">
        <div style="display: flex; align-items: center; margin-bottom: 18px;">
          <div style="width: 56px; height: 56px; background: ${borderColors[item.riskLevel]}; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: bold; margin-right: 20px; line-height: 1; font-family: Arial, sans-serif;">
            ${item.id}
          </div>
          <div>
            <div style="font-size: 38px; font-weight: bold; color: ${textColors[item.riskLevel]};">
              ${item.title}
            </div>
            <div style="font-size: 26px; color: ${textColors[item.riskLevel]}; margin-top: 5px;">
              위험도: ${item.riskLevel}
            </div>
          </div>
        </div>
        <div style="font-size: 30px; line-height: 1.7; color: #2d2d2d; word-break: keep-all;">
          ${item.feedback}
        </div>
      </div>
    `;
  }).join('');

  const html = `
    <div style="height: 100%; display: flex; flex-direction: column;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
        <div style="font-size: 28px; color: #2d2d2d; font-weight: 500;">@sundayhug.kr</div>
        <div style="font-size: 28px; color: #2d2d2d; font-weight: 500;">${slideNumber}/10</div>
      </div>
      
      <div style="font-size: 52px; font-weight: bold; color: #2d2d2d; margin-bottom: 40px;">
        상세 분석
      </div>
      
      <div style="flex: 1; overflow: hidden;">
        ${itemsHtml}
      </div>
    </div>
  `;
  
  container.innerHTML = html;
  document.body.appendChild(container);

  const result = await elementToImage(container);
  document.body.removeChild(container);
  
  return result;
}

/**
 * 모든 슬라이드 생성 (화면에서 직접 캡처)
 */
export async function generateAllSlidesFromScreen(
  report: AnalysisReport
): Promise<SlideData[]> {
  const slides: SlideData[] = [];

  // 슬라이드 0: 인트로
  slides.push(await createSlide0());

  // 슬라이드 1: 화면에서 이미지 컨테이너 찾기
  const imageContainer = document.querySelector('.report-image-container') as HTMLElement;
  if (imageContainer) {
    slides.push(await createSlide1FromScreen(imageContainer));
  }

  // 슬라이드 2: 종합 요약
  slides.push(await createSlide2(report.summary));

  // 슬라이드 3+: 피드백 항목 (2개씩)
  let slideNumber = 4;
  for (let i = 0; i < report.feedbackItems.length; i += 2) {
    slides.push(await createFeedbackSlide(report.feedbackItems, i, slideNumber));
    slideNumber++;
  }

  return slides;
}

/**
 * 슬라이드를 ZIP으로 다운로드
 */
export async function downloadSlidesAsZip(slides: SlideData[], filename: string = '수면분석리포트') {
  // JSZip이 없으므로 개별 다운로드로 대체
  slides.forEach((slide, index) => {
    const link = document.createElement('a');
    link.href = slide.dataUrl;
    link.download = `${filename}_${index + 1}.png`;
    link.click();
  });
}

/**
 * 슬라이드를 Base64 배열로 변환 (Supabase 저장용)
 */
export function slidesToBase64Array(slides: SlideData[]): string[] {
  return slides.map(slide => slide.dataUrl.split(',')[1]);
}

