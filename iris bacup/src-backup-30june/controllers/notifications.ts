import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { z } from 'zod';

const registerDeviceSchema = z.object({
  device_token: z.string().min(1, 'device_token is required'),
  device_type: z.enum(['ios', 'android', 'web']).default('web')
});

export async function registerDevice(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }

    const parseResult = registerDeviceSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.errors[0].message });
    }

    const { device_token, device_type } = parseResult.data;

    // Upsert the device token for the user
    const { data, error } = await supabaseAdmin
      .from('device_tokens')
      .upsert({
        user_id: req.user.id,
        device_token,
        device_type,
        updated_at: new Date().toISOString()
      }, { onConflict: 'device_token' })
      .select()
      .single();

    if (error) {
      console.error('Failed to register device token:', error);
      return res.status(500).json({ success: false, error: 'Database failed to register device token.' });
    }

    return res.status(200).json({ success: true, message: 'Device token registered successfully.', device: data });
  } catch (err: any) {
    console.error('registerDevice error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}
