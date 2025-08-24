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
  title: 'NOVASHOP'
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
