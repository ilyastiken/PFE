package ma.xproce.workflow.service;
import ma.xproce.workflow.entities.Instance;
import ma.xproce.workflow.entities.Task;
import ma.xproce.workflow.entities.Workflow;
import ma.xproce.workflow.repositories.InstanceRepository;
import ma.xproce.workflow.repositories.TaskRepository;
import ma.xproce.workflow.repositories.WorkflowRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class MonitoringService {

    @Autowired
    private InstanceRepository instanceRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private WorkflowRepository workflowRepository;

    /**
     * ✅ DASHBOARD GLOBAL - Toutes les statistiques
     */
    public Map<String, Object> getGlobalDashboard() {
        Map<String, Object> dashboard = new HashMap<>();

        try {
            // Statistiques instances
            List<Instance> allInstances = instanceRepository.findAll();
            long activeInstances = allInstances.stream()
                    .filter(i -> "IN_PROGRESS".equals(i.getStatus()))
                    .count();
            long completedInstances = allInstances.stream()
                    .filter(i -> "COMPLETED".equals(i.getStatus()))
                    .count();

            // Statistiques tâches
            List<Task> allTasks = taskRepository.findAll();
            long pendingTasks = allTasks.stream()
                    .filter(t -> t.getStatus() == Task.TaskStatus.CREATED || t.getStatus() == Task.TaskStatus.ASSIGNED)
                    .count();
            long overdueTasks = allTasks.stream()
                    .filter(this::isTaskOverdue)
                    .count();

            // Statistiques workflows
            long totalWorkflows = workflowRepository.count();
            long activeWorkflows = workflowRepository.findAll().stream()
                    .filter(Workflow::isActive)
                    .count();

            dashboard.put("instances", Map.of(
                    "total", allInstances.size(),
                    "active", activeInstances,
                    "completed", completedInstances,
                    "blocked", Math.max(0, allInstances.size() - activeInstances - completedInstances)
            ));

            dashboard.put("tasks", Map.of(
                    "total", allTasks.size(),
                    "pending", pendingTasks,
                    "overdue", overdueTasks,
                    "completed", allTasks.size() - pendingTasks
            ));

            dashboard.put("workflows", Map.of(
                    "total", totalWorkflows,
                    "active", activeWorkflows
            ));

            dashboard.put("success", true);
            dashboard.put("timestamp", LocalDateTime.now());

        } catch (Exception e) {
            dashboard.put("success", false);
            dashboard.put("error", e.getMessage());
        }

        return dashboard;
    }

    /**
     * ✅ MONITORING WORKFLOW SPÉCIFIQUE - Données détaillées
     */
    public Map<String, Object> getWorkflowMonitoring(Long workflowId) {
        Map<String, Object> monitoring = new HashMap<>();

        try {
            // Workflow info
            Workflow workflow = workflowRepository.findById(workflowId)
                    .orElseThrow(() -> new RuntimeException("Workflow non trouvé: " + workflowId));

            // Instances de ce workflow
            List<Instance> instances = instanceRepository.findAll().stream()
                    .filter(i -> i.getWorkflow().getId().equals(workflowId))
                    .collect(Collectors.toList());

            // Instances actives avec détails
            List<Map<String, Object>> activeInstances = instances.stream()
                    .filter(i -> "IN_PROGRESS".equals(i.getStatus()))
                    .map(this::mapInstanceToMonitoringData)
                    .collect(Collectors.toList());

            // Statistiques du workflow
            long totalInstances = instances.size();
            long activeCount = activeInstances.size();
            long completedCount = instances.stream()
                    .filter(i -> "COMPLETED".equals(i.getStatus()))
                    .count();

            monitoring.put("workflow", Map.of(
                    "id", workflow.getId(),
                    "name", workflow.getName(),
                    "description", workflow.getDescription(),
                    "isActive", workflow.isActive()
            ));

            monitoring.put("statistics", Map.of(
                    "total", totalInstances,
                    "active", activeCount,
                    "completed", completedCount,
                    "blocked", Math.max(0, totalInstances - activeCount - completedCount)
            ));

            monitoring.put("activeInstances", activeInstances);
            monitoring.put("success", true);
            monitoring.put("timestamp", LocalDateTime.now());

        } catch (Exception e) {
            monitoring.put("success", false);
            monitoring.put("error", e.getMessage());
        }

        return monitoring;
    }

    /**
     * ✅ DÉTAILS D'UNE INSTANCE SPÉCIFIQUE
     */
    public Map<String, Object> getInstanceDetails(Long instanceId) {
        try {
            Instance instance = instanceRepository.findById(instanceId)
                    .orElseThrow(() -> new RuntimeException("Instance non trouvée: " + instanceId));

            return mapInstanceToMonitoringData(instance);

        } catch (Exception e) {
            return Map.of(
                    "success", false,
                    "error", e.getMessage()
            );
        }
    }

    /**
     * 🔄 MÉTHODES UTILITAIRES PRIVÉES
     */
    private Map<String, Object> mapInstanceToMonitoringData(Instance instance) {
        Map<String, Object> data = new HashMap<>();

        data.put("id", instance.getId());
        data.put("businessKey", instance.getBusinessKey());
        data.put("status", instance.getStatus());
        data.put("createdBy", instance.getCreatedBy());
        data.put("startDate", instance.getStartDate());
        data.put("endDate", instance.getEndDate());

        // Workflow info
        data.put("workflowId", instance.getWorkflow().getId());
        data.put("workflowName", instance.getWorkflow().getName());

        // Statut actuel
        if (instance.getCurrentStatut() != null) {
            data.put("currentStatutId", instance.getCurrentStatut().getId());
            data.put("currentStatutName", instance.getCurrentStatut().getName());
            data.put("currentStatutType", instance.getCurrentStatut().getStatutType());
        }

        // Durée
        if (instance.getStartDate() != null) {
            Duration duration = Duration.between(instance.getStartDate(),
                    instance.getEndDate() != null ? instance.getEndDate() : LocalDateTime.now());
            data.put("durationMinutes", duration.toMinutes());
            data.put("durationHours", duration.toHours());
            data.put("durationText", formatDuration(duration));
        }

        // Progression (approximation basée sur le type de statut)
        if (instance.getCurrentStatut() != null) {
            String statutType = instance.getCurrentStatut().getStatutType();
            int progress = calculateProgress(statutType);
            data.put("progressPercent", progress);
        }

        return data;
    }

    private boolean isTaskOverdue(Task task) {
        return task.getDueDate() != null &&
                task.getDueDate().isBefore(LocalDateTime.now()) &&
                (task.getStatus() == Task.TaskStatus.CREATED || task.getStatus() == Task.TaskStatus.ASSIGNED);
    }

    private String formatDuration(Duration duration) {
        long hours = duration.toHours();
        long minutes = duration.toMinutes() % 60;

        if (hours > 0) {
            return hours + "h " + minutes + "min";
        } else {
            return minutes + "min";
        }
    }

    private int calculateProgress(String statutType) {
        switch (statutType) {
            case "INITIAL": return 10;
            case "NORMAL": return 50;
            case "FINAL": return 100;
            default: return 25;
        }
    }
}