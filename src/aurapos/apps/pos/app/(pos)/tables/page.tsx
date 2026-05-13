"use client";
import React, { useState } from 'react';

type TableStatus = 'free' | 'occupied' | 'reserved';

interface Table {
  id: string;
  name: string;
  status: TableStatus;
  x: number;
  y: number;
}

const TableMap: React.FC = () => {
  const [tables, setTables] = useState<Table[]>([
    { id: '1', name: 'Table 1', status: 'free', x: 100, y: 100 },
    { id: '2', name: 'Table 2', status: 'occupied', x: 250, y: 100 },
    { id: '3', name: 'Table 3', status: 'reserved', x: 400, y: 100 },
    { id: '4', name: 'Table 4', status: 'free', x: 100, y: 250 },
    { id: '5', name: 'Table 5', status: 'occupied', x: 250, y: 250 },
    { id: '6', name: 'Table 6', status: 'reserved', x: 400, y: 250 },
  ]);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetId: string) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain');
    if (sourceId === targetId) return;
    setTables(prev => {
      const source = prev.find(t => t.id === sourceId)!;
      const target = prev.find(t => t.id === targetId)!;
      return prev.map(t => {
        if (t.id === sourceId) return { ...t, x: target.x, y: target.y };
        if (t.id === targetId) return { ...t, x: source.x, y: source.y };
        return t;
      });
    });
  };

  const getStatusColor = (status: TableStatus) => {
    switch (status) {
      case 'free': return '#4caf50';
      case 'occupied': return '#f44336';
      case 'reserved': return '#ff9800';
      default: return '#9e9e9e';
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '600px', background: '#f5f5f5' }}>
      {tables.map(table => (
        <div
          key={table.id}
          draggable
          onDragStart={(e) => handleDragStart(e, table.id)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, table.id)}
          style={{
            position: 'absolute',
            left: table.x,
            top: table.y,
            width: '80px',
            height: '80px',
            backgroundColor: getStatusColor(table.status),
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 'bold',
            cursor: 'grab',
            userSelect: 'none',
          }}
        >
          {table.name}
        </div>
      ))}
    </div>
  );
};

export default TableMap;