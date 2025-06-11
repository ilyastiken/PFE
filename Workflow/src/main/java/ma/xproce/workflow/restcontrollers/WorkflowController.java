package ma.xproce.workflow.restcontrollers;

import ma.xproce.workflow.dtos.WorkflowDTO;
import ma.xproce.workflow.dtos.WorkflowResponseDTO;
import ma.xproce.workflow.service.WorkflowService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/workflows")
@CrossOrigin("*")
public class WorkflowController {

    @Autowired
    private WorkflowService workflowService;

    @GetMapping
    public ResponseEntity<List<WorkflowResponseDTO>> getAllWorkflows() {
        List<WorkflowResponseDTO> workflows = workflowService.getAllWorkflowsDTO();
        return ResponseEntity.ok(workflows);
    }

    // ✅ PLACER /active AVANT /{id} pour éviter le conflit
    @GetMapping("/active")
    public ResponseEntity<List<WorkflowResponseDTO>> getActiveWorkflows() {
        List<WorkflowResponseDTO> activeWorkflows = workflowService.getActiveWorkflowsDTO();
        return ResponseEntity.ok(activeWorkflows);
    }

    // ✅ PLACER /{id}/details AVANT /{id} pour éviter le conflit
    @GetMapping("/{id}/details")
    public ResponseEntity<WorkflowResponseDTO> getWorkflowWithFullDetails(@PathVariable Long id) {
        WorkflowResponseDTO workflow = workflowService.getWorkflowWithFullDetails(id);
        return workflow != null ? ResponseEntity.ok(workflow) : ResponseEntity.notFound().build();
    }

    // ✅ /{id} DOIT ÊTRE EN DERNIER pour éviter les conflits
    @GetMapping("/{id}")
    public ResponseEntity<WorkflowResponseDTO> getWorkflowById(@PathVariable Long id) {
        WorkflowResponseDTO workflow = workflowService.getWorkflowDTOById(id);
        return workflow != null ? ResponseEntity.ok(workflow) : ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<WorkflowResponseDTO> createWorkflow(@RequestBody WorkflowDTO workflowDTO) {
        try {
            WorkflowResponseDTO created = workflowService.createWorkflowFromDTO(workflowDTO);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<WorkflowResponseDTO> updateWorkflow(
            @PathVariable Long id,
            @RequestBody WorkflowDTO workflowDTO) {
        try {
            WorkflowResponseDTO updated = workflowService.updateWorkflowFromDTO(id, workflowDTO);
            return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWorkflow(@PathVariable Long id) {
        try {
            boolean deleted = workflowService.deleteWorkflow(id);
            return deleted ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}