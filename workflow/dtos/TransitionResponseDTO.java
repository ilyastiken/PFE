package ma.xproce.workflow.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransitionResponseDTO {
    private Long id;
    private String name;
    private String conditionExpression;

    // Informations sur les statuts (IDs et noms seulement)
    private Long sourceStatutId;
    private String sourceStatutName;
    private Long targetStatutId;
    private String targetStatutName;

    // Informations sur le workflow
    private Long workflowId;
    private String workflowName;

    // Compteurs au lieu de listes complètes
    private int conditionCount;
    private int executionCount;

    // Métadonnées utiles
    private boolean hasConditions;
    private boolean isExecutable;
}