import { db } from '@/lib/db';
import { getTemplateFallback, templatePaths, toCanonicalTemplateKey } from '@/lib/template';
import { scanTemplateDirectory, TemplateFolder } from '@/modules/playground/lib/path-to-json';
import { NextRequest } from 'next/server';
import path from 'path';

// Runtime configuration
export const runtime = 'nodejs';

function validateJsonStructure(data: unknown): boolean {
  try {
    JSON.parse(JSON.stringify(data)); // Ensures it's serializable
    return true;
  } catch (error) {
    console.error('Invalid JSON structure:', error);
    return false;
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;

  if (!id) {
    return Response.json({ error: 'Missing playground ID' }, { status: 400 });
  }

  let playground: any = null;
  try {
    playground = await db.playground.findUnique({
      where: { id },
    });
  } catch (err) {
    console.error('DB error finding playground, returning fallback:', err);
    const fallback = getTemplateFallback('REACT');
    return Response.json({ success: true, templateJson: fallback, fallback: true }, { status: 200 });
  }

  if (!playground) {
    const fallback = getTemplateFallback('REACT');
    return Response.json({ success: true, templateJson: fallback, fallback: true }, { status: 200 });
  }

  const rawTemplate = (playground as any)?.template as string | undefined;
  const templateKey = toCanonicalTemplateKey(rawTemplate);
  const templatePath = templateKey ? templatePaths[templateKey] : undefined;

  if (!templatePath) {
    const fallback = getTemplateFallback(String(templateKey || 'REACT'));
    return Response.json({ success: true, templateJson: fallback, fallback: true }, { status: 200 });
  }

  try {
    const inputPath = path.join(process.cwd(), templatePath);
    const scanned: TemplateFolder = await scanTemplateDirectory(inputPath);

    if (!validateJsonStructure(scanned.items)) {
      const fallback = getTemplateFallback(String(templateKey || 'REACT'));
      return Response.json({ success: true, templateJson: fallback, fallback: true }, { status: 200 });
    }

    return Response.json({ success: true, templateJson: scanned }, { status: 200 });
  } catch (error) {
    console.error('Template scan failed, using fallback:', error);
    const fallback = getTemplateFallback(String(templateKey || 'REACT'));
    return Response.json({ success: true, templateJson: fallback, fallback: true }, { status: 200 });
  }
}
