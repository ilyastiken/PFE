package ma.xproce.workflow.repositories;

import ma.xproce.workflow.entities.Passerelle;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PasserelleRepository extends JpaRepository<Passerelle, Long> {
    List<Passerelle> findByWorkflowIdOrderByPosition(Long workflowId);

    boolean existsByWorkflowIdAndName(Long workflowId, String name);

    // Supprimer par workflow (pour la cascade)
    void deleteByWorkflowId(Long workflowId);
}
