package ma.xproce.workflow.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConditionResponseDTO {
    private Long id;
    private String name;
    private String expression;
    private String description;
    private String conditionType;
    private boolean isActive;
    private LocalDateTime creationDate;
    private LocalDateTime modificationDate;

    // Référence au statut (si la condition est liée à un statut)
    private Long statutId;
    private String statutName;

    // Référence à la transition (si la condition est liée à une transition)
    private Long transitionId;
    private String transitionName;

    // Métadonnées utiles
    private String attachedTo; // "STATUT" ou "TRANSITION"
}