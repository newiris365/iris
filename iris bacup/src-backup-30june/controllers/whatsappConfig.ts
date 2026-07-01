import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { reloadWhatsAppConfig, sendTextMessage } from '../services/whatsapp';

/** GET /whatsapp/config - Get current WhatsApp API configuration */
export async function getWhatsAppConfig(req: Request, res: Response) {
  try {
    const { data, error } = await supabaseAdmin
      .from('whatsapp_api_config')
      .select('id, provider, api_url, api_key, phone_number_id, from_number, verify_token, access_token, template_namespace, is_active, extra_config, created_at, updated_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // Mask sensitive fields
    const masked = data ? {
      ...data,
      api_key: data.api_key ? '••••••' + data.api_key.slice(-4) : null,
      access_token: data.access_token ? '••••••' + data.access_token.slice(-4) : null,
    } : null;

    return res.json({ success: true, config: masked, hasConfig: !!data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/** POST /whatsapp/config - Save WhatsApp API configuration */
export async function saveWhatsAppConfig(req: Request, res: Response) {
  try {
    const {
      provider, api_url, api_key, phone_number_id,
      from_number, verify_token, access_token,
      template_namespace, extra_config
    } = req.body;

    if (!provider || !api_url || !from_number) {
      return res.status(400).json({ success: false, error: 'provider, api_url, and from_number are required.' });
    }

    // Validate provider-specific fields
    if (provider === 'twilio' && (!api_key || !template_namespace)) {
      return res.status(400).json({ success: false, error: 'Twilio requires api_key (Auth Token) and template_namespace (Account SID).' });
    }
    if (provider === 'meta_cloud' && (!access_token || !phone_number_id)) {
      return res.status(400).json({ success: false, error: 'Meta Cloud API requires access_token and phone_number_id.' });
    }

    // Deactivate existing configs
    await supabaseAdmin
      .from('whatsapp_api_config')
      .update({ is_active: false })
      .eq('is_active', true);

    // Check if updating existing or creating new
    const { data: existing } = await supabaseAdmin
      .from('whatsapp_api_config')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const userId = (req as any).userId || null;

    const configData = {
      provider,
      api_url,
      api_key: api_key?.startsWith('••••') ? undefined : api_key || null,
      phone_number_id: phone_number_id || null,
      from_number,
      verify_token: verify_token || null,
      access_token: access_token?.startsWith('••••') ? undefined : access_token || null,
      template_namespace: template_namespace || null,
      is_active: true,
      extra_config: extra_config || {},
      updated_by: userId,
    };

    // Don't overwrite masked values
    if (configData.api_key === undefined) delete (configData as any).api_key;
    if (configData.access_token === undefined) delete (configData as any).access_token;

    let result;
    if (existing) {
      result = await supabaseAdmin
        .from('whatsapp_api_config')
        .update(configData)
        .eq('id', existing.id)
        .select()
        .single();
    } else {
      result = await supabaseAdmin
        .from('whatsapp_api_config')
        .insert({ ...configData, created_by: userId })
        .select()
        .single();
    }

    if (result.error) throw result.error;

    // Reload config cache
    reloadWhatsAppConfig();

    return res.json({ success: true, message: 'WhatsApp API configuration saved.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/** POST /whatsapp/test - Send a test message */
export async function testWhatsAppMessage(req: Request, res: Response) {
  try {
    const { phone_number } = req.body;
    if (!phone_number) {
      return res.status(400).json({ success: false, error: 'phone_number is required.' });
    }

    const testMsg = `✅ IRIS 365 WhatsApp Test\n\nThis is a test message from your campus management system.\n\nTime: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}\n\nIf you received this, your WhatsApp API is configured correctly!`;

    const sent = await sendTextMessage(phone_number, testMsg, 'general');

    return res.json({
      success: sent,
      message: sent ? 'Test message sent successfully!' : 'Failed to send test message. Check your API configuration.',
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/** GET /whatsapp/delivery-log - Get recent delivery logs */
export async function getWhatsAppDeliveryLog(req: Request, res: Response) {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const offset = parseInt(req.query.offset as string) || 0;

    const { data, error, count } = await supabaseAdmin
      .from('whatsapp_delivery_log')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return res.json({ success: true, logs: data || [], total: count || 0 });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
