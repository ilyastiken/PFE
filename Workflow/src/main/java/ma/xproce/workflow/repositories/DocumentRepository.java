package ma.xproce.workflow.repositories;

import ma.xproce.workflow.entities.Document;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DocumentRepository extends JpaRepository<Document,Long> {
}
