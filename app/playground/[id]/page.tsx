'use client';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import LoadingStep from '@/modules/playground/components/loader';
import { PlaygroundEditor } from '@/modules/playground/components/playground-editor';
import { TemplateFileTree } from '@/modules/playground/components/playground-explorer';
import ToggleAI from '@/modules/playground/components/toggle-ai';
import { useAISuggestions } from '@/modules/playground/hooks/useAISuggestion';
import { useFileExplorer } from '@/modules/playground/hooks/useFileExplorer';
import { usePlayground } from '@/modules/playground/hooks/usePlayground';
import { findFilePath, findFirstFile } from '@/modules/playground/lib';
import { TemplateFile, TemplateFolder } from '@/modules/playground/lib/path-to-json';
import WebContainerPreview from '@/modules/webcontainers/components/webcontainer-preview';
import { useWebContainer } from '@/modules/webcontainers/hooks/useWebContainer';
import { AlertCircle, FileText, FolderOpen, RefreshCw, Save, Settings, X } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

const MainPlaygroundPage = () => {
  console.group('🎮 MainPlaygroundPage Initialization');
  console.log('1️⃣ Component mounted');

  const { id } = useParams<{ id: string }>();
  console.log('2️⃣ URL params:', { id });

  // Use default playground ID if undefined
  const playgroundId = id === 'undefined' ? 'cmgmxwly80001u1z0jbatl1zy' : id;
  console.log('2️⃣1️⃣ Resolved playground ID:', { originalId: id, resolvedId: playgroundId });

  // Redirect to correct URL if using default ID
  useEffect(() => {
    if (id === 'undefined' && typeof window !== 'undefined') {
      console.log('2️⃣2️⃣ Redirecting to correct URL with default ID');
      window.history.replaceState(null, '', `/playground/${playgroundId}`);
    }
  }, [id, playgroundId]);

  const [isPreviewVisible, setIsPreviewVisible] = useState(true);
  console.log('3️⃣ Preview visibility state:', { isPreviewVisible });

  const { playgroundData, templateData, isLoading, error, saveTemplateData } = usePlayground(playgroundId);
  console.log('4️⃣ Playground data:', {
    hasPlaygroundData: !!playgroundData,
    hasTemplateData: !!templateData,
    isLoading: isLoading,
    hasError: !!error,
    errorMessage: error,
  });

  const aiSuggestions = useAISuggestions();
  console.log('5️⃣ AI suggestions:', {
    isEnabled: aiSuggestions.isEnabled,
    isLoading: aiSuggestions.isLoading,
    hasSuggestion: !!aiSuggestions.suggestion,
  });

  const {
    setTemplateData,
    setActiveFileId,
    setPlaygroundId,
    setOpenFiles,
    activeFileId,
    closeAllFiles,
    closeFile,
    openFile,
    openFiles,

    handleAddFile,
    handleAddFolder,
    handleDeleteFile,
    handleDeleteFolder,
    handleRenameFile,
    handleRenameFolder,
    updateFileContent,
  } = useFileExplorer();

  console.log('6️⃣ File explorer state:', {
    activeFileId: activeFileId,
    openFilesCount: openFiles?.length || 0,
    openFiles: openFiles,
    hasOpenFiles: !!openFiles,
    isOpenFilesArray: Array.isArray(openFiles),
  });

  const {
    serverUrl,
    isLoading: containerLoading,
    error: containerError,
    instance,
    writeFileSync,
    retryCount,
    isRetrying,
    retryInitialization,
    // @ts-expect-error - useWebContainer hook type mismatch
  } = useWebContainer({ templateData });

  console.log('7️⃣ WebContainer state:', {
    serverUrl: serverUrl,
    containerLoading: containerLoading,
    hasContainerError: !!containerError,
    containerErrorMessage: containerError,
    hasInstance: !!instance,
    hasWriteFileSync: !!writeFileSync,
    retryCount: retryCount,
    isRetrying: isRetrying,
    hasRetryInitialization: !!retryInitialization,
  });

  console.log('8️⃣ Component initialization complete');
  console.groupEnd();

  useEffect(() => {
    setPlaygroundId(playgroundId);
  }, [playgroundId, setPlaygroundId]);

  useEffect(() => {
    if (templateData && !openFiles.length) {
      console.group('📁 Template Data Processing');
      console.log('1️⃣ Template data received:', {
        hasTemplateData: !!templateData,
        templateFolderName: templateData.folderName,
        itemsCount: templateData.items?.length || 0,
        openFilesCount: openFiles.length,
      });

      setTemplateData(templateData);

      // Automatically open the first file
      const firstFile = findFirstFile(templateData);
      if (firstFile) {
        console.log('2️⃣ Found first file to open:', {
          filename: firstFile.filename,
          extension: firstFile.fileExtension,
          contentLength: firstFile.content?.length || 0,
        });

        console.log('3️⃣ Opening first file automatically');
        openFile(firstFile);
        console.log('4️⃣ ✅ SUCCESS: First file opened');
      } else {
        console.log('2️⃣ ⚠️ No files found in template data');
      }
      console.groupEnd();
    }
  }, [templateData, setTemplateData, openFiles.length, openFile]);

  // Create wrapper functions that pass saveTemplateData
  const wrappedHandleAddFile = useCallback(
    (newFile: TemplateFile, parentPath: string) => {
      return handleAddFile(newFile, parentPath, writeFileSync!, instance, saveTemplateData);
    },
    [handleAddFile, writeFileSync, instance, saveTemplateData]
  );

  const wrappedHandleAddFolder = useCallback(
    (newFolder: TemplateFolder, parentPath: string) => {
      return handleAddFolder(newFolder, parentPath, instance, saveTemplateData);
    },
    [handleAddFolder, instance, saveTemplateData]
  );

  const wrappedHandleDeleteFile = useCallback(
    (file: TemplateFile, parentPath: string) => {
      return handleDeleteFile(file, parentPath, saveTemplateData);
    },
    [handleDeleteFile, saveTemplateData]
  );

  const wrappedHandleDeleteFolder = useCallback(
    (folder: TemplateFolder, parentPath: string) => {
      return handleDeleteFolder(folder, parentPath, saveTemplateData);
    },
    [handleDeleteFolder, saveTemplateData]
  );

  const wrappedHandleRenameFile = useCallback(
    (file: TemplateFile, newFilename: string, newExtension: string, parentPath: string) => {
      return handleRenameFile(file, newFilename, newExtension, parentPath, saveTemplateData);
    },
    [handleRenameFile, saveTemplateData]
  );

  const wrappedHandleRenameFolder = useCallback(
    (folder: TemplateFolder, newFolderName: string, parentPath: string) => {
      return handleRenameFolder(folder, newFolderName, parentPath, saveTemplateData);
    },
    [handleRenameFolder, saveTemplateData]
  );

  const handleFileSelect = (file: TemplateFile) => {
    openFile(file);
  };

  const handleSave = useCallback(
    async (fileId?: string) => {
      const targetFileId = fileId || activeFileId;
      if (!targetFileId) return;

      // Add null check to prevent find error
      if (!openFiles || !Array.isArray(openFiles)) {
        toast.error('No files available to save');
        return;
      }

      const fileToSave = openFiles.find(f => f.id === targetFileId);

      if (!fileToSave) return;

      const latestTemplateData = useFileExplorer.getState().templateData;
      if (!latestTemplateData) return;

      try {
        const filePath = findFilePath(fileToSave, latestTemplateData);
        if (!filePath) {
          toast.error(`Could not find path for file: ${fileToSave.filename}.${fileToSave.fileExtension}`);
          return;
        }

        const updatedTemplateData = JSON.parse(JSON.stringify(latestTemplateData));
        await saveTemplateData(updatedTemplateData);
        await writeFileSync!(filePath, fileToSave.content);

        const updatedOpenFiles = (openFiles || []).map(f => (f.id === targetFileId ? { ...f, hasUnsavedChanges: false } : f));
        setOpenFiles(updatedOpenFiles);

        toast.success('File saved successfully');
      } catch (error) {
        console.error('Error saving file:', error);
        toast.error('Failed to save file');
      }
    },
    [activeFileId, openFiles, writeFileSync, saveTemplateData, setOpenFiles]
  );

  const handleResetEnvironment = useCallback(async () => {
    try {
      if (retryInitialization) {
        toast.info('Resetting WebContainer environment...');
        await retryInitialization();
        toast.success('Environment reset successfully');
      } else {
        toast.error('Reset functionality not available');
      }
    } catch (error) {
      console.error('Error resetting environment:', error);
      toast.error('Failed to reset environment');
    }
  }, [retryInitialization]);

  useEffect(() => {
    if (templateData && instance) {
      // setupContainer will be handled by WebContainerPreview component
      console.log('Template data and instance available for setup');
    }
  }, [templateData, instance]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  // Add safety check for undefined ID after all hooks
  if (!playgroundId || playgroundId === 'undefined') {
    console.error('❌ ERROR: Invalid playground ID:', { originalId: id, resolvedId: playgroundId });
    return (
      <div className='flex flex-col items-center justify-center h-[calc(100vh-4rem)] p-4'>
        <AlertCircle className='h-12 w-12 text-red-500 mb-4' />
        <h2 className='text-xl font-semibold text-red-600 mb-2'>Invalid Playground</h2>
        <p className='text-gray-600 mb-4'>The playground ID is invalid or missing.</p>
        <Button onClick={() => (window.location.href = '/dashboard')} variant='destructive'>
          Go to Dashboard
        </Button>
      </div>
    );
  }

  console.group('🔍 Array Operations Check');
  console.log('9️⃣ Before array operations:', {
    openFiles: openFiles,
    openFilesType: typeof openFiles,
    isArray: Array.isArray(openFiles),
    activeFileId: activeFileId,
  });

  const activeFile = openFiles?.find(file => file.id === activeFileId);
  console.log('🔟 Active file found:', { activeFile: activeFile });

  const hasUnsavedChanges = openFiles?.some(file => file.hasUnsavedChanges) || false;
  console.log('1️⃣1️⃣ Unsaved changes check:', { hasUnsavedChanges });
  console.groupEnd();

  const handleSaveAll = async () => {
    console.group('💾 Handle Save All Flow');
    console.log('1️⃣ Save All Request:', {
      openFiles: openFiles,
      openFilesType: typeof openFiles,
      isArray: Array.isArray(openFiles),
      openFilesLength: openFiles?.length || 0,
    });

    // Add null check to prevent filter error
    if (!openFiles || !Array.isArray(openFiles)) {
      console.log('1️⃣ ❌ BLOCKED: No files available to save');
      toast.error('No files available to save');
      console.groupEnd();
      return;
    }

    console.log('2️⃣ ✅ PROCEEDING: Filtering unsaved files');
    const unsavedFiles = openFiles.filter(f => f.hasUnsavedChanges);
    console.log('2️⃣ Filter result:', {
      unsavedFilesCount: unsavedFiles.length,
      unsavedFiles: unsavedFiles,
    });

    if (unsavedFiles.length === 0) {
      console.log('3️⃣ ℹ️ No unsaved changes');
      toast.info('No unsaved changes');
      console.groupEnd();
      return;
    }

    try {
      console.log('4️⃣ 💾 Saving all files...');
      await Promise.all(unsavedFiles.map(f => handleSave(f.id)));
      toast.success(`Saved ${unsavedFiles.length} file(s)`);
      console.log('4️⃣ ✅ SUCCESS: All files saved');
    } catch {
      console.log('4️⃣ ❌ FAILED: Some files failed to save');
      toast.error('Failed to save some files');
    }
    console.groupEnd();
  };

  if (error) {
    return (
      <div className='flex flex-col items-center justify-center h-[calc(100vh-4rem)] p-4'>
        <AlertCircle className='h-12 w-12 text-red-500 mb-4' />
        <h2 className='text-xl font-semibold text-red-600 mb-2'>Something went wrong</h2>
        <p className='text-gray-600 mb-4'>{error}</p>
        <Button onClick={() => window.location.reload()} variant='destructive'>
          Try Again
        </Button>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className='flex flex-col items-center justify-center h-[calc(100vh-4rem)] p-4'>
        <div className='w-full max-w-md p-6 rounded-lg shadow-sm border'>
          <h2 className='text-xl font-semibold mb-6 text-center'>Loading Playground</h2>
          <div className='mb-8'>
            <LoadingStep currentStep={1} step={1} label='Loading playground data' />
            <LoadingStep currentStep={2} step={2} label='Setting up environment' />
            <LoadingStep currentStep={3} step={3} label='Ready to code' />
          </div>
        </div>
      </div>
    );
  }

  // No template data
  if (!templateData) {
    return (
      <div className='flex flex-col items-center justify-center h-[calc(100vh-4rem)] p-4'>
        <FolderOpen className='h-12 w-12 text-amber-500 mb-4' />
        <h2 className='text-xl font-semibold text-amber-600 mb-2'>No template data available</h2>
        <Button onClick={() => window.location.reload()} variant='outline'>
          Reload Template
        </Button>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <>
        <TemplateFileTree
          data={templateData!}
          onFileSelect={handleFileSelect}
          selectedFile={activeFile}
          title='File Explorer'
          onAddFile={wrappedHandleAddFile}
          onAddFolder={wrappedHandleAddFolder}
          onDeleteFile={wrappedHandleDeleteFile}
          onDeleteFolder={wrappedHandleDeleteFolder}
          onRenameFile={wrappedHandleRenameFile}
          onRenameFolder={wrappedHandleRenameFolder}
        />
        <SidebarInset>
          <header className='flex h-16 shrink-0 items-center gap-2 border-b px-4'>
            <SidebarTrigger className='-ml-1' />
            <Separator orientation='vertical' className='mr-2 h-4' />

            <div className='flex flex-1 items-center gap-2'>
              <div className='flex flex-col flex-1'>
                <h1 className='text-sm font-medium'>{playgroundData?.title || 'Code Playground'}</h1>
                <p className='text-xs text-muted-foreground'>
                  {openFiles?.length || 0} File(s) Open
                  {hasUnsavedChanges && ' • Unsaved changes'}
                </p>
              </div>

              <div className='flex items-center gap-1'>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size='sm' variant='outline' onClick={() => handleSave()} disabled={!activeFile || !activeFile.hasUnsavedChanges}>
                      <Save className='h-4 w-4' />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Save (Ctrl+S)</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size='sm' variant='outline' onClick={handleSaveAll} disabled={!hasUnsavedChanges}>
                      <Save className='h-4 w-4' /> All
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Save All (Ctrl+Shift+S)</TooltipContent>
                </Tooltip>

                <ToggleAI isEnabled={aiSuggestions.isEnabled} onToggle={aiSuggestions.toggleEnabled} suggestionLoading={aiSuggestions.isLoading} />

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size='sm' variant='outline' onClick={handleResetEnvironment} disabled={!retryInitialization}>
                      <RefreshCw className='h-4 w-4' />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Reset Environment</TooltipContent>
                </Tooltip>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size='sm' variant='outline'>
                      <Settings className='h-4 w-4' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    <DropdownMenuItem onClick={() => setIsPreviewVisible(!isPreviewVisible)}>
                      {isPreviewVisible ? 'Hide' : 'Show'} Preview
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={closeAllFiles}>Close All Files</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          <div className='h-[calc(100vh-4rem)]'>
            {(openFiles?.length || 0) > 0 ? (
              <div className='h-full flex flex-col'>
                <div className='border-b bg-muted/30'>
                  <Tabs value={activeFileId || ''} onValueChange={setActiveFileId}>
                    <div className='flex items-center justify-between px-4 py-2'>
                      <TabsList className='h-8 bg-transparent p-0'>
                        {(openFiles || []).map(file => (
                          <TabsTrigger
                            key={file.id}
                            value={file.id}
                            className='relative h-8 px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm group'
                          >
                            <div className='flex items-center gap-2'>
                              <FileText className='h-3 w-3' />
                              <span>
                                {file.filename}.{file.fileExtension}
                              </span>
                              {file.hasUnsavedChanges && <span className='h-2 w-2 rounded-full bg-orange-500' />}
                              <span
                                className='ml-2 h-4 w-4 hover:bg-destructive hover:text-destructive-foreground rounded-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer'
                                onClick={e => {
                                  e.stopPropagation();
                                  closeFile(file.id);
                                }}
                              >
                                <X className='h-3 w-3' />
                              </span>
                            </div>
                          </TabsTrigger>
                        ))}
                      </TabsList>

                      {(openFiles?.length || 0) > 1 && (
                        <Button size='sm' variant='ghost' onClick={closeAllFiles} className='h-6 px-2 text-xs'>
                          Close All
                        </Button>
                      )}
                    </div>
                  </Tabs>
                </div>
                <div className='flex-1'>
                  <ResizablePanelGroup direction='horizontal' className='h-full'>
                    <ResizablePanel defaultSize={isPreviewVisible ? 50 : 100}>
                      <PlaygroundEditor
                        activeFile={activeFile}
                        content={activeFile?.content || ''}
                        onContentChange={value => activeFileId && updateFileContent(activeFileId, value)}
                        suggestion={aiSuggestions.suggestion}
                        suggestionLoading={aiSuggestions.isLoading}
                        suggestionPosition={aiSuggestions.position}
                        onAcceptSuggestion={(editor, monaco) => aiSuggestions.acceptSuggestion(editor, monaco)}
                        onRejectSuggestion={editor => aiSuggestions.rejectSuggestion(editor)}
                        onTriggerSuggestion={(type, editor) => aiSuggestions.fetchSuggestion(type, editor)}
                      />
                    </ResizablePanel>

                    {isPreviewVisible && (
                      <>
                        <ResizableHandle />
                        <ResizablePanel defaultSize={50}>
                          <WebContainerPreview
                            templateData={templateData}
                            instance={instance}
                            writeFileSync={writeFileSync}
                            isLoading={containerLoading}
                            error={containerError}
                            serverUrl={serverUrl!}
                            forceResetup={false}
                            retryCount={retryCount}
                            isRetrying={isRetrying}
                            retryInitialization={retryInitialization}
                          />
                        </ResizablePanel>
                      </>
                    )}
                  </ResizablePanelGroup>
                </div>
              </div>
            ) : (
              <div className='flex flex-col h-full items-center justify-center text-muted-foreground gap-4'>
                <FileText className='h-16 w-16 text-gray-300' />
                <div className='text-center'>
                  <p className='text-lg font-medium'>No files open</p>
                  <p className='text-sm text-gray-500'>Select a file from the sidebar to start editing</p>
                </div>
              </div>
            )}
          </div>
        </SidebarInset>
      </>
    </TooltipProvider>
  );
};

export default MainPlaygroundPage;
