import React from 'react';

interface TableItemProps {
  id: string | number;
  status: TableStatus;
  label?: string;
  tooltip?: string;
  className?: string;
}

type TableStatus = 'available' | 'occupied' | 'reserved' | 'cleaning';

const TableItem: React.FC<TableItemProps> = ({
  id,
  status,
  label,
  tooltip,
  className = '',
}) => {
  const statusToClass: Record<TableStatus, string> = {
    available: 'bg-green-100 text-green-800',
    occupied: 'bg-red-100 text-red-800',
    reserved: 'bg-yellow-100 text-yellow-800',
    cleaning: 'bg-blue-100 text-blue-800',
  };

  const baseClasses = 'flex items-center justify-center w-full h-full rounded-md';
  const statusClass = statusToClass[status];
  const fullClassName = `${baseClasses} ${statusClass} ${className}`.trim();

  const tooltipContent = tooltip ?? `${label || id} - ${status}`;

  return (
    <div className={fullClassName} title={tooltipContent}>
      {label || id}
    </div>
  );
};

export default TableItem;