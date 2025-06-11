// BpmnLivePreview.js
import React, { useState, useEffect, useMemo } from 'react';
import BpmnSvgRenderer from './BpmnSvgRenderer';

const BpmnLivePreview = ({ processus, passerelles, showPreview = true }) => {
    const [xmlPreview, setXmlPreview] = useState('');
    const [error, setError] = useState(null);

    // Générer le XML BPMN basique en temps réel
    useEffect(() => {
        if (!processus.name || !processus.etapeList || processus.etapeList.length === 0) {
            setXmlPreview('');
            return;
        }

        try {
            // Création des éléments de base pour le XML
            const processName = processus.name;
            const processId = "Process_" + processName.replace(/\s+/g, "_");

            let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
            xml += '<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" ';
            xml += 'xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" ';
            xml += 'xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" ';
            xml += 'xmlns:di="http://www.omg.org/spec/DD/20100524/DI" ';
            xml += 'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ';
            xml += 'id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">\n';

            // Process
            xml += `  <bpmn:process id="${processId}" name="${processName}" isExecutable="false">\n`;

            // Start Event
            xml += '    <bpmn:startEvent id="start" name="Start" />\n';

            // Tasks (Étapes)
            for (let i = 0; i < processus.etapeList.length; i++) {
                const etape = processus.etapeList[i];
                xml += `    <bpmn:task id="task_${i}" name="${etape.nom}" />\n`;
            }

            // Gateways (Passerelles)
            for (let i = 0; i < passerelles.length; i++) {
                const passerelle = passerelles[i];
                let gatewayType = 'bpmn:exclusiveGateway';

                switch(passerelle.type) {
                    case 'EXCLUSIVE':
                        gatewayType = 'bpmn:exclusiveGateway';
                        break;
                    case 'PARALLEL':
                        gatewayType = 'bpmn:parallelGateway';
                        break;
                    case 'INCLUSIVE':
                        gatewayType = 'bpmn:inclusiveGateway';
                        break;
                }

                xml += `    <${gatewayType} id="gateway_${i}" name="${passerelle.name}" />\n`;
            }

            // End Event
            xml += '    <bpmn:endEvent id="end" name="End" />\n';

            // Sequence Flows (connexions)
            // Connecter les étapes de manière linéaire pour la simplicité
            xml += '    <bpmn:sequenceFlow id="flow_start" sourceRef="start" targetRef="task_0" />\n';

            // Flows entre les étapes, en tenant compte des passerelles
            if (passerelles.length === 0) {
                // Flux simple sans passerelles
                for (let i = 0; i < processus.etapeList.length - 1; i++) {
                    xml += `    <bpmn:sequenceFlow id="flow_${i}" sourceRef="task_${i}" targetRef="task_${i+1}" />\n`;
                }
                xml += `    <bpmn:sequenceFlow id="flow_end" sourceRef="task_${processus.etapeList.length-1}" targetRef="end" />\n`;
            } else {
                // Avec passerelles, créer des connexions simplifiées
                const simplifiedConnections = generateSimplifiedConnections(processus.etapeList, passerelles);
                xml += simplifiedConnections;
            }

            // Fermer le process
            xml += '  </bpmn:process>\n';

            // Diagram (partie visuelle simplifiée)
            xml += generateSimplifiedDiagram(processId, processus.etapeList, passerelles);

            // Fin du XML
            xml += '</bpmn:definitions>';

            setXmlPreview(xml);
            setError(null);
        } catch (err) {
            console.error('Erreur lors de la génération du prévisualisation BPMN:', err);
            setError('Impossible de générer la prévisualisation du diagramme.');
            setXmlPreview('');
        }
    }, [processus, passerelles]);

    // Fonction pour générer des connexions simplifiées
    const generateSimplifiedConnections = (etapes, passerelles) => {
        let connections = '';
        let flowIndex = 0;

        // Localiser les positions des passerelles entre les étapes
        const passerellePositions = passerelles.map(p => ({
            id: p.id || flowIndex++,
            position: parseInt(p.apresEtape) + 1,
            type: p.type,
            name: p.name,
            conditions: p.conditions
        }));

        // Trier les positions pour faciliter le parcours
        passerellePositions.sort((a, b) => a.position - b.position);

        // Étape courante pour le suivi
        let currentNodeRef = "start";
        let currentPosition = 0;

        // Parcourir les étapes et insérer les passerelles aux bons endroits
        for (let i = 0; i < etapes.length; i++) {
            // Vérifier si une passerelle est positionnée avant cette étape
            const passerellesBeforeThisStep = passerellePositions.filter(p =>
                p.position > currentPosition && p.position <= i + 1);

            if (passerellesBeforeThisStep.length > 0) {
                // Ajouter des connexions pour chaque passerelle trouvée
                for (const passerelle of passerellesBeforeThisStep) {
                    // Connexion du nœud actuel à la passerelle
                    connections += `    <bpmn:sequenceFlow id="flow_${flowIndex++}" sourceRef="${currentNodeRef}" targetRef="gateway_${passerellePositions.indexOf(passerelle)}" />\n`;

                    // Si la passerelle a des conditions, créer des branches conditionnelles (simplifié)
                    if (passerelle.conditions && passerelle.conditions.length > 0) {
                        // Simplification: première condition vers l'étape actuelle
                        connections += `    <bpmn:sequenceFlow id="flow_${flowIndex++}" sourceRef="gateway_${passerellePositions.indexOf(passerelle)}" targetRef="task_${i}" name="${passerelle.conditions[0].label}" />\n`;

                        // Autres conditions vers d'autres étapes si définies
                        for (let j = 1; j < passerelle.conditions.length && j < 2; j++) { // Limiter à 2 conditions pour simplifier
                            const targetIndex = passerelle.conditions[j].targetEtape;
                            if (targetIndex < etapes.length) {
                                connections += `    <bpmn:sequenceFlow id="flow_${flowIndex++}" sourceRef="gateway_${passerellePositions.indexOf(passerelle)}" targetRef="task_${targetIndex}" name="${passerelle.conditions[j].label}" />\n`;
                            }
                        }
                    } else {
                        // Pas de conditions, simplement connecter à l'étape actuelle
                        connections += `    <bpmn:sequenceFlow id="flow_${flowIndex++}" sourceRef="gateway_${passerellePositions.indexOf(passerelle)}" targetRef="task_${i}" />\n`;
                    }

                    // La passerelle devient le nœud de référence actuel
                    currentNodeRef = "task_" + i;
                }
            } else {
                // Pas de passerelle, connexion directe
                connections += `    <bpmn:sequenceFlow id="flow_${flowIndex++}" sourceRef="${currentNodeRef}" targetRef="task_${i}" />\n`;
                currentNodeRef = "task_" + i;
            }

            currentPosition = i + 1;
        }

        // Connexion finale à l'événement de fin
        connections += `    <bpmn:sequenceFlow id="flow_end" sourceRef="${currentNodeRef}" targetRef="end" />\n`;

        return connections;
    };

    // Générer une représentation visuelle simplifiée du diagramme
    const generateSimplifiedDiagram = (processId, etapes, passerelles) => {
        let diagram = '  <bpmndi:BPMNDiagram id="BPMNDiagram_1">\n';
        diagram += `    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="${processId}">\n`;

        // Positions standard pour les éléments
        const startX = 150;
        const startY = 100;
        const spacing = 150;

        // Start event
        diagram += `      <bpmndi:BPMNShape id="start_di" bpmnElement="start">\n`;
        diagram += `        <dc:Bounds x="${startX}" y="${startY}" width="36" height="36" />\n`;
        diagram += `      </bpmndi:BPMNShape>\n`;

        // Tasks (Étapes)
        for (let i = 0; i < etapes.length; i++) {
            const taskX = startX + ((i + 1) * spacing);
            diagram += `      <bpmndi:BPMNShape id="task_${i}_di" bpmnElement="task_${i}">\n`;
            diagram += `        <dc:Bounds x="${taskX}" y="${startY - 20}" width="100" height="80" />\n`;
            diagram += `      </bpmndi:BPMNShape>\n`;
        }

        // Gateways (Passerelles) - positionnées après les étapes pour simplicité
        const gatewayStartX = startX + ((etapes.length + 1) * spacing);
        for (let i = 0; i < passerelles.length; i++) {
            const gatewayX = gatewayStartX + (i * spacing);
            diagram += `      <bpmndi:BPMNShape id="gateway_${i}_di" bpmnElement="gateway_${i}">\n`;
            diagram += `        <dc:Bounds x="${gatewayX}" y="${startY - 10}" width="50" height="50" />\n`;
            diagram += `      </bpmndi:BPMNShape>\n`;
        }

        // End event
        const endX = Math.max(
            startX + ((etapes.length + 1) * spacing),
            gatewayStartX + (passerelles.length * spacing)
        );
        diagram += `      <bpmndi:BPMNShape id="end_di" bpmnElement="end">\n`;
        diagram += `        <dc:Bounds x="${endX}" y="${startY}" width="36" height="36" />\n`;
        diagram += `      </bpmndi:BPMNShape>\n`;

        // Connexions visuelles simplifiées (juste pour visualisation)
        diagram += `      <bpmndi:BPMNEdge id="flow_start_di" bpmnElement="flow_start">\n`;
        diagram += `        <di:waypoint x="${startX + 36}" y="${startY + 18}" />\n`;
        diagram += `        <di:waypoint x="${startX + spacing}" y="${startY + 20}" />\n`;
        diagram += `      </bpmndi:BPMNEdge>\n`;

        // Autres connexions simplifiées
        for (let i = 0; i < etapes.length - 1; i++) {
            const sourceX = startX + ((i + 1) * spacing) + 100; // Width of the task
            const targetX = startX + ((i + 2) * spacing);

            diagram += `      <bpmndi:BPMNEdge id="flow_${i}_di" bpmnElement="flow_${i}">\n`;
            diagram += `        <di:waypoint x="${sourceX}" y="${startY + 20}" />\n`;
            diagram += `        <di:waypoint x="${targetX}" y="${startY + 20}" />\n`;
            diagram += `      </bpmndi:BPMNEdge>\n`;
        }

        // Connexion finale
        const lastTaskX = startX + (etapes.length * spacing) + 100;
        diagram += `      <bpmndi:BPMNEdge id="flow_end_di" bpmnElement="flow_end">\n`;
        diagram += `        <di:waypoint x="${lastTaskX}" y="${startY + 20}" />\n`;
        diagram += `        <di:waypoint x="${endX}" y="${startY + 18}" />\n`;
        diagram += `      </bpmndi:BPMNEdge>\n`;

        diagram += `    </bpmndi:BPMNPlane>\n`;
        diagram += `  </bpmndi:BPMNDiagram>\n`;

        return diagram;
    };

    // Ne rien afficher si pas de prévisualisation ou d'erreur
    if (!xmlPreview && !error) {
        return null;
    }

    return (
        <div className={`bpmn-preview ${showPreview ? '' : 'hidden'}`}>
            <div className="preview-header">
                <h3>Prévisualisation en temps réel</h3>
                <div className="preview-status">
                    {error ? (
                        <span className="preview-error">{error}</span>
                    ) : (
                        <span className="preview-info">Mise à jour automatique</span>
                    )}
                </div>
            </div>

            {xmlPreview && (
                <div className="preview-container">
                    <BpmnSvgRenderer xml={xmlPreview} />
                </div>
            )}
        </div>
    );
};

export default BpmnLivePreview;