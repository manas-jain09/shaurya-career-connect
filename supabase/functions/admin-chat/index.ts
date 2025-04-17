
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Message {
  role: string;
  content: string;
}

async function queryDatabase(query: string) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data, error } = await supabase.rpc('execute_query', { query_text: query });
  
  if (error) {
    console.error('Database query error:', error);
    return { error: error.message };
  }
  
  return { data };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (!GEMINI_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'Gemini API key is not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { query, history } = await req.json();
    
    // Construct the prompt with system context and history
    const messages = [
      {
        role: "user",
        parts: [{
          text: `You are an AI assistant for the Shaurya Placement Portal administrators. 
          You can help query information about students, jobs, applications, and other data in the system. 
          
          The database has the following tables:
          - student_profiles: Contains student information
          - class_x_details: Class X education details
          - class_xii_details: Class XII education details
          - graduation_details: College education details
          - job_postings: Available jobs
          - job_applications: Student applications for jobs
          - companies: Employer information
          - resumes: Student resume documents
          - notifications: System notifications
          
          When asked about data, first try to understand what information is needed, then suggest a query. 
          Respond in a helpful, conversational manner. Always prioritize privacy and security. 
          Do not execute dangerous queries or reveal sensitive information like passwords.
          
          Use PostgreSQL query syntax when suggesting SQL queries.
          
          Current query: ${query}`
        }]
      }
    ];

    // Add chat history if available
    if (history && Array.isArray(history)) {
      const recentHistory = history.slice(-10);
      messages.push(...recentHistory.map((msg: Message) => ({
        role: msg.role,
        parts: [{ text: msg.content }]
      })));
    }

    // Call Gemini API
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GEMINI_API_KEY}`,
      },
      body: JSON.stringify({
        contents: messages,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${error}`);
    }

    const result = await response.json();
    const aiResponse = result.candidates[0].content.parts[0].text;

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in admin-chat function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
