import './App.css';
import React, { useEffect, useRef } from 'react';
import BpmnJS from 'bpmn-js/dist/bpmn-navigated-viewer.production.min.js';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';


function BpmnViewer({ xml }) {
    const containerRef = useRef(null);
    const bpmnViewerRef = useRef(null);

    useEffect(() => {
        // Nettoyage de l'ancienne visionneuse si elle existe
        if (bpmnViewerRef.current) {
            bpmnViewerRef.current.destroy();
            bpmnViewerRef.current = null;
        }

        // Créer une nouvelle instance de BpmnJS pour chaque rendu
        bpmnViewerRef.current = new BpmnJS({
            container: containerRef.current,
            height: '100%',
            width: '100%'
        });

        // Importer le XML uniquement s'il existe
        if (xml && xml.trim() !== '') {
            try {
                bpmnViewerRef.current.importXML(xml)
                    .then(({ warnings }) => {
                        if (warnings.length) {
                            console.warn('Warnings during BPMN import:', warnings);
                        }

                        // Ajuster la vue pour afficher le diagramme entier
                        const canvas = bpmnViewerRef.current.get('canvas');
                        canvas.zoom('fit-viewport', 'auto');

                        // Force un redimensionnement pour s'assurer que tout est correctement affiché
                        setTimeout(() => {
                            if (bpmnViewerRef.current) {
                                bpmnViewerRef.current.get('canvas').zoom('fit-viewport', 'auto');
                            }
                        }, 200);
                    })
                    .catch(err => {
                        console.error('Error importing BPMN XML:', err);
                    });
            } catch (error) {
                console.error('Exception during BPMN import:', error);
            }
        }

        // Nettoyage lors du démontage du composant
        return () => {
            if (bpmnViewerRef.current) {
                bpmnViewerRef.current.destroy();
                bpmnViewerRef.current = null;
            }
        };
    }, [xml]);// Réexécuter uniquement lorsque le XML change

    return (
        <div>
            <div className="bpmn-viewer" ref={containerRef}></div>
            <div className="bpmn-controls">
                <button
                    onClick={() => {
                        if (bpmnViewerRef.current) {
                            bpmnViewerRef.current.get("canvas").zoom("fit-viewport");
                        }
                    }}
                    className="bpmn-control-button"
                >
                    Ajuster à la vue
                </button>
                <button
                    onClick={() => {
                        if (bpmnViewerRef.current) {
                            const canvas = bpmnViewerRef.current.get("canvas");
                            canvas.zoom(canvas.zoom() * 1.1);
                        }
                    }}
                    className="bpmn-control-button"
                >
                    Zoom +
                </button>
                <button
                    onClick={() => {
                        if (bpmnViewerRef.current) {
                            const canvas = bpmnViewerRef.current.get("canvas");
                            canvas.zoom(canvas.zoom() * 0.9);
                        }
                    }}
                    className="bpmn-control-button"
                >
                    Zoom -
                </button>
                <button
                    onClick={() => {
                        const downloadLink = document.createElement("a");
                        const blob = new Blob([xml], { type: "application/xml" });
                        downloadLink.href = URL.createObjectURL(blob);
                        downloadLink.download = "processus.bpmn";
                        document.body.appendChild(downloadLink);
                        downloadLink.click();
                        document.body.removeChild(downloadLink);
                    }}
                    className="bpmn-control-button download-button"
                >
                    Télécharger BPMN
                </button>
            </div>
        </div>
    );
}

export default BpmnViewer;