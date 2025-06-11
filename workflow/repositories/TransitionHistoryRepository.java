package ma.xproce.workflow.repositories;

import ma.xproce.workflow.entities.TransitionHistory;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TransitionHistoryRepository extends JpaRepository<TransitionHistory,Long> {
}
