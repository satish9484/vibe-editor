import SignInFormClient from '@/modules/auth/components/sign-in-form-client';
import Image from 'next/image';

const Page = () => {
  return (
    <>
      <div className='flex flex-col md:flex-row items-center justify-center min-h-screen'>
        <Image src={'/login.svg'} alt='Login-Image' height={300} width={300} className='m-6 hidden object-cover md:block' />
        <SignInFormClient />
      </div>
    </>
  );
};

export default Page;
