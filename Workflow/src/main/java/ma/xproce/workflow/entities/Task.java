package ma.xproce.workflow.entities;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "task")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Task {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "instance_id")
    private Instance instance;

    @ManyToOne
    @JoinColumn(name = "statut_id")
    private Statut statut;

    private String name;
    private String description;

    @Enumerated(EnumType.STRING)
    private TaskStatus status;

    private String assignee;
    private LocalDateTime createdDate;
    private LocalDateTime dueDate;
    private Integer priority;

    @Column(columnDefinition = "TEXT")
    private String comments;

    public enum TaskStatus {
        CREATED, ASSIGNED, COMPLETED, CANCELLED
    }
}