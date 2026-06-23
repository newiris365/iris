import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';

// Local memory fallback state if DB columns do not exist
let localAiConfigFallback: Record<string, any> = {};

/** GET /api/v1/core/ai/config - Get current AI API configurations */
export async function getAiConfig(req: Request, res: Response) {
  try {
    const institutionId = req.query.institution_id as string;
    if (!institutionId) {
      return res.status(400).json({ success: false, error: 'institution_id is required' });
    }

    const { data, error } = await supabaseAdmin
      .from('institutions')
      .select('gemini_api_key, openai_api_key, claude_api_key')
      .eq('id', institutionId)
      .single();

    if (error) {
      // Check if the error is due to missing columns in DB schema
      const errMsg = error.message || '';
      if (errMsg.includes('column') || errMsg.includes('exist') || errMsg.includes('cache')) {
        console.warn('AI API key columns do not exist in institutions table. Falling back to session memory config.');
        return res.json({
          success: true,
          config: localAiConfigFallback[institutionId] || {
            gemini_api_key: '',
            openai_api_key: '',
            claude_api_key: '',
          }
        });
      }
      throw error;
    }

    return res.json({
      success: true,
      config: data || {
        gemini_api_key: '',
        openai_api_key: '',
        claude_api_key: '',
      }
    });
  } catch (err: any) {
    console.error('ERROR in getAiConfig:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/** POST /api/v1/core/ai/config - Save AI API configurations */
export async function saveAiConfig(req: Request, res: Response) {
  try {
    const { institution_id, gemini_api_key, openai_api_key, claude_api_key } = req.body;

    if (!institution_id) {
      return res.status(400).json({ success: false, error: 'institution_id is required.' });
    }

    const { error } = await supabaseAdmin
      .from('institutions')
      .update({
        gemini_api_key: gemini_api_key || null,
        openai_api_key: openai_api_key || null,
        claude_api_key: claude_api_key || null,
      })
      .eq('id', institution_id);

    if (error) {
      const errMsg = error.message || '';
      if (errMsg.includes('column') || errMsg.includes('exist') || errMsg.includes('cache')) {
        console.warn('AI API key columns do not exist in institutions table. Emulating successful save in local session memory.');
        localAiConfigFallback[institution_id] = {
          gemini_api_key: gemini_api_key || '',
          openai_api_key: openai_api_key || '',
          claude_api_key: claude_api_key || '',
        };
        return res.json({ success: true, warning: 'Columns missing. Saved in local session memory.' });
      }
      throw error;
    }

    return res.json({ success: true });
  } catch (err: any) {
    console.error('ERROR in saveAiConfig:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/** Helper to retrieve configured keys for an institution (DB or in-memory fallback) */
export async function getActiveInstitutionKeys(institutionId: string) {
  try {
    const { data } = await supabaseAdmin
      .from('institutions')
      .select('gemini_api_key, openai_api_key, claude_api_key')
      .eq('id', institutionId)
      .single();
    if (data && (data.gemini_api_key || data.openai_api_key || data.claude_api_key)) {
      return {
        gemini_api_key: data.gemini_api_key || '',
        openai_api_key: data.openai_api_key || '',
        claude_api_key: data.claude_api_key || '',
      };
    }
  } catch (err) {
    // ignore
  }

  // Fallback to local session configuration
  return localAiConfigFallback[institutionId] || {
    gemini_api_key: '',
    openai_api_key: '',
    claude_api_key: '',
  };
}

