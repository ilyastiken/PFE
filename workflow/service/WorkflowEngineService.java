package ma.xproce.workflow.service;

import ma.xproce.workflow.entities.*;
import ma.xproce.workflow.repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class WorkflowEngineService {

    @Autowired
    private WorkflowRepository workflowRepository;

    @Autowired
    private InstanceRepository instanceRepository;

    @Autowired
    private StatutRepository statutRepository;

    @Autowired
    private TransitionRepository transitionRepository;

    @Autowired
    private TransitionHistoryRepository transitionHistoryRepository;

    public Instance startWorkflow(Long workflowId, String businessKey, String createdBy) {
        // Récupérer le workflow
        Workflow workflow = workflowRepository.findById(workflowId).orElse(null);
        if (workflow == null) {
            return null;
        }

        // Trouver l'état initial
        Statut initialStatut = workflow.getStatuts().stream()
                .filter(s -> "INITIAL".equals(s.getStatutType()))
                .findFirst()
                .orElse(null);

        if (initialStatut == null) {
            return null;
        }

        // Créer une nouvelle instance
        Instance instance = new Instance();
        instance.setWorkflow(workflow);
        instance.setBusinessKey(businessKey);
        instance.setCurrentStatut(initialStatut);
        instance.setStartDate(LocalDateTime.now());
        instance.setStatus("IN_PROGRESS");
        instance.setCreatedBy(createdBy);

        return instanceRepository.save(instance);
    }

    // Récupérer toutes les instances
    public List<Instance> getAllInstances() {
        return instanceRepository.findAll();
    }

    // Récupérer une instance par ID
    public Instance getInstanceById(Long id) {
        return instanceRepository.findById(id).orElse(null);
    }

    // Effectuer une transition
    public Instance performTransition(Long instanceId, Long transitionId, String executedBy) {
        // Récupérer l'instance
        Instance instance = instanceRepository.findById(instanceId).orElse(null);
        if (instance == null) {
            return null;
        }

        // Récupérer la transition
        Transition transition = transitionRepository.findById(transitionId).orElse(null);
        if (transition == null) {
            return null;
        }

        // Vérifier que la transition est valide
        if (!transition.getSourceStatut().getId().equals(instance.getCurrentStatut().getId())) {
            return null;
        }

        // Enregistrer l'historique
        TransitionHistory history = new TransitionHistory();
        history.setInstance(instance);
        history.setTransition(transition);
        history.setPreviousStatut(instance.getCurrentStatut());
        history.setNewStatut(transition.getTargetStatut());
        history.setExecutionDate(LocalDateTime.now());
        history.setExecutedBy(executedBy);
        transitionHistoryRepository.save(history);

        // Mettre à jour l'instance
        instance.setCurrentStatut(transition.getTargetStatut());

        // Si c'est un état final, terminer l'instance
        if ("FINAL".equals(transition.getTargetStatut().getStatutType())) {
            instance.setEndDate(LocalDateTime.now());
            instance.setStatus("COMPLETED");
        }

        return instanceRepository.save(instance);
    }
    public List<Transition> getAvailableTransitions(Long instanceId) {
        Instance instance = instanceRepository.findById(instanceId).orElse(null);
        if (instance == null) {
            return List.of();
        }

        // Trouver toutes les transitions qui partent de l'état actuel
        return transitionRepository.findBySourceStatutId(instance.getCurrentStatut().getId());
    }
}