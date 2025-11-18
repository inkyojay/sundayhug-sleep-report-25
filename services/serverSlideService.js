import { createCanvas, loadImage, registerFont } from 'canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INSTAGRAM_WIDTH = 1080;
const INSTAGRAM_HEIGHT = 1350;

/**
 * 둥근 모서리 사각형 그리기 헬퍼 함수
 */
function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// 한글 폰트 설정
// 폰트 파일이 있으면 로드, 없으면 시스템 폰트 사용
let FONT_LOADED = false;
const fontPath = path.join(__dirname, '../fonts/NotoSansKR-Regular.ttf');
const fontBoldPath = path.join(__dirname, '../fonts/NotoSansKR-Bold.ttf');

try {
  if (fs.existsSync(fontPath)) {
    registerFont(fontPath, { family: 'Noto Sans KR' });
    FONT_LOADED = true;
    console.log('✅ 한글 폰트 파일 로드 성공: NotoSansKR-Regular.ttf');
  }
  if (fs.existsSync(fontBoldPath)) {
    registerFont(fontBoldPath, { family: 'Noto Sans KR', weight: 'bold' });
    console.log('✅ 한글 폰트 파일 로드 성공: NotoSansKR-Bold.ttf');
  }
} catch (error) {
  console.warn('⚠️ 폰트 파일 로드 실패:', error.message);
  console.warn('   시스템 폰트를 사용합니다.');
}

// 서버 환경에서 사용 가능한 한글 폰트 (우선순위 순)
const KOREAN_FONT_FALLBACK = 'Noto Sans CJK KR, NanumGothic, AppleGothic, Malgun Gothic, sans-serif';

// 폰트 헬퍼 함수
function setKoreanFont(ctx, size, weight = 'normal') {
  const weightMap = {
    'normal': 'normal',
    '500': '500',
    'bold': 'bold',
    '900': 'bold' // 900은 bold로 매핑
  };
  const fontWeight = weightMap[weight] || 'normal';
  
  // 폰트 파일이 로드되었으면 'Noto Sans KR' 사용, 아니면 시스템 폰트 사용
  const fontFamily = FONT_LOADED ? 'Noto Sans KR' : KOREAN_FONT_FALLBACK;
  ctx.font = `${fontWeight} ${size}px ${fontFamily}`;
}

/**
 * 슬라이드 0: 인트로 페이지
 */
export async function createSlide0() {
  const canvas = createCanvas(INSTAGRAM_WIDTH, INSTAGRAM_HEIGHT);
  const ctx = canvas.getContext('2d');

  // 배경색
  ctx.fillStyle = '#F5F1E8';
  ctx.fillRect(0, 0, INSTAGRAM_WIDTH, INSTAGRAM_HEIGHT);

  // 헤더
  ctx.fillStyle = '#2d2d2d';
  setKoreanFont(ctx, 28, 'bold');
  ctx.fillText('@sundayhug.kr', 60, 60);
  ctx.fillText('1/10', INSTAGRAM_WIDTH - 60 - ctx.measureText('1/10').width, 60);

  // 메인 텍스트
  ctx.fillStyle = '#6B4E3D';
  setKoreanFont(ctx, 42, '500');
  const line1 = '썬데이허그와 함께하는';
  ctx.fillText(line1, (INSTAGRAM_WIDTH - ctx.measureText(line1).width) / 2, 400);

  ctx.fillStyle = '#2d2d2d';
  setKoreanFont(ctx, 90, '900');
  const lines = ['우리아기', '안전한 수면환경', '만들기'];
  let y = 500;
  lines.forEach(line => {
    ctx.fillText(line, (INSTAGRAM_WIDTH - ctx.measureText(line).width) / 2, y);
    y += 100;
  });

  // 버튼
  ctx.fillStyle = '#2d3748';
  const buttonWidth = 400;
  const buttonHeight = 80;
  const buttonX = (INSTAGRAM_WIDTH - buttonWidth) / 2;
  const buttonY = 1000;
  ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
  
  ctx.fillStyle = 'white';
  setKoreanFont(ctx, 32, '500');
  const buttonText = '수면 환경 분석 레포트';
  ctx.fillText(buttonText, (INSTAGRAM_WIDTH - ctx.measureText(buttonText).width) / 2, buttonY + 50);

  return canvas.toDataURL('image/png').split(',')[1]; // Base64 데이터 부분만 반환
}

/**
 * 슬라이드 1: 분석된 이미지 (핀 포함)
 */
export async function createSlide1(imageBase64, feedbackItems) {
  const canvas = createCanvas(INSTAGRAM_WIDTH, INSTAGRAM_HEIGHT);
  const ctx = canvas.getContext('2d');

  // 배경색
  ctx.fillStyle = '#F5F1E8';
  ctx.fillRect(0, 0, INSTAGRAM_WIDTH, INSTAGRAM_HEIGHT);

  // 헤더
  ctx.fillStyle = '#2d2d2d';
  setKoreanFont(ctx, 28, '500');
  ctx.fillText('@sundayhug.kr', 60, 60);
  ctx.fillText('2/10', INSTAGRAM_WIDTH - 60 - ctx.measureText('2/10').width, 60);

  // 제목
  setKoreanFont(ctx, 52, 'bold');
  ctx.fillText('종합 요약', 60, 150);

  // 이미지 로드 및 그리기
  const imageBuffer = Buffer.from(imageBase64, 'base64');
  const img = await loadImage(imageBuffer);
  
  const imageSize = 900;
  const imageX = (INSTAGRAM_WIDTH - imageSize) / 2;
  const imageY = 200;

  // 이미지 배경 (흰색 둥근 모서리)
  ctx.fillStyle = 'white';
  drawRoundedRect(ctx, imageX, imageY, imageSize, imageSize, 20);
  ctx.fill();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 4;

  // 이미지 그리기
  ctx.save();
  drawRoundedRect(ctx, imageX, imageY, imageSize, imageSize, 20);
  ctx.clip();
  ctx.drawImage(img, imageX, imageY, imageSize, imageSize);
  ctx.restore();
  ctx.shadowBlur = 0;

  // 핀 그리기
  const pinSize = 56;
  feedbackItems.forEach(item => {
    const pinX = imageX + (item.x / 100) * imageSize;
    const pinY = imageY + (item.y / 100) * imageSize;

    const bgColors = {
      High: '#FF6B6B',
      Medium: '#FFB74D',
      Low: '#66BB6A',
      Info: '#42A5F5',
    };

    ctx.fillStyle = bgColors[item.riskLevel] || '#42A5F5';
    ctx.beginPath();
    ctx.arc(pinX, pinY, pinSize / 2, 0, Math.PI * 2);
    ctx.fill();

    // 흰색 테두리
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 번호 텍스트
    ctx.fillStyle = 'white';
    setKoreanFont(ctx, 32, 'bold');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.id.toString(), pinX, pinY);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  });

  return canvas.toDataURL('image/png').split(',')[1];
}

/**
 * 슬라이드 2: 종합 요약
 */
export async function createSlide2(summary) {
  const canvas = createCanvas(INSTAGRAM_WIDTH, INSTAGRAM_HEIGHT);
  const ctx = canvas.getContext('2d');

  // 배경색
  ctx.fillStyle = '#F5F1E8';
  ctx.fillRect(0, 0, INSTAGRAM_WIDTH, INSTAGRAM_HEIGHT);

  // 헤더
  ctx.fillStyle = '#2d2d2d';
  setKoreanFont(ctx, 28, '500');
  ctx.fillText('@sundayhug.kr', 60, 60);
  ctx.fillText('3/10', INSTAGRAM_WIDTH - 60 - ctx.measureText('3/10').width, 60);

  // 제목
  setKoreanFont(ctx, 52, 'bold');
  ctx.fillText('종합 요약', 60, 150);

  // 요약 텍스트 박스
  const boxX = 60;
  const boxY = 200;
  const boxWidth = INSTAGRAM_WIDTH - 120;
  const boxHeight = INSTAGRAM_HEIGHT - 280;

  ctx.fillStyle = 'white';
  drawRoundedRect(ctx, boxX, boxY, boxWidth, boxHeight, 20);
  ctx.fill();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 2;

  // 텍스트
  ctx.fillStyle = '#2d2d2d';
  setKoreanFont(ctx, 32, 'normal');
  ctx.textAlign = 'left';
  
  // 텍스트 줄바꿈 처리
  const maxWidth = boxWidth - 100;
  const lineHeight = 50;
  let y = boxY + 80;
  const words = summary.split('');
  let line = '';

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i];
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && line.length > 0) {
      ctx.fillText(line, boxX + 50, y);
      line = words[i];
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line.length > 0) {
    ctx.fillText(line, boxX + 50, y);
  }

  ctx.shadowBlur = 0;

  return canvas.toDataURL('image/png').split(',')[1];
}

/**
 * 슬라이드 3+: 피드백 항목 (한 슬라이드에 2개씩)
 */
export async function createFeedbackSlide(items, startIndex, slideNumber) {
  const canvas = createCanvas(INSTAGRAM_WIDTH, INSTAGRAM_HEIGHT);
  const ctx = canvas.getContext('2d');

  // 배경색
  ctx.fillStyle = '#F5F1E8';
  ctx.fillRect(0, 0, INSTAGRAM_WIDTH, INSTAGRAM_HEIGHT);

  // 헤더
  ctx.fillStyle = '#2d2d2d';
  setKoreanFont(ctx, 28, '500');
  ctx.fillText('@sundayhug.kr', 60, 60);
  ctx.fillText(`${slideNumber}/10`, INSTAGRAM_WIDTH - 60 - ctx.measureText(`${slideNumber}/10`).width, 60);

  // 제목
  setKoreanFont(ctx, 52, 'bold');
  ctx.fillText('상세 분석', 60, 150);

  // 피드백 항목 그리기 (최대 2개)
  const displayItems = items.slice(startIndex, startIndex + 2);
  let y = 200;

  displayItems.forEach((item, index) => {
    const bgColors = {
      High: '#FFE5E5',
      Medium: '#FFF4E5',
      Low: '#E8F5E9',
      Info: '#E3F2FD',
    };
    const borderColors = {
      High: '#FF6B6B',
      Medium: '#FFB74D',
      Low: '#66BB6A',
      Info: '#42A5F5',
    };
    const textColors = {
      High: '#C62828',
      Medium: '#E65100',
      Low: '#2E7D32',
      Info: '#1565C0',
    };

    const itemHeight = 350;
    const itemX = 60;
    const itemWidth = INSTAGRAM_WIDTH - 120;

    // 배경
    ctx.fillStyle = bgColors[item.riskLevel] || '#E3F2FD';
    drawRoundedRect(ctx, itemX, y, itemWidth, itemHeight, 20);
    ctx.fill();

    // 왼쪽 테두리
    ctx.fillStyle = borderColors[item.riskLevel] || '#42A5F5';
    ctx.fillRect(itemX, y, 8, itemHeight);

    // 번호 원
    const circleX = itemX + 50;
    const circleY = y + 50;
    const circleRadius = 28;
    ctx.fillStyle = borderColors[item.riskLevel] || '#42A5F5';
    ctx.beginPath();
    ctx.arc(circleX, circleY, circleRadius, 0, Math.PI * 2);
    ctx.fill();

    // 번호 텍스트
    ctx.fillStyle = 'white';
    setKoreanFont(ctx, 32, 'bold');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.id.toString(), circleX, circleY);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    // 제목
    ctx.fillStyle = textColors[item.riskLevel] || '#1565C0';
    setKoreanFont(ctx, 38, 'bold');
    ctx.fillText(item.title, circleX + 50, y + 45);

    // 위험도
    setKoreanFont(ctx, 26, 'normal');
    ctx.fillText(`위험도: ${item.riskLevel}`, circleX + 50, y + 85);

    // 피드백 텍스트
    ctx.fillStyle = '#2d2d2d';
    setKoreanFont(ctx, 30, 'normal');
    const feedbackY = y + 130;
    const feedbackMaxWidth = itemWidth - 150;
    const feedbackLineHeight = 45;
    let feedbackLineY = feedbackY;
    let feedbackLine = '';

    const feedbackWords = item.feedback.split('');
    for (let i = 0; i < feedbackWords.length; i++) {
      const testLine = feedbackLine + feedbackWords[i];
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > feedbackMaxWidth && feedbackLine.length > 0) {
        ctx.fillText(feedbackLine, itemX + 100, feedbackLineY);
        feedbackLine = feedbackWords[i];
        feedbackLineY += feedbackLineHeight;
      } else {
        feedbackLine = testLine;
      }
    }
    if (feedbackLine.length > 0) {
      ctx.fillText(feedbackLine, itemX + 100, feedbackLineY);
    }

    y += itemHeight + 25;
  });

  return canvas.toDataURL('image/png').split(',')[1];
}

/**
 * 모든 슬라이드 생성
 */
export async function generateAllSlides(analysisResult, imageBase64) {
  const slides = [];

  // 슬라이드 0: 인트로
  slides.push(await createSlide0());

  // 슬라이드 1: 분석된 이미지
  slides.push(await createSlide1(imageBase64, analysisResult.feedbackItems || []));

  // 슬라이드 2: 종합 요약
  slides.push(await createSlide2(analysisResult.summary || ''));

  // 슬라이드 3+: 피드백 항목 (2개씩)
  let slideNumber = 4;
  const feedbackItems = analysisResult.feedbackItems || [];
  for (let i = 0; i < feedbackItems.length; i += 2) {
    slides.push(await createFeedbackSlide(feedbackItems, i, slideNumber));
    slideNumber++;
  }

  return slides;
}

