package ma.xproce.workflow.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class StatutResponseDTO {

    private Long id;
    private String name;
    private String description;
    private String statutType;
    private Integer position;

    // Informations du workflow parent
    private Long workflowId;
    private String workflowName;

    // Statistiques
    private int outgoingTransitionCount;
    private int incomingTransitionCount;
    private int instanceCount;
    private boolean isActive;

    // Métadonnées
    private LocalDateTime creationDate;
    private LocalDateTime modificationDate;
}
