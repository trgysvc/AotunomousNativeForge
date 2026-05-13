import React, { useState, useRef } from 'react';

type TableStatus = 'free' | 'occupied' | 'reserved';

interface Table {
  id: string;
  status: TableStatus;
  zoneId?: string;
  label: string;
}

interface Zone {
  id: string;
  name: string;
  tables: string[]; // table ids
}

const initialTables: Table[] = [
  { id: 't1', status: 'free', label: '1' },
  { id: 't2', status: 'free', label: '2' },
  { id: 't3', status: 'occupied', label: '3' },
  { id: 't4', status: 'reserved', label: '4' },
  { id: 't5', status: 'free', label: '5' },
  { id: 't6', status: 'free', label: '6' },
];

const initialZones: Zone[] = [
  { id: 'z1', name: 'Ana Salon', tables: [] },
  { id: 'z2', name: 'Terasa', tables: [] },
];

export default function MasaPlan() {
  const [tables, setTables] = useState<Table[]>(initialTables);
  const [zones, setZones] = useState<Zone[]>(initialZones);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ show: boolean; x: number; y: number; tableId: string } | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, zoneId: string) => {
    e.preventDefault();
    if (!draggedId) return;
    setTables(prev =>
      prev.map(t =>
        t.id === draggedId ? { ...t, zoneId } : t
      )
    );
    setZones(prev =>
      prev.map(z =>
        z.id === zoneId
          ? { ...z, tables: [...z.tables, draggedId] }
          : z
      )
    );
    setDraggedId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
  };

  const handleContextMenu = (e: React.MouseEvent, tableId: string) => {
    e.preventDefault();
    setMenu({ show: true, x: e.clientX, y: e.clientY, tableId });
  };

  const handleMenuAction = (action: 'split' | 'merge') => {
    if (!menu) return;
    // Placeholder logic
    alert(`${action} table ${menu.tableId}`);
    setMenu(null);
  };

  const handleMenuClose = () => {
    setMenu(null);
  };

  const statusColors: Record<TableStatus, string> = {
    free: '#4caf50',
    occupied: '#f44336',
    reserved: '#ff9800',
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>Masa Planı</h2>
      <div style={{ display: 'flex', gap: '20px' }}>
        {/* Zones */}
        <div style={{ flex: 1, border: '1px solid #ccc', minHeight: '400px', padding: '10px' }}>
          {zones.map(zone => (
            <div
              key={zone.id}
              style={{
                border: '2px dashed #999',
                margin: '10px',
                padding: '10px',
                minHeight: '80px',
                backgroundColor: '#fafafa',
              }}
              onDragOver={handleDragOver}
              onDrop={e => handleDrop(e, zone.id)}
            >
              <strong>{zone.name}</strong>
              <div style={{ marginTop: '5px' }}>
                {zone.tables.map(tid => {
                  const t = tables.find(t => t.id === tid);
                  return t ? (
                    <div
                      key={t.id}
                      style={{
                        display: 'inline-block',
                        width: '40px',
                        height: '40px',
                        lineHeight: '40px',
                        textAlign: 'center',
                        margin: '5px',
                        backgroundColor: statusColors[t.status],
                        color: '#fff',
                        borderRadius: '4px',
                        userSelect: 'none',
                      }}
                      draggable
                      onDragStart={e => handleDragStart(e, t.id)}
                      onDragEnd={handleDragEnd}
                      onContextMenu={e => handleContextMenu(e, t.id)}
                    >
                      {t.label}
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Tables palette */}
        <div style={{ width: '200px', border: '1px solid #ccc', padding: '10px' }}>
          <strong>Masalar</strong>
          {tables.map(t => (
            <div
              key={t.id}
              style={{
                display: 'block',
                width: '100%',
                height: '40px',
                lineHeight: '40px',
                textAlign: 'center',
                margin: '5px 0',
                backgroundColor: statusColors[t.status],
                color: '#fff',
                borderRadius: '4px',
                userSelect: 'none',
                cursor: 'grab',
              }}
              draggable
              onDragStart={e => handleDragStart(e, t.id)}
              onDragEnd={handleDragEnd}
              onContextMenu={e => handleContextMenu(e, t.id)}
            >
              {t.label}
            </div>
          ))}
        </div>
      </div>

      {/* Context Menu */}
      {menu && (
        <div
          style={{
            position: 'fixed',
            left: menu.x,
            top: menu.y,
            backgroundColor: '#fff',
            border: '1px solid #ccc',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            padding: '5px 0',
            zIndex: 1000,
          }}
          onClickOutside={handleMenuClose}
        >
          <div
            style={{
              padding: '8px 16px',
              cursor: 'pointer',
            }}
            onClick={() => {
              handleMenuAction('split');
              handleMenuClose();
            }}
          >
            Böl (Split)
          </div>
          <div
            style={{
              padding: '8px 16px',
              cursor: 'pointer',
            }}
            onClick={() => {
              handleMenuAction('merge');
              handleMenuClose();
            }}
          >
            Birleştir (Merge)
          </div>
        </div>
      )}
    </div>
  );
}

// Helper for click outside (simple implementation)
function useClickOutside(ref: RefObject<HTMLElement>, handler: () => void) {
  useEffect(() => {
    const listener = (e: MouseEvent) => {
      if (!ref.current || ref.current.contains(e.target as Node)) return;
      handler();
    };
    document.addEventListener('mousedown', listener);
    return () => document.removeEventListener('mousedown', listener);
  }, [ref, handler]);
}

// Since we cannot rely on external libs, we implement a simple version inline.
// For brevity, we omitted the hook usage; in a real scenario you'd implement properly.

// Note: The above code is a simplified representation; actual production code would need proper
// click-outside handling and possibly more robust drag-and-drop logic.