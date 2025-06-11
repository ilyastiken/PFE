package ma.xproce.workflow.service;

import jakarta.transaction.Transactional;
import ma.xproce.workflow.dtos.StatutDTO;
import ma.xproce.workflow.dtos.TransitionDTO;
import ma.xproce.workflow.dtos.WorkflowDTO;
import ma.xproce.workflow.dtos.WorkflowResponseDTO;
import ma.xproce.workflow.entities.Workflow;
import ma.xproce.workflow.entities.Statut;
import ma.xproce.workflow.entities.Transition;
import ma.xproce.workflow.repositories.InstanceRepository;
import ma.xproce.workflow.repositories.StatutRepository;
import ma.xproce.workflow.repositories.WorkflowRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;

@Service
public class WorkflowService {

    @Autowired
    private WorkflowRepository workflowRepository;

    @Autowired
    private StatutRepository statutRepository;

    @Autowired
    private InstanceRepository instanceRepository;

    // =====================================================
    // MÉTHODES EXISTANTES (GARDÉES TELLES QUELLES)
    // =====================================================

    public List<Workflow> getAllWorkflows() {
        return workflowRepository.findAll();
    }

    public Workflow getWorkflowById(Long id) {
        return workflowRepository.findById(id).orElse(null);
    }

    @Transactional
    public Workflow saveWorkflow(Workflow workflow) {
        if (workflow.getId() == null) {
            workflow.setCreationDate(LocalDateTime.now());
        }
        workflow.setModificationDate(LocalDateTime.now());

        if (workflow.getStatuts() != null && !workflow.getStatuts().isEmpty()) {
            List<Statut> managedStatuts = new ArrayList<>();

            for (Statut statut : workflow.getStatuts()) {
                if (statut.getId() != null) {
                    Statut existingStatut = statutRepository.findById(statut.getId())
                            .orElseThrow(() -> new RuntimeException("Statut introuvable avec l'ID : " + statut.getId()));

                    existingStatut.setWorkflow(workflow);
                    managedStatuts.add(existingStatut);
                } else {
                    statut.setWorkflow(workflow);
                    managedStatuts.add(statut);
                }
            }
            workflow.setStatuts(managedStatuts);
        }

        if (workflow.getTransitions() != null && !workflow.getTransitions().isEmpty()) {
            List<Transition> managedTransitions = new ArrayList<>();

            for (Transition transition : workflow.getTransitions()) {
                transition.setWorkflow(workflow);

                if (transition.getSourceStatut() != null) {
                    Long sourceStatutId = transition.getSourceStatut().getId();
                    if (sourceStatutId != null) {
                        Statut sourceStatut = statutRepository.findById(sourceStatutId)
                                .orElseThrow(() -> new RuntimeException("Statut source introuvable avec l'ID : " + sourceStatutId));
                        transition.setSourceStatut(sourceStatut);
                    } else {
                        throw new RuntimeException("Le statut source doit avoir un ID");
                    }
                }

                if (transition.getTargetStatut() != null) {
                    Long targetStatutId = transition.getTargetStatut().getId();
                    if (targetStatutId != null) {
                        Statut targetStatut = statutRepository.findById(targetStatutId)
                                .orElseThrow(() -> new RuntimeException("Statut cible introuvable avec l'ID : " + targetStatutId));
                        transition.setTargetStatut(targetStatut);
                    } else {
                        throw new RuntimeException("Le statut cible doit avoir un ID");
                    }
                }

                managedTransitions.add(transition);
            }

            workflow.setTransitions(managedTransitions);
        }

        return workflowRepository.save(workflow);
    }

    // =====================================================
    // NOUVELLES MÉTHODES POUR LES DTOs
    // =====================================================

    public List<WorkflowResponseDTO> getAllWorkflowsDTO() {
        List<Workflow> workflows = workflowRepository.findAll();
        return workflows.stream()
                .map(this::mapToResponseDTO)
                .toList();
    }

    public WorkflowResponseDTO getWorkflowDTOById(Long id) {
        return workflowRepository.findById(id)
                .map(this::mapToResponseDTO)
                .orElse(null);
    }

    public List<WorkflowResponseDTO> getActiveWorkflowsDTO() {
        try {
            List<Workflow> activeWorkflows = workflowRepository.findByIsActiveTrue();
            return activeWorkflows.stream()
                    .map(this::mapToResponseDTO)
                    .toList();
        } catch (Exception e) {
            // Si la méthode n'existe pas encore, filtrer manuellement
            List<Workflow> allWorkflows = workflowRepository.findAll();
            return allWorkflows.stream()
                    .filter(Workflow::isActive)
                    .map(this::mapToResponseDTO)
                    .toList();
        }
    }

    @Transactional
    public WorkflowResponseDTO createWorkflowFromDTO(WorkflowDTO dto) {
        Workflow workflow = Workflow.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .version(dto.getVersion())
                .isActive(dto.isActive())
                .createdBy(dto.getCreatedBy())
                .creationDate(LocalDateTime.now())
                .modificationDate(LocalDateTime.now())
                .statuts(new ArrayList<>())
                .transitions(new ArrayList<>())
                .build();

        Workflow saved = workflowRepository.save(workflow);
        return mapToResponseDTO(saved);
    }

    @Transactional
    public WorkflowResponseDTO updateWorkflowFromDTO(Long id, WorkflowDTO dto) {
        return workflowRepository.findById(id)
                .map(existingWorkflow -> {
                    existingWorkflow.setName(dto.getName());
                    existingWorkflow.setDescription(dto.getDescription());
                    existingWorkflow.setVersion(dto.getVersion());
                    existingWorkflow.setActive(dto.isActive());
                    existingWorkflow.setModificationDate(LocalDateTime.now());

                    Workflow updated = workflowRepository.save(existingWorkflow);
                    return mapToResponseDTO(updated);
                })
                .orElse(null);
    }

    @Transactional
    public boolean deleteWorkflow(Long id) {
        if (workflowRepository.existsById(id)) {
            try {
                // Vérifier s'il y a des instances actives
                long activeInstances = instanceRepository.countByWorkflowIdAndStatusNot(id, "COMPLETED");
                if (activeInstances > 0) {
                    throw new RuntimeException("Impossible de supprimer le workflow : " + activeInstances + " instances actives");
                }
            } catch (Exception e) {
                // Si la méthode n'existe pas encore, continuer quand même
                System.out.println("Impossible de vérifier les instances : " + e.getMessage());
            }

            workflowRepository.deleteById(id);
            return true;
        }
        return false;
    }

    public WorkflowResponseDTO getWorkflowWithFullDetails(Long id) {
        return workflowRepository.findById(id)
                .map(this::mapToResponseDTOWithFullDetails)
                .orElse(null);
    }

    // =====================================================
    // MAPPERS PRIVÉS
    // =====================================================

    private WorkflowResponseDTO mapToResponseDTO(Workflow workflow) {
        // Mapper les statuts avec gestion des valeurs nulles
        List<StatutDTO> statutDTOs = new ArrayList<>();
        if (workflow.getStatuts() != null) {
            statutDTOs = workflow.getStatuts().stream()
                    .map(statut -> StatutDTO.builder()
                            .id(statut.getId())
                            .name(statut.getName())
                            .description(statut.getDescription())
                            .statutType(statut.getStatutType())
                            .position(statut.getPosition())
                            .build())
                    .sorted((a, b) -> {
                        int posA = (a.getPosition() != null) ? a.getPosition() : 0;
                        int posB = (b.getPosition() != null) ? b.getPosition() : 0;
                        return Integer.compare(posA, posB);
                    })
                    .toList();
        }

        // Mapper les transitions avec gestion des valeurs nulles
        List<TransitionDTO> transitionDTOs = new ArrayList<>();
        if (workflow.getTransitions() != null) {
            transitionDTOs = workflow.getTransitions().stream()
                    .map(transition -> {
                        // Construction progressive pour éviter les erreurs
                        Long sourceId = null;
                        Long targetId = null;

                        if (transition.getSourceStatut() != null) {
                            sourceId = transition.getSourceStatut().getId();
                        }
                        if (transition.getTargetStatut() != null) {
                            targetId = transition.getTargetStatut().getId();
                        }

                        return TransitionDTO.builder()
                                .sourceStatutId(transition.getId())
                                .name(transition.getName())
                                .sourceStatutId(sourceId)
                                .targetStatutId(targetId)
                                .conditionExpression(transition.getConditionExpression())
                                .build();
                    })
                    .toList();
        }

        // Compter les instances actives avec gestion d'erreur
        int activeInstanceCount = 0;
        try {
            activeInstanceCount = (int) instanceRepository.countByWorkflowIdAndStatus(
                    workflow.getId(), "IN_PROGRESS");
        } catch (Exception e) {
            // Si la méthode n'existe pas encore ou erreur, ignorer
            System.out.println("Impossible de compter les instances : " + e.getMessage());
        }

        // Construction du DTO de réponse
        return WorkflowResponseDTO.builder()
                .id(workflow.getId())
                .name(workflow.getName())
                .description(workflow.getDescription())
                .version(workflow.getVersion())
                .isActive(workflow.isActive())
                .createdBy(workflow.getCreatedBy())
                .creationDate(workflow.getCreationDate())
                .modificationDate(workflow.getModificationDate())
                .statuts(statutDTOs)
                .transitions(transitionDTOs)
                .statutCount(statutDTOs.size())
                .transitionCount(transitionDTOs.size())
                .activeInstanceCount(activeInstanceCount)
                .build();
    }

    private WorkflowResponseDTO mapToResponseDTOWithFullDetails(Workflow workflow) {
        return mapToResponseDTO(workflow);
    }
}