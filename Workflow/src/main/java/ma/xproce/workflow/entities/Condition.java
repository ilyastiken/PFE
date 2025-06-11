package ma.xproce.workflow.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "workflow_condition")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Condition {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String expression; // Expression pour évaluer la condition
    private String description;
    @Column(name = "condition_type")
    private String conditionType;
    private boolean isActive = true;
    private LocalDateTime creationDate;
    private LocalDateTime modificationDate;

    @ManyToOne
    private Statut statut;

    @ManyToOne
    private Transition transition;

    @ManyToOne
    private Passerelle passerelle;

}
