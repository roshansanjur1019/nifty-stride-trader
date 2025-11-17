import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple encryption using Web Crypto API with a project-specific key
async function encryptCredential(credential: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(credential);
  
  // Use a key derived from Supabase JWT secret for encryption
  const jwtSecret = Deno.env.get('SUPABASE_JWT_SECRET') || '';
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(jwtSecret),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
  
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('skyspear-broker-salt'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encryptedData = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );
  
  // Combine IV and encrypted data, then base64 encode
  const combined = new Uint8Array(iv.length + encryptedData.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encryptedData), iv.length);
  
  return btoa(String.fromCharCode(...combined));
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Create Supabase client with user's auth token
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { apiKey, apiSecret, brokerType } = await req.json();

    // Validate inputs
    if (!apiKey || !apiSecret || !brokerType) {
      throw new Error('Missing required fields: apiKey, apiSecret, or brokerType');
    }

    if (!['zerodha', 'angel_one'].includes(brokerType)) {
      throw new Error('Invalid broker type');
    }

    if (apiKey.length < 10 || apiKey.length > 200) {
      throw new Error('Invalid API key length');
    }

    if (apiSecret.length < 10 || apiSecret.length > 200) {
      throw new Error('Invalid API secret length');
    }

    console.log('Encrypting credentials for user:', user.id);

    // Encrypt credentials
    const encryptedApiKey = await encryptCredential(apiKey);
    const encryptedApiSecret = await encryptCredential(apiSecret);

    // Store encrypted credentials
    const { data, error } = await supabase
      .from('broker_accounts')
      .insert({
        user_id: user.id,
        broker_type: brokerType,
        api_key_encrypted: encryptedApiKey,
        api_secret_encrypted: encryptedApiSecret,
        is_active: true,
        last_connected_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw new Error(`Failed to store credentials: ${error.message}`);
    }

    console.log('Credentials stored successfully');

    return new Response(
      JSON.stringify({ success: true, data }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error storing broker credentials:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
