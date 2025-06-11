
import './App.css';
import { useState, useEffect } from 'react';
import axios from 'axios';
import BpmnDiagram from "./BpmnDiagram";
import BpmnLivePreview from "./BpmnLivePreview";
import TaskList from "./TaskList";
import MonitoringDashboard from "./MonitoringDashboard";


// Configuration API
const API_BASE = 'http://localhost:8080/api';

function App() {
    const [activeTab, setActiveTab] = useState('designer');
    const [workflows, setWorkflows] = useState([]);
    const [instances, setInstances] = useState([]);
    const [selectedWorkflowForView, setSelectedWorkflowForView] = useState(null);
    const [expandedInstance, setExpandedInstance] = useState(null);
    const [instanceTransitions, setInstanceTransitions] = useState({});
    const [loadingTransitions, setLoadingTransitions] = useState(false);

    const [bpmnXmlForView , setBpmnXmlForView] = useState('');
    const [showBpmnModal , setShowBpmnModal] = useState(false);

    // État pour le designer de processus
    const [processData, setProcessData] = useState({
        name: '',
        description: '',
        version: '1.0',
        isActive: true,
        createdBy: 'Process Designer',
        etapeList: [
            { nom: '', type: 'INITIAL', position: 1 }
        ],
        transitionList: [],
        passerelleList: []
    });

    // État pour créer une instance
    const [instanceData, setInstanceData] = useState({
        workflowId: '',
        businessKey: '',
        createdBy: 'Test User'
    });

    // Charger les données au démarrage
    useEffect(() => {
        loadWorkflows();
        loadInstances();
    }, []);
    const viewWorkflowBpmn = async (workflow) => {
        try {
            console.log('Génération BPMN pour workflow:', workflow.id);
            const response = await axios.get(`${API_BASE}/bpmn/generate/${workflow.id}`);

            setSelectedWorkflowForView(workflow);
            setBpmnXmlForView(response.data.bpmn);
            setShowBpmnModal(true);

        } catch (error) {
            console.error('Erreur génération BPMN:', error);
            alert(`Erreur lors de la génération du BPMN: ${error.response?.data || error.message}`);
        }
    };
    // =====================================================
    // FONCTIONS API
    // =====================================================

    const loadWorkflows = async () => {
        try {
            const response = await axios.get(`${API_BASE}/workflows`);
            setWorkflows(response.data);
        } catch (error) {
            console.error('Erreur chargement workflows:', error);
        }
    };
    const closeBpmnModal = () => {
        setShowBpmnModal(false);
        setSelectedWorkflowForView(null);
        setBpmnXmlForView('');
    };
    const loadInstanceTransitions = async (instanceId) => {
        try {
            setLoadingTransitions(true);
            const response = await axios.get(`${API_BASE}/instances/${instanceId}/transitions/available`);
            setInstanceTransitions(prev => ({
                ...prev,
                [instanceId]: response.data
            }));
            console.log(`Transitions chargées pour instance ${instanceId}:`, response.data);
        } catch (error) {
            console.error('Erreur chargement transitions:', error);
            setInstanceTransitions(prev => ({
                ...prev,
                [instanceId]: []
            }));
        } finally {
            setLoadingTransitions(false);
        }
    };

// Fonction pour basculer l'affichage des transitions
    const toggleInstanceTransitions = async (instanceId) => {
        if (expandedInstance === instanceId) {
            // Fermer si déjà ouvert
            setExpandedInstance(null);
        } else {
            // Ouvrir et charger les transitions
            setExpandedInstance(instanceId);
            await loadInstanceTransitions(instanceId);
        }
    };

// Fonction pour exécuter une transition
    const executeInstanceTransition = async (instanceId, transitionId, transitionName) => {
        if (!window.confirm(`Voulez-vous vraiment exécuter la transition "${transitionName}" ?`)) {
            return;
        }

        try {
            const response = await axios.post(
                `${API_BASE}/instances/${instanceId}/transitions/${transitionId}/execute`,
                "Manual User",
                { headers: { 'Content-Type': 'application/json' } }
            );

            alert(`✅ Transition "${transitionName}" exécutée avec succès !`);

            // Recharger les données
            loadInstances();

            // Recharger les transitions si l'instance est toujours ouverte
            if (expandedInstance === instanceId) {
                await loadInstanceTransitions(instanceId);
            }

        } catch (error) {
            console.error('Erreur exécution transition:', error);
            alert(`❌ Erreur lors de l'exécution de la transition:\n${error.response?.data?.message || error.message}`);
        }
    };

    const loadInstances = async () => {
        try {
            const response = await axios.get(`${API_BASE}/instances`);
            setInstances(response.data);
        } catch (error) {
            console.error('Erreur chargement instances:', error);
        }
    };

    // =====================================================
    // DESIGNER DE PROCESSUS
    // =====================================================

    const handleEtapeChange = (index, field, value) => {
        const updated = [...processData.etapeList];
        updated[index][field] = value;
        setProcessData({ ...processData, etapeList: updated });
    };

    const handleTransitionChange = (index, field, value) => {
        const updated = [...processData.transitionList];
        updated[index][field] = value;
        setProcessData({ ...processData, transitionList: updated });
    };

    const addEtape = () => {
        const newPosition = processData.etapeList.length + 1;
        setProcessData({
            ...processData,
            etapeList: [...processData.etapeList, {
                nom: '',
                type: newPosition === 1 ? 'INITIAL' : 'NORMAL',
                position: newPosition
            }]
        });
    };

    const removeEtape = (index) => {
        const updated = [...processData.etapeList];
        updated.splice(index, 1);
        // Réajuster les positions
        updated.forEach((etape, idx) => {
            etape.position = idx + 1;
        });
        setProcessData({ ...processData, etapeList: updated });
    };

    const addTransition = () => {
        if (processData.etapeList.length < 2) {
            alert("Vous devez avoir au moins deux étapes pour créer une transition.");
            return;
        }
        setProcessData({
            ...processData,
            transitionList: [
                ...processData.transitionList,
                { name: '', sourceStatutId: null, targetStatutId: null, conditionExpression: '' }
            ]
        });
    };

    const removeTransition = (index) => {
        const updated = [...processData.transitionList];
        updated.splice(index, 1);
        setProcessData({ ...processData, transitionList: updated });
    };
    const handlePasserelleChange = (passerelleIndex, field, value) => {
        const updated = [...processData.passerelleList];
        updated[passerelleIndex][field] = value;
        setProcessData({ ...processData, passerelleList: updated });
    };

// 2. Handler pour les changements de conditions
    const handleConditionChange = (passerelleIndex, conditionIndex, field, value) => {
        const updated = [...processData.passerelleList];
        updated[passerelleIndex].conditions[conditionIndex][field] = value;
        setProcessData({ ...processData, passerelleList: updated });
    };

// 3. Ajouter une passerelle
    const addPasserelle = () => {
        if (processData.etapeList.length < 2) {
            alert("Vous devez avoir au moins deux étapes pour créer une passerelle.");
            return;
        }

        const newPasserelle = {
            id: Date.now(), // ID temporaire unique
            name: '',
            type: 'EXCLUSIVE',
            apresEtape: 0,
            conditions: [{
                id: Date.now() + 1,
                name: '',
                expression: '',
                targetEtape: processData.etapeList.length > 1 ? 1 : 0
            }]
        };

        setProcessData({
            ...processData,
            passerelleList: [...processData.passerelleList, newPasserelle]
        });
    };

// 4. Supprimer une passerelle
    const removePasserelle = (passerelleIndex) => {
        const updated = [...processData.passerelleList];
        updated.splice(passerelleIndex, 1);
        setProcessData({ ...processData, passerelleList: updated });
    };

// 5. Ajouter une condition à une passerelle
    const addConditionToPasserelle = (passerelleIndex) => {
        const updated = [...processData.passerelleList];

        // Trouver le prochain targetEtape disponible
        const usedTargets = new Set(updated[passerelleIndex].conditions.map(c => c.targetEtape));
        let nextTarget = 0;

        for (let i = 0; i < processData.etapeList.length; i++) {
            if (!usedTargets.has(i)) {
                nextTarget = i;
                break;
            }
        }

        const newCondition = {
            id: Date.now(),
            name: '',
            expression: '',
            targetEtape: nextTarget
        };

        updated[passerelleIndex].conditions.push(newCondition);
        setProcessData({ ...processData, passerelleList: updated });
    };

// 6. Supprimer une condition d'une passerelle
    const removeConditionFromPasserelle = (passerelleIndex, conditionIndex) => {
        const updated = [...processData.passerelleList];
        updated[passerelleIndex].conditions.splice(conditionIndex, 1);
        setProcessData({ ...processData, passerelleList: updated });
    };

    // Créer le workflow complet
    const createCompleteWorkflow = async (e) => {
        e.preventDefault();

        if (!processData.name.trim()) {
            alert("Le nom du processus est requis.");
            return;
        }

        if (processData.etapeList.some(etape => !etape.nom.trim())) {
            alert("Toutes les étapes doivent avoir un nom.");
            return;
        }

        try {
            // 1. Créer le workflow de base
            const workflowData = {
                name: processData.name,
                description: processData.description,
                version: processData.version,
                isActive: processData.isActive,
                createdBy: processData.createdBy
            };

            const workflowResponse = await axios.post(`${API_BASE}/workflows`, workflowData);
            const workflowId = workflowResponse.data.id;

            console.log('Workflow créé:', workflowResponse.data);

            // 2. Créer les statuts
            const statutIds = [];
            for (let i = 0; i < processData.etapeList.length; i++) {
                const etape = processData.etapeList[i];
                const statutData = {
                    name: etape.nom,
                    description: `Étape: ${etape.nom}`,
                    statutType: etape.type,
                    position: etape.position
                };

                const statutResponse = await axios.post(`${API_BASE}/workflows/${workflowId}/statuts`, statutData);
                statutIds[i] = statutResponse.data.id;
                console.log(`Statut ${i + 1} créé:`, statutResponse.data);
            }

            // 3. Créer les transitions
            if (processData.transitionList.length > 0) {
                const transitionsData = processData.transitionList.map(transition => ({
                    name: transition.name || `Transition ${transition.sourceStatutId} -> ${transition.targetStatutId}`,
                    sourceStatutId: statutIds[transition.sourceStatutId],
                    targetStatutId: statutIds[transition.targetStatutId],
                    conditionExpression: transition.conditionExpression
                }));

                const transitionsResponse = await axios.post(`${API_BASE}/workflows/${workflowId}/transitions`, transitionsData);
                console.log('Transitions créées:', transitionsResponse.data);
            }

            alert('Workflow créé avec succès !');

            if (processData.passerelleList && processData.passerelleList.length > 0) {
                for (const passerelle of processData.passerelleList) {
                    try {
                        const passerelleResponse = await axios.post(
                            `${API_BASE}/workflows/${workflowId}/passerelles`,
                            {
                                name: passerelle.name,
                                gatewayType: passerelle.type,
                                position: passerelle.apresEtape + 1
                            }
                        );

                        console.log('Passerelle créée:', passerelleResponse.data);

                        // Ensuite créer les conditions pour cette passerelle
                        if (passerelle.conditions && passerelle.conditions.length > 0) {
                            for (const condition of passerelle.conditions) {
                                await axios.post(`${API_BASE}/conditions`, {
                                    name: condition.name,
                                    expression: condition.expression,
                                    passerelleId: passerelleResponse.data.id,
                                    conditionType: "GATEWAY_CONDITION",
                                    isActive: true,

                                });
                            }
                        }

                    } catch (error) {
                        console.error('Erreur création passerelle:', error);
                        alert(`Erreur passerelle "${passerelle.name}": ${error.message}`);
                    }
                }
            }

            // Recharger les workflows et réinitialiser le formulaire
            loadWorkflows();
            setProcessData({
                name: '',
                description: '',
                version: '1.0',
                isActive: true,
                createdBy: 'Process Designer',
                etapeList: [{ nom: '', type: 'INITIAL', position: 1 }],
                transitionList: [],
                passerelleList: []
            });

        } catch (error) {
            console.error('Erreur création workflow:', error);
            alert(`Erreur: ${error.response?.data?.message || error.message}`);
        }
    };
    const deleteWorkflow = async (workflowId, workflowName) => {
        // Confirmation avant suppression
        const confirmMessage = `Êtes-vous sûr de vouloir supprimer le workflow "${workflowName}" ?\n\n` +
            `⚠️ ATTENTION : Cette action est irréversible et supprimera :\n` +
            `- Le workflow et toutes ses étapes\n` +
            `- Toutes les transitions associées\n` +
            `- Toutes les instances en cours\n\n` +
            `Tapez "SUPPRIMER" pour confirmer :`;

        const userConfirmation = prompt(confirmMessage);

        if (userConfirmation !== "SUPPRIMER") {
            alert("Suppression annulée.");
            return;
        }

        try {
            await axios.delete(`${API_BASE}/workflows/${workflowId}`);
            alert(`Workflow "${workflowName}" supprimé avec succès !`);

            // Recharger la liste des workflows
            loadWorkflows();

            // Si on était en train de visualiser ce workflow, fermer le modal
            if (selectedWorkflowForView?.id === workflowId) {
                closeBpmnModal();
            }

        } catch (error) {
            console.error('Erreur suppression workflow:', error);

            // Messages d'erreur plus spécifiques
            let errorMessage = 'Erreur lors de la suppression du workflow';

            if (error.response?.status === 409) {
                errorMessage = `Impossible de supprimer le workflow "${workflowName}" car il contient des instances actives. Terminez d'abord toutes les instances.`;
            } else if (error.response?.status === 404) {
                errorMessage = `Le workflow "${workflowName}" n'existe plus.`;
            } else if (error.response?.data?.message) {
                errorMessage = `Erreur : ${error.response.data.message}`;
            }

            alert(errorMessage);
        }
    };
    // =====================================================
    // GESTION DES INSTANCES
    // =====================================================

    const createInstance = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.post(`${API_BASE}/instances`, instanceData);
            console.log('Instance créée:', response.data);
            alert('Instance créée avec succès !');

            loadInstances();
            setInstanceData({
                workflowId: '',
                businessKey: '',
                createdBy: 'Test User'
            });
        } catch (error) {
            console.error('Erreur création instance:', error);
            alert(`Erreur: ${error.response?.data?.message || error.message}`);
        }
    };

    const executeTransition = async (instanceId, transitionId) => {
        try {
            const response = await axios.post(
                `${API_BASE}/instances/${instanceId}/transitions/${transitionId}/execute`,
                "Test User",
                { headers: { 'Content-Type': 'application/json' } }
            );
            console.log('Transition exécutée:', response.data);
            alert('Transition exécutée avec succès !');
            loadInstances();
        } catch (error) {
            console.error('Erreur exécution transition:', error);
            alert(`Erreur: ${error.response?.data?.message || error.message}`);
        }
    };

    const getAvailableTransitions = async (instanceId) => {
        try {
            const response = await axios.get(`${API_BASE}/instances/${instanceId}/transitions/available`);
            return response.data;
        } catch (error) {
            console.error('Erreur récupération transitions:', error);
            return [];
        }
    };

    // =====================================================
    // GÉNÉRATION BPMN
    // =====================================================

    const generateBPMN = async (workflowId) => {
        try {
            const response = await axios.get(`${API_BASE}/bpmn/generate/${workflowId}`);

            // Créer un blob et télécharger le fichier
            const blob = new Blob([response.data], { type: 'application/xml' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `workflow-${workflowId}.bpmn`;
            link.click();
            window.URL.revokeObjectURL(url);

            alert('BPMN téléchargé avec succès !');
        } catch (error) {
            console.error('Erreur génération BPMN:', error);
            alert(`Erreur: ${error.response?.data || error.message}`);
        }
    };
    const executeWorkflowAutomatically = async (workflowId) => {
        try {
            const businessKey = `AUTO_${Date.now()}`;

            console.log('🚀 Exécution automatique du workflow', workflowId);

            const response = await axios.post(`${API_BASE}/workflow-engine/execute-full`, null, {
                params: {
                    workflowId: workflowId,
                    businessKey: businessKey,
                    createdBy: 'Auto Executor'
                }
            });

            const result = response.data;

            alert(
                `✅ Workflow exécuté automatiquement !\n\n` +
                `📋 Business Key: ${result.businessKey}\n` +
                `🎯 Statut final: ${result.currentStatutName}\n` +
                `⚡ Statut: ${result.status}\n` +
                `🕐 Début: ${new Date(result.startDate).toLocaleString()}\n` +
                `${result.endDate ? `🏁 Fin: ${new Date(result.endDate).toLocaleString()}` : ''}`
            );

            // Recharger les instances pour voir le résultat
            loadInstances();

        } catch (error) {
            console.error('❌ Erreur exécution automatique:', error);
            alert(`❌ Erreur lors de l'exécution automatique:\n${error.response?.data?.message || error.message}`);
        }
    };

    // =====================================================
    // INTERFACE UTILISATEUR
    // =====================================================

    return (
        <div className="App">
            <header style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: '2rem',
                textAlign: 'center',
                marginBottom: '2rem'
            }}>
                <h1>🏭 Moteur de Workflow </h1>
                <p>Designer de processus et moteur d'exécution</p>
            </header>

            {/* Navigation par onglets */}
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '2rem',
                borderBottom: '2px solid #ecf0f1'
            }}>
                {[
                    { id: 'designer', label: '🎨 Designer', icon: '🎨' },
                    { id: 'workflows', label: '📋 Workflows', icon: '📋' },
                    { id: 'instances', label: '🔄 Instances', icon: '⚡' },
                    { id: 'tasks', label: '📝 Mes Tâches', icon: '📝' },
                    { id: 'monitoring', label: '📊 Monitoring', icon: '📊' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            padding: '1rem 2rem',
                            border: 'none',
                            background: activeTab === tab.id ? '#3498db' : 'transparent',
                            color: activeTab === tab.id ? 'white' : '#7f8c8d',
                            cursor: 'pointer',
                            borderRadius: '8px 8px 0 0',
                            fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* Contenu des onglets */}
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>

                {/* Onglet Designer */}
                {activeTab === 'designer' && (
                    <div>
                        <h2>🎨 Designer de Processus</h2>
                        <form onSubmit={createCompleteWorkflow}>
                            <div className="form-group">
                                <label>Nom du processus:</label>
                                <input
                                    type="text"
                                    value={processData.name}
                                    onChange={(e) => setProcessData({ ...processData, name: e.target.value })}
                                    required
                                    style={{
                                        padding: '1rem',           // Plus d'espace interne
                                        fontSize: '1.1rem',       // Texte plus gros
                                        border: '2px solid #ddd', // Bordure plus visible
                                        borderRadius: '8px'       // Coins arrondis
                                    }}
                                />
                            </div>

                            <div className="form-group">
                                <label>Description:</label>
                                <input
                                    type="text"
                                    value={processData.description}
                                    onChange={(e) => setProcessData({ ...processData, description: e.target.value })}
                                    style={{
                                        padding: '1rem',           // Plus d'espace interne
                                        fontSize: '1.1rem',       // Texte plus gros
                                        border: '2px solid #ddd', // Bordure plus visible
                                        borderRadius: '8px'       // Coins arrondis
                                    }}
                                />
                            </div>

                            <h3>📍 Étapes du Processus</h3>
                            {processData.etapeList.map((etape, index) => (
                                <div className="etape-group" key={index}>
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                        <div style={{ flex: 2 }}>
                                            <label>Nom de l'étape:</label>
                                            <input
                                                type="text"
                                                placeholder="Ex: Validation Manager"
                                                value={etape.nom}
                                                onChange={(e) => handleEtapeChange(index, 'nom', e.target.value)}
                                                required
                                                style={{
                                                    padding: '1rem',           // Plus d'espace interne
                                                    fontSize: '1.1rem',       // Texte plus gros
                                                    border: '2px solid #ddd', // Bordure plus visible
                                                    borderRadius: '8px'       // Coins arrondis
                                                }}
                                            />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <label>Type:</label>
                                            <select
                                                value={etape.type}
                                                onChange={(e) => handleEtapeChange(index, 'type', e.target.value)}
                                                required
                                            >
                                                <option value="INITIAL">🟢 Initial</option>
                                                <option value="NORMAL">🔵 Normal</option>
                                                <option value="FINAL">🔴 Final</option>
                                            </select>
                                        </div>
                                        {processData.etapeList.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeEtape(index)}
                                                style={{
                                                    background: '#e74c3c',
                                                    color: 'white',
                                                    border: 'none',
                                                    padding: '0.5rem',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                🗑️
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}

                            <button type="button" onClick={addEtape}>
                                ➕ Ajouter une Étape
                            </button>

                            <h3>⚡ Transitions</h3>
                            {processData.transitionList.map((transition, index) => (
                                <div className="transition-group" key={index}>
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                        <div style={{ flex: 1 }}>
                                            <label>Nom de la transition:</label>
                                            <input
                                                type="text"
                                                placeholder="Ex: Valider"
                                                value={transition.name}
                                                onChange={(e) => handleTransitionChange(index, 'name', e.target.value)}
                                            />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <label>De l'étape:</label>
                                            <select
                                                value={transition.sourceStatutId !== null ? transition.sourceStatutId : ''}
                                                onChange={(e) => handleTransitionChange(index, 'sourceStatutId', e.target.value ? parseInt(e.target.value) : null)}
                                                required
                                            >
                                                <option value="">-- Sélectionner --</option>
                                                {processData.etapeList.map((etape, idx) => (
                                                    <option key={idx} value={idx}>
                                                        {etape.nom || `Étape ${idx + 1}`}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div style={{flex: 1}}>
                                            <label>Vers l'étape:</label>
                                            <select
                                                value={transition.targetStatutId !== null ? transition.targetStatutId : ''}
                                                onChange={(e) => handleTransitionChange(index, 'targetStatutId', e.target.value ? parseInt(e.target.value) : null)}
                                                required
                                            >
                                                <option value="">-- Sélectionner --</option>
                                                {processData.etapeList.map((etape, idx) => (
                                                    <option key={idx} value={idx}>
                                                        {etape.nom || `Étape ${idx + 1}`}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeTransition(index)}
                                            style={{
                                                background: '#e74c3c',
                                                color: 'white',
                                                border: 'none',
                                                padding: '0.5rem',
                                                borderRadius: '4px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {processData.etapeList.length > 1 && (
                                <div style={{ marginTop: '2rem' }}>
                                    <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: '#2c3e50' }}>
                                        🔀 Passerelles et Conditions
                                    </h3>
                                    <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                                        Les passerelles permettent de créer des branchements conditionnels dans votre workflow.
                                    </p>

                                    {processData.passerelleList.map((passerelle, passerelleIndex) => (
                                        <div key={passerelle.id} style={{
                                            background: '#fff3cd',
                                            border: '2px solid #ffeaa7',
                                            padding: '1.5rem',
                                            borderRadius: '12px',
                                            marginBottom: '1.5rem'
                                        }}>
                                            {/* En-tête de la passerelle */}
                                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'end', marginBottom: '1.5rem' }}>
                                                <div style={{ flex: 2 }}>
                                                    <label style={{
                                                        fontSize: '1rem',
                                                        fontWeight: 'bold',
                                                        marginBottom: '0.5rem',
                                                        display: 'block',
                                                        color: '#856404'
                                                    }}>
                                                        🔀 Nom de la passerelle:
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder="Ex: Vérification Montant"
                                                        value={passerelle.name}
                                                        onChange={(e) => handlePasserelleChange(passerelleIndex, 'name', e.target.value)}
                                                        required
                                                        style={{
                                                            width: '100%',
                                                            padding: '0.9rem',
                                                            fontSize: '1rem',
                                                            border: '2px solid #f39c12',
                                                            borderRadius: '6px',
                                                            fontFamily: 'inherit'
                                                        }}
                                                    />
                                                </div>

                                                <div style={{ flex: 1 }}>
                                                    <label style={{
                                                        fontSize: '1rem',
                                                        fontWeight: 'bold',
                                                        marginBottom: '0.5rem',
                                                        display: 'block',
                                                        color: '#856404'
                                                    }}>
                                                        Type:
                                                    </label>
                                                    <select
                                                        value={passerelle.type}
                                                        onChange={(e) => handlePasserelleChange(passerelleIndex, 'type', e.target.value)}
                                                        style={{
                                                            width: '100%',
                                                            padding: '0.9rem',
                                                            fontSize: '1rem',
                                                            border: '2px solid #f39c12',
                                                            borderRadius: '6px',
                                                            backgroundColor: 'white'
                                                        }}
                                                    >
                                                        <option value="EXCLUSIVE">🔶 Exclusive (XOR) - Une seule condition</option>
                                                        <option value="PARALLEL">🔷 Parallèle (AND) - Toutes les branches</option>
                                                        <option value="INCLUSIVE">🔸 Inclusive (OR) - Une ou plusieurs</option>
                                                    </select>
                                                </div>

                                                <div style={{ flex: 1 }}>
                                                    <label style={{
                                                        fontSize: '1rem',
                                                        fontWeight: 'bold',
                                                        marginBottom: '0.5rem',
                                                        display: 'block',
                                                        color: '#856404'
                                                    }}>
                                                        Après l'étape:
                                                    </label>
                                                    <select
                                                        value={passerelle.apresEtape}
                                                        onChange={(e) => handlePasserelleChange(passerelleIndex, 'apresEtape', parseInt(e.target.value))}
                                                        style={{
                                                            width: '100%',
                                                            padding: '0.9rem',
                                                            fontSize: '1rem',
                                                            border: '2px solid #f39c12',
                                                            borderRadius: '6px',
                                                            backgroundColor: 'white'
                                                        }}
                                                    >
                                                        {processData.etapeList.map((etape, idx) => (
                                                            <option key={idx} value={idx}>
                                                                {etape.nom || `Étape ${idx + 1}`}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => removePasserelle(passerelleIndex)}
                                                    style={{
                                                        background: '#e74c3c',
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '0.9rem',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        fontSize: '1.1rem',
                                                        minWidth: '50px'
                                                    }}
                                                    title="Supprimer cette passerelle"
                                                >
                                                    🗑️
                                                </button>
                                            </div>

                                            {/* Conditions de la passerelle */}
                                            <div style={{
                                                background: 'rgba(255, 255, 255, 0.7)',
                                                padding: '1rem',
                                                borderRadius: '8px',
                                                border: '1px solid #f39c12'
                                            }}>
                                                <h4 style={{
                                                    margin: '0 0 1rem 0',
                                                    color: '#856404',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem'
                                                }}>
                                                    ⚡ Conditions ({passerelle.conditions.length})
                                                    <span style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>
                            {passerelle.type === 'EXCLUSIVE' && '(Une seule sera exécutée)'}
                                                        {passerelle.type === 'PARALLEL' && '(Toutes seront exécutées)'}
                                                        {passerelle.type === 'INCLUSIVE' && '(Une ou plusieurs seront exécutées)'}
                        </span>
                                                </h4>

                                                {passerelle.conditions.map((condition, conditionIndex) => (
                                                    <div key={condition.id} style={{
                                                        background: 'white',
                                                        padding: '1rem',
                                                        borderRadius: '6px',
                                                        marginBottom: '1rem',
                                                        border: '1px solid #ddd',
                                                        display: 'flex',
                                                        gap: '1rem',
                                                        alignItems: 'end'
                                                    }}>
                                                        <div style={{ flex: 2 }}>
                                                            <label style={{
                                                                fontSize: '0.9rem',
                                                                fontWeight: 'bold',
                                                                marginBottom: '0.3rem',
                                                                display: 'block',
                                                                color: '#495057'
                                                            }}>
                                                                Nom de la condition:
                                                            </label>
                                                            <input
                                                                type="text"
                                                                placeholder="Ex: Si montant > 10000€"
                                                                value={condition.name}
                                                                onChange={(e) => handleConditionChange(passerelleIndex, conditionIndex, 'name', e.target.value)}
                                                                style={{
                                                                    width: '100%',
                                                                    padding: '0.7rem',
                                                                    fontSize: '0.9rem',
                                                                    border: '1px solid #ddd',
                                                                    borderRadius: '4px'
                                                                }}
                                                            />
                                                        </div>

                                                        <div style={{ flex: 2 }}>
                                                            <label style={{
                                                                fontSize: '0.9rem',
                                                                fontWeight: 'bold',
                                                                marginBottom: '0.3rem',
                                                                display: 'block',
                                                                color: '#495057'
                                                            }}>
                                                                Expression/Règle:
                                                            </label>
                                                            <input
                                                                type="text"
                                                                placeholder="Ex: montant > 10000 || priorite == 'urgent'"
                                                                value={condition.expression}
                                                                onChange={(e) => handleConditionChange(passerelleIndex, conditionIndex, 'expression', e.target.value)}
                                                                style={{
                                                                    width: '100%',
                                                                    padding: '0.7rem',
                                                                    fontSize: '0.9rem',
                                                                    border: '1px solid #ddd',
                                                                    borderRadius: '4px'
                                                                }}
                                                            />
                                                        </div>

                                                        <div style={{ flex: 1 }}>
                                                            <label style={{
                                                                fontSize: '0.9rem',
                                                                fontWeight: 'bold',
                                                                marginBottom: '0.3rem',
                                                                display: 'block',
                                                                color: '#495057'
                                                            }}>
                                                                Vers l'étape:
                                                            </label>
                                                            <select
                                                                value={condition.targetEtape}
                                                                onChange={(e) => handleConditionChange(passerelleIndex, conditionIndex, 'targetEtape', parseInt(e.target.value))}
                                                                style={{
                                                                    width: '100%',
                                                                    padding: '0.7rem',
                                                                    fontSize: '0.9rem',
                                                                    border: '1px solid #ddd',
                                                                    borderRadius: '4px',
                                                                    backgroundColor: 'white'
                                                                }}
                                                            >
                                                                {processData.etapeList.map((etape, idx) => (
                                                                    <option key={idx} value={idx}>
                                                                        {etape.nom || `Étape ${idx + 1}`}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>

                                                        {passerelle.conditions.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => removeConditionFromPasserelle(passerelleIndex, conditionIndex)}
                                                                style={{
                                                                    background: '#e74c3c',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    padding: '0.7rem',
                                                                    borderRadius: '4px',
                                                                    cursor: 'pointer',
                                                                    fontSize: '0.9rem',
                                                                    minWidth: '40px'
                                                                }}
                                                                title="Supprimer cette condition"
                                                            >
                                                                ×
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}

                                                <button
                                                    type="button"
                                                    onClick={() => addConditionToPasserelle(passerelleIndex)}
                                                    style={{
                                                        background: '#17a2b8',
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '0.75rem 1.5rem',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        fontSize: '0.9rem',
                                                        fontWeight: 'bold'
                                                    }}
                                                >
                                                    ➕ Ajouter une condition
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    <button
                                        type="button"
                                        onClick={addPasserelle}
                                        style={{
                                            background: '#f39c12',
                                            color: 'white',
                                            border: 'none',
                                            padding: '1rem 2rem',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontSize: '1.1rem',
                                            fontWeight: 'bold',
                                            marginBottom: '2rem'
                                        }}
                                    >
                                        🔀 Ajouter une Passerelle
                                    </button>
                                </div>
                            )}

                            <button type="button" onClick={addTransition}>
                                ➕ Ajouter une Transition
                            </button>
                            {processData.name && processData.etapeList.length > 0 && (
                                <div style={{
                                    marginTop: '2rem',
                                    padding: '1rem',
                                    background: '#f8f9fa',
                                    borderRadius: '8px',
                                    border: '1px solid #dee2e6'
                                }}>
                                    <h3>👁️ Prévisualisation temps réel</h3>
                                    <p style={{ margin: '0.5rem 0', fontSize: '0.9rem', color: '#666' }}>
                                        Voici à quoi ressemble votre workflow pendant que vous le créez :
                                    </p>

                                    {/* ✅ PRÉVISUALISATION LIVE SIMPLE */}
                                    <div style={{
                                        background: 'white',
                                        padding: '1rem',
                                        borderRadius: '4px',
                                        border: '1px solid #ddd'
                                    }}>
                                        <BpmnLivePreview
                                            processus={processData}
                                            passerelles={processData.passerelleList || []}
                                            showPreview={true}
                                        />
                                    </div>
                                </div>
                            )}

                            <div style={{ marginTop: '2rem' }}>
                                <button type="submit" style={{
                                    background: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)',
                                    color: 'white',
                                    border: 'none',
                                    padding: '1rem 2rem',
                                    borderRadius: '8px',
                                    fontSize: '1.1rem',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    width: '100%'
                                }}>
                                    🚀 Créer le Workflow Complet
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Onglet Workflows */}
                {activeTab === 'workflows' && (
                    <div>
                        <h2>📋 Workflows Disponibles</h2>
                        <button onClick={loadWorkflows} style={{ marginBottom: '1rem' }}>
                            🔄 Actualiser
                        </button>

                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {workflows.map(workflow => (
                                <div key={workflow.id} style={{
                                    background: 'white',
                                    padding: '1.5rem',
                                    borderRadius: '8px',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                    border: '1px solid #ecf0f1'
                                }}>
                                    <h4 style={{ margin: '0 0 1rem 0', color: '#34495e' }}>
                                        🏭 {workflow.name}
                                    </h4>
                                    <p><strong>ID:</strong> {workflow.id}</p>
                                    <p><strong>Description:</strong> {workflow.description}</p>
                                    <p><strong>Version:</strong> {workflow.version}</p>
                                    <p><strong>Statuts:</strong> {workflow.statutCount}</p>
                                    <p><strong>Transitions:</strong> {workflow.transitionCount}</p>
                                    <p><strong>Instances actives:</strong> {workflow.activeInstanceCount}</p>

                                    <div style={{
                                        marginTop: '1rem',
                                        display: 'flex',
                                        gap: '0.5rem',
                                        alignItems: 'center'
                                    }}>
                                        <button
                                            onClick={() => viewWorkflowBpmn(workflow)}
                                            style={{
                                                background: '#9b59b6',
                                                color: 'white',
                                                border: 'none',
                                                padding: '0.5rem 1rem',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                marginRight: '0.5rem'
                                            }}
                                        >
                                            👁️ View BPMN
                                        </button>

                                        <button
                                            onClick={() => generateBPMN(workflow.id)}
                                            style={{
                                                background: '#3498db',
                                                color: 'white',
                                                border: 'none',
                                                padding: '0.5rem 1rem',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                marginRight: '0.5rem'
                                            }}
                                        >
                                            🎨 Télécharger BPMN
                                        </button>
                                        <button
                                            onClick={() => executeWorkflowAutomatically(workflow.id)}
                                            style={{
                                                background: '#28a745',
                                                color: 'white',
                                                border: 'none',
                                                padding: '0.5rem 1rem',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '0.875rem',
                                                fontWeight: 'bold'
                                            }}
                                            title={`Exécuter automatiquement le workflow "${workflow.name}"`}
                                        >
                                            ▶️ Execute
                                        </button>

                                        <button
                                            onClick={() => deleteWorkflow(workflow.id, workflow.name)}
                                            style={{
                                                background: '#e74c3c',
                                                color: 'white',
                                                border: 'none',
                                                padding: '0.5rem 1rem',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '0.875rem',
                                                fontWeight: 'bold'
                                            }}
                                            title={`Supprimer le workflow "${workflow.name}"`}
                                        >
                                            🗑️ Supprimer
                                        </button>

                                        <span style={{
                                            background: workflow.isActive ? '#27ae60' : '#95a5a6',
                                            color: 'white',
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '12px',
                                            fontSize: '0.875rem',
                                            fontWeight: 'bold'
                                        }}>
                                            {workflow.isActive ? '✅ ACTIF' : '❌ INACTIF'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'instances' && (
                    <div>
                        <h2>🔄 Gestion des Instances</h2>
                        <p style={{ color: '#666', marginBottom: '2rem' }}>
                            Créez des instances et contrôlez leur exécution directement ici.
                        </p>

                        {/* Formulaire création instance - IDENTIQUE À VOTRE VERSION ACTUELLE */}
                        <div style={{
                            background: 'white',
                            padding: '1.5rem',
                            borderRadius: '8px',
                            marginBottom: '2rem',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}>
                            <h3>➕ Créer une Nouvelle Instance</h3>
                            <form onSubmit={createInstance}>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'end' }}>
                                    <div style={{ flex: 1 }}>
                                        <label>Workflow:</label>
                                        <select
                                            value={instanceData.workflowId}
                                            onChange={(e) => setInstanceData({...instanceData, workflowId: e.target.value})}
                                            required
                                        >
                                            <option value="">-- Sélectionner un workflow --</option>
                                            {workflows.map(workflow => (
                                                <option key={workflow.id} value={workflow.id}>
                                                    {workflow.name} {workflow.isActive ? '✅' : '⚠️ (Inactif)'}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label>Business Key:</label>
                                        <input
                                            type="text"
                                            placeholder="Ex: DEMANDE-001"
                                            value={instanceData.businessKey}
                                            onChange={(e) => setInstanceData({...instanceData, businessKey: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label>Créé par:</label>
                                        <input
                                            type="text"
                                            value={instanceData.createdBy}
                                            onChange={(e) => setInstanceData({...instanceData, createdBy: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <button type="submit" style={{
                                        background: '#27ae60',
                                        color: 'white',
                                        border: 'none',
                                        padding: '0.75rem 1.5rem',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontWeight: 'bold'
                                    }}>
                                        ✅ Créer
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Liste des instances - AMÉLIORÉE AVEC EXÉCUTION */}
                        <button onClick={loadInstances} style={{ marginBottom: '1rem' }}>
                            🔄 Actualiser les Instances
                        </button>

                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {instances.map(instance => (
                                <div key={instance.id} style={{
                                    background: 'white',
                                    padding: '1.5rem',
                                    borderRadius: '8px',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                    border: expandedInstance === instance.id ? '2px solid #3498db' : '1px solid #ecf0f1',
                                    transition: 'border-color 0.3s ease'
                                }}>
                                    {/* Informations de base */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                        <div>
                                            <h4 style={{ margin: '0 0 1rem 0', color: '#34495e' }}>
                                                🔄 {instance.businessKey}
                                            </h4>
                                            <p><strong>ID:</strong> {instance.id}</p>
                                            <p><strong>Workflow:</strong> {instance.workflowName}</p>
                                            <p><strong>Statut actuel:</strong>
                                                <span style={{
                                                    background: '#f39c12',
                                                    color: 'white',
                                                    padding: '0.25rem 0.5rem',
                                                    borderRadius: '4px',
                                                    marginLeft: '0.5rem',
                                                    fontSize: '0.875rem'
                                                }}>
                                    {instance.currentStatutName}
                                </span>
                                            </p>
                                            <p><strong>Créé par:</strong> {instance.createdBy}</p>
                                            <p><strong>Date de début:</strong> {new Date(instance.startDate).toLocaleString()}</p>
                                        </div>
                                        <div>
                            <span style={{
                                background:
                                    instance.status === 'COMPLETED' ? '#27ae60' :
                                        instance.status === 'IN_PROGRESS' ? '#f39c12' : '#3498db',
                                color: 'white',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '12px',
                                fontSize: '0.875rem',
                                fontWeight: 'bold'
                            }}>
                                {instance.status}
                            </span>
                                        </div>
                                    </div>

                                    {/* 🆕 SECTION EXÉCUTION - SEULEMENT POUR LES INSTANCES ACTIVES */}
                                    {instance.status !== 'COMPLETED' && (
                                        <div style={{
                                            marginTop: '1rem',
                                            borderTop: '1px solid #eee',
                                            paddingTop: '1rem'
                                        }}>
                                            <button
                                                onClick={() => toggleInstanceTransitions(instance.id)}
                                                style={{
                                                    background: expandedInstance === instance.id ? '#e74c3c' : '#3498db',
                                                    color: 'white',
                                                    border: 'none',
                                                    padding: '0.75rem 1.5rem',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    fontWeight: 'bold',
                                                    width: '100%',
                                                    transition: 'background-color 0.3s ease'
                                                }}
                                            >
                                                {expandedInstance === instance.id ?
                                                    '🔼 Masquer l\'exécution' :
                                                    '⚡ Contrôler l\'exécution'
                                                }
                                            </button>

                                            {/* Panel d'exécution expandable */}
                                            {expandedInstance === instance.id && (
                                                <div style={{
                                                    marginTop: '1rem',
                                                    padding: '1.5rem',
                                                    background: 'linear-gradient(145deg, #f8f9fa 0%, #e9ecef 100%)',
                                                    borderRadius: '8px',
                                                    border: '1px solid #dee2e6'
                                                }}>
                                                    <h4 style={{
                                                        margin: '0 0 1rem 0',
                                                        color: '#495057',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.5rem'
                                                    }}>
                                                        ⚡ Transitions Disponibles
                                                        {loadingTransitions && <span style={{ fontSize: '0.8rem' }}>🔄</span>}
                                                    </h4>

                                                    {loadingTransitions ? (
                                                        <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                                                            🔄 Chargement des transitions...
                                                        </div>
                                                    ) : !instanceTransitions[instance.id] || instanceTransitions[instance.id].length === 0 ? (
                                                        <div style={{
                                                            textAlign: 'center',
                                                            padding: '2rem',
                                                            background: 'white',
                                                            borderRadius: '6px',
                                                            border: '2px dashed #dee2e6'
                                                        }}>
                                                            <p style={{ margin: '0 0 0.5rem 0', color: '#666' }}>
                                                                🚫 Aucune transition disponible
                                                            </p>
                                                            <p style={{ margin: 0, fontSize: '0.875rem', color: '#999' }}>
                                                                Cette instance a peut-être atteint un état final
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <div style={{ display: 'grid', gap: '1rem' }}>
                                                            {instanceTransitions[instance.id].map(transition => (
                                                                <div key={transition.id} style={{
                                                                    display: 'flex',
                                                                    justifyContent: 'space-between',
                                                                    alignItems: 'center',
                                                                    padding: '1rem',
                                                                    background: 'white',
                                                                    borderRadius: '6px',
                                                                    border: '1px solid #ddd',
                                                                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                                                }}>
                                                                    <div style={{ flex: 1 }}>
                                                                        <div style={{
                                                                            fontWeight: 'bold',
                                                                            color: '#333',
                                                                            marginBottom: '0.25rem'
                                                                        }}>
                                                                            ➡️ {transition.name || `Transition ${transition.id}`}
                                                                        </div>
                                                                        <div style={{
                                                                            fontSize: '0.875rem',
                                                                            color: '#666',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: '0.5rem'
                                                                        }}>
                                                                            <span>{transition.sourceStatutName}</span>
                                                                            <span style={{ color: '#3498db' }}>→</span>
                                                                            <span>{transition.targetStatutName}</span>
                                                                        </div>
                                                                        {transition.conditionExpression && (
                                                                            <div style={{
                                                                                fontSize: '0.8rem',
                                                                                color: '#999',
                                                                                marginTop: '0.25rem',
                                                                                fontStyle: 'italic'
                                                                            }}>
                                                                                Condition: {transition.conditionExpression}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <button
                                                                        onClick={() => executeInstanceTransition(
                                                                            instance.id,
                                                                            transition.id,
                                                                            transition.name || `Transition ${transition.id}`
                                                                        )}
                                                                        style={{
                                                                            background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                                                                            color: 'white',
                                                                            border: 'none',
                                                                            padding: '0.75rem 1.25rem',
                                                                            borderRadius: '6px',
                                                                            cursor: 'pointer',
                                                                            fontWeight: 'bold',
                                                                            fontSize: '0.875rem',
                                                                            transition: 'transform 0.2s ease',
                                                                            marginLeft: '1rem'
                                                                        }}
                                                                        onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                                                                        onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                                                                    >
                                                                        ▶️ Exécuter
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Message pour les instances terminées */}
                                    {instance.status === 'COMPLETED' && (
                                        <div style={{
                                            marginTop: '1rem',
                                            padding: '1rem',
                                            background: '#d4edda',
                                            border: '1px solid #c3e6cb',
                                            borderRadius: '6px',
                                            color: '#155724',
                                            textAlign: 'center'
                                        }}>
                                            ✅ Instance terminée - Aucune action possible
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            {activeTab === 'tasks' && (
                <TaskList />
            )}
            {activeTab === 'monitoring' && (
                <MonitoringDashboard />
            )}
            {showBpmnModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: 'white',
                        borderRadius: '12px',
                        padding: '2rem',
                        maxWidth: '90vw',
                        maxHeight: '90vh',
                        overflow: 'auto',
                        position: 'relative'
                    }}>
                        {/* En-tête du modal */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '1rem',
                            paddingBottom: '1rem',
                            borderBottom: '1px solid #eee'
                        }}>
                            <h2 style={{ margin: 0 }}>
                                📊 BPMN - {selectedWorkflowForView?.name}
                            </h2>
                            <button
                                onClick={closeBpmnModal}
                                style={{
                                    background: '#e74c3c',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '40px',
                                    height: '40px',
                                    cursor: 'pointer',
                                    fontSize: '1.2rem'
                                }}
                            >
                                ×
                            </button>
                        </div>

                        {/* Contenu du diagramme */}
                        <div style={{ minWidth: '600px', minHeight: '400px' }}>
                            <BpmnDiagram xml={bpmnXmlForView} />
                        </div>

                        {/* Actions */}
                        <div style={{
                            marginTop: '1rem',
                            paddingTop: '1rem',
                            borderTop: '1px solid #eee',
                            textAlign: 'center'
                        }}>
                            <button
                                onClick={() => {
                                    // Télécharger le BPMN
                                    const blob = new Blob([bpmnXmlForView], { type: 'application/xml' });
                                    const url = window.URL.createObjectURL(blob);
                                    const link = document.createElement('a');
                                    link.href = url;
                                    link.download = `${selectedWorkflowForView?.name || 'workflow'}.bpmn`;
                                    link.click();
                                    window.URL.revokeObjectURL(url);
                                }}
                                style={{
                                    background: '#3498db',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    marginRight: '1rem'
                                }}
                            >
                                💾 Télécharger BPMN
                            </button>
                            <button
                                onClick={closeBpmnModal}
                                style={{
                                    background: '#95a5a6',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '6px',
                                    cursor: 'pointer'
                                }}
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;