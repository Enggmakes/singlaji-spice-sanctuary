import { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';
import { MessageCircle } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col relative">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />

      {/* Floating WhatsApp Quick Contact Button */}
      <a
        href="https://wa.me/918872572784?text=Hi%20Singlaji%20Store!%20I%20have%20an%20inquiry%20about%20your%20spices."
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-[#25D366] hover:bg-[#20ba59] text-white p-3.5 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center gap-2 group"
        title="Chat on WhatsApp"
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle className="h-6 w-6 fill-current" />
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 ease-in-out text-sm font-medium pr-1">
          Chat with Us
        </span>
      </a>
    </div>
  );
}
