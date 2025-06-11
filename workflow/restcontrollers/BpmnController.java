package ma.xproce.workflow.restcontrollers;

import ma.xproce.workflow.dtos.WorkflowDTO;
import ma.xproce.workflow.entities.Workflow;
import ma.xproce.workflow.service.BpmnGeneratorService;
import ma.xproce.workflow.service.WorkflowService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/bpmn")
@CrossOrigin("*")
public class BpmnController {

    private static final Logger logger = LoggerFactory.getLogger(BpmnController.class);

    @Autowired
    private WorkflowService workflowService;

    @Autowired
    private BpmnGeneratorService bpmnGeneratorService;

    // ✅ MÉTHODE CORRIGÉE - Accepte DTO au lieu d'entité
    @PostMapping(value = "/generate",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_XML_VALUE)
    public ResponseEntity<String> generateBpmnFromDTO(@RequestBody WorkflowDTO workflowDTO) {
        try {
            logger.info("Génération BPMN demandée pour workflow: {}", workflowDTO.getName());

            // Créer le workflow à partir du DTO
            Workflow workflow = Workflow.builder()
                    .name(workflowDTO.getName())
                    .description(workflowDTO.getDescription())
                    .version(workflowDTO.getVersion())
                    .isActive(workflowDTO.isActive())
                    .createdBy(workflowDTO.getCreatedBy())
                    .build();

            // Sauvegarder temporairement pour avoir les relations
            Workflow savedWorkflow = workflowService.saveWorkflow(workflow);
            logger.debug("Workflow sauvegardé avec ID: {}", savedWorkflow.getId());

            // Générer le BPMN
            String bpmnXml = bpmnGeneratorService.generateBpmn(savedWorkflow);
            logger.info("BPMN généré avec succès pour workflow ID: {}", savedWorkflow.getId());

            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_XML)
                    .body(bpmnXml);

        } catch (Exception e) {
            logger.error("Erreur lors de la génération BPMN pour workflow: {}",
                    workflowDTO != null ? workflowDTO.getName() : "null", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .contentType(MediaType.TEXT_PLAIN)
                    .body("Erreur lors de la génération BPMN: " + e.getMessage());
        }
    }

    // ✅ MÉTHODE SIMPLIFIÉE - Générer BPMN depuis workflow existant
    @GetMapping(value = "/generate/{workflowId}", produces = MediaType.APPLICATION_XML_VALUE)
    public ResponseEntity<String> generateBpmnById(@PathVariable Long workflowId) {
        try {
            logger.info("Génération BPMN demandée pour workflow ID: {}", workflowId);

            Workflow workflow = workflowService.getWorkflowById(workflowId);
            if (workflow == null) {
                logger.warn("Workflow non trouvé avec ID: {}", workflowId);
                return ResponseEntity.notFound().build();
            }

            String bpmnXml = bpmnGeneratorService.generateBpmn(workflow);
            logger.info("BPMN généré avec succès pour workflow ID: {}", workflowId);

            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_XML)
                    .body(bpmnXml);

        } catch (Exception e) {
            logger.error("Erreur lors de la génération BPMN pour workflow ID: {}", workflowId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.TEXT_PLAIN)
                    .body("Erreur lors de la génération BPMN: " + e.getMessage());
        }
    }

    // ✅ NOUVEAU - Endpoint simple pour test
    @PostMapping(value = "/generate-simple",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_XML_VALUE)
    public ResponseEntity<String> generateSimpleBpmn(@RequestBody SimpleWorkflowRequest request) {
        try {
            logger.info("Génération BPMN simple demandée pour: {}", request.getName());

            // Créer un workflow minimal
            Workflow workflow = Workflow.builder()
                    .name(request.getName())
                    .description(request.getDescription())
                    .version("1.0")
                    .isActive(true)
                    .createdBy("BPMN_GENERATOR")
                    .build();

            String bpmnXml = bpmnGeneratorService.generateBpmn(workflow);
            logger.info("BPMN simple généré avec succès pour: {}", request.getName());

            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_XML)
                    .body(bpmnXml);

        } catch (Exception e) {
            logger.error("Erreur lors de la génération BPMN simple pour: {}",
                    request != null ? request.getName() : "null", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .contentType(MediaType.TEXT_PLAIN)
                    .body("Erreur: " + e.getMessage());
        }
    }

    // ✅ DTO SIMPLE POUR TEST
    public static class SimpleWorkflowRequest {
        private String name;
        private String description;

        // Getters et setters
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }
}