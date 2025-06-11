package ma.xproce.workflow.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowResponseDTO {
    private Long id;
    private String name;
    private String description;
    private String version;
    private boolean isActive;
    private String createdBy;
    private LocalDateTime creationDate;
    private LocalDateTime modificationDate;

    private List<StatutDTO> statuts;
    private List<TransitionDTO> transitions;

    private int statutCount;
    private int transitionCount;
    private int activeInstanceCount;
}