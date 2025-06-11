package ma.xproce.workflow.repositories;

import ma.xproce.workflow.entities.Statut;
import ma.xproce.workflow.entities.Transition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TransitionRepository extends JpaRepository<Transition,Long> {

    List<Transition> findBySourceStatut(Statut sourceStatut);
    List<Transition> findBySourceStatutId(Long sourceStatutId);


}
