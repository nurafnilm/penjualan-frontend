'use client';

import { Inter } from 'next/font/google';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const menuItems = [
    { href: '/', label: 'Transaksi' },
    { href: '/products', label: 'Produk' },
  ];

  return (
    <html lang="id">
      <body className={`${inter.className} bg-gray-100 flex h-screen overflow-hidden`}>
        {/* Sidebar Kiri - Fix lebar, tanpa toggle */}
        <aside className="w-64 bg-gray-800 text-white flex flex-col">
          {/* Header Sidebar */}
          <div className="p-6 border-b border-gray-700">
            <h1 className="text-2xl font-bold text-center">Penjualan App +</h1>
            <p className="text-sm text-gray-300 text-center mt-1">
              Kelola transaksi dengan mudah
            </p>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center px-6 py-3 rounded-lg transition-colors ${
                      pathname === item.href
                        ? 'bg-gray-900 text-white shadow-lg'
                        : 'hover:bg-gray-700'
                    }`}
                  >
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main Content - padding biar ga mepet dan nyaman */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-8 md:p-12">
          {children}
        </main>
      </body>
    </html>
  );
}