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
public class TaskDTO {
    private Long id;
    private String name;
    private String description;
    private String status; // "CREATED", "ASSIGNED", "COMPLETED"
    private String assignee;
    private LocalDateTime createdDate;
    private LocalDateTime dueDate;
    private Integer priority;

    // Relations
    private Long instanceId;
    private String instanceBusinessKey;
    private Long statutId;
    private String statutName;
}