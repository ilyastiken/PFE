import './App.css';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';
import React, { useEffect, useRef, useState } from 'react';
import BpmnViewer from 'bpmn-js/lib/NavigatedViewer';

const BpmnDiagram = ({ xml }) => {
    const containerRef = useRef(null);
    const bpmnViewerRef = useRef(null);
    const [error, setError] = useState(null);
    const [isReady, setIsReady] = useState(false);

    // Initialisation du viewer
    useEffect(() => {
        if (!containerRef.current) return;

        try {
            // Créer le viewer avec la configuration minimale
            const viewer = new BpmnViewer({
                container: containerRef.current,
                keyboard: {
                    bindTo: window
                }
            });

            bpmnViewerRef.current = viewer;
            setIsReady(true);

            // Cleanup
            return () => {
                if (bpmnViewerRef.current) {
                    bpmnViewerRef.current.destroy();
                    bpmnViewerRef.current = null;
                }
                setIsReady(false);
            };
        } catch (err) {
            console.error('Erreur lors de la création du viewer:', err);
            setError('Impossible de créer le viewer BPMN');
        }
    }, []); // S'exécute une seule fois au montage

    // Chargement du XML
    useEffect(() => {
        if (!isReady || !bpmnViewerRef.current || !xml) return;

        const importDiagram = async () => {
            try {
                setError(null);

                // S'assurer que le viewer est prêt
                const viewer = bpmnViewerRef.current;

                // Importer le XML
                await viewer.importXML(xml);

                // Attendre que le rendu soit complet avant d'ajuster le zoom
                requestAnimationFrame(() => {
                    try {
                        const canvas = viewer.get('canvas');
                        canvas.zoom('fit-viewport');
                    } catch (zoomError) {
                        console.warn('Avertissement lors du zoom initial:', zoomError);
                    }
                });

            } catch (err) {
                console.error('Erreur d\'importation BPMN:', err);
                setError(`Erreur: ${err.message}`);
            }
        };

        importDiagram();
    }, [xml, isReady]);

    // Fonctions de contrôle
    const handleZoomIn = () => {
        if (!bpmnViewerRef.current) return;
        try {
            const canvas = bpmnViewerRef.current.get('canvas');
            canvas.zoom(canvas.zoom() * 1.1);
        } catch (err) {
            console.error('Erreur zoom in:', err);
        }
    };

    const handleZoomOut = () => {
        if (!bpmnViewerRef.current) return;
        try {
            const canvas = bpmnViewerRef.current.get('canvas');
            canvas.zoom(canvas.zoom() * 0.9);
        } catch (err) {
            console.error('Erreur zoom out:', err);
        }
    };

    const handleFitViewport = () => {
        if (!bpmnViewerRef.current) return;
        try {
            const canvas = bpmnViewerRef.current.get('canvas');
            canvas.zoom('fit-viewport');
        } catch (err) {
            console.error('Erreur fit viewport:', err);
        }
    };

    const handleDownload = () => {
        if (!xml) return;

        const blob = new Blob([xml], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'processus.bpmn';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="bpmn-container">
            <h2 className="text-xl font-bold mb-2">Diagramme BPMN</h2>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-2">
                    {error}
                </div>
            )}

            <div
                ref={containerRef}
                className="bpmn-canvas"
                style={{
                    width: '100%',
                    height: '500px',
                    border: '1px solid #ccc',
                    backgroundColor: '#f8f8f8',
                    position: 'relative'
                }}
            />

            <div className="bpmn-controls mt-4 flex gap-2">
                <button
                    onClick={handleFitViewport}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                    Ajuster à la vue
                </button>
                <button
                    onClick={handleZoomIn}
                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                >
                    Zoom +
                </button>
                <button
                    onClick={handleZoomOut}
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                >
                    Zoom -
                </button>
                <button
                    onClick={handleDownload}
                    className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
                >
                    Télécharger BPMN
                </button>
            </div>
        </div>
    );
};

export default BpmnDiagram;