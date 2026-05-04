import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const { code } = await req.json()
    if (!code || typeof code !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'missing_code' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const normalizedCode = code.trim().toLowerCase()

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
        JSON.stringify({ success: false, error: 'invalid_token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Idempotent: if already validated, return success without consuming another invite
    if (user.app_metadata?.invite_validated === true) {
      return new Response(
        JSON.stringify({ success: true, alreadyValidated: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const { data: invite, error: inviteError } = await adminClient
      .from('invitations')
      .select('id, used_at, expires_at')
      .eq('code', normalizedCode)
      .single()

    if (inviteError || !invite) {
      return new Response(
        JSON.stringify({ success: false, error: 'not_found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    if (invite.used_at) {
      return new Response(
        JSON.stringify({ success: false, error: 'already_used' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    if (new Date(invite.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ success: false, error: 'expired' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Optimistic lock: only update if still unused — handles race condition where
    // two clients submit the same code simultaneously
    const { error: updateError } = await adminClient
      .from('invitations')
      .update({ used_by: user.id, used_at: new Date().toISOString() })
      .eq('id', invite.id)
      .is('used_at', null)

    if (updateError) {
      return new Response(
        JSON.stringify({ success: false, error: 'race_condition' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Set invite_validated in app_metadata — service role only, client cannot do this
    const { error: metaError } = await adminClient.auth.admin.updateUserById(user.id, {
      app_metadata: { invite_validated: true },
    })

    if (metaError) {
      // Roll back the invite consumption so the user can retry
      await adminClient
        .from('invitations')
        .update({ used_by: null, used_at: null })
        .eq('id', invite.id)

      return new Response(
        JSON.stringify({ success: false, error: 'metadata_update_failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: 'server_error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
