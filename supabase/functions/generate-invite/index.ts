import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MAX_ACTIVE_INVITES = 5
const EXPIRY_DAYS = 7

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  try {
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )

    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'invalid_token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Only invite-validated users can generate invites
    if (!user.app_metadata?.invite_validated) {
      return new Response(
        JSON.stringify({ error: 'not_validated' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Count active (unused + unexpired) invites for this user
    const { count, error: countError } = await adminClient
      .from('invitations')
      .select('id', { count: 'exact', head: true })
      .eq('created_by', user.id)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())

    if (countError) {
      return new Response(
        JSON.stringify({ error: 'server_error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    if ((count ?? 0) >= MAX_ACTIVE_INVITES) {
      return new Response(
        JSON.stringify({ error: 'limit_reached', limit: MAX_ACTIVE_INVITES }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + EXPIRY_DAYS)

    const { data: invite, error: insertError } = await adminClient
      .from('invitations')
      .insert({ created_by: user.id, expires_at: expiresAt.toISOString() })
      .select('code, expires_at')
      .single()

    if (insertError || !invite) {
      return new Response(
        JSON.stringify({ error: 'server_error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    return new Response(
      JSON.stringify({ code: invite.code, expiresAt: invite.expires_at }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch {
    return new Response(
      JSON.stringify({ error: 'server_error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
