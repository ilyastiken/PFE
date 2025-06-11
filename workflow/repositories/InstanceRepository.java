package ma.xproce.workflow.repositories;

import ma.xproce.workflow.entities.Instance;
import ma.xproce.workflow.entities.Workflow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface InstanceRepository extends JpaRepository<Instance,Long> {
    List<Instance> findByStatus(String completed);
    List<Instance> findByWorkflow(Workflow workflow);
    List<Instance> findByCreatedBy(String createdBy);
    Optional<Instance> findByBusinessKey(String businessKey);
    long countByWorkflowIdAndStatus(Long workflowId, String status);
    long countByWorkflowIdAndStatusNot(Long workflowId, String status);

    @Query("SELECT i.currentStatut.id FROM Instance i WHERE i.id = :instanceId")
    Long findCurrentStatutId(@Param("instanceId") Long instanceId);
}
