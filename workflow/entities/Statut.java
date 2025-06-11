package ma.xproce.workflow.entities;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Statut {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
  //  @JoinColumn(name = "workflow_id")
    @JsonBackReference("workflow-statuts")
    private Workflow workflow;

    private String name;
    private String description;
    private String statutType; // "INITIAL", "NORMAL", "FINAL"
    private Integer position;

    @OneToMany(mappedBy = "sourceStatut")
    @JsonIgnore
    private List<Transition> outgoingTransitions = new ArrayList<>();

    @OneToMany(mappedBy = "targetStatut")
    @JsonIgnore
    private List<Transition> incomingTransitions = new ArrayList<>();

    @OneToMany(mappedBy = "currentStatut")
    @JsonIgnore
    private List<Instance> instances = new ArrayList<>();

    @OneToMany(mappedBy = "statut")
    @JsonIgnore
    private List<Condition> conditions = new ArrayList<>();
}