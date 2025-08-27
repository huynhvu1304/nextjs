import { Roboto } from 'next/font/google';
import './globals.css';
import './page.module.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import ClientProviders from '../components/ClientProviders';


const roboto = Roboto({
  subsets: ['latin'],
  variable: '--font-roboto',
});

export const metadata = {
   title: 'NOVASHOP - Vợt & Giày Cầu Lông Chính Hãng',
  description: 'Chuyên vợt cầu lông và giày cầu lông chính hãng, giá tốt.',
  keywords: ['vợt cầu lông', 'giày cầu lông', 'NovaShop','vợt kumpoo','vợt yonex','vợt lining','giày yonex','giày kumpoo','giày lining'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${roboto.variable} font-roboto`}>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
