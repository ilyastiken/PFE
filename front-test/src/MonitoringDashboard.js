// MONITORING INTERFACE REACT - src/MonitoringDashboard.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import BpmnViewer from 'bpmn-js/lib/Viewer';

const MonitoringDashboard = () => {
    const [globalStats, setGlobalStats] = useState(null);
    const [workflows, setWorkflows] = useState([]);
    const [selectedWorkflowId, setSelectedWorkflowId] = useState(null);
    const [workflowMonitoring, setWorkflowMonitoring] = useState(null);
    const [selectedInstance, setSelectedInstance] = useState(null);
    const [bpmnXml, setBpmnXml] = useState('');
    const [loading, setLoading] = useState(true);
    const [autoRefresh, setAutoRefresh] = useState(true);

    const containerRef = useRef(null);
    const viewerRef = useRef(null);
    const refreshIntervalRef = useRef(null);

    const API_BASE = 'http://localhost:8080/api';

    // ✅ CHARGEMENT INITIAL
    useEffect(() => {
        loadInitialData();

        // Auto-refresh toutes les 5 secondes
        if (autoRefresh) {
            refreshIntervalRef.current = setInterval(() => {
                refreshData();
            }, 5000);
        }

        return () => {
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
            }
        };
    }, [autoRefresh]);

    // ✅ CHARGEMENT DONNÉES INITIALES
    const loadInitialData = async () => {
        try {
            setLoading(true);

            // Dashboard global
            const statsResponse = await fetch(`${API_BASE}/monitoring/dashboard`);
            const statsData = await statsResponse.json();
            setGlobalStats(statsData);

            // Liste des workflows
            const workflowsResponse = await fetch(`${API_BASE}/workflows`);
            const workflowsData = await workflowsResponse.json();
            setWorkflows(workflowsData);

            // Sélectionner automatiquement le premier workflow avec instances actives
            const workflowWithInstances = workflowsData.find(w => w.activeInstanceCount > 0);
            if (workflowWithInstances) {
                setSelectedWorkflowId(workflowWithInstances.id);
                await loadWorkflowMonitoring(workflowWithInstances.id);
            }

        } catch (error) {
            console.error('❌ Erreur chargement initial:', error);
        } finally {
            setLoading(false);
        }
    };

    // ✅ CHARGEMENT MONITORING WORKFLOW
    const loadWorkflowMonitoring = async (workflowId) => {
        try {
            // Monitoring data
            const monitoringResponse = await fetch(`${API_BASE}/monitoring/workflow/${workflowId}`);
            const monitoringData = await monitoringResponse.json();
            setWorkflowMonitoring(monitoringData);

            // BPMN du workflow
            const bpmnResponse = await fetch(`${API_BASE}/bpmn/generate/${workflowId}`);
            const bpmnData = await bpmnResponse.text();
            setBpmnXml(bpmnData);

            // Sélectionner automatiquement la première instance active
            if (monitoringData.activeInstances && monitoringData.activeInstances.length > 0) {
                setSelectedInstance(monitoringData.activeInstances[0]);
            }

        } catch (error) {
            console.error('❌ Erreur chargement workflow monitoring:', error);
        }
    };

    // ✅ REFRESH INTELLIGENT
    const refreshData = useCallback(async () => {
        if (selectedWorkflowId) {
            // Refresh silencieux sans loading
            try {
                const monitoringResponse = await fetch(`${API_BASE}/monitoring/workflow/${selectedWorkflowId}`);
                const monitoringData = await monitoringResponse.json();
                setWorkflowMonitoring(monitoringData);

                // Maintenir la sélection d'instance si elle existe toujours
                if (selectedInstance) {
                    const updatedInstance = monitoringData.activeInstances?.find(
                        i => i.id === selectedInstance.id
                    );
                    if (updatedInstance) {
                        setSelectedInstance(updatedInstance);
                    }
                }

            } catch (error) {
                console.error('❌ Erreur refresh:', error);
            }
        }
    }, [selectedWorkflowId, selectedInstance]);

    // ✅ INITIALISATION BPMN VIEWER
    useEffect(() => {
        if (bpmnXml && containerRef.current) {
            initializeBpmnViewer();
        }
    }, [bpmnXml]);

    const initializeBpmnViewer = async () => {
        try {
            // Nettoyer l'ancien viewer
            if (viewerRef.current) {
                viewerRef.current.destroy();
            }

            // Créer nouveau viewer
            const viewer = new BpmnViewer({
                container: containerRef.current,
                width: '100%',
                height: '100%'
            });

            viewerRef.current = viewer;
            await viewer.importXML(bpmnXml);

            // Ajuster vue
            const canvas = viewer.get('canvas');
            canvas.zoom('fit-viewport');

            // Appliquer highlights si instance sélectionnée
            if (selectedInstance) {
                highlightCurrentStep(selectedInstance);
            }

        } catch (error) {
            console.error('❌ Erreur BPMN viewer:', error);
        }
    };

    // ✅ HIGHLIGHT ÉTAPE ACTUELLE
    const highlightCurrentStep = (instance) => {
        if (!viewerRef.current || !instance.currentStatutName) return;

        try {
            const canvas = viewerRef.current.get('canvas');
            const elementRegistry = viewerRef.current.get('elementRegistry');

            // Reset tous les highlights
            elementRegistry.getAll().forEach(element => {
                canvas.removeMarker(element.id, 'highlight-current');
                canvas.removeMarker(element.id, 'highlight-completed');
            });

            // Trouver l'élément correspondant au statut actuel
            const currentElement = elementRegistry.filter(element => {
                return element.businessObject && (
                    element.businessObject.name === instance.currentStatutName ||
                    element.businessObject.name?.includes(instance.currentStatutName)
                );
            })[0];

            if (currentElement) {
                canvas.addMarker(currentElement.id, 'highlight-current');
                console.log('✅ Highlight appliqué à:', instance.currentStatutName);
            }

        } catch (error) {
            console.error('❌ Erreur highlight:', error);
        }
    };

    // ✅ SÉLECTION WORKFLOW
    const handleWorkflowChange = (workflowId) => {
        setSelectedWorkflowId(workflowId);
        setSelectedInstance(null);
        loadWorkflowMonitoring(workflowId);
    };

    // ✅ SÉLECTION INSTANCE
    const handleInstanceSelect = (instance) => {
        setSelectedInstance(instance);
        highlightCurrentStep(instance);
    };

    // ✅ FORMATAGE DURÉE
    const formatDuration = (durationText) => {
        return durationText || 'N/A';
    };

    // ✅ COULEUR STATUT
    const getStatusColor = (status) => {
        switch (status) {
            case 'IN_PROGRESS': return '#ff9800';
            case 'COMPLETED': return '#4caf50';
            case 'CREATED': return '#2196f3';
            default: return '#9e9e9e';
        }
    };

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '50vh',
                gap: '1rem'
            }}>
                <div style={{
                    width: '3rem',
                    height: '3rem',
                    border: '4px solid #e3f2fd',
                    borderTop: '4px solid #2196f3',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }}></div>
                <span style={{ fontSize: '1.2rem', color: '#666' }}>
                    Chargement du monitoring...
                </span>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f5f5f5' }}>
            {/* ✅ PANNEAU LATÉRAL */}
            <div style={{
                width: '350px',
                backgroundColor: 'white',
                borderRight: '1px solid #e0e0e0',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '2px 0 4px rgba(0,0,0,0.1)'
            }}>
                {/* Header panneau */}
                <div style={{
                    padding: '1.5rem',
                    borderBottom: '1px solid #e0e0e0',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white'
                }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem' }}>
                        📊 Monitoring Temps Réel
                    </h3>
                    <div style={{ fontSize: '0.9rem', opacity: 0.9, marginTop: '0.5rem' }}>
                        {autoRefresh && '🔴 LIVE • '}Actualisation automatique
                    </div>
                </div>

                {/* Statistiques globales */}
                {globalStats && globalStats.success && (
                    <div style={{ padding: '1rem', borderBottom: '1px solid #f0f0f0' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.75rem', color: '#333' }}>
                            📈 Vue d'ensemble
                        </div>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '0.5rem',
                            fontSize: '0.8rem'
                        }}>
                            <div style={{
                                background: '#e3f2fd',
                                padding: '0.5rem',
                                borderRadius: '4px',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontWeight: 'bold', color: '#1976d2' }}>
                                    {globalStats.instances.active}
                                </div>
                                <div style={{ color: '#666' }}>Actives</div>
                            </div>
                            <div style={{
                                background: '#e8f5e8',
                                padding: '0.5rem',
                                borderRadius: '4px',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontWeight: 'bold', color: '#2e7d32' }}>
                                    {globalStats.instances.completed}
                                </div>
                                <div style={{ color: '#666' }}>Terminées</div>
                            </div>
                            <div style={{
                                background: '#fff3e0',
                                padding: '0.5rem',
                                borderRadius: '4px',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontWeight: 'bold', color: '#f57c00' }}>
                                    {globalStats.tasks.pending}
                                </div>
                                <div style={{ color: '#666' }}>Tâches</div>
                            </div>
                            <div style={{
                                background: '#ffebee',
                                padding: '0.5rem',
                                borderRadius: '4px',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontWeight: 'bold', color: '#d32f2f' }}>
                                    {globalStats.tasks.overdue}
                                </div>
                                <div style={{ color: '#666' }}>En retard</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Sélection workflow */}
                <div style={{ padding: '1rem', borderBottom: '1px solid #f0f0f0' }}>
                    <label style={{
                        display: 'block',
                        fontSize: '0.9rem',
                        fontWeight: 'bold',
                        marginBottom: '0.5rem',
                        color: '#333'
                    }}>
                        🏭 Workflow à monitorer:
                    </label>
                    <select
                        value={selectedWorkflowId || ''}
                        onChange={(e) => handleWorkflowChange(parseInt(e.target.value))}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid #ddd',
                            borderRadius: '6px',
                            fontSize: '0.9rem'
                        }}
                    >
                        <option value="">-- Sélectionner un workflow --</option>
                        {workflows.map(workflow => (
                            <option key={workflow.id} value={workflow.id}>
                                {workflow.name} ({workflow.activeInstanceCount || 0} actives)
                            </option>
                        ))}
                    </select>
                </div>

                {/* Liste des instances */}
                <div style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
                    {workflowMonitoring && workflowMonitoring.success && (
                        <>
                            <div style={{
                                fontSize: '0.9rem',
                                fontWeight: 'bold',
                                marginBottom: '1rem',
                                color: '#333',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <span>🔄 Instances Actives</span>
                                <span style={{
                                    background: '#2196f3',
                                    color: 'white',
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: '12px',
                                    fontSize: '0.75rem'
                                }}>
                                    {workflowMonitoring.activeInstances?.length || 0}
                                </span>
                            </div>

                            {workflowMonitoring.activeInstances?.map(instance => (
                                <div
                                    key={instance.id}
                                    onClick={() => handleInstanceSelect(instance)}
                                    style={{
                                        background: selectedInstance?.id === instance.id ? '#e3f2fd' : '#f9f9f9',
                                        border: selectedInstance?.id === instance.id ? '2px solid #2196f3' : '1px solid #e0e0e0',
                                        borderRadius: '8px',
                                        padding: '1rem',
                                        marginBottom: '0.75rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        position: 'relative'
                                    }}
                                >
                                    <div style={{
                                        fontWeight: 'bold',
                                        color: '#333',
                                        marginBottom: '0.5rem',
                                        fontSize: '0.95rem'
                                    }}>
                                        🔄 {instance.businessKey}
                                    </div>

                                    <div style={{
                                        display: 'inline-block',
                                        background: getStatusColor(instance.status),
                                        color: 'white',
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '12px',
                                        fontSize: '0.7rem',
                                        fontWeight: 'bold',
                                        marginBottom: '0.5rem'
                                    }}>
                                        {instance.status}
                                    </div>

                                    <div style={{
                                        fontSize: '0.8rem',
                                        color: '#666',
                                        lineHeight: '1.4'
                                    }}>
                                        <div>👤 {instance.createdBy}</div>
                                        <div>📅 {new Date(instance.startDate).toLocaleString('fr-FR')}</div>
                                        <div>⏱️ Durée: {formatDuration(instance.durationText)}</div>
                                    </div>

                                    <div style={{
                                        background: '#e8f5e8',
                                        color: '#2e7d32',
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '4px',
                                        fontSize: '0.75rem',
                                        fontWeight: 'bold',
                                        marginTop: '0.5rem',
                                        display: 'inline-block'
                                    }}>
                                        📍 {instance.currentStatutName}
                                    </div>

                                    {selectedInstance?.id === instance.id && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '0.5rem',
                                            right: '0.5rem',
                                            background: '#4caf50',
                                            color: 'white',
                                            padding: '0.25rem',
                                            borderRadius: '50%',
                                            fontSize: '0.7rem'
                                        }}>
                                            ✓
                                        </div>
                                    )}
                                </div>
                            ))}

                            {(!workflowMonitoring.activeInstances || workflowMonitoring.activeInstances.length === 0) && (
                                <div style={{
                                    textAlign: 'center',
                                    padding: '2rem 1rem',
                                    color: '#999',
                                    fontSize: '0.9rem'
                                }}>
                                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>😴</div>
                                    Aucune instance active
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* ✅ ZONE PRINCIPALE */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Header principal */}
                <div style={{
                    background: 'white',
                    padding: '1.5rem',
                    borderBottom: '1px solid #e0e0e0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                    <div>
                        <h2 style={{ margin: 0, color: '#333', fontSize: '1.5rem' }}>
                            🏭 {workflowMonitoring?.workflow?.name || 'Sélectionnez un workflow'}
                        </h2>
                        {selectedInstance && (
                            <div style={{
                                fontSize: '0.9rem',
                                color: '#666',
                                marginTop: '0.5rem',
                                background: '#f0f0f0',
                                padding: '0.5rem 1rem',
                                borderRadius: '6px',
                                display: 'inline-block'
                            }}>
                                📍 Instance: <strong>{selectedInstance.businessKey}</strong> •
                                Étape: <strong>{selectedInstance.currentStatutName}</strong> •
                                Durée: <strong>{formatDuration(selectedInstance.durationText)}</strong>
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                            <input
                                type="checkbox"
                                checked={autoRefresh}
                                onChange={(e) => setAutoRefresh(e.target.checked)}
                            />
                            🔄 Auto-refresh
                        </label>

                        <button
                            onClick={refreshData}
                            style={{
                                background: '#2196f3',
                                color: 'white',
                                border: 'none',
                                padding: '0.75rem 1.5rem',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: '0.9rem'
                            }}
                        >
                            🔄 Actualiser
                        </button>
                    </div>
                </div>

                {/* Zone BPMN */}
                <div style={{ flex: 1, position: 'relative', background: '#fafafa' }}>
                    {bpmnXml ? (
                        <>
                            <div
                                ref={containerRef}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    background: 'white'
                                }}
                            />

                            {!selectedInstance && selectedWorkflowId && (
                                <div style={{
                                    position: 'absolute',
                                    top: '20px',
                                    left: '20px',
                                    background: 'rgba(33, 150, 243, 0.95)',
                                    color: 'white',
                                    padding: '1rem',
                                    borderRadius: '8px',
                                    fontSize: '0.9rem',
                                    maxWidth: '300px'
                                }}>
                                    👈 Sélectionnez une instance dans le panneau pour voir sa progression en temps réel
                                </div>
                            )}

                            {selectedInstance && (
                                <div style={{
                                    position: 'absolute',
                                    top: '20px',
                                    right: '20px',
                                    background: '#4caf50',
                                    color: 'white',
                                    padding: '0.75rem 1rem',
                                    borderRadius: '20px',
                                    fontSize: '0.8rem',
                                    fontWeight: 'bold',
                                    animation: 'pulse 2s infinite'
                                }}>
                                    🔴 LIVE • {selectedInstance.businessKey}
                                </div>
                            )}
                        </>
                    ) : (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            flexDirection: 'column',
                            color: '#666'
                        }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏭</div>
                            <h3>Sélectionnez un workflow pour commencer le monitoring</h3>
                            <p>Choisissez un workflow dans le panneau de gauche pour voir ses instances en temps réel</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ✅ STYLES CSS */}
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                
                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.7; }
                    100% { opacity: 1; }
                }
                
                .highlight-current .djs-visual > :nth-child(1) {
                    stroke: #4caf50 !important;
                    stroke-width: 4px !important;
                    fill: #c8e6c9 !important;
                    filter: drop-shadow(0 0 8px rgba(76, 175, 80, 0.6));
                }
                
                .highlight-current .djs-visual text {
                    fill: #2e7d32 !important;
                    font-weight: bold !important;
                    font-size: 12px !important;
                }
                
                .highlight-completed .djs-visual > :nth-child(1) {
                    stroke: #2196f3 !important;
                    stroke-width: 2px !important;
                    fill: #e3f2fd !important;
                }
            `}</style>
        </div>
    );
};

export default MonitoringDashboard;