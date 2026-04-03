import { supabase } from '../lib/supabase';
import type { EvidenceFileType } from '../types';

const EVIDENCE_BUCKET = 'evidence';

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export async function uploadEvidenceFile(params: {
  file: File;
  taskId: string;
  uploadedBy: string;
  fileType: EvidenceFileType;
}) {
  const { file, taskId, uploadedBy, fileType } = params;

  const objectPath = `${uploadedBy}/${taskId}/${Date.now()}-${sanitizeFileName(file.name)}`;

  const { error: uploadError } = await supabase.storage
    .from(EVIDENCE_BUCKET)
    .upload(objectPath, file, {
      upsert: false,
      cacheControl: '3600',
      contentType: file.type,
    });

  if (uploadError) throw uploadError;

  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from(EVIDENCE_BUCKET)
    .createSignedUrl(objectPath, 60 * 60);

  if (signedUrlError) throw signedUrlError;

  const { data, error } = await supabase
    .from('evidence')
    .insert({
      task_id: taskId,
      file_url: objectPath,
      file_type: fileType,
      uploaded_by: uploadedBy,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;

  return {
    evidence: data,
    signedUrl: signedUrlData.signedUrl,
  };
}

export async function getSignedEvidenceUrl(objectPath: string) {
  const { data, error } = await supabase.storage
    .from(EVIDENCE_BUCKET)
    .createSignedUrl(objectPath, 60 * 30);

  if (error) throw error;
  return data.signedUrl;
}
