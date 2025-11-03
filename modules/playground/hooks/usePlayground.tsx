import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { getPlaygroundById, SaveUpdatedCode } from '../actions';
import type { TemplateFolder } from '../lib/path-to-json';

interface PlaygroundData {
  id: string;
  title?: string;
  template?: 'REACT' | 'NEXTJS' | 'EXPRESS' | 'VUE' | 'HONO' | 'ANGULAR' | string;
  templateFiles?: Array<{ content: unknown }>;
}

interface UsePlaygroundReturn {
  playgroundData: PlaygroundData | null;
  templateData: TemplateFolder | null;
  isLoading: boolean;
  error: string | null;
  loadPlayground: () => Promise<void>;
  saveTemplateData: (data: TemplateFolder) => Promise<void>;
}

export const usePlayground = (id: string): UsePlaygroundReturn => {
  const [playgroundData, setPlaygroundData] = useState<PlaygroundData | null>(null);
  const [templateData, setTemplateData] = useState<TemplateFolder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPlayground = useCallback(async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      setError(null);

      const data = await getPlaygroundById(id);

      setPlaygroundData(data as PlaygroundData);
      const rawContent = data?.templateFiles?.[0]?.content;

      const isTemplateFolder = (val: unknown): val is TemplateFolder => {
        return (
          !!val &&
          typeof val === 'object' &&
          typeof (val as { folderName?: unknown }).folderName === 'string' &&
          Array.isArray((val as { items?: unknown }).items)
        );
      };

      if (typeof rawContent === 'string') {
        const parsedContent = JSON.parse(rawContent);
        setTemplateData(parsedContent);
        toast.success('playground loaded successfully (string content)');
        return;
      }

      if (rawContent && typeof rawContent === 'object') {
        if (Array.isArray(rawContent)) {
          setTemplateData({ folderName: 'Root', items: rawContent as unknown as TemplateFolder['items'] });
          toast.success('playground loaded successfully (json array)');
          return;
        }
        if (isTemplateFolder(rawContent)) {
          setTemplateData(rawContent);
          toast.success('playground loaded successfully (json object)');
          return;
        }
      }

      //   load template from api if not in saved content (pass template key if available)
      const templateKey = (data as PlaygroundData)?.template as string | undefined;
      const query = templateKey ? `?template=${encodeURIComponent(templateKey)}` : '';
      const res = await fetch(`/api/template/${id}${query}`);

      if (!res.ok) throw new Error(`Failed to load template: ${res.status}`);

      const templateRes = await res.json();

      if (templateRes.templateJson && Array.isArray(templateRes.templateJson)) {
        setTemplateData({
          folderName: 'Root',
          items: templateRes.templateJson,
        });
      } else {
        setTemplateData(
          templateRes.templateJson || {
            folderName: 'Root',
            items: [],
          }
        );
      }
      toast.success('Template loaded successfully');
    } catch (error) {
      console.error('Error loading playground:', error);
      setError('Failed to load playground data');
      toast.error('Failed to load playground data');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const saveTemplateData = useCallback(
    async (data: TemplateFolder) => {
      try {
        await SaveUpdatedCode(id, data);
        setTemplateData(data);
        toast.success('Changes saved successfully');
      } catch (error) {
        console.error('Error saving template data:', error);
        toast.error('Failed to save changes');
        throw error;
      }
    },
    [id]
  );

  useEffect(() => {
    loadPlayground();
  }, [loadPlayground]);

  return {
    playgroundData,
    templateData,
    isLoading,
    error,
    loadPlayground,
    saveTemplateData,
  };
};
