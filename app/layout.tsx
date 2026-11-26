import './globals.css';
import type { Metadata } from 'next';
export const metadata:Metadata={title:'Everlight | Family Campaign',description:'The Five Days of Everlight family campaign companion'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
