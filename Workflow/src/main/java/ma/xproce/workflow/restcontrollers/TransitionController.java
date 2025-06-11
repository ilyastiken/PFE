package ma.xproce.workflow.restcontrollers;

import ma.xproce.workflow.dtos.ConditionDTO;
import ma.xproce.workflow.dtos.ConditionResponseDTO;
import ma.xproce.workflow.dtos.TransitionDTO;
import ma.xproce.workflow.dtos.TransitionResponseDTO;
import ma.xproce.workflow.service.ConditionService;
import ma.xproce.workflow.service.TransitionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/workflows/{workflowId}/transitions")
@CrossOrigin("*")
public class TransitionController {

    @Autowired
    private TransitionService transitionService;

    @Autowired
    private ConditionService conditionService;

    // ✅ RETOURNE DES DTOs UNIQUEMENT
    @PostMapping
    public ResponseEntity<List<TransitionResponseDTO>> addTransitions(
            @PathVariable Long workflowId,
            @RequestBody List<TransitionDTO> transitionDTOs) {
        try {
            List<TransitionResponseDTO> responses = transitionService.addTransitionsToWorkflowDTO(workflowId, transitionDTOs);
            return ResponseEntity.status(HttpStatus.CREATED).body(responses);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    @PostMapping("/{transitionId}/conditions")
    public ResponseEntity<List<ConditionResponseDTO>> addConditionsToTransition(
            @PathVariable Long transitionId,
            @RequestBody List<ConditionDTO> conditionDTOs) {
        try {
            List<ConditionResponseDTO> responses = conditionService.addConditionsToTransitionDTO(transitionId, conditionDTOs);
            return ResponseEntity.status(HttpStatus.CREATED).body(responses);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    @GetMapping
    public ResponseEntity<String> getTransitions(@PathVariable Long workflowId) {
        return ResponseEntity.ok("Transitions pour workflow " + workflowId + " - Endpoint actif !");
    }

    @GetMapping("/{transitionId}")
    public ResponseEntity<String> getTransitionById(
            @PathVariable Long workflowId,
            @PathVariable Long transitionId) {
        return ResponseEntity.ok("Transition " + transitionId + " du workflow " + workflowId + " - Endpoint actif !");
    }

}