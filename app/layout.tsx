import './globals.css'; import type { Metadata } from 'next';
export const metadata: Metadata = { title:'AI Product Review Video Bot', description:'Shopee Affiliate AI-assisted review workflow' };
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="th"><body>{children}</body></html>}
