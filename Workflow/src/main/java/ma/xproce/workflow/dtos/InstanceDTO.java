package ma.xproce.workflow.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import ma.xproce.workflow.entities.Statut;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InstanceDTO {
    private Long workflowId;
    private String businessKey;
    private String createdBy;
    private long currentStatut;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String status;
    private Map<String, Object> initialVariables;
}
