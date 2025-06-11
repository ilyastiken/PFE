package ma.xproce.workflow.service;

import ma.xproce.workflow.entities.Instance;
import ma.xproce.workflow.entities.Transition;
import ma.xproce.workflow.entities.TransitionHistory;
import ma.xproce.workflow.repositories.InstanceRepository;
import ma.xproce.workflow.repositories.TransitionRepository;
import ma.xproce.workflow.repositories.TransitionHistoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class TransitionEngineService {

    @Autowired
    private InstanceRepository instanceRepository;

    @Autowired
    private TransitionRepository transitionRepository;

    @Autowired
    private TransitionHistoryRepository transitionHistoryRepository;
    @Autowired
    private TaskService taskService;

    @Transactional
    public Instance executeTransition(Long instanceId, Long transitionId, String executedBy) {
        // 1. Récupérer l'instance
        Instance instance = instanceRepository.findById(instanceId)
                .orElseThrow(() -> new RuntimeException("Instance introuvable avec l'ID : " + instanceId));

        // 2. Récupérer la transition
        Transition transition = transitionRepository.findById(transitionId)
                .orElseThrow(() -> new RuntimeException("Transition introuvable avec l'ID : " + transitionId));

        // 3. Vérifier que la transition est valide (CORRECTION ICI)
        if (!transition.getSourceStatut().getId().equals(instance.getCurrentStatut().getId())) {
            throw new RuntimeException(
                    String.format("Transition invalide : état actuel (%s - %s) ne correspond pas au statut source (%s - %s)",
                            instance.getCurrentStatut().getId(),
                            instance.getCurrentStatut().getName(),
                            transition.getSourceStatut().getId(),
                            transition.getSourceStatut().getName())
            );
        }

        // 4. Exécuter la transition
        instance.setCurrentStatut(transition.getTargetStatut());

        // 5. Créer l'historique
        TransitionHistory history = new TransitionHistory();
        history.setInstance(instance);
        history.setTransition(transition);
        history.setExecutedBy(executedBy);
        history.setExecutionDate(LocalDateTime.now());

        // Sauvegarder l'historique
        transitionHistoryRepository.save(history);
        
        if (!"FINAL".equals(transition.getTargetStatut().getStatutType())) {
            try {
                taskService.createTaskForStatut(instance, transition.getTargetStatut(), executedBy);
                System.out.println("✅ Tâche créée automatiquement pour statut: " + transition.getTargetStatut().getName());
            } catch (Exception e) {
                System.out.println("⚠️ Erreur création tâche: " + e.getMessage());
                // On n'interrompt pas le processus principal
            }
        }
        // Sauvegarder l'instance mise à jour
        return instanceRepository.save(instance);
    }

    public List<Transition> getAvailableTransitions(Long instanceId) {
        Long currentStatutId = instanceRepository.findCurrentStatutId(instanceId);
        if (currentStatutId == null) {
            return List.of();
        }
        return transitionRepository.findBySourceStatutId(currentStatutId);
    }
}