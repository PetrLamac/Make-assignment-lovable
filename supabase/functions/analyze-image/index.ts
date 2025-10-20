import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting image analysis request');
    
    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      console.error('No file provided in request');
      return new Response(
        JSON.stringify({ 
          status: 'failed',
          reason: 'No file provided',
          error: 'Missing required field: file'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg'];
    if (!validTypes.includes(file.type)) {
      console.error('Invalid file type:', file.type);
      return new Response(
        JSON.stringify({ 
          status: 'failed',
          reason: `Invalid file type: ${file.type}. Only PNG and JPEG are supported.`
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate file size (15 MB limit)
    const MAX_SIZE = 15 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      console.error('File too large:', file.size);
      return new Response(
        JSON.stringify({ 
          status: 'failed',
          reason: `File size ${(file.size / 1024 / 1024).toFixed(2)} MB exceeds maximum of 15 MB`
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('File validated:', file.name, file.type, file.size, 'bytes');

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(bytes)));
    const dataUrl = `data:${file.type};base64,${base64}`;

    console.log('Sending request to OpenAI Vision API');

    // Call OpenAI Vision API with structured output
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert error analyzer for customer support. Extract structured information from error screenshots.

TAXONOMY for probable_cause (use EXACTLY one of these):
- network_error
- authentication_error
- permission_denied
- timeout
- not_found
- rate_limit
- invalid_input
- server_error
- dependency_down
- unknown

Extract:
1. error_title: Short, clear title (≤100 chars)
2. error_code: Any error code visible (or null)
3. product: Application/service name (or null)
4. environment: Object with os, browser, app, version if visible
5. key_text_blocks: Array of important text with bounding boxes [x,y,w,h] and confidence
6. probable_cause: From taxonomy above
7. suggested_fix: Actionable fix (≤500 chars)
8. severity: low, medium, or high
9. confidence: 0-1 score of analysis accuracy
10. follow_up_questions: 0-3 questions to ask user

Be precise and actionable.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this error screenshot and extract all relevant information for customer support triage.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: dataUrl
                }
              }
            ]
          }
        ],
        max_tokens: 1500,
        temperature: 0.3,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI API error:', openaiResponse.status, errorText);
      return new Response(
        JSON.stringify({ 
          status: 'failed',
          reason: 'OpenAI API error',
          error: `API returned ${openaiResponse.status}`
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openaiData = await openaiResponse.json();
    console.log('Received response from OpenAI');

    const content = openaiData.choices[0].message.content;
    
    // Parse the JSON response from OpenAI
    let parsedData;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      parsedData = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      return new Response(
        JSON.stringify({ 
          status: 'failed',
          reason: 'Failed to parse AI response',
          raw_content: content
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate analysis_id
    const analysis_id = crypto.randomUUID();

    // Prepare response data
    const analysisResult = {
      analysis_id,
      error_title: parsedData.error_title || 'Unknown Error',
      error_code: parsedData.error_code || null,
      product: parsedData.product || null,
      environment: parsedData.environment || null,
      key_text_blocks: parsedData.key_text_blocks || [],
      probable_cause: parsedData.probable_cause || 'unknown',
      suggested_fix: parsedData.suggested_fix || 'No suggestion available',
      severity: parsedData.severity || 'medium',
      confidence: parsedData.confidence || 0.5,
      follow_up_questions: parsedData.follow_up_questions || [],
      status: 'ok' as const,
    };

    // Store in Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const { error: dbError } = await supabase
      .from('image_analyses')
      .insert({
        analysis_id,
        error_title: analysisResult.error_title,
        error_code: analysisResult.error_code,
        product: analysisResult.product,
        environment: analysisResult.environment,
        key_text_blocks: analysisResult.key_text_blocks,
        probable_cause: analysisResult.probable_cause,
        suggested_fix: analysisResult.suggested_fix,
        severity: analysisResult.severity,
        confidence: analysisResult.confidence,
        follow_up_questions: analysisResult.follow_up_questions,
        status: 'ok',
        image_filename: file.name,
        image_size_bytes: file.size,
        requester_ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown',
      });

    if (dbError) {
      console.error('Database error:', dbError);
      // Still return the analysis even if DB save fails
    } else {
      console.log('Analysis saved to database:', analysis_id);
    }

    return new Response(
      JSON.stringify(analysisResult),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in analyze-image function:', error);
    return new Response(
      JSON.stringify({ 
        status: 'failed',
        reason: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
