package ma.xproce.workflow.restcontrollers;
import ma.xproce.workflow.service.MonitoringService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/monitoring")
@CrossOrigin("*")
public class MonitoringController {

    private static final Logger logger = LoggerFactory.getLogger(MonitoringController.class);

    @Autowired
    private MonitoringService monitoringService;

    /**
     * ✅ DASHBOARD GLOBAL
     * GET /api/monitoring/dashboard
     */
    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getGlobalDashboard() {
        try {
            logger.info("📊 Récupération dashboard global");
            Map<String, Object> dashboard = monitoringService.getGlobalDashboard();
            return ResponseEntity.ok(dashboard);
        } catch (Exception e) {
            logger.error("❌ Erreur dashboard global", e);
            return ResponseEntity.ok(Map.of("success", false, "error", e.getMessage()));
        }
    }

    /**
     * ✅ MONITORING WORKFLOW SPÉCIFIQUE
     * GET /api/monitoring/workflow/{workflowId}
     */
    @GetMapping("/workflow/{workflowId}")
    public ResponseEntity<Map<String, Object>> getWorkflowMonitoring(@PathVariable Long workflowId) {
        try {
            logger.info("🔍 Monitoring workflow {}", workflowId);
            Map<String, Object> monitoring = monitoringService.getWorkflowMonitoring(workflowId);
            return ResponseEntity.ok(monitoring);
        } catch (Exception e) {
            logger.error("❌ Erreur monitoring workflow {}", workflowId, e);
            return ResponseEntity.ok(Map.of("success", false, "error", e.getMessage()));
        }
    }

    /**
     * ✅ DÉTAILS INSTANCE SPÉCIFIQUE
     * GET /api/monitoring/instance/{instanceId}
     */
    @GetMapping("/instance/{instanceId}")
    public ResponseEntity<Map<String, Object>> getInstanceDetails(@PathVariable Long instanceId) {
        try {
            logger.info("🔍 Détails instance {}", instanceId);
            Map<String, Object> details = monitoringService.getInstanceDetails(instanceId);
            return ResponseEntity.ok(details);
        } catch (Exception e) {
            logger.error("❌ Erreur détails instance {}", instanceId, e);
            return ResponseEntity.ok(Map.of("success", false, "error", e.getMessage()));
        }
    }

    /**
     * ✅ TEST MONITORING
     * GET /api/monitoring/test
     */
    @GetMapping("/test")
    public ResponseEntity<Map<String, Object>> test() {
        return ResponseEntity.ok(Map.of(
                "status", "OK",
                "message", "✅ MonitoringController opérationnel !",
                "timestamp", System.currentTimeMillis(),
                "endpoints", Map.of(
                        "dashboard", "GET /api/monitoring/dashboard",
                        "workflow", "GET /api/monitoring/workflow/{id}",
                        "instance", "GET /api/monitoring/instance/{id}"
                )
        ));
    }
}
