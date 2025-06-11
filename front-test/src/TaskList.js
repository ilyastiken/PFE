import React, { useState, useEffect, useCallback } from 'react';

const TaskList = () => {
    const [tasks, setTasks] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // ✅ CONFIGURATION
    const API_BASE = 'http://localhost:8080/api/tasks'; // URL complète
    const CURRENT_USER = 'Manual User'; // Correspond à vos données

    // ✅ CHARGEMENT DES TÂCHES OPTIMISÉ
    const fetchTasks = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('📋 Chargement des tâches...');
            const response = await fetch(`${API_BASE}/all`);

            if (!response.ok) {
                throw new Error(`Erreur API: ${response.status}`);
            }

            const data = await response.json();
            console.log('✅ Tâches reçues:', data);

            // ✅ MAPPING INTELLIGENT des données
            const mappedTasks = data.map(task => ({
                id: task.id,
                instanceId: task.instanceId,
                businessKey: task.instanceBusinessKey || `TASK-${task.id}`,
                title: task.name,
                description: task.description,
                assignee: task.assignee?.replace(/"/g, ''), // Nettoyer les guillemets
                created: task.createdDate,
                dueDate: task.dueDate,
                priority: mapPriority(task.priority),
                status: task.status,
                variables: {
                    clientName: extractClientName(task.description),
                    amount: extractAmount(task.description),
                    agency: extractAgency(task.description),
                    accountNumber: task.instanceBusinessKey || 'N/A'
                },
                workflowName: `Workflow (${task.statutName})`,
                statutName: task.statutName,
                rawTask: task // Garder les données originales
            }));

            setTasks(mappedTasks);
            console.log('✅ Tâches mappées:', mappedTasks);

        } catch (error) {
            console.error('❌ Erreur chargement tâches:', error);
            setError(error.message);
            setTasks([]); // Liste vide en cas d'erreur
        } finally {
            setLoading(false);
        }
    }, []);

    // ✅ CHARGEMENT INITIAL
    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    // ✅ FONCTIONS UTILITAIRES OPTIMISÉES
    const mapPriority = (priority) => {
        if (priority >= 7) return "HIGH";
        if (priority <= 3) return "LOW";
        return "MEDIUM";
    };

    const extractClientName = (description) => {
        if (!description) return "Client automatique";

        // "Tâche pour AUTO_19372938 - Étape: BBB" → "AUTO_19372938"
        const match = description.match(/pour\s+([^-]+)/);
        return match ? match[1].trim() : "Client automatique";
    };

    const extractAmount = (description) => {
        if (!description) return Math.floor(Math.random() * 50000) + 10000;

        const match = description.match(/(\d+[\d,]*)/);
        return match ? parseInt(match[1].replace(/,/g, '')) : Math.floor(Math.random() * 50000) + 10000;
    };

    const extractAgency = (description) => {
        // Logique basique - à améliorer selon vos besoins
        if (description?.includes('Casa')) return 'Casablanca Centre';
        if (description?.includes('Rabat')) return 'Rabat Nord';
        return 'Agence Principale';
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('fr-FR');
    };

    const getPriorityColor = (priority) => {
        const colors = {
            HIGH: 'color: #dc2626; background-color: #fef2f2;',
            MEDIUM: 'color: #d97706; background-color: #fffbeb;',
            LOW: 'color: #059669; background-color: #f0fdf4;'
        };
        return colors[priority] || 'color: #4b5563; background-color: #f9fafb;';
    };

    const isTaskOverdue = (dueDate) => {
        if (!dueDate) return false;
        return new Date(dueDate) < new Date();
    };

    // ✅ GESTIONNAIRE DE CLIC OPTIMISÉ
    const handleTaskClick = useCallback((task) => {
        setSelectedTask(task);
    }, []);

    // ✅ GESTIONNAIRE D'ACTIONS INTELLIGENT
    const handleAction = useCallback(async (taskId, action) => {
        if (!selectedTask) return;

        try {
            console.log(`🎯 Action ${action} sur tâche ${taskId}`);

            // Récupérer les commentaires
            const commentsTextarea = document.querySelector('textarea');
            const comments = commentsTextarea?.value || '';

            // ✅ API INTELLIGENTE
            const response = await fetch(`${API_BASE}/${taskId}/complete-and-advance`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    completedBy: CURRENT_USER,
                    comments: comments,
                    action: action
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur lors du traitement');
            }

            const result = await response.json();
            console.log('✅ Résultat:', result);

            // ✅ MISE À JOUR INTELLIGENTE
            setTasks(prevTasks => prevTasks.filter(t => t.id !== taskId));
            setSelectedTask(null);

            // ✅ NOTIFICATION DÉTAILLÉE
            let message = `✅ Tâche ${action} avec succès !`;
            if (result.transitionExecuted) {
                message += `\n🔄 Transition "${result.transitionName}" exécutée automatiquement.`;
            }

            alert(message);

            // ✅ RECHARGEMENT INTELLIGENT
            setTimeout(() => {
                fetchTasks(); // Recharger les tâches pour voir les nouvelles
            }, 1000);

        } catch (error) {
            console.error('❌ Erreur action:', error);
            alert(`❌ Erreur: ${error.message}`);
        }
    }, [selectedTask, fetchTasks]);

    // ✅ RENDU CONDITIONNEL OPTIMISÉ
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
                    width: '2rem',
                    height: '2rem',
                    border: '3px solid #e5e7eb',
                    borderTop: '3px solid #2563eb',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }}></div>
                <span style={{ color: '#6b7280', fontSize: '1.1rem' }}>
                    Chargement des tâches...
                </span>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                textAlign: 'center',
                padding: '3rem',
                backgroundColor: '#fef2f2',
                borderRadius: '0.5rem',
                margin: '2rem'
            }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
                <h3 style={{ color: '#dc2626', marginBottom: '1rem' }}>
                    Erreur de chargement
                </h3>
                <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
                    {error}
                </p>
                <button
                    onClick={fetchTasks}
                    style={{
                        backgroundColor: '#2563eb',
                        color: 'white',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '0.5rem',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: '500'
                    }}
                >
                    🔄 Réessayer
                </button>
            </div>
        );
    }

    return (
        <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '1.5rem',
            backgroundColor: '#f9fafb',
            minHeight: '100vh'
        }}>
            {/* ✅ EN-TÊTE AMÉLIORÉ */}
            <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{
                            fontSize: '1.875rem',
                            fontWeight: 'bold',
                            color: '#111827',
                            marginBottom: '0.5rem'
                        }}>
                            📝 Mes Tâches
                        </h1>
                        <p style={{ color: '#6b7280' }}>
                            Vous avez <span style={{ fontWeight: '600', color: '#2563eb' }}>{tasks.length}</span> tâche(s) en attente
                        </p>
                    </div>
                    <button
                        onClick={fetchTasks}
                        style={{
                            backgroundColor: '#f3f4f6',
                            border: '1px solid #d1d5db',
                            padding: '0.5rem 1rem',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            color: '#374151'
                        }}
                        title="Actualiser les tâches"
                    >
                        🔄 Actualiser
                    </button>
                </div>
            </div>

            {tasks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
                    <h3 style={{
                        fontSize: '1.25rem',
                        fontWeight: '500',
                        color: '#111827',
                        marginBottom: '0.5rem'
                    }}>
                        Aucune tâche en attente !
                    </h3>
                    <p style={{ color: '#6b7280' }}>
                        Toutes vos tâches sont terminées ou aucune tâche n'est assignée.
                    </p>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: window.innerWidth > 768 ? '1fr 1fr' : '1fr',
                    gap: '1.5rem'
                }}>
                    {/* ✅ LISTE DES TÂCHES OPTIMISÉE */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {tasks.map(task => (
                            <div
                                key={task.id}
                                style={{
                                    backgroundColor: 'white',
                                    borderRadius: '0.75rem',
                                    boxShadow: selectedTask?.id === task.id
                                        ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 0 0 2px #3b82f6'
                                        : '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                                    borderLeft: `4px solid ${isTaskOverdue(task.dueDate) ? '#dc2626' : '#3b82f6'}`,
                                    padding: '1.5rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    position: 'relative'
                                }}
                                onClick={() => handleTaskClick(task)}
                                onMouseEnter={(e) => {
                                    if (selectedTask?.id !== task.id) {
                                        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (selectedTask?.id !== task.id) {
                                        e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
                                    }
                                }}
                            >
                                {/* Badge de retard */}
                                {isTaskOverdue(task.dueDate) && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '0.5rem',
                                        right: '0.5rem',
                                        backgroundColor: '#dc2626',
                                        color: 'white',
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '0.25rem',
                                        fontSize: '0.625rem',
                                        fontWeight: 'bold'
                                    }}>
                                        ⏰ RETARD
                                    </div>
                                )}

                                <div style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    justifyContent: 'space-between',
                                    marginBottom: '0.75rem'
                                }}>
                                    <div style={{ flex: 1, paddingRight: '1rem' }}>
                                        <h3 style={{
                                            fontSize: '1.125rem',
                                            fontWeight: '600',
                                            color: '#111827',
                                            marginBottom: '0.25rem'
                                        }}>
                                            {task.title}
                                        </h3>
                                        <p style={{
                                            color: '#6b7280',
                                            fontSize: '0.875rem',
                                            marginBottom: '0.5rem',
                                            lineHeight: '1.4'
                                        }}>
                                            {task.description}
                                        </p>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            fontSize: '0.75rem',
                                            color: '#6b7280',
                                            gap: '1rem',
                                            flexWrap: 'wrap'
                                        }}>
                                            <span title={`Créée le ${formatDate(task.created)}`}>
                                                📅 {formatDate(task.created)}
                                            </span>
                                            <span title={`Échéance: ${formatDate(task.dueDate)}`}>
                                                ⏱️ {formatDate(task.dueDate)}
                                            </span>
                                            <span>👤 {task.workflowName}</span>
                                        </div>
                                    </div>
                                    <div style={{
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '9999px',
                                        fontSize: '0.75rem',
                                        fontWeight: '500',
                                        whiteSpace: 'nowrap',
                                        ...Object.fromEntries(getPriorityColor(task.priority).split(';').map(s => s.split(':')))
                                    }}>
                                        {task.priority}
                                    </div>
                                </div>

                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                }}>
                                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                        <strong>Dossier:</strong> {task.businessKey}
                                    </div>
                                    <span style={{
                                        color: selectedTask?.id === task.id ? '#059669' : '#2563eb',
                                        fontSize: '0.875rem',
                                        fontWeight: '500'
                                    }}>
                                        {selectedTask?.id === task.id ? '✅ Sélectionné' : '👁️ Voir détails'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* ✅ DÉTAIL OPTIMISÉ */}
                    <div>
                        {selectedTask ? (
                            <div style={{
                                backgroundColor: 'white',
                                borderRadius: '0.75rem',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                padding: '1.5rem',
                                position: 'sticky',
                                top: '1.5rem'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '1rem'
                                }}>
                                    <h2 style={{
                                        fontSize: '1.25rem',
                                        fontWeight: 'bold',
                                        color: '#111827'
                                    }}>
                                        Détails de la tâche
                                    </h2>
                                    <span style={{
                                        backgroundColor: selectedTask.status === 'CREATED' ? '#fbbf24' : '#10b981',
                                        color: 'white',
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '1rem',
                                        fontSize: '0.75rem',
                                        fontWeight: '500'
                                    }}>
                                        {selectedTask.status}
                                    </span>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    {/* Informations générales */}
                                    <div>
                                        <h3 style={{ fontWeight: '600', color: '#111827', marginBottom: '0.75rem' }}>
                                            📋 Informations générales
                                        </h3>
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: '1fr 1fr',
                                            gap: '1rem',
                                            fontSize: '0.875rem'
                                        }}>
                                            <div>
                                                <span style={{ color: '#6b7280' }}>Dossier:</span>
                                                <p style={{ fontWeight: '500', margin: 0 }}>{selectedTask.businessKey}</p>
                                            </div>
                                            <div>
                                                <span style={{ color: '#6b7280' }}>Processus:</span>
                                                <p style={{ fontWeight: '500', margin: 0 }}>{selectedTask.workflowName}</p>
                                            </div>
                                            <div>
                                                <span style={{ color: '#6b7280' }}>Créée le:</span>
                                                <p style={{ fontWeight: '500', margin: 0 }}>{formatDate(selectedTask.created)}</p>
                                            </div>
                                            <div>
                                                <span style={{ color: '#6b7280' }}>Échéance:</span>
                                                <p style={{
                                                    fontWeight: '500',
                                                    margin: 0,
                                                    color: isTaskOverdue(selectedTask.dueDate) ? '#dc2626' : 'inherit'
                                                }}>
                                                    {formatDate(selectedTask.dueDate)}
                                                    {isTaskOverdue(selectedTask.dueDate) && ' ⚠️'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Variables métier */}
                                    <div>
                                        <h3 style={{ fontWeight: '600', color: '#111827', marginBottom: '0.75rem' }}>
                                            💼 Données du dossier
                                        </h3>
                                        <div style={{
                                            backgroundColor: '#f9fafb',
                                            borderRadius: '0.5rem',
                                            padding: '1rem'
                                        }}>
                                            <div style={{
                                                display: 'grid',
                                                gridTemplateColumns: '1fr 1fr',
                                                gap: '1rem',
                                                fontSize: '0.875rem'
                                            }}>
                                                <div>
                                                    <span style={{ color: '#6b7280' }}>Client:</span>
                                                    <p style={{ fontWeight: '500', margin: 0 }}>{selectedTask.variables.clientName}</p>
                                                </div>
                                                <div>
                                                    <span style={{ color: '#6b7280' }}>Montant:</span>
                                                    <p style={{ fontWeight: '500', color: '#059669', margin: 0 }}>
                                                        {selectedTask.variables.amount?.toLocaleString()} €
                                                    </p>
                                                </div>
                                                <div>
                                                    <span style={{ color: '#6b7280' }}>Agence:</span>
                                                    <p style={{ fontWeight: '500', margin: 0 }}>{selectedTask.variables.agency}</p>
                                                </div>
                                                <div>
                                                    <span style={{ color: '#6b7280' }}>Référence:</span>
                                                    <p style={{ fontWeight: '500', margin: 0 }}>{selectedTask.variables.accountNumber}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Zone de commentaires */}
                                    <div>
                                        <label style={{
                                            display: 'block',
                                            fontSize: '0.875rem',
                                            fontWeight: '500',
                                            color: '#374151',
                                            marginBottom: '0.5rem'
                                        }}>
                                            💬 Commentaires
                                        </label>
                                        <textarea
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                border: '1px solid #d1d5db',
                                                borderRadius: '0.5rem',
                                                fontSize: '0.875rem',
                                                resize: 'vertical',
                                                minHeight: '80px',
                                                fontFamily: 'inherit'
                                            }}
                                            rows="3"
                                            placeholder="Ajouter un commentaire sur cette action..."
                                        />
                                    </div>

                                    {/* Actions */}
                                    <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1.5rem' }}>
                                        <h3 style={{ fontWeight: '600', color: '#111827', marginBottom: '0.75rem' }}>
                                            ⚡ Actions disponibles
                                        </h3>
                                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                                            <button
                                                onClick={() => handleAction(selectedTask.id, 'APPROVE')}
                                                style={{
                                                    flex: 1,
                                                    backgroundColor: '#059669',
                                                    color: 'white',
                                                    padding: '0.75rem 1rem',
                                                    borderRadius: '0.5rem',
                                                    border: 'none',
                                                    fontWeight: '500',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    fontSize: '0.875rem'
                                                }}
                                                onMouseEnter={(e) => e.target.style.backgroundColor = '#047857'}
                                                onMouseLeave={(e) => e.target.style.backgroundColor = '#059669'}
                                            >
                                                ✅ Approuver
                                            </button>
                                            <button
                                                onClick={() => handleAction(selectedTask.id, 'REJECT')}
                                                style={{
                                                    flex: 1,
                                                    backgroundColor: '#dc2626',
                                                    color: 'white',
                                                    padding: '0.75rem 1rem',
                                                    borderRadius: '0.5rem',
                                                    border: 'none',
                                                    fontWeight: '500',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    fontSize: '0.875rem'
                                                }}
                                                onMouseEnter={(e) => e.target.style.backgroundColor = '#b91c1c'}
                                                onMouseLeave={(e) => e.target.style.backgroundColor = '#dc2626'}
                                            >
                                                ❌ Rejeter
                                            </button>
                                            <button
                                                onClick={() => handleAction(selectedTask.id, 'SUSPEND')}
                                                style={{
                                                    flex: 1,
                                                    backgroundColor: '#d97706',
                                                    color: 'white',
                                                    padding: '0.75rem 1rem',
                                                    borderRadius: '0.5rem',
                                                    border: 'none',
                                                    fontWeight: '500',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    fontSize: '0.875rem'
                                                }}
                                                onMouseEnter={(e) => e.target.style.backgroundColor = '#b45309'}
                                                onMouseLeave={(e) => e.target.style.backgroundColor = '#d97706'}
                                            >
                                                ⏸️ Suspendre
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div style={{
                                backgroundColor: 'white',
                                borderRadius: '0.75rem',
                                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                                padding: '2rem',
                                textAlign: 'center',
                                position: 'sticky',
                                top: '1.5rem'
                            }}>
                                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>👆</div>
                                <h3 style={{
                                    fontSize: '1.125rem',
                                    fontWeight: '500',
                                    color: '#111827',
                                    marginBottom: '0.5rem'
                                }}>
                                    Sélectionnez une tâche
                                </h3>
                                <p style={{ color: '#6b7280', lineHeight: '1.5' }}>
                                    Cliquez sur une tâche dans la liste pour voir ses détails
                                    et les actions disponibles.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default TaskList;