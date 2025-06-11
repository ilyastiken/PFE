package ma.xproce.workflow.repositories;

import ma.xproce.workflow.entities.Variable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VariableRepository extends JpaRepository<Variable,Long> {
}
