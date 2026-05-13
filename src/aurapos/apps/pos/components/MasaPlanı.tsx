import React, { useState, useRef } from 'react';

interface Table {
  id: string;
  status: 'free' | 'occupied' | 'reserved' | 'cleaning';
  seats: number;
  x?: number;
  y?: number;
}

interface MasaPlanProps {
  tables: Table[];
  onTableDrop?: (tableId: string, x: number, y: number) => void;
  onTableSplit?: (tableId: string) => void;
  onTableMerge?: (tableId: string) => void;
}

export default function MasaPlan({ tables, onTableDrop, onTableSplit, onTableMerge }: MasaPlanProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const floorRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    setDraggedId(id);
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text');
    if (!id) return;
    const floor = floorRef.current;
    if (!floor) return;
    const rect = floor.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (onTableDrop) {
      onTableDrop(id, x, y);
    }
    setDraggedId(null);
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>, id: string) => {
    e.preventDefault();
    setSelectedTableId(id);
    setMenuPos({ x: e.clientX, y: e.clientY });
    setMenuOpen(true);
  };

  const handleMenuClose = () => {
    setMenuOpen(false);
    setSelectedTableId(null);
  };

  const handleSplit = () => {
    if (selectedTableId && onTableSplit) {
      onTableSplit(selectedTableId);
    }
    handleMenuClose();
  };

  const handleMerge = () => {
    if (selectedTableId && onTableMerge) {
      onTableMerge(selectedTableId);
    }
    handleMenuClose();
  };

  const statusColors: Record<Table['status'], string> = {
    free: 'bg-green-200',
    occupied: 'bg-red-200',
    reserved: 'bg-yellow-200',
    cleaning: 'bg-gray-200',
  };

  return (
    <div className="flex h-[600px] w-full gap-4 p-4">
      {/* Palette */}
      <div className="w-64 flex flex-col gap-2">
        <h2 className="font-bold">Masalar</h2>
        <div className="space-y-2">
          {tables.map((t) => (
            <div
              key={t.id}
              draggable
              onDragStart={(e) => handleDragStart(e, t.id)}
              onDragEnd={handleDragEnd}
              className={`p-2 border rounded cursor-move ${
                draggedId === t.id ? 'opacity-50' : ''
              }`}
            >
              <div className="font-medium">{t.id}</div>
              <div className="text-sm">{t.seats} koltuk</div>
            </div>
          ))}
        </div>
      </div>

      {/* Floor Plan */}
      <div
        ref={floorRef}
        className="flex-1 relative bg-gray-100 rounded border"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Existing placed tables */}
        {tables
          .filter((t): t is Table & { x: number; y: number } => t.x !== undefined && t.y !== undefined)
          .map((t) => (
            <div
              key={t.id}
              className={`absolute left-[${t.x}px] top-[${t.y}px] w-20 h-20 ${statusCodes[t.status]} flex flex-col items-center justify-center rounded border cursor-pointer`}
              onContextMenu={(e) => handleContextMenu(e, t.id)}
            >
              <div className="font-medium">{t.id}</div>
              <div className="text-xs">{t.seats}</div>
            </div>
          ))}

        {/* Drag preview */}
        {draggedId && (
          <div
            className="absolute left-0 top-0 w-20 h-20 bg-blue-500/50 border-dashed border-2 border-blue-500 rounded flex items-center justify-center pointer-events-none"
          >
            <div className="text-white font-medium">{draggedId}</div>
          </div>
        )}
      </div>

      {/* Context Menu */}
      {menuOpen && (
        <div
          className={`absolute left-[${menuPos.x}px] top-[${menuPos.y}px] bg-white border rounded shadow-md w-48 z-50`}
          onClick={handleMenuClose}
        >
          <div className="px-4 py-2 cursor-pointer hover:bg-gray-100" onClick={(e) => {
            e.stopPropagation();
            handleSplit();
          }}>
            Böl (Split)
          </div>
          <div className="px-4 py-2 cursor-pointer hover:bg-gray-100" onClick={(e) => {
            e.stopPropagation();
            handleMerge();
          }}>
            Birleştir (Merge)
          </div>
        </div>
      )}
    </div>
  );
}