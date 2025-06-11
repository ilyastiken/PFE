package ma.xproce.workflow.repositories;

import ma.xproce.workflow.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User,Long> {
}
