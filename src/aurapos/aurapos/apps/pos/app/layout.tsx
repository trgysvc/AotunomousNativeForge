import './globals.css';
import type { ReactNode } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { ElectricSQLProvider } from '@/providers/ElectricSQLProvider';
import { ordersRoutes, tablesRoutes, paymentsRoutes } from './routes';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ElectricSQLProvider>
        {ordersRoutes}
        {tablesRoutes}
        {paymentsRoutes}
        <>{children}</>
      </ElectricSQLProvider>
    </AuthProvider>
  );
}