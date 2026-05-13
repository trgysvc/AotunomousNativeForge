import React from 'react';

type TableStatus = 'available' | 'occupied' | 'reserved' | 'maintenance';

interface Table {
  id: string;
  number: number;
  status: TableStatus;
}

interface TableItemProps {
  table: Table;
  onClick?: () => void;
}

const statusColors: Record<TableStatus, string> = {
  available: 'bg-green-500',
  occupied: 'bg-red-500',
  reserved: 'bg-yellow-500',
  maintenance: 'bg-gray-500',
};

export default function TableItem({ table, onClick }: TableItemProps) {
  const tooltip = `${table.number} - ${table.status}`;
  const baseClasses = 'w-20 h-20 rounded-lg flex items-center justify-center text-white font-medium cursor-pointer transition-colors duration-200';
  return (
    <div
      className={`${baseClasses} ${statusColors[table.status]} hover:opacity-90`}
      onClick={onClick}
      title={tooltip}
    >
      {table.number}
    </div>
  );
}