package ma.xproce.workflow.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "Passerelle")
public class Passerelle {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)

    private Long id;
    private String name;
    private String gatewayType;
    private Integer position;

    @ManyToOne
    private Workflow workflow;

    @OneToMany(mappedBy = "passerelle", cascade = CascadeType.ALL)
    private List<Condition> conditions;
}
