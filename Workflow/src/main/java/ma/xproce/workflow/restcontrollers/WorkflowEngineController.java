package ma.xproce.workflow.restcontrollers;

import ma.xproce.workflow.dtos.InstanceResponseDTO;
import ma.xproce.workflow.dtos.TransitionResponseDTO;
import ma.xproce.workflow.entities.Instance;
import ma.xproce.workflow.entities.Transition;
import ma.xproce.workflow.service.InstanceService;
import ma.xproce.workflow.service.WorkflowEngineService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/workflow-engine")
@CrossOrigin("*")
public class WorkflowEngineController {

    private static final Logger logger = LoggerFactory.getLogger(WorkflowEngineController.class);

    @Autowired
    private WorkflowEngineService workflowEngineService;

    @Autowired
    private InstanceService instanceService;

    @GetMapping
    public List<InstanceResponseDTO> getAllInstances() {
        logger.info("Récupération de toutes les instances via WorkflowEngine");
        // Utiliser InstanceService qui retourne déjà des DTOs
        return instanceService.getAllInstancesDTO();
    }

    // ✅ CORRIGÉ - DTO au lieu d'entité
    @GetMapping("/{id}")
    public ResponseEntity<InstanceResponseDTO> getInstanceById(@PathVariable Long id) {
        logger.info("Récupération de l'instance {} via WorkflowEngine", id);
        InstanceResponseDTO instance = instanceService.getInstanceDTOById(id);
        return instance != null ? ResponseEntity.ok(instance) : ResponseEntity.notFound().build();
    }

    // ✅ CORRIGÉ - Retourner DTO
    @PostMapping("/start")
    public ResponseEntity<InstanceResponseDTO> startWorkflow(@RequestBody Map<String, Object> request) {
        try {
            Long workflowId = Long.valueOf(request.get("workflowId").toString());
            String businessKey = (String) request.get("businessKey");
            String createdBy = (String) request.get("createdBy");

            logger.info("Démarrage workflow {} avec businessKey: {}", workflowId, businessKey);

            // Utiliser le service original puis convertir
            Instance instance = workflowEngineService.startWorkflow(workflowId, businessKey, createdBy);

            if (instance != null) {
                // Convertir en DTO
                InstanceResponseDTO dto = mapInstanceToDTO(instance);
                return ResponseEntity.ok(dto);
            } else {
                return ResponseEntity.badRequest().build();
            }
        } catch (Exception e) {
            logger.error("Erreur lors du démarrage du workflow", e);
            return ResponseEntity.badRequest().build();
        }
    }
    @GetMapping("/{id}/transitions")
    public List<TransitionResponseDTO> getAvailableTransitions(@PathVariable Long id) {
        logger.info("Récupération des transitions disponibles pour instance {}", id);

        List<Transition> transitions = workflowEngineService.getAvailableTransitions(id);

        // Convertir en DTOs
        return transitions.stream()
                .map(this::mapTransitionToDTO)
                .toList();
    }

    @PostMapping("/{id}/transition")
    public ResponseEntity<InstanceResponseDTO> performTransition(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request) {

        try {
            Long transitionId = Long.valueOf(request.get("transitionId").toString());
            String executedBy = (String) request.get("executedBy");

            logger.info("Exécution transition {} pour instance {}", transitionId, id);

            Instance instance = workflowEngineService.performTransition(id, transitionId, executedBy);

            if (instance != null) {
                // Convertir en DTO
                InstanceResponseDTO dto = mapInstanceToDTO(instance);
                return ResponseEntity.ok(dto);
            } else {
                return ResponseEntity.badRequest().build();
            }
        } catch (Exception e) {
            logger.error("Erreur lors de l'exécution de la transition", e);
            return ResponseEntity.badRequest().build();
        }
    }
    @PostMapping("/execute-full")
    public ResponseEntity<InstanceResponseDTO> executeFullWorkflow(
            @RequestParam Long workflowId,
            @RequestParam String businessKey,
            @RequestParam String createdBy) {

        try {
            logger.info("🚀 Exécution automatique complète du workflow {} avec businessKey: {}", workflowId, businessKey);

            // ✅ Appel de votre méthode simple et efficace
            Instance instance = workflowEngineService.executeFullWorkflow(workflowId, businessKey, createdBy);

            if (instance == null) {
                logger.warn("❌ Échec de l'exécution automatique du workflow {}", workflowId);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }

            // Convertir en DTO pour le retour
            InstanceResponseDTO dto = mapInstanceToDTO(instance);

            logger.info("✅ Workflow {} exécuté avec succès - Statut final: {}",
                    workflowId, dto.getCurrentStatutName());

            return ResponseEntity.ok(dto);

        } catch (Exception e) {
            logger.error("❌ Erreur lors de l'exécution automatique du workflow {}: {}", workflowId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ✅ MAPPERS PRIVÉS POUR CONVERSION
    private InstanceResponseDTO mapInstanceToDTO(Instance instance) {
        return InstanceResponseDTO.builder()
                .id(instance.getId())
                .businessKey(instance.getBusinessKey())
                .status(instance.getStatus())
                .createdBy(instance.getCreatedBy())
                .startDate(instance.getStartDate())
                .endDate(instance.getEndDate())
                .workflowId(instance.getWorkflow() != null ? instance.getWorkflow().getId() : null)
                .workflowName(instance.getWorkflow() != null ? instance.getWorkflow().getName() : null)
                .currentStatutId(instance.getCurrentStatut() != null ? instance.getCurrentStatut().getId() : null)
                .currentStatutName(instance.getCurrentStatut() != null ? instance.getCurrentStatut().getName() : null)
                .build();
    }

    private TransitionResponseDTO mapTransitionToDTO(Transition transition) {
        return TransitionResponseDTO.builder()
                .id(transition.getId())
                .name(transition.getName())
                .conditionExpression(transition.getConditionExpression())
                .sourceStatutId(transition.getSourceStatut() != null ? transition.getSourceStatut().getId() : null)
                .sourceStatutName(transition.getSourceStatut() != null ? transition.getSourceStatut().getName() : null)
                .targetStatutId(transition.getTargetStatut() != null ? transition.getTargetStatut().getId() : null)
                .targetStatutName(transition.getTargetStatut() != null ? transition.getTargetStatut().getName() : null)
                .workflowId(transition.getWorkflow() != null ? transition.getWorkflow().getId() : null)
                .workflowName(transition.getWorkflow() != null ? transition.getWorkflow().getName() : null)
                .conditionCount(transition.getConditions() != null ? transition.getConditions().size() : 0)
                .executionCount(0) // Pas d'accès direct à l'historique
                .hasConditions(transition.getConditions() != null && !transition.getConditions().isEmpty())
                .isExecutable(true)
                .build();
    }
}