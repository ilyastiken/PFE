package ma.xproce.workflow.repositories;

import ma.xproce.workflow.entities.Statut;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StatutRepository extends JpaRepository<Statut,Long> {
    List<Statut> findByWorkflowIdOrderByPosition(Long workflowId);
    List<Statut> findByWorkflowId(Long workflowId);
    List<Statut> findByStatutType(String statutType);
    Optional<Statut> findByWorkflowIdAndStatutType(Long workflowId, String statutType);
    Optional<Statut> findByWorkflowIdAndPosition(Long workflowId, Integer position);

}
