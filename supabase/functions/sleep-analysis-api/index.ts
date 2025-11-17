import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
}

Deno.serve(async (req: Request) => {
  // CORS preflight 요청 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const url = new URL(req.url);
    const path = url.pathname.replace('/sleep-analysis-api', '');
    const method = req.method;

    // GET /sleep-analyses - 분석 결과 목록 조회
    if (method === 'GET' && path === '/sleep-analyses') {
      const limit = parseInt(url.searchParams.get('limit') || '10');
      const offset = parseInt(url.searchParams.get('offset') || '0');
      const birthDate = url.searchParams.get('birth_date');
      const ageInMonths = url.searchParams.get('age_in_months');

      let query = supabase
        .from('sleep_analyses')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (birthDate) {
        query = query.eq('birth_date', birthDate);
      }
      if (ageInMonths) {
        query = query.eq('age_in_months', parseInt(ageInMonths));
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: data || [],
          count: data?.length || 0,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // GET /sleep-analyses/:id - 특정 분석 결과 조회 (피드백 및 참고 자료 포함)
    if (method === 'GET' && path.startsWith('/sleep-analyses/')) {
      const analysisId = path.split('/')[2];

      if (!analysisId) {
        return new Response(
          JSON.stringify({ success: false, error: 'Analysis ID is required' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        );
      }

      // 메인 분석 결과 조회
      const { data: analysis, error: analysisError } = await supabase
        .from('sleep_analyses')
        .select('*')
        .eq('id', analysisId)
        .single();

      if (analysisError) {
        throw analysisError;
      }

      // 피드백 항목 조회
      const { data: feedbackItems, error: feedbackError } = await supabase
        .from('sleep_analysis_feedback_items')
        .select('*')
        .eq('analysis_id', analysisId)
        .order('item_id', { ascending: true });

      if (feedbackError) {
        throw feedbackError;
      }

      // 참고 자료 조회
      const { data: references, error: referencesError } = await supabase
        .from('sleep_analysis_references')
        .select('*')
        .eq('analysis_id', analysisId);

      if (referencesError) {
        throw referencesError;
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            ...analysis,
            feedbackItems: feedbackItems || [],
            references: references || [],
          },
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // GET /sleep-analyses/stats - 통계 정보 조회
    if (method === 'GET' && path === '/sleep-analyses/stats') {
      const { data: totalAnalyses, error: totalError } = await supabase
        .from('sleep_analyses')
        .select('id', { count: 'exact', head: true });

      if (totalError) {
        throw totalError;
      }

      const { data: riskLevelStats, error: riskError } = await supabase
        .from('sleep_analysis_feedback_items')
        .select('risk_level');

      if (riskError) {
        throw riskError;
      }

      const riskCounts = {
        High: 0,
        Medium: 0,
        Low: 0,
        Info: 0,
      };

      riskLevelStats?.forEach((item) => {
        if (item.risk_level in riskCounts) {
          riskCounts[item.risk_level as keyof typeof riskCounts]++;
        }
      });

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            totalAnalyses: totalAnalyses?.length || 0,
            riskLevelDistribution: riskCounts,
          },
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // 지원하지 않는 엔드포인트
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Endpoint not found',
        availableEndpoints: [
          'GET /sleep-analyses',
          'GET /sleep-analyses/:id',
          'GET /sleep-analyses/stats',
        ],
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      }
    );
  } catch (error) {
    console.error('API Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

