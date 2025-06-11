package ma.xproce.workflow.service;

import ma.xproce.workflow.dtos.InstanceDTO;
import ma.xproce.workflow.dtos.InstanceResponseDTO;
import ma.xproce.workflow.entities.*;
import ma.xproce.workflow.repositories.InstanceRepository;
import ma.xproce.workflow.repositories.WorkflowRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class InstanceService {

    @Autowired
    private InstanceRepository instanceRepository;

    @Autowired
    private WorkflowRepository workflowRepository;

    @Transactional
    public InstanceResponseDTO createInstanceAndReturnDTO(InstanceDTO createDTO) {
        Workflow workflow = workflowRepository.findById(createDTO.getWorkflowId())
                .orElseThrow(() -> new RuntimeException("Workflow introuvable avec l'ID : " + createDTO.getWorkflowId()));

        Statut initialStatut = workflow.getStatuts().stream()
                .filter(statut -> "INITIAL".equals(statut.getStatutType()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Aucun statut initial trouvé pour le workflow"));

        String businessKey = (createDTO.getBusinessKey() != null && !createDTO.getBusinessKey().trim().isEmpty())
                ? createDTO.getBusinessKey()
                : "WF_" + createDTO.getWorkflowId() + "_" + System.currentTimeMillis();

        Instance instance = Instance.builder()
                .workflow(workflow)
                .businessKey(businessKey)
                .currentStatut(initialStatut)
                .startDate(LocalDateTime.now())
                .status("IN_PROGRESS")
                .createdBy(createDTO.getCreatedBy())
                .transitionHistory(new ArrayList<>())
                .variables(new ArrayList<>())
                .build();

        Instance savedInstance = instanceRepository.save(instance);
        return mapToDTO(savedInstance);
    }
    @Transactional
    public Instance saveInstance(Instance instance) {
        return instanceRepository.save(instance);
    }
    public Instance getInstanceById(Long instanceId) {
        return instanceRepository.findById(instanceId)
                .orElseThrow(() -> new RuntimeException("Instance introuvable avec l'ID : " + instanceId));
    }

    public List<Instance> getAllInstances() {
        return instanceRepository.findAll();
    }

    private InstanceResponseDTO mapToDTO(Instance instance) {
        return InstanceResponseDTO.builder()
                .id(instance.getId())
                .businessKey(instance.getBusinessKey())
                .status(instance.getStatus())
                .createdBy(instance.getCreatedBy())
                .startDate(instance.getStartDate())
                .endDate(instance.getEndDate())
                .workflowId(instance.getWorkflow().getId())
                .workflowName(instance.getWorkflow().getName())
                .currentStatutId(instance.getCurrentStatut().getId())
                .currentStatutName(instance.getCurrentStatut().getName())
                .build();
    }
    public List<InstanceResponseDTO> getAllInstancesDTO() {
        List<Instance> instances = instanceRepository.findAll();
        List<InstanceResponseDTO> dtoList = new ArrayList<>();

        for (Instance instance : instances) {
            dtoList.add(mapToDTO(instance));
        }

        return dtoList;
    }
    @Transactional
    public InstanceResponseDTO advanceInstance(Long instanceId, String performedBy) {
        Instance instance = getInstanceById(instanceId);
        System.out.println("Nombre de transitions: " + instance.getWorkflow().getTransitions().size());
        Workflow workflow = workflowRepository.findById(instance.getWorkflow().getId())
                .orElseThrow(() -> new RuntimeException("Workflow introuvable"));

        Statut current = instance.getCurrentStatut();
        Transition transition1 = workflow.getTransitions().stream()
                .filter(t -> t.getSourceStatut().getId().equals(current.getId()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Aucune transition disponible depuis le statut actuel"));

        // Chercher la première transition valide (tu peux affiner avec conditions, priorités, etc.)
        Transition transition = instance.getWorkflow().getTransitions().stream()
                .filter(t -> t.getSourceStatut().getId().equals(current.getId()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Aucune transition disponible depuis le statut actuel"));

        // Appliquer la transition
        instance.setCurrentStatut(transition.getTargetStatut());

        // Historiser
        TransitionHistory history = TransitionHistory.builder()
                .instance(instance)
                .transition(transition)
                .executionDate(LocalDateTime.now())
                .executedBy(performedBy)
                .build();

        instance.getTransitionHistory().add(history);

        // Si on est arrivé à un statut final, marquer terminé
        if ("FINAL".equals(transition.getTargetStatut().getStatutType())) {
            instance.setStatus("COMPLETED");
            instance.setEndDate(LocalDateTime.now());
        }

        return mapToDTO(instanceRepository.save(instance));
    }
    public InstanceResponseDTO getInstanceDTOById(Long id) {
        Instance instance = instanceRepository.findById(id).orElse(null);
        return instance != null ? mapToDTO(instance) : null;
    }

}
