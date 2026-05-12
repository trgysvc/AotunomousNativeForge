import type { ReactNode } from 'react';
import { AuthProvider } from '@/contexts/auth';
import { ElectricSQLProvider } from '@/providers/electric-sql';
import { ROUTE_GROUPS } from './routes';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr">
      <body>
        <AuthProvider>
          <ElectricSQLProvider>
            {children}
          </ElectricSQLProvider>
        </AuthProvider>
      </body>
    </html>
  );
}