'use client';

import { Button } from '@/components/ui/button';
// import { createPlayground } from "@/features/playground/actions";
import { Plus } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { createPlayground } from '../actions';
import TemplateSelectingModal from './template-selecting-modal';

const AddNewButton = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<{
    title: string;
    template: 'REACT' | 'NEXTJS' | 'EXPRESS' | 'VUE' | 'HONO' | 'ANGULAR';
    description?: string;
  } | null>(null);
  const router = useRouter();

  const handleSubmit = async (data: {
    title: string;
    template: 'REACT' | 'NEXTJS' | 'EXPRESS' | 'VUE' | 'HONO' | 'ANGULAR';
    description?: string;
  }) => {
    setSelectedTemplate(data);

    try {
      console.group('🆕 Creating New Playground');
      console.log('1️⃣ Playground data:', data);

      const res = await createPlayground(data);
      console.log('2️⃣ Playground created:', res);

      if (!res || !res.id) {
        console.error('3️⃣ ❌ FAILED: No playground ID returned');
        toast.error('Failed to create playground - no ID returned');
        return;
      }

      console.log('3️⃣ ✅ SUCCESS: Navigating to playground', { id: res.id });
      toast.success('Playground Created successfully');
      setIsModalOpen(false);
      router.push(`/playground/${res.id}`);
      console.groupEnd();
    } catch (error) {
      console.error('❌ ERROR: Failed to create playground:', error);
      toast.error('Failed to create playground');
      console.groupEnd();
    }
  };

  return (
    <>
      <div
        onClick={() => setIsModalOpen(true)}
        className='group px-6 py-6 flex flex-row justify-between items-center border rounded-lg bg-muted cursor-pointer 
        transition-all duration-300 ease-in-out
        hover:bg-background hover:border-[#E93F3F] hover:scale-[1.02]
        shadow-[0_2px_10px_rgba(0,0,0,0.08)]
        hover:shadow-[0_10px_30px_rgba(233,63,63,0.15)]'
      >
        <div className='flex flex-row justify-center items-start gap-4'>
          <Button
            variant={'outline'}
            className='flex justify-center items-center bg-white group-hover:bg-[#fff8f8] group-hover:border-[#E93F3F] group-hover:text-[#E93F3F] transition-colors duration-300'
            size={'icon'}
          >
            <Plus size={30} className='transition-transform duration-300 group-hover:rotate-90' />
          </Button>
          <div className='flex flex-col'>
            <h1 className='text-xl font-bold text-[#e93f3f]'>Add New</h1>
            <p className='text-sm text-muted-foreground max-w-[220px]'>Create a new playground</p>
          </div>
        </div>

        <div className='relative overflow-hidden'>
          <Image
            src={'/add-new.svg'}
            alt='Create new playground'
            width={150}
            height={150}
            style={{ width: 'auto', height: 'auto' }}
            className='transition-transform duration-300 group-hover:scale-110'
          />
        </div>
      </div>
      <TemplateSelectingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleSubmit} />
    </>
  );
};

export default AddNewButton;
