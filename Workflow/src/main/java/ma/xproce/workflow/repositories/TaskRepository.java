package ma.xproce.workflow.repositories;
import ma.xproce.workflow.entities.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    // Méthodes de base seulement
    List<Task> findByAssignee(String assignee);
    List<Task> findByInstanceId(Long instanceId);
}