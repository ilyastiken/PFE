import React, { useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import BpmnLivePreview from "./BpmnLivePreview";
import './App.css';
import BpmnDiagram from "./BpmnDiagram";
import BpmnSvgRenderer from "./BpmnSvgRenderer";

// Constantes
const STEP_TYPES = {
    TASK: { value: 'TASK', label: 'Tâche' },
    START: { value: 'START', label: 'Début' },
    END: { value: 'END', label: 'Fin' }
};

const GATEWAY_TYPES = {
    EXCLUSIVE: { value: 'EXCLUSIVE', label: 'Exclusive (XOR)' },
    PARALLEL: { value: 'PARALLEL', label: 'Parallèle (AND)' },
    INCLUSIVE: { value: 'INCLUSIVE', label: 'Inclusive (OR)' }
};

// Définition d'un seul endpoint API
const API_ENDPOINT = 'http://localhost:8080/api/bpmn/generate-simple';

// Valeurs par défaut
const DEFAULT_STEP = { nom: '', type: 'TASK' };
const DEFAULT_GATEWAY = {
    name: '',
    type: 'EXCLUSIVE',
    apresEtape: 0,
    conditions: [
        {
            label: 'Transition par défaut', // Nom par défaut
            expression: 'condition par défaut', // Gardé mais caché dans l'UI
            sourceEtape: 0,
            targetEtape: 1
        }
    ]
};

const ProcessForm = () => {
    const [processus, setProcessus] = useState({ name: '', etapeList: [] });
    const [passerelles, setPasserelles] = useState([]);
    const [bpmnXml, setBpmnXml] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [showLivePreview, setShowLivePreview] = useState(true);

    // Validation
    const isFormValid = useMemo(() => {
        if (!processus.name.trim()) return false;
        if (processus.etapeList.length === 0) return false;
        return processus.etapeList.every(etape => etape.nom.trim() !== '');
    }, [processus]);

    // Handlers optimisés avec useCallback
    const handleAddEtape = useCallback(() => {
        setProcessus(prev => ({
            ...prev,
            etapeList: [...prev.etapeList, { ...DEFAULT_STEP }]
        }));
    }, []);

    const handleChangeEtape = useCallback((index, field, value) => {
        setProcessus(prev => ({
            ...prev,
            etapeList: prev.etapeList.map((etape, i) =>
                i === index ? { ...etape, [field]: value } : etape
            )
        }));
    }, []);

    const handleRemoveEtape = useCallback((index) => {
        setProcessus(prev => ({
            ...prev,
            etapeList: prev.etapeList.filter((_, i) => i !== index)
        }));

        // Ajuster les positions des passerelles si nécessaire
        setPasserelles(prev => prev.map(p => ({
            ...p,
            apresEtape: p.apresEtape > index ? p.apresEtape - 1 : p.apresEtape,
            conditions: p.conditions.map(c => ({
                ...c,
                sourceEtape: c.sourceEtape > index ? c.sourceEtape - 1 : c.sourceEtape,
                targetEtape: c.targetEtape > index ? c.targetEtape - 1 : c.targetEtape
            }))
        })));
    }, []);

    const handleAddPasserelle = useCallback(() => {
        // Par défaut, nous utilisons les deux premières étapes du processus
        const sourceEtapeDefault = processus.etapeList.length > 0 ? 0 : 0;
        const targetEtapeDefault1 = processus.etapeList.length > 1 ? 1 : 0;

        const newGateway = {
            ...DEFAULT_GATEWAY,
            apresEtape: processus.etapeList.length > 0 ? processus.etapeList.length - 1 : 0,
            conditions: [
                {
                    label: 'Transition par défaut',
                    expression: 'condition par défaut',
                    sourceEtape: sourceEtapeDefault,
                    targetEtape: targetEtapeDefault1
                }
            ]
        };
        setPasserelles(prev => [...prev, newGateway]);
    }, [processus.etapeList.length]);

    const handleChangePasserelle = useCallback((index, field, value) => {
        setPasserelles(prev => prev.map((p, i) =>
            i === index ? { ...p, [field]: value } : p
        ));
    }, []);

    const handleChangeCondition = useCallback((passerelleIndex, conditionIndex, field, value) => {
        setPasserelles(prev => prev.map((p, i) => {
            if (i !== passerelleIndex) return p;

            return {
                ...p,
                conditions: p.conditions.map((c, j) =>
                    j === conditionIndex ? { ...c, [field]: value } : c
                )
            };
        }));
    }, []);

    const handleAddCondition = useCallback((passerelleIndex) => {
        setPasserelles(prev => prev.map((p, i) => {
            if (i !== passerelleIndex) return p;

            // Obtenir un index de source par défaut (l'étape après laquelle la passerelle est placée)
            const sourceEtapeDefault = p.apresEtape;

            // Trouver un index de cible qui n'est pas déjà utilisé, ou utiliser le dernier
            const usedTargets = new Set(p.conditions.map(c => c.targetEtape));
            let targetEtapeDefault = 0;

            for (let j = 0; j < processus.etapeList.length; j++) {
                if (j !== sourceEtapeDefault && !usedTargets.has(j)) {
                    targetEtapeDefault = j;
                    break;
                }
            }

            // Si tous sont utilisés, prendre le dernier différent de la source
            if (targetEtapeDefault === sourceEtapeDefault && processus.etapeList.length > 1) {
                targetEtapeDefault = processus.etapeList.length - 1;
            }

            return {
                ...p,
                conditions: [...p.conditions, {
                    label: `Transition ${p.conditions.length + 1}`,
                    expression: 'condition par défaut', // Expression par défaut
                    sourceEtape: sourceEtapeDefault,
                    targetEtape: targetEtapeDefault
                }]
            };
        }));
    }, [processus.etapeList.length]);

    const handleRemoveCondition = useCallback((passerelleIndex, conditionIndex) => {
        setPasserelles(prev => prev.map((p, i) => {
            if (i !== passerelleIndex) return p;

            return {
                ...p,
                conditions: p.conditions.filter((_, j) => j !== conditionIndex)
            };
        }));
    }, []);

    const handleRemovePasserelle = useCallback((index) => {
        setPasserelles(prev => prev.filter((_, i) => i !== index));
    }, []);

    // Validation des passerelles
    const validateGateways = useCallback(() => {
        for (const gateway of passerelles) {
            if (!gateway.name.trim()) {
                throw new Error('Toutes les passerelles doivent avoir un nom');
            }

            if (gateway.conditions.length < 1) {
                throw new Error('Une passerelle doit avoir au moins une transition');
            }
        }
    }, [passerelles]);

    // Préparation des données
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            // Validation
            if (!isFormValid) {
                throw new Error('Veuillez remplir tous les champs requis');
            }

            if (passerelles.length > 0) {
                validateGateways();
            }

            // Création des étapes avec leurs positions correctes
            const etapeListWithPositions = processus.etapeList.map((etape, index) => ({
                ...etape,
                id: etape.id || null,
                position: index + 1, // Assurer que les positions sont correctes
                processus: null,
            }));

            // Création des passerelles avec leurs positions correctes
            const passerelleListWithPositions = passerelles.map((passerelle, index) => ({
                id: null,
                name: passerelle.name,
                type: passerelle.type,
                position: parseInt(passerelle.apresEtape) + 1, // Position basée sur l'étape après laquelle la passerelle est placée
                processus: null
            }));

            // Création des transitions basées sur les étapes et passerelles
            const transitions = [];

            // Ajouter transitions entre étapes consécutives sauf si une passerelle est entre elles
            for (let i = 0; i < etapeListWithPositions.length - 1; i++) {
                const currentEtape = etapeListWithPositions[i];
                const nextEtape = etapeListWithPositions[i + 1];

                // Vérifier si une passerelle est entre ces étapes
                const passerelleBetween = passerelleListWithPositions.find(
                    p => p.position > currentEtape.position && p.position < nextEtape.position
                );

                if (!passerelleBetween) {
                    transitions.push({
                        id: null,
                        etapeSource: currentEtape,
                        etapeCible: nextEtape,
                        passerelleSource: null,
                        passerelleCible: null,
                        label: null,
                        condition: null
                    });
                }
            }

            // Ajouter transitions pour chaque passerelle
            passerelles.forEach((passerelle, pIndex) => {
                const passerelleObj = passerelleListWithPositions[pIndex];

                // Trouver l'étape source (celle qui précède la passerelle)
                const sourceEtapeIndex = passerelle.apresEtape;
                const sourceEtape = etapeListWithPositions[sourceEtapeIndex];

                // Créer une transition de l'étape source vers la passerelle
                transitions.push({
                    id: null,
                    etapeSource: sourceEtape,
                    etapeCible: null,
                    passerelleSource: null,
                    passerelleCible: passerelleObj,
                    label: "Vers " + passerelleObj.name,
                    condition: null
                });

                // Ajouter les transitions issues de la passerelle
                passerelle.conditions.forEach(condition => {
                    const targetEtape = etapeListWithPositions[condition.targetEtape];

                    transitions.push({
                        id: null,
                        etapeSource: null,
                        etapeCible: targetEtape,
                        passerelleSource: passerelleObj,
                        passerelleCible: null,
                        label: condition.label,
                        condition: condition.expression === "condition par défaut" ? null : condition.expression
                    });
                });
            });

            // Créer l'objet final au format attendu par le back-end
            const data = {
                id: null,
                name: processus.name,
                etapeList: etapeListWithPositions,
                passerelleList: passerelleListWithPositions,
                transitions: transitions
            };

            console.log('Envoi des données:', data);
            console.log('URL API:', API_ENDPOINT);

            try {
                // Appel API
                const response = await axios.post(API_ENDPOINT, data, {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000 // 30 secondes de timeout
                });

                setBpmnXml(response.data);
                setShowPreview(true);
            } catch (apiError) {
                console.error('Erreur API détaillée:', apiError);

                if (apiError.response) {
                    // Le serveur a répondu avec un code d'erreur
                    setError(`Erreur ${apiError.response.status}: ${apiError.response.data?.message || 'Erreur du serveur'}`);
                } else if (apiError.request) {
                    // La requête a été faite mais pas de réponse
                    setError("Erreur de connexion: le serveur ne répond pas. Vérifiez que le backend est en cours d'exécution sur " + API_ENDPOINT);
                } else {
                    // Erreur lors de la configuration de la requête
                    setError("Erreur de requête: " + apiError.message);
                }
            }

        } catch (error) {
            console.error('Erreur:', error);
            setError(error.message || 'Erreur lors de la génération du BPMN');
        } finally {
            setIsLoading(false);
        }
    };

    // Reset form
    const handleReset = useCallback(() => {
        setProcessus({ name: '', etapeList: [] });
        setPasserelles([]);
        setBpmnXml('');
        setError('');
        setShowPreview(false);
    }, []);


    // Export BPMN
    const handleExportBpmn = useCallback(() => {
        if (!bpmnXml) return;

        const blob = new Blob([bpmnXml], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${processus.name || 'processus'}.bpmn`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [bpmnXml, processus.name]);



    return (
        <div className="process-container">
            <header className="header">
                <h1>Créateur de Processus BPMN</h1>
                <div className="header-actions">
                    <button
                        type="button"
                        onClick={handleReset}
                        className="reset-button"
                    >
                        Réinitialiser
                    </button>
                </div>
            </header>

            <form onSubmit={handleSubmit} className="process-form">
                {/* Section Informations */}
                <div className="form-section">
                    <h2>Informations du processus</h2>
                    <input
                        type="text"
                        className="process-input"
                        placeholder="Nom du processus"
                        value={processus.name}
                        onChange={e => setProcessus(prev => ({ ...prev, name: e.target.value }))}
                        required
                    />
                    {!processus.name.trim() && (
                        <span className="field-error">Le nom est requis</span>
                    )}
                </div>

                {/* Section Étapes */}
                <div className="form-section">
                    <h2>Étapes ({processus.etapeList.length})</h2>
                    {processus.etapeList.map((etape, i) => (
                        <div key={i} className="etape-container">
                            <span className="element-number">{i + 1}</span>
                            <input
                                type="text"
                                className={`etape-input ${!etape.nom.trim() ? 'error' : ''}`}
                                placeholder={`Nom de l'étape ${i + 1}`}
                                value={etape.nom}
                                onChange={e => handleChangeEtape(i, 'nom', e.target.value)}
                                required
                            />
                            <select
                                className="etape-select"
                                value={etape.type}
                                onChange={e => handleChangeEtape(i, 'type', e.target.value)}
                            >
                                {Object.entries(STEP_TYPES).map(([key, {value, label}]) => (
                                    <option key={key} value={value}>{label}</option>
                                ))}
                            </select>
                            <button
                                type="button"
                                className="remove-button"
                                onClick={() => handleRemoveEtape(i)}
                                title="Supprimer cette étape"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                    <button type="button" className="add-button" onClick={handleAddEtape}>
                        + Ajouter une étape
                    </button>
                </div>

                {/* Section Passerelles */}
                {processus.etapeList.length > 0 && (
                    <div className="form-section">
                        <h2>Condition ({passerelles.length})</h2>
                        {passerelles.map((passerelle, i) => (
                            <div key={i} className="gateway-container">
                                <div className="gateway-header">
                                    <span className="element-number">P{i + 1}</span>
                                    <input
                                        type="text"
                                        className={`gateway-input ${!passerelle.name.trim() ? 'error' : ''}`}
                                        placeholder="Nom de la condition (ex: Vérification)"
                                        value={passerelle.name}
                                        onChange={e => handleChangePasserelle(i, 'name', e.target.value)}
                                        required
                                    />
                                    <select
                                        className="gateway-select"
                                        value={passerelle.type}
                                        onChange={e => handleChangePasserelle(i, 'type', e.target.value)}
                                    >
                                        {Object.entries(GATEWAY_TYPES).map(([key, {value, label}]) => (
                                            <option key={key} value={value}>{label}</option>
                                        ))}
                                    </select>

                                    <button
                                        type="button"
                                        className="remove-button"
                                        onClick={() => handleRemovePasserelle(i)}
                                        title="Supprimer cette passerelle"
                                    >
                                        ×
                                    </button>
                                </div>

                                <div className="conditions-section">
                                    <h4>Transitions ({passerelle.conditions.length}) :</h4>
                                    {passerelle.conditions.map((condition, j) => (
                                        <div key={j} className="condition-item">
                                            <div className="transition-flow">
                                                <div className="flow-source">
                                                    <label>De :</label>
                                                    <select
                                                        value={condition.sourceEtape}
                                                        onChange={e => handleChangeCondition(i, j, 'sourceEtape', parseInt(e.target.value))}
                                                    >
                                                        {processus.etapeList.map((etape, idx) => (
                                                            <option key={idx} value={idx}>
                                                                {etape.nom || `Étape ${idx + 1}`}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="flow-arrow">→</div>
                                                <div className="flow-target">
                                                    <label>Vers :</label>
                                                    <select
                                                        value={condition.targetEtape}
                                                        onChange={e => handleChangeCondition(i, j, 'targetEtape', parseInt(e.target.value))}
                                                    >
                                                        {processus.etapeList.map((etape, idx) => (
                                                            <option key={idx} value={idx}>
                                                                {etape.nom || `Étape ${idx + 1}`}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <button
                                                    type="button"
                                                    className="remove-button small"
                                                    onClick={() => handleRemoveCondition(i, j)}
                                                    disabled={passerelle.conditions.length <= 1}
                                                    title="Supprimer cette transition"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        className="add-condition-button"
                                        onClick={() => handleAddCondition(i)}
                                    >
                                        + Ajouter une transition
                                    </button>
                                </div>
                            </div>
                        ))}
                        <button type="button" className="add-button" onClick={handleAddPasserelle}>
                            + Ajouter une Condition
                        </button>
                    </div>
                )}
                {processus.name && processus.etapeList.length > 0 && (
                    <div className="form-section">
                        <div className="preview-header-controls">
                            <h2>Prévisualisation en temps réel</h2>
                            <button
                                type="button"
                                className="toggle-preview"
                                onClick={() => setShowLivePreview(!showLivePreview)}
                            >
                                {showLivePreview ? 'Masquer' : 'Afficher'}
                            </button>
                        </div>
                        <BpmnLivePreview
                            processus={processus}
                            passerelles={passerelles}
                            showPreview={showLivePreview}
                        />
                    </div>
                )}

                {/* Actions */}
                <div className="form-buttons">
                    <button
                        type="submit"
                        className="submit-button"
                        disabled={isLoading || !isFormValid}
                    >
                        {isLoading ? 'Génération...' : 'Générer BPMN'}
                    </button>

                    {bpmnXml && (
                        <button
                            type="button"
                            className="export-button"
                            onClick={handleExportBpmn}
                        >
                            Exporter BPMN
                        </button>
                    )}
                </div>

                {error && (
                    <div className="error-message">
                        <strong>Erreur :</strong> {error}
                    </div>
                )}
            </form>

            {/* Prévisualisation */}
            {bpmnXml && showPreview && (
                <div className="bpmn-result">
                    <div className="result-header">
                        <h2>Diagramme BPMN généré</h2>
                        <button
                            type="button"
                            className="toggle-preview"
                            onClick={() => setShowPreview(!showPreview)}
                        >
                            {showPreview ? 'Masquer' : 'Afficher'}
                        </button>
                    </div>
                    <BpmnDiagram xml={bpmnXml} />
                </div>
            )}
        </div>
    );
};

export default ProcessForm;