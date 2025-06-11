package ma.xproce.workflow.restcontrollers;

import ma.xproce.workflow.entities.Passerelle;
import ma.xproce.workflow.service.PasserelleService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/workflows/{workflowId}/passerelles")
@CrossOrigin("*")
public class PasserelleController {

    private static final Logger logger = LoggerFactory.getLogger(PasserelleController.class);

    @Autowired
    private PasserelleService passerelleService;

    /**
     * Créer une passerelle
     * POST /api/workflows/1/passerelles
     */
    @PostMapping
    public ResponseEntity<Passerelle> createPasserelle(
            @PathVariable Long workflowId,
            @RequestBody Map<String, Object> request) {

        try {
            String name = (String) request.get("name");
            String type = (String) request.get("gatewayType");
            Integer position = (Integer) request.get("position");

            logger.info("Création passerelle '{}' pour workflow {}", name, workflowId);

            Passerelle passerelle = passerelleService.createPasserelle(workflowId, name, type, position);

            return ResponseEntity.status(HttpStatus.CREATED).body(passerelle);

        } catch (Exception e) {
            logger.error("Erreur création passerelle pour workflow {}", workflowId, e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Récupérer les passerelles d'un workflow
     * GET /api/workflows/1/passerelles
     */
    @GetMapping
    public ResponseEntity<List<Passerelle>> getPasserelles(@PathVariable Long workflowId) {
        try {
            List<Passerelle> passerelles = passerelleService.getPasserellesByWorkflow(workflowId);
            return ResponseEntity.ok(passerelles);
        } catch (Exception e) {
            logger.error("Erreur récupération passerelles pour workflow {}", workflowId, e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Récupérer une passerelle spécifique
     * GET /api/workflows/1/passerelles/5
     */
    @GetMapping("/{passerelleId}")
    public ResponseEntity<Passerelle> getPasserelle(
            @PathVariable Long workflowId,
            @PathVariable Long passerelleId) {

        try {
            Passerelle passerelle = passerelleService.getPasserelleById(passerelleId);
            return ResponseEntity.ok(passerelle);
        } catch (Exception e) {
            logger.error("Erreur récupération passerelle {} du workflow {}", passerelleId, workflowId, e);
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Mettre à jour une passerelle
     * PUT /api/workflows/1/passerelles/5
     */
    @PutMapping("/{passerelleId}")
    public ResponseEntity<Passerelle> updatePasserelle(
            @PathVariable Long workflowId,
            @PathVariable Long passerelleId,
            @RequestBody Map<String, Object> request) {

        try {
            String name = (String) request.get("name");
            String type = (String) request.get("gatewayType");
            Integer position = (Integer) request.get("position");

            logger.info("Mise à jour passerelle {} du workflow {}", passerelleId, workflowId);

            Passerelle passerelle = passerelleService.updatePasserelle(passerelleId, name, type, position);

            return ResponseEntity.ok(passerelle);

        } catch (Exception e) {
            logger.error("Erreur mise à jour passerelle {} du workflow {}", passerelleId, workflowId, e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Supprimer une passerelle
     * DELETE /api/workflows/1/passerelles/5
     */
    @DeleteMapping("/{passerelleId}")
    public ResponseEntity<Void> deletePasserelle(
            @PathVariable Long workflowId,
            @PathVariable Long passerelleId) {

        try {
            logger.info("Suppression passerelle {} du workflow {}", passerelleId, workflowId);

            passerelleService.deletePasserelle(passerelleId);

            return ResponseEntity.noContent().build();

        } catch (Exception e) {
            logger.error("Erreur suppression passerelle {} du workflow {}", passerelleId, workflowId, e);
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Supprimer toutes les passerelles d'un workflow
     * DELETE /api/workflows/1/passerelles
     */
    @DeleteMapping
    public ResponseEntity<Void> deleteAllPasserelles(@PathVariable Long workflowId) {
        try {
            logger.info("Suppression de toutes les passerelles du workflow {}", workflowId);

            passerelleService.deletePasserellesByWorkflow(workflowId);

            return ResponseEntity.noContent().build();

        } catch (Exception e) {
            logger.error("Erreur suppression passerelles du workflow {}", workflowId, e);
            return ResponseEntity.badRequest().build();
        }
    }
}
