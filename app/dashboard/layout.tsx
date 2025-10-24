import { SidebarProvider } from '@/components/ui/sidebar';
import { getAllPlaygroundForUser } from '@/modules/dashboard/actions';
import { DashboardSidebar } from '@/modules/dashboard/components/dashboard-sidebar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  console.group('🏗️ Dashboard Layout Initialization');
  console.log('1️⃣ Starting dashboard layout setup');

  const playgroundData = await getAllPlaygroundForUser();
  console.log('2️⃣ Playground data fetched:', {
    hasData: !!playgroundData,
    dataType: typeof playgroundData,
    isArray: Array.isArray(playgroundData),
    dataLength: playgroundData?.length || 0,
    rawData: playgroundData,
  });

  const technologyIconMap: Record<string, string> = {
    REACT: 'Zap',
    NEXTJS: 'Lightbulb',
    EXPRESS: 'Database',
    VUE: 'Compass',
    HONO: 'FlameIcon',
    ANGULAR: 'Terminal',
  };

  // Add null check to prevent map error
  const formattedPlaygroundData =
    playgroundData?.map(item => ({
      id: item.id,
      name: item.title,
      starred: item.Starmark?.[0]?.isMarked || false,
      icon: technologyIconMap[item.template] || 'Code2',
    })) || [];

  console.log('3️⃣ Formatted playground data:', {
    hasFormattedData: !!formattedPlaygroundData,
    formattedDataLength: formattedPlaygroundData.length,
    formattedData: formattedPlaygroundData,
  });

  console.log('4️⃣ Dashboard layout setup complete');
  console.groupEnd();

  return (
    <SidebarProvider>
      <div className='flex min-h-screen w-full overflow-x-hidden'>
        {/* Dashboard Sidebar */}
        <DashboardSidebar initialPlaygroundData={formattedPlaygroundData} />
        <main className='flex-1'>{children}</main>
      </div>
    </SidebarProvider>
  );
}
