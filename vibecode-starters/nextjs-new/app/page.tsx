export default function Page() {
  return (
    <main style={{ padding: 24 }}>
      <h1>@vibecode-starters/nextjs-new</h1>
      <p>Next.js 15 App Router starter is running.</p>
    </main>
  );
}

export default function Home() {
  return (
    <main className='flex min-h-screen flex-col items-center justify-between p-24'>
      <div className='z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex'>
        <h1 className='text-4xl font-bold text-center'>Welcome to Next.js!</h1>
      </div>

      <div className='relative flex place-items-center'>
        <p className='text-lg'>Start building your amazing Next.js application.</p>
      </div>
    </main>
  );
}
