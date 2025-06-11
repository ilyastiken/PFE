package ma.xproce.workflow.entities;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class TransitionHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "instance_id")
    private Instance instance;

    @ManyToOne
    @JoinColumn(name = "transition_id")
    private Transition transition;

    @ManyToOne
    @JoinColumn(name = "previous_statut_id")
    private Statut previousStatut;

    @ManyToOne
    @JoinColumn(name = "new_statut_id")
    private Statut newStatut;

    private LocalDateTime executionDate;
    private String executedBy;

    @Column(columnDefinition = "TEXT")
    private String comments;
}