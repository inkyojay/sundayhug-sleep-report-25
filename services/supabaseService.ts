/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';
import { AnalysisReport } from '../types';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || 'https://ugzwgegkvxcczwiottej.supabase.co';
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnendnZWdrdnhjY3p3aW90dGVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3MTI2NzAsImV4cCI6MjA3NzI4ODY3MH0._ezV2r8kAvjIlovx6U_L0XzW9nWtSR0MY-RpMISPK38';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface SleepAnalysisRecord {
  id?: string;
  image_url?: string;
  image_base64?: string;
  birth_date: string;
  age_in_months: number;
  summary: string;
  report_slides?: string[]; // 인스타그램 슬라이드 이미지 (Base64 배열)
  created_at?: string;
}

export interface FeedbackItemRecord {
  id?: string;
  analysis_id: string;
  item_id: number;
  x: number;
  y: number;
  title: string;
  feedback: string;
  risk_level: 'High' | 'Medium' | 'Low' | 'Info';
}

export interface ReferenceRecord {
  id?: string;
  analysis_id: string;
  title: string;
  uri: string;
}

/**
 * 수면 분석 결과를 Supabase에 저장
 */
export async function saveSleepAnalysis(
  report: AnalysisReport,
  birthDate: string,
  ageInMonths: number,
  imageBase64?: string,
  reportSlides?: string[],
  phoneNumber?: string | null,
  instagramId?: string | null
): Promise<string> {
  try {
    // 1. 메인 분석 결과 저장
    const { data: analysisData, error: analysisError } = await supabase
      .from('sleep_analyses')
      .insert({
        birth_date: birthDate,
        age_in_months: ageInMonths,
        summary: report.summary,
        image_base64: imageBase64 || null,
        report_slides: reportSlides || null,
        phone_number: phoneNumber,
        instagram_id: instagramId,
      })
      .select('id')
      .single();

    if (analysisError) {
      throw new Error(`분석 결과 저장 실패: ${analysisError.message}`);
    }

    const analysisId = analysisData.id;

    // 2. 피드백 항목들 저장
    if (report.feedbackItems && report.feedbackItems.length > 0) {
      const feedbackItems: Omit<FeedbackItemRecord, 'id'>[] = report.feedbackItems.map(item => ({
        analysis_id: analysisId,
        item_id: item.id,
        x: item.x,
        y: item.y,
        title: item.title,
        feedback: item.feedback,
        risk_level: item.riskLevel,
      }));

      const { error: feedbackError } = await supabase
        .from('sleep_analysis_feedback_items')
        .insert(feedbackItems);

      if (feedbackError) {
        throw new Error(`피드백 항목 저장 실패: ${feedbackError.message}`);
      }
    }

    // 3. 참고 자료 저장
    if (report.references && report.references.length > 0) {
      const references: Omit<ReferenceRecord, 'id'>[] = report.references.map(ref => ({
        analysis_id: analysisId,
        title: ref.title,
        uri: ref.uri,
      }));

      const { error: referencesError } = await supabase
        .from('sleep_analysis_references')
        .insert(references);

      if (referencesError) {
        throw new Error(`참고 자료 저장 실패: ${referencesError.message}`);
      }
    }

    return analysisId;
  } catch (error) {
    console.error('Supabase 저장 오류:', error);
    throw error;
  }
}

/**
 * 분석 결과 조회
 */
export async function getSleepAnalysis(analysisId: string) {
  try {
    // 메인 분석 결과 조회
    const { data: analysis, error: analysisError } = await supabase
      .from('sleep_analyses')
      .select('*')
      .eq('id', analysisId)
      .single();

    if (analysisError) {
      throw new Error(`분석 결과 조회 실패: ${analysisError.message}`);
    }

    // 피드백 항목 조회
    const { data: feedbackItems, error: feedbackError } = await supabase
      .from('sleep_analysis_feedback_items')
      .select('*')
      .eq('analysis_id', analysisId)
      .order('item_id', { ascending: true });

    if (feedbackError) {
      throw new Error(`피드백 항목 조회 실패: ${feedbackError.message}`);
    }

    // 참고 자료 조회
    const { data: references, error: referencesError } = await supabase
      .from('sleep_analysis_references')
      .select('*')
      .eq('analysis_id', analysisId);

    if (referencesError) {
      throw new Error(`참고 자료 조회 실패: ${referencesError.message}`);
    }

    return {
      analysis,
      feedbackItems: feedbackItems || [],
      references: references || [],
    };
  } catch (error) {
    console.error('Supabase 조회 오류:', error);
    throw error;
  }
}

/**
 * 분석 결과에 슬라이드 추가 (업데이트)
 */
export async function updateSleepAnalysisSlides(
  analysisId: string,
  reportSlides: string[]
): Promise<void> {
  try {
    const { error } = await supabase
      .from('sleep_analyses')
      .update({ report_slides: reportSlides })
      .eq('id', analysisId);

    if (error) {
      throw new Error(`슬라이드 저장 실패: ${error.message}`);
    }

    console.log('슬라이드가 Supabase에 저장되었습니다.');
  } catch (error) {
    console.error('Supabase 슬라이드 저장 오류:', error);
    throw error;
  }
}

/**
 * 최근 분석 결과 목록 조회
 */
export async function getRecentSleepAnalyses(limit: number = 10) {
  try {
    const { data, error } = await supabase
      .from('sleep_analyses')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`분석 결과 목록 조회 실패: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Supabase 조회 오류:', error);
    throw error;
  }
}

