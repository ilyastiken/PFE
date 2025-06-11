package ma.xproce.workflow.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import ma.xproce.workflow.entities.TransitionHistory;

import java.util.ArrayList;
import java.util.List;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Transition {
   @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "workflow_id")
    @JsonIgnore
    private Workflow workflow;

    @ManyToOne
    @JoinColumn(name = "source_statut_id")
    @JsonIgnore
    private Statut sourceStatut;

    @ManyToOne
    @JoinColumn(name = "target_statut_id")
    @JsonIgnore
    private Statut targetStatut;

    private String name;

    @Column(columnDefinition = "TEXT")
    private String conditionExpression;

    @OneToMany(mappedBy = "transition")
    @JsonIgnore
    private List<TransitionHistory> history = new ArrayList<>();

    @OneToMany(mappedBy = "transition")
    @JsonIgnore
    private List<RolePermission> permissions = new ArrayList<>();

   @OneToMany(mappedBy = "transition", cascade = CascadeType.ALL, orphanRemoval = true)
   @JsonIgnore
   private List<Condition> conditions = new ArrayList<>();

}