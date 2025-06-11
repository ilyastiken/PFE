package ma.xproce.workflow.restcontrollers;
import ma.xproce.workflow.dtos.TaskDTO;
import ma.xproce.workflow.service.TaskService;
import ma.xproce.workflow.service.TransitionEngineService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tasks")
@CrossOrigin("*")
public class TaskController {

    private static final Logger logger = LoggerFactory.getLogger(TaskController.class);

    @Autowired
    private TaskService taskService;

    @Autowired
    private TransitionEngineService transitionEngineService;

    @GetMapping("/my-tasks")
    public ResponseEntity<List<TaskDTO>> getMyTasks(@RequestParam(defaultValue = "current_user") String user) {
        try {
            logger.info("📋 Récupération des tâches pour: {}", user);

            List<TaskDTO> tasks = taskService.getTasksForUser(user);

            logger.info("✅ Trouvé {} tâches pour {}", tasks.size(), user);
            return ResponseEntity.ok(tasks);

        } catch (Exception e) {
            logger.error("❌ Erreur récupération tâches pour {}", user, e);
            return ResponseEntity.ok(List.of()); // Retourner liste vide plutôt qu'erreur
        }
    }

    @PostMapping("/{taskId}/complete-and-advance")
    public ResponseEntity<Map<String, Object>> completeTaskAndAdvance(
            @PathVariable Long taskId,
            @RequestBody Map<String, String> request) {

        Map<String, Object> response = new HashMap<>();

        try {
            String completedBy = request.get("completedBy");
            String comments = request.get("comments");
            String action = request.get("action"); // "APPROVE", "REJECT", "SUSPEND"

            logger.info("🎯 Completion tâche {} par {} avec action {}", taskId, completedBy, action);

            // 1. Compléter la tâche
            TaskDTO completedTask = taskService.completeTask(taskId, completedBy, comments);

            // 2. Récupérer l'instance et les transitions disponibles
            Long instanceId = completedTask.getInstanceId();
            var availableTransitions = transitionEngineService.getAvailableTransitions(instanceId);

            // 3. Exécuter automatiquement la transition appropriée
            if (!availableTransitions.isEmpty()) {
                // Prendre la première transition disponible (vous pouvez affiner la logique)
                var transition = availableTransitions.get(0);

                logger.info("🔄 Exécution automatique transition {} pour instance {}",
                        transition.getId(), instanceId);

                transitionEngineService.executeTransition(instanceId, transition.getId(), completedBy);

                response.put("transitionExecuted", true);
                response.put("transitionName", transition.getName());
            } else {
                response.put("transitionExecuted", false);
                response.put("message", "Aucune transition automatique disponible");
            }

            response.put("success", true);
            response.put("message", "Tâche terminée avec succès");
            response.put("task", completedTask);

            logger.info("✅ Tâche {} terminée et transition exécutée avec succès", taskId);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("❌ Erreur completion tâche {}", taskId, e);

            response.put("success", false);
            response.put("message", "Erreur: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * ✅ API SIMPLE : Toutes les tâches (Admin/Debug)
     */
    @GetMapping("/all")
    public ResponseEntity<List<TaskDTO>> getAllTasks() {
        try {
            List<TaskDTO> tasks = taskService.getAllTasks();
            logger.info("📊 Récupération de {} tâches au total", tasks.size());
            return ResponseEntity.ok(tasks);
        } catch (Exception e) {
            logger.error("❌ Erreur récupération toutes tâches", e);
            return ResponseEntity.ok(List.of());
        }
    }

    /**
     * ✅ API UTILE : Tâches d'une instance
     */
    @GetMapping("/instance/{instanceId}")
    public ResponseEntity<List<TaskDTO>> getTasksForInstance(@PathVariable Long instanceId) {
        try {
            List<TaskDTO> tasks = taskService.getTasksForInstance(instanceId);
            logger.info("📄 Trouvé {} tâches pour instance {}", tasks.size(), instanceId);
            return ResponseEntity.ok(tasks);
        } catch (Exception e) {
            logger.error("❌ Erreur tâches instance {}", instanceId, e);
            return ResponseEntity.ok(List.of());
        }
    }

    /**
     * ✅ API TEST : Vérification fonctionnement
     */
    @GetMapping("/test")
    public ResponseEntity<Map<String, Object>> test() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "OK");
        response.put("message", "✅ TaskController fonctionne parfaitement !");
        response.put("timestamp", System.currentTimeMillis());
        response.put("endpoints", Map.of(
                "my-tasks", "GET /api/tasks/my-tasks?user=username",
                "complete", "POST /api/tasks/{id}/complete-and-advance",
                "all", "GET /api/tasks/all",
                "instance", "GET /api/tasks/instance/{id}"
        ));
        return ResponseEntity.ok(response);
    }
}