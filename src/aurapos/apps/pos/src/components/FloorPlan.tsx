import React, { useState, useRef } from 'react';

interface Table {
  id: string;
  x: number; // left position in px
  y: number; // top position in px
  width: number; // width in px
  height: number; // height in px
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
    // optional: add a class for dragging feedback
    e.currentTarget.classList.add('opacity-50');
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('opacity-50');
    draggedId.current = null;
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // allow drop
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetId: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (!id || id === targetId || !draggedId.current) return;

    setTableState((prev) => {
      const dragged = prev.find((t) => t.id === draggedId.current);
      const target = prev.find((t) => t.id === targetId);
      if (!dragged || !target) return prev;

      return prev.map((t) => {
        if (t.id === dragged.id) {
          return { ...t, x: target.x, y: target.y };
        }
        if (t.id === target.id) {
          return { ...t, x: dragged.x, y: dragged.y };
        }
        return t;
      });
    });
  };

  // If we want to propagate changes upward
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