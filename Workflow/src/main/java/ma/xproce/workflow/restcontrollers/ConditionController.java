package ma.xproce.workflow.restcontrollers;

import ma.xproce.workflow.dtos.ConditionDTO;
import ma.xproce.workflow.entities.Condition;
import ma.xproce.workflow.service.ConditionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/conditions")
@CrossOrigin("*")
public class ConditionController {

    private static final Logger logger = LoggerFactory.getLogger(ConditionController.class);

    @Autowired
    private ConditionService conditionService;


    @PostMapping
    public ResponseEntity<Map<String, Object>> createCondition(@RequestBody ConditionDTO conditionDTO) {
        try {
            logger.info("Création condition: {}", conditionDTO.getName());

            // Utiliser votre service existant
            List<ConditionDTO> conditionList = List.of(conditionDTO);
            List<Condition> createdConditions = conditionService.addConditions(conditionList);

            if (!createdConditions.isEmpty()) {
                Condition created = createdConditions.get(0);

                // Réponse simple en Map
                Map<String, Object> response = new HashMap<>();
                response.put("id", created.getId());
                response.put("name", created.getName());
                response.put("expression", created.getExpression());
                response.put("success", true);
                response.put("message", "Condition créée avec succès");

                return ResponseEntity.status(HttpStatus.CREATED).body(response);
            } else {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Échec de la création");
                return ResponseEntity.badRequest().body(errorResponse);
            }

        } catch (Exception e) {
            logger.error("Erreur création condition", e);

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Erreur: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }

    /**
     * ✅ TEST ENDPOINT - TRÈS IMPORTANT
     */
    @GetMapping("/test")
    public ResponseEntity<Map<String, Object>> test() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "OK");
        response.put("message", "✅ ConditionController fonctionne parfaitement !");
        response.put("timestamp", System.currentTimeMillis());
        return ResponseEntity.ok(response);
    }

    /**
     * ✅ LISTE DES CONDITIONS (optionnel)
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllConditions() {
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Endpoint /api/conditions disponible et fonctionnel");
        response.put("methods", List.of("GET", "POST"));
        return ResponseEntity.ok(response);
    }
}
