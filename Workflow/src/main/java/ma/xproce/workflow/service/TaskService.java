package ma.xproce.workflow.service;
import ma.xproce.workflow.dtos.TaskDTO;
import ma.xproce.workflow.entities.Instance;
import ma.xproce.workflow.entities.Statut;
import ma.xproce.workflow.entities.Task;
import ma.xproce.workflow.repositories.TaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TaskService {

    @Autowired
    private TaskRepository taskRepository;

    /**
     * ✅ MÉTHODE 1 : Créer une tâche automatiquement quand une instance change de statut
     */
    @Transactional
    public Task createTaskForStatut(Instance instance, Statut statut, String assignee) {
        Task task = Task.builder()
                .instance(instance)
                .statut(statut)
                .name("Traitement: " + statut.getName())
                .description("Tâche pour " + instance.getBusinessKey() + " - " + statut.getDescription())
                .status(Task.TaskStatus.CREATED)
                .assignee(assignee)
                .createdDate(LocalDateTime.now())
                .dueDate(LocalDateTime.now().plusDays(1)) // 24h par défaut
                .priority(5) // Priorité normale
                .build();

        return taskRepository.save(task);
    }

    /**
     * ✅ MÉTHODE 2 : Récupérer les tâches d'un utilisateur (pour l'interface Worker)
     */
    public List<TaskDTO> getTasksForUser(String username) {
        List<Task> tasks = taskRepository.findByAssignee(username);
        return tasks.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * ✅ MÉTHODE 3 : Compléter une tâche
     */
    @Transactional
    public TaskDTO completeTask(Long taskId, String completedBy, String comments) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Tâche non trouvée: " + taskId));

        // Vérifier que l'utilisateur peut compléter cette tâche
        if (!completedBy.equals(task.getAssignee())) {
            throw new RuntimeException("Seul l'assigné peut compléter cette tâche");
        }

        // Marquer comme terminée
        task.setStatus(Task.TaskStatus.COMPLETED);
        task.setComments(comments);

        Task savedTask = taskRepository.save(task);
        return convertToDTO(savedTask);
    }

    /**
     * ✅ MÉTHODE 4 : Assigner une tâche à un utilisateur
     */
    @Transactional
    public TaskDTO assignTask(Long taskId, String assignee) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Tâche non trouvée: " + taskId));

        task.setAssignee(assignee);
        task.setStatus(Task.TaskStatus.ASSIGNED);

        Task savedTask = taskRepository.save(task);
        return convertToDTO(savedTask);
    }

    /**
     * ✅ MÉTHODE 5 : Récupérer les tâches d'une instance
     */
    public List<TaskDTO> getTasksForInstance(Long instanceId) {
        List<Task> tasks = taskRepository.findByInstanceId(instanceId);
        return tasks.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * ✅ MÉTHODE 6 : Récupérer toutes les tâches
     */
    public List<TaskDTO> getAllTasks() {
        List<Task> tasks = taskRepository.findAll();
        return tasks.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    private TaskDTO convertToDTO(Task task) {
        TaskDTO.TaskDTOBuilder builder = TaskDTO.builder()
                .id(task.getId())
                .name(task.getName())
                .description(task.getDescription())
                .status(task.getStatus().name()) // Enum vers String
                .assignee(task.getAssignee())
                .createdDate(task.getCreatedDate())
                .dueDate(task.getDueDate())
                .priority(task.getPriority());

        // Ajouter les infos de l'instance si elle existe
        if (task.getInstance() != null) {
            builder.instanceId(task.getInstance().getId())
                    .instanceBusinessKey(task.getInstance().getBusinessKey());
        }

        // Ajouter les infos du statut si il existe
        if (task.getStatut() != null) {
            builder.statutId(task.getStatut().getId())
                    .statutName(task.getStatut().getName());
        }

        return builder.build();
    }

    /**
     * 🔄 MÉTHODE UTILITAIRE : Conversion TaskDTO → Task (pour les updates)
     */
    private Task convertFromDTO(TaskDTO dto) {
        return Task.builder()
                .id(dto.getId())
                .name(dto.getName())
                .description(dto.getDescription())
                .status(Task.TaskStatus.valueOf(dto.getStatus())) // String vers Enum
                .assignee(dto.getAssignee())
                .createdDate(dto.getCreatedDate())
                .dueDate(dto.getDueDate())
                .priority(dto.getPriority())
                .build();
    }
}
