"use client";
import { AuthProvider } from '@/app/context/AuthContext';
import { ElectricProvider } from '@electric-sql/react';
import { ordersRoutes, tablesRoutes, paymentsRoutes } from './routes';

export default function PosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <ElectricProvider>
        <main className="min-h-screen flex flex-col p-4">
          {children}
        </main>
      </ElectricProvider>
    </AuthProvider>
  );
}