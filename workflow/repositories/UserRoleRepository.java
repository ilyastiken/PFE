package ma.xproce.workflow.repositories;

import ma.xproce.workflow.entities.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRoleRepository extends JpaRepository<UserRole,Long> {
}
