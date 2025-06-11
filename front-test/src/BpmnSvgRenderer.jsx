import React, { useEffect, useState, useRef } from 'react';

const BpmnSvgRenderer = ({ xml }) => {
    const [svgContent, setSvgContent] = useState(null);
    const [error, setError] = useState(null);
    const svgRef = useRef(null);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    useEffect(() => {
        if (!xml || xml.trim() === '') {
            setError('Aucun XML fourni');
            return;
        }

        try {
            // Nettoyer le XML
            const cleanXml = xml.trim();

            // Vérifier que c'est du XML valide
            if (!cleanXml.startsWith('<?xml') && !cleanXml.startsWith('<')) {
                throw new Error('Le contenu ne semble pas être du XML valide');
            }

            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(cleanXml, "text/xml");

            // Vérifier les erreurs de parsing plus robustement
            const parserError = xmlDoc.querySelector('parsererror');
            if (parserError) {
                const errorText = parserError.textContent || 'Erreur de parsing XML';
                throw new Error(errorText);
            }

            // Vérifier que c'est bien du BPMN
            const definitions = xmlDoc.querySelector('definitions');
            if (!definitions) {
                throw new Error('Document BPMN invalide - élément definitions manquant');
            }

            // Extraire les éléments BPMN
            const elements = [];
            const connections = [];

            // Utiliser différents sélecteurs pour être plus flexible
            const shapes = xmlDoc.querySelectorAll('[bpmnElement]');
            shapes.forEach(shape => {
                const elementId = shape.getAttribute('bpmnElement');
                const bounds = shape.querySelector('Bounds');

                // Chercher l'élément dans tout le document
                const element = xmlDoc.querySelector(`[id="${elementId}"]`) ||
                    xmlDoc.querySelector(`#${elementId}`);

                if (bounds && element) {
                    elements.push({
                        id: elementId,
                        type: element.tagName.replace('bpmn:', ''),
                        name: element.getAttribute('name') || elementId,
                        x: parseFloat(bounds.getAttribute('x')) || 0,
                        y: parseFloat(bounds.getAttribute('y')) || 0,
                        width: parseFloat(bounds.getAttribute('width')) || 36,
                        height: parseFloat(bounds.getAttribute('height')) || 36
                    });
                }
            });

            // Si aucun shape trouvé, essayer une approche différente
            if (elements.length === 0) {
                // Chercher directement les éléments BPMN
                const bpmnElements = xmlDoc.querySelectorAll('startEvent, endEvent, task');
                bpmnElements.forEach((element, index) => {
                    elements.push({
                        id: element.getAttribute('id'),
                        type: element.tagName.replace('bpmn:', ''),
                        name: element.getAttribute('name') || element.getAttribute('id'),
                        x: index * 150 + 50,
                        y: 100,
                        width: element.tagName.includes('Event') ? 36 : 100,
                        height: element.tagName.includes('Event') ? 36 : 80
                    });
                });
            }

            // Récupérer les connexions
            const edges = xmlDoc.querySelectorAll('[bpmnElement*="flow"]');
            edges.forEach(edge => {
                const elementId = edge.getAttribute('bpmnElement');
                const waypoints = edge.querySelectorAll('waypoint');
                const flow = xmlDoc.querySelector(`[id="${elementId}"]`);

                if (waypoints.length >= 2 && flow) {
                    const points = [];
                    waypoints.forEach(wp => {
                        points.push({
                            x: parseFloat(wp.getAttribute('x')) || 0,
                            y: parseFloat(wp.getAttribute('y')) || 0
                        });
                    });

                    connections.push({
                        id: elementId,
                        source: flow.getAttribute('sourceRef'),
                        target: flow.getAttribute('targetRef'),
                        points: points
                    });
                }
            });

            // Si pas de connexions trouvées, essayer les sequenceFlow
            if (connections.length === 0) {
                const flows = xmlDoc.querySelectorAll('sequenceFlow');
                flows.forEach((flow, index) => {
                    const sourceId = flow.getAttribute('sourceRef');
                    const targetId = flow.getAttribute('targetRef');
                    const source = elements.find(e => e.id === sourceId);
                    const target = elements.find(e => e.id === targetId);

                    if (source && target) {
                        connections.push({
                            id: flow.getAttribute('id'),
                            source: sourceId,
                            target: targetId,
                            points: [
                                { x: source.x + source.width, y: source.y + source.height/2 },
                                { x: target.x, y: target.y + target.height/2 }
                            ]
                        });
                    }
                });
            }

            // Générer le SVG
            const svg = generateSVG(elements, connections);
            setSvgContent(svg);
            setError(null);

        } catch (err) {
            console.error('Erreur rendering:', err);
            setError('Erreur lors du rendu: ' + err.message);
            setSvgContent(null);
        }
    }, [xml]);

    const generateSVG = (elements, connections) => {
        if (elements.length === 0) {
            return {
                content: '<text x="50%" y="50%" text-anchor="middle" font-size="16">Aucun élément à afficher</text>',
                viewBox: '0 0 400 200'
            };
        }

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        // Calculer les dimensions
        elements.forEach(elem => {
            minX = Math.min(minX, elem.x);
            minY = Math.min(minY, elem.y);
            maxX = Math.max(maxX, elem.x + elem.width);
            maxY = Math.max(maxY, elem.y + elem.height);
        });

        // S'assurer que les dimensions sont valides
        if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
            minX = 0; minY = 0; maxX = 800; maxY = 600;
        }

        const svgElements = [];

        // Marqueurs pour les flèches
        const defs = `
            <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="10" 
                        refX="9" refY="3" orient="auto">
                    <polygon points="0 0, 10 3, 0 6" fill="#333" />
                </marker>
                <style>
                    text { font-family: Arial, sans-serif; }
                </style>
            </defs>
        `;
        svgElements.push(defs);

        // Dessiner les connexions en premier
        connections.forEach(conn => {
            if (conn.points && conn.points.length >= 2) {
                let path = `M ${conn.points[0].x} ${conn.points[0].y}`;
                for (let i = 1; i < conn.points.length; i++) {
                    path += ` L ${conn.points[i].x} ${conn.points[i].y}`;
                }

                svgElements.push(`
                    <path d="${path}" fill="none" stroke="#333" stroke-width="2" 
                          marker-end="url(#arrowhead)"/>
                `);
            }
        });

        // Dessiner les éléments
        elements.forEach(elem => {
            let shape = '';
            const centerX = elem.x + (elem.width / 2);
            const centerY = elem.y + (elem.height / 2);

            switch (elem.type.toLowerCase()) {
                case 'startevent':
                    shape = `
                        <g>
                            <circle cx="${centerX}" cy="${centerY}" r="18" 
                                    fill="#90EE90" stroke="#333" stroke-width="2"/>
                            <text x="${centerX}" y="${elem.y + elem.height + 15}" 
                                  text-anchor="middle" font-size="12">${elem.name}</text>
                        </g>
                    `;
                    break;

                case 'endevent':
                    shape = `
                        <g>
                            <circle cx="${centerX}" cy="${centerY}" r="18" 
                                    fill="#FF6B6B" stroke="#333" stroke-width="3"/>
                            <text x="${centerX}" y="${elem.y + elem.height + 15}" 
                                  text-anchor="middle" font-size="12">${elem.name}</text>
                        </g>
                    `;
                    break;

                default: // task ou autre
                    shape = `
                        <g>
                            <rect x="${elem.x}" y="${elem.y}" 
                                  width="${elem.width}" height="${elem.height}" 
                                  fill="#87CEEB" stroke="#333" stroke-width="2" rx="8"/>
                            <text x="${centerX}" y="${centerY + 5}" 
                                  text-anchor="middle" font-size="14">${elem.name}</text>
                        </g>
                    `;
                    break;
            }

            svgElements.push(shape);
        });

        const padding = 50;
        const viewBox = `${minX - padding} ${minY - padding} ${maxX - minX + 2*padding} ${maxY - minY + 2*padding}`;

        return {
            content: svgElements.join('\n'),
            viewBox: viewBox
        };
    };

    // Gestion du zoom et du déplacement
    const handleZoom = (direction) => {
        setZoom(prevZoom => {
            const factor = direction === 'in' ? 1.2 : 0.8;
            const newZoom = prevZoom * factor;
            return Math.max(0.1, Math.min(5, newZoom));
        });
    };

    const handleMouseDown = (e) => {
        e.preventDefault();
        setIsDragging(true);
        setDragStart({
            x: e.clientX - pan.x,
            y: e.clientY - pan.y
        });
    };

    const handleMouseMove = (e) => {
        if (isDragging) {
            e.preventDefault();
            setPan({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleReset = () => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
    };

    const handleDownload = () => {
        if (!xml) return;

        const blob = new Blob([xml], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'processus.bpmn';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div>
            <h2 className="text-xl font-bold mb-2">Diagramme BPMN (SVG)</h2>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-2">
                    {error}
                </div>
            )}

            <div
                style={{
                    width: '100%',
                    height: '500px',
                    border: '1px solid #ccc',
                    overflow: 'hidden',
                    position: 'relative',
                    cursor: isDragging ? 'grabbing' : 'grab',
                    backgroundColor: '#f8f8f8'
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                {svgContent && (
                    <svg
                        ref={svgRef}
                        width="100%"
                        height="100%"
                        viewBox={svgContent.viewBox}
                        style={{
                            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                            transformOrigin: '0 0',
                            transition: isDragging ? 'none' : 'transform 0.1s'
                        }}
                        dangerouslySetInnerHTML={{ __html: svgContent.content }}
                    />
                )}
            </div>

            <div className="controls mt-4 flex gap-2">
                <button
                    onClick={() => handleZoom('in')}
                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                >
                    Zoom +
                </button>
                <button
                    onClick={() => handleZoom('out')}
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                >
                    Zoom -
                </button>
                <button
                    onClick={handleReset}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                    Ajuster la vue
                </button>
                <button
                    onClick={handleDownload}
                    className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
                    disabled={!xml}
                >
                    Télécharger BPMN
                </button>
            </div>

            <div className="mt-2 text-sm text-gray-600">
                Utilisez la souris pour naviguer : glisser pour déplacer, boutons pour zoomer
            </div>
        </div>
    );
};

export default BpmnSvgRenderer;