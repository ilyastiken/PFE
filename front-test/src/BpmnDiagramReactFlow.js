import React, { useEffect, useState, memo, useCallback } from 'react';
import ReactFlow, {
    Controls,
    Background,
    MiniMap,
    useNodesState,
    useEdgesState,
    MarkerType,
    ReactFlowProvider
} from 'reactflow';
import 'reactflow/dist/style.css';

// Constantes définies globalement
const fitViewOptions = { padding: 0.2 };
const edgeOptions = {
    animated: true,
    style: {
        stroke: '#333',
        strokeWidth: 2
    }
};

// Parser XML pour BPMN
const parseBPMNToReactFlow = (xmlString) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");

    const nodes = [];
    const edges = [];

    // Parser les événements de démarrage
    const startEvents = xmlDoc.querySelectorAll('startEvent');
    startEvents.forEach((event) => {
        const shape = xmlDoc.querySelector(`[bpmnElement="${event.getAttribute('id')}"]`);
        const bounds = shape?.querySelector('Bounds');

        nodes.push({
            id: event.getAttribute('id'),
            data: { label: event.getAttribute('name') || 'Start' },
            position: {
                x: parseInt(bounds?.getAttribute('x') || 100),
                y: parseInt(bounds?.getAttribute('y') || 100)
            },
            style: {
                backgroundColor: '#90EE90',
                borderRadius: '50%',
                width: 50,
                height: 50,
                border: '2px solid #333',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }
        });
    });

    // Parser les tâches
    const tasks = xmlDoc.querySelectorAll('task');
    tasks.forEach((task) => {
        const shape = xmlDoc.querySelector(`[bpmnElement="${task.getAttribute('id')}"]`);
        const bounds = shape?.querySelector('Bounds');

        nodes.push({
            id: task.getAttribute('id'),
            data: { label: task.getAttribute('name') || 'Task' },
            position: {
                x: parseInt(bounds?.getAttribute('x') || 200),
                y: parseInt(bounds?.getAttribute('y') || 100)
            },
            style: {
                backgroundColor: '#87CEEB',
                border: '2px solid #333',
                borderRadius: '8px',
                padding: '10px',
                width: 100,
                height: 80,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }
        });
    });

    // Parser les événements de fin
    const endEvents = xmlDoc.querySelectorAll('endEvent');
    endEvents.forEach((event) => {
        const shape = xmlDoc.querySelector(`[bpmnElement="${event.getAttribute('id')}"]`);
        const bounds = shape?.querySelector('Bounds');

        nodes.push({
            id: event.getAttribute('id'),
            data: { label: event.getAttribute('name') || 'End' },
            position: {
                x: parseInt(bounds?.getAttribute('x') || 600),
                y: parseInt(bounds?.getAttribute('y') || 100)
            },
            style: {
                backgroundColor: '#FF6B6B',
                borderRadius: '50%',
                width: 50,
                height: 50,
                border: '3px solid #333',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }
        });
    });

    // Parser les flux de séquence
    const sequenceFlows = xmlDoc.querySelectorAll('sequenceFlow');
    sequenceFlows.forEach((flow) => {
        edges.push({
            id: flow.getAttribute('id'),
            source: flow.getAttribute('sourceRef'),
            target: flow.getAttribute('targetRef'),
            ...edgeOptions,
            markerEnd: {
                type: MarkerType.ArrowClosed
            }
        });
    });

    return { nodes, edges };
};

// Composant interne mémorisé
const Flow = memo(({ xml }) => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!xml) return;

        try {
            const { nodes: parsedNodes, edges: parsedEdges } = parseBPMNToReactFlow(xml);
            setNodes(parsedNodes);
            setEdges(parsedEdges);
            setError(null);
        } catch (err) {
            console.error('Erreur parsing BPMN:', err);
            setError('Erreur lors du parsing du diagramme BPMN');
        }
    }, [xml, setNodes, setEdges]);

    if (error) {
        return (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
            </div>
        );
    }

    return (
        <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
            fitViewOptions={fitViewOptions}
        >
            <Controls />
            <MiniMap />
            <Background variant="dots" gap={12} size={1} />
        </ReactFlow>
    );
});

Flow.displayName = 'Flow';

// Composant principal
const BpmnDiagramReactFlow = ({ xml }) => {
    return (
        <div>
            <h2 className="text-xl font-bold mb-2">Diagramme BPMN (React Flow)</h2>
            <div style={{ width: '100%', height: '500px', border: '1px solid #ccc' }}>
                <ReactFlowProvider>
                    <Flow xml={xml} />
                </ReactFlowProvider>
            </div>
        </div>
    );
};

export default BpmnDiagramReactFlow;