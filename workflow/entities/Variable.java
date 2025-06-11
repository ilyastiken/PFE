package ma.xproce.workflow.entities;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.math.BigDecimal;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Variable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "instance_id")
    @JsonBackReference("instance-variables")
    private Instance instance;

    private String name;
    private String variableType;

    @Column(columnDefinition = "TEXT")
    private String stringValue;

    private BigDecimal numberValue;
    private LocalDateTime dateValue;
    private Boolean booleanValue;

    @Column(columnDefinition = "TEXT")
    private String jsonValue;
}