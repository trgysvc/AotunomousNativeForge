import { ReactFlow, ReactFlowProvider, Node, Edge, Background, Controls, MiniMap, Position } from '@xyflow/react';
import { useEffect, useState } from 'react';

interface TableNodeData {
  label: string;
  status: 'free' | 'occupied' | 'cleaning';
}

export default function TablesPage() {
  const [nodes, setNodes] = useState<Node<TableNodeData>[]>([]);
  const [edges, setEdges] = useState<Edge<unknown>[]>([]);

  useEffect(() => {
    const tableData = [
      { id: '1', label: 'Table 1', status: 'free', position: { x: 100, y: 100 } },
      { id: '2', label: 'Table 2', status: 'occupied', position: { x: 300, y: 100 } },
      { id: '3', label: 'Table 3', status: 'cleaning', position: { x: 200, y: 300 } },
    ];

    const initialNodes = tableData.map(t => ({
      id: t.id,
      type: 'tableNode',
      data: { label: t.label, status: t.status },
      position: t.position,
    }));

    setNodes(initialNodes);
    setEdges([]);
  }, []);

  const nodeTypes = {
    tableNode: ({ data, selected }: { data: TableNodeData; selected: boolean }) => {
      const bgColor =
        data.status === 'free'
          ? '#4caf50'
          : data.status === 'occupied'
          ? '#f44336'
          : '#ff9800';
      return (
        <div
          style={{
            width: 120,
            height: 60,
            background: bgColor,
            color: '#fff',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'move',
            userSelect: 'none',
          }}
        >
          <div>{data.label}</div>
        </div>
      );
    },
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Table Map</h2>
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={(changes) =>
            setNodes(nds =>
              nds.map(node => {
                const change = changes.find(c => c.id === node.id);
                if (!change) return node;
                if (change.type === 'position') {
                  return { ...node, position: change.position };
                }
                return node;
              })
            )
          }
          zoomOnWheel
          panOnDrag
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
}