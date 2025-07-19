import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const origin = url.searchParams.get('origin') || '*';
    const theme = url.searchParams.get('theme') || 'light';
    const route = url.searchParams.get('route') || '/';
    
    // Get the app HTML content
    const appHtml = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Shaurya - Embedded</title>
    <link rel="icon" href="/Shaurya.png" />
    <style>
      body {
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      }
      .iframe-container {
        width: 100%;
        height: 100vh;
        border: none;
        overflow: hidden;
      }
      .loading {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        font-size: 18px;
        color: #666;
      }
    </style>
  </head>
  <body>
    <div id="loading" class="loading">Loading Shaurya...</div>
    <iframe 
      id="app-frame"
      class="iframe-container"
      src="${origin === '*' ? window.location.origin : origin}${route}?embedded=true&theme=${theme}"
      style="display: none;"
      onload="document.getElementById('loading').style.display = 'none'; this.style.display = 'block';"
      allowfullscreen
    ></iframe>
    
    <script>
      // Handle iframe communication
      window.addEventListener('message', function(event) {
        const iframe = document.getElementById('app-frame');
        if (event.data.type === 'resize') {
          iframe.style.height = event.data.height + 'px';
        }
      });
      
      // Set initial theme
      document.documentElement.setAttribute('data-theme', '${theme}');
    </script>
  </body>
</html>`;

    return new Response(appHtml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html',
        'X-Frame-Options': 'ALLOWALL',
        'X-Content-Type-Options': 'nosniff',
      },
    });

  } catch (error) {
    console.error('Error in iframe-embed function:', error);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
})