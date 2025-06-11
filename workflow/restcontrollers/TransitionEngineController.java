package ma.xproce.workflow.restcontrollers;

import ma.xproce.workflow.dtos.InstanceResponseDTO;
import ma.xproce.workflow.dtos.TransitionResponseDTO;
import ma.xproce.workflow.entities.Instance;
import ma.xproce.workflow.entities.Transition;
import ma.xproce.workflow.service.InstanceService;
import ma.xproce.workflow.service.TransitionEngineService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/instances/{instanceId}/transitions")
@CrossOrigin("*")
public class TransitionEngineController {

    private static final Logger logger = LoggerFactory.getLogger(TransitionEngineController.class);

    @Autowired
    private TransitionEngineService transitionEngineService;

    @Autowired
    private InstanceService instanceService;

    // ✅ CORRIGÉ - Retourne DTO au lieu d'entité
    @PostMapping("/{transitionId}/execute")
    public ResponseEntity<InstanceResponseDTO> executeTransition(
            @PathVariable Long instanceId,
            @PathVariable Long transitionId,
            @RequestBody String executedBy) {

        try {
            logger.info("Exécution transition {} pour instance {}", transitionId, instanceId);

            Instance instance = transitionEngineService.executeTransition(instanceId, transitionId, executedBy);

            if (instance != null) {
                // ✅ CONVERSION EN DTO
                InstanceResponseDTO dto = mapInstanceToDTO(instance);
                logger.info("Transition exécutée avec succès - Instance {} au statut {}",
                        instanceId, dto.getCurrentStatutName());
                return ResponseEntity.ok(dto);
            } else {
                return ResponseEntity.badRequest().build();
            }
        } catch (Exception e) {
            logger.error("Erreur lors de l'exécution de la transition {} pour instance {}",
                    transitionId, instanceId, e);
            return ResponseEntity.badRequest().build();
        }
    }

    // ✅ CORRIGÉ - Retourne DTOs au lieu d'entités
    @GetMapping("/available")
    public ResponseEntity<List<TransitionResponseDTO>> getAvailableTransitions(@PathVariable Long instanceId) {
        try {
            logger.info("Récupération des transitions disponibles pour instance {}", instanceId);

            List<Transition> transitions = transitionEngineService.getAvailableTransitions(instanceId);

            // ✅ CONVERSION EN DTOs
            List<TransitionResponseDTO> transitionDTOs = transitions.stream()
                    .map(this::mapTransitionToDTO)
                    .toList();

            return ResponseEntity.ok(transitionDTOs);
        } catch (Exception e) {
            logger.error("Erreur lors de la récupération des transitions pour instance {}", instanceId, e);
            return ResponseEntity.badRequest().build();
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
                .executionCount(0)
                .hasConditions(transition.getConditions() != null && !transition.getConditions().isEmpty())
                .isExecutable(true)
                .build();
    }
}