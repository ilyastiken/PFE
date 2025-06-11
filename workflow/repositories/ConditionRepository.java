package ma.xproce.workflow.repositories;

import ma.xproce.workflow.entities.Condition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ConditionRepository extends JpaRepository<Condition,Long> {
    List<Condition> findByTransitionIdAndIsActive(Long transitionId, boolean isActive);

    List<Condition> findByStatutIdAndIsActive(Long statutId, boolean isActive);

    @Query("SELECT c FROM Condition c WHERE c.transition.sourceStatut.id = :fromStatutId AND c.transition.targetStatut.id = :toStatutId AND c.isActive = true")
    List<Condition> findByStatutTransition(@Param("fromStatutId") Long fromStatutId, @Param("toStatutId") Long toStatutId);
}
