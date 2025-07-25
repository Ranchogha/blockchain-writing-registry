import { Providers } from '@/components/providers';
import { Header } from '@/components/header';
import { ContentSubmission } from '@/components/content-submission';
import { RegistryViewer } from '@/components/registry-viewer';

export default function Home() {

  return (
    <Providers>
      <div className="min-h-screen bg-white">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold text-gray-900">
                Blockchain-Based Writing Registry
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Register your written content on Camp Network with SHA-256 hashing for 
                tamper-proof proof of authorship and transparent AI attribution.
              </p>
            </div>
            <ContentSubmission />
            <RegistryViewer />
          </div>
        </main>
      </div>
    </Providers>
  );
} 