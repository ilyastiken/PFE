package ma.xproce.workflow.service;


import ma.xproce.workflow.dtos.TransitionDTO;
import ma.xproce.workflow.dtos.TransitionResponseDTO;
import ma.xproce.workflow.entities.Statut;
import ma.xproce.workflow.entities.Transition;
import ma.xproce.workflow.entities.Workflow;
import ma.xproce.workflow.repositories.StatutRepository;
import ma.xproce.workflow.repositories.TransitionRepository;
import ma.xproce.workflow.repositories.WorkflowRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class TransitionService {

    @Autowired
    private WorkflowRepository workflowRepository;

    @Autowired
    private StatutRepository statutRepository;

    @Autowired
    private TransitionRepository transitionRepository;

    @Transactional
    public List<Transition> addTransitionsToWorkflow(Long workflowId, List<TransitionDTO> transitionDTOs) {
        Workflow workflow = workflowRepository.findById(workflowId)
                .orElseThrow(() -> new RuntimeException("Workflow introuvable avec l'ID : " + workflowId));


        List<Transition> createdTransitions = new ArrayList<>();


        for (TransitionDTO dto : transitionDTOs) {
            Statut sourceStatut = statutRepository.findById(dto.getSourceStatutId())
                    .orElseThrow(() -> new RuntimeException("Statut source introuvable avec l'ID : " + dto.getSourceStatutId()));

            Statut targetStatut = statutRepository.findById(dto.getTargetStatutId())
                    .orElseThrow(() -> new RuntimeException("Statut cible introuvable avec l'ID : " + dto.getTargetStatutId()));

            // Créer la transition avec les bonnes références
            Transition transition = new Transition();
            transition.setName(dto.getName());
            transition.setConditionExpression(dto.getConditionExpression());

            // Établir les relations
            transition.setWorkflow(workflow);
            transition.setSourceStatut(sourceStatut);
            transition.setTargetStatut(targetStatut);

            // Sauvegarder la transition
            Transition savedTransition = transitionRepository.save(transition);
            createdTransitions.add(savedTransition);
        }

        return createdTransitions;
    }
    @Transactional
    public List<TransitionResponseDTO> addTransitionsToWorkflowDTO(Long workflowId, List<TransitionDTO> transitionDTOs) {
        // Utiliser votre méthode existante puis mapper
        List<Transition> transitions = addTransitionsToWorkflow(workflowId, transitionDTOs);
        return transitions.stream()
                .map(this::mapToResponseDTO)
                .toList();
    }

    private TransitionResponseDTO mapToResponseDTO(Transition transition) {
        TransitionResponseDTO.TransitionResponseDTOBuilder builder = TransitionResponseDTO.builder()
                .id(transition.getId())
                .name(transition.getName())
                .conditionExpression(transition.getConditionExpression());

        // Informations sur les statuts
        if (transition.getSourceStatut() != null) {
            builder.sourceStatutId(transition.getSourceStatut().getId())
                    .sourceStatutName(transition.getSourceStatut().getName());
        }

        if (transition.getTargetStatut() != null) {
            builder.targetStatutId(transition.getTargetStatut().getId())
                    .targetStatutName(transition.getTargetStatut().getName());
        }

        // Informations sur le workflow
        if (transition.getWorkflow() != null) {
            builder.workflowId(transition.getWorkflow().getId())
                    .workflowName(transition.getWorkflow().getName());
        }

        // Compteurs
        int conditionCount = (transition.getConditions() != null) ? transition.getConditions().size() : 0;
        int executionCount = (transition.getHistory() != null) ? transition.getHistory().size() : 0;

        builder.conditionCount(conditionCount)
                .executionCount(executionCount)
                .hasConditions(conditionCount > 0)
                .isExecutable(true); // Logique métier à définir

        return builder.build();
    }
}
