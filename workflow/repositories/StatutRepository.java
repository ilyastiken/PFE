package ma.xproce.workflow.repositories;

import ma.xproce.workflow.entities.Statut;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StatutRepository extends JpaRepository<Statut,Long> {
}
