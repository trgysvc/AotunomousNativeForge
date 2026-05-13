import React, { useState, useRef } from 'react';

interface Table {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  status: 'empty' | 'occupied' | 'waiting';
}

type FloorPlanProps = {
  tables: Table[];
  onTableUpdate?: (updatedTables: Table[]) => void;
};

export default function FloorPlan({ tables, onTableUpdate }: FloorPlanProps) {
  const [tableState, setTableState] = useState<Table[]>(tables);
  const draggedId = useRef<string | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    draggedId.current = id;
    e.dataTransfer.setData('text/plain', id);
    e.currentTarget.classList.add('opacity-50');
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('opacity-50');
    draggedId.current = null;
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetId: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (!id || id === targetId || !draggedId.current) return;

    setTableState((prev) => {
      const dragged = prev.find((t) => t.id === draggedId.current);
      const target = prev.find((t) => t.id === targetId);
      if (!dragged || !target) return prev;

      if (e.altKey) {
        // Merge: combine widths, keep max height, position at dragged
        const merged = {
          ...dragged,
          width: dragged.width + target.width,
          height: Math.max(dragged.height, target.height),
        };
        return prev
          .filter((t) => t.id !== dragged.id && t.id !== target.id)
          .concat(merged);
      }

      if (e.ctrlKey) {
        // Split: two halves horizontally
        const halfWidth = dragged.width / 2;
        const left = {
          ...dragged,
          width: halfWidth,
          id: `${dragged.id}-left-${Date.now()}`,
        };
        const right = {
          ...dragged,
          width: halfWidth,
          x: dragged.x + halfWidth,
          id: `${dragged.id}-right-${Date.now()}`,
        };
        return prev
          .filter((t) => t.id !== dragged.id)
          .concat(left, right);
      }

      // Default: swap positions
      return prev.map((t) => {
        if (t.id === dragged.id) return { ...t, x: target.x, y: target.y };
        if (t.id === target.id) return { ...t, x: dragged.x, y: dragged.y };
        return t;
      });
    });
  };

  React.useEffect(() => {
    if (onTableUpdate) {
      onTableUpdate(tableState);
    }
  }, [tableState, onTableUpdate]);

  return (
    <div className="relative w-full h-[600px] bg-gray-100 border-2 border-gray-300 rounded">
      {tableState.map((table) => (
        <div
          key={table.id}
          className={`absolute left-[${table.x}px] top-[${table.y}px] w-[${table.width}px] h-[${table.height}px] flex items-center justify-center text-center font-medium rounded border-2 ${
            table.status === 'empty'
              ? 'bg-green-200 border-green-500'
              : table.status === 'occupied'
              ? 'bg-red-200 border-red-500'
              : 'bg-yellow-200 border-yellow-500'
          }`}
          draggable
          onDragStart={(e) => handleDragStart(e, table.id)}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, table.id)}
        >
          <div className="text-xs">{table.id.slice(0, 4)}</div>
        </div>
      ))}
    </div>
  );
}