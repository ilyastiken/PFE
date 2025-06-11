import './App.css';
import React, { useEffect, useRef, useState } from "react";
import BpmnModeler from "bpmn-js/lib/Modeler";


const BpmnEditor = ({ bpmnXml, onSave }) => {
    const modelerRef = useRef(null);
    const [bpmnModeler, setBpmnModeler] = useState(null); // Déclarer bpmnModeler ici

    useEffect(() => {
        if (!bpmnXml) return;

        const modeler = new BpmnModeler({
            container: modelerRef.current,
        });

        modeler.importXML(bpmnXml)
            .then(() => {
                console.log("BPMN chargé avec succès !");
            })
            .catch((err) => {
                console.error("Erreur lors du chargement du BPMN :", err);
            });

        setBpmnModeler(modeler);

        return () => modeler.destroy(); // Nettoyage
    }, [bpmnXml]);

    const handleSave = async () => {
        if (!bpmnModeler) {
            console.error("bpmnModeler n'est pas initialisé.");
            return;
        }

        try {
            const { xml } = await bpmnModeler.saveXML({ format: true });
            onSave(xml); // Appeler la fonction onSave avec le XML généré
        } catch (err) {
            console.error("Erreur lors de l'enregistrement du BPMN :", err);
        }
    };

    return (
        <div>
            <div ref={modelerRef} style={{ width: "100%", height: "500px", border: "1px solid #ccc" }} />
            <button onClick={handleSave}>Enregistrer</button>
        </div>
    );
};

export default BpmnEditor;