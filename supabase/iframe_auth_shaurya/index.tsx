
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { user_id } = await req.json()

    console.log('Received request with user_id:', user_id)

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Validating user with user_id:', user_id)

    // Validate user exists in auth table
    const { data: userData, error: userError } = await supabase
      .from('auth')
      .select('id, email')
      .eq('id', user_id)
      .single()

    if (userError || !userData) {
      console.log('User validation failed:', userError)
      return new Response(
        JSON.stringify({ error: 'Invalid user_id - user not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('User validated:', userData.email)

    // Generate iframe token
    const iframeToken = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now

    // Store iframe token in auto_login_tokens table for validation
    const { error: tokenError } = await supabase
      .from('auto_login_tokens')
      .insert({
        user_id: user_id,
        token: iframeToken,
        expires_at: expiresAt.toISOString(),
        used: false
      })

    if (tokenError) {
      console.log('Token creation failed:', tokenError)
      return new Response(
        JSON.stringify({ error: 'Failed to create iframe token' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Iframe token created successfully')

    const origin = req.headers.get('origin') || req.headers.get('referer') || 'https://gray-plant-048f51a10.4.azurestaticapps.net'
    const iframeUrl = `${origin}/iframe?token=${iframeToken}`

    return new Response(
      JSON.stringify({ 
        success: true,
        iframe_token: iframeToken,
        expires_at: expiresAt.toISOString(),
        iframe_url: iframeUrl,
        user_email: userData.email
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Iframe auth error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})