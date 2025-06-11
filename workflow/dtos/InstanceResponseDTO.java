package ma.xproce.workflow.dtos;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class InstanceResponseDTO {
    private Long id;
    private String businessKey;
    private String status;
    private String createdBy;
    private LocalDateTime startDate;
    private LocalDateTime endDate;

    private Long workflowId;
    private String workflowName;

    private Long currentStatutId;
    private String currentStatutName;
}
