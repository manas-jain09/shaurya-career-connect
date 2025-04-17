
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

async function validateGeminiApiKey() {
  if (!GEMINI_API_KEY) {
    return { 
      valid: false, 
      errorMessage: 'GEMINI_API_KEY is not set in environment variables' 
    };
  }
  
  try {
    // Simple test call to Gemini API to validate the key
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GEMINI_API_KEY}`,
      },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [{ text: "Hello" }]
        }],
        generationConfig: {
          maxOutputTokens: 10,
        },
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Gemini API key validation failed (Status ${response.status}):`, errorText);
      
      if (response.status === 401) {
        return { 
          valid: false, 
          errorMessage: 'The Gemini API key is invalid or has expired. Please update it in your Supabase secrets.' 
        };
      }
      
      return { 
        valid: false, 
        errorMessage: 'Failed to validate Gemini API key. Please check the key and try again.' 
      };
    }
    
    return { valid: true, errorMessage: null };
  } catch (error) {
    console.error('Error validating Gemini API key:', error);
    return { 
      valid: false, 
      errorMessage: 'Error validating Gemini API key: ' + (error.message || 'Unknown error') 
    };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate Gemini API key
    const keyValidation = await validateGeminiApiKey();
    if (!keyValidation.valid) {
      console.error(keyValidation.errorMessage);
      return new Response(
        JSON.stringify({ 
          error: keyValidation.errorMessage
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
    let conversationMessages = [...messages];
    if (history && Array.isArray(history)) {
      // Filter out system messages to avoid issues
      const filteredHistory = history.filter(msg => msg.role !== 'system');
      const recentHistory = filteredHistory.slice(-10);
      
      conversationMessages = [
        ...messages,
        ...recentHistory.map((msg: Message) => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        }))
      ];
    }

    console.log('Calling Gemini API with messages:', JSON.stringify(conversationMessages, null, 2));

    // Call Gemini API with proper error handling
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GEMINI_API_KEY}`,
      },
      body: JSON.stringify({
        contents: conversationMessages,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Gemini API error (Status ${response.status}):`, errorText);
      
      if (response.status === 401) {
        return new Response(
          JSON.stringify({ 
            error: "Authentication failed. Your Gemini API key appears to be invalid or expired. Please update it in your Supabase secrets."
          }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Return a more user-friendly error message
      return new Response(
        JSON.stringify({ 
          error: "Sorry, I'm having trouble connecting to the AI service. Please check your API key configuration or try again later." 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await response.json();
    
    // Validate the response structure
    if (!result.candidates || !result.candidates[0]?.content?.parts?.length) {
      console.error('Invalid response structure from Gemini API:', JSON.stringify(result));
      return new Response(
        JSON.stringify({ error: "Received an invalid response from the AI service. Please try again." }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = result.candidates[0].content.parts[0].text;
    
    console.log('Successful response from Gemini API');

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in admin-chat function:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred. Please try again later.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
