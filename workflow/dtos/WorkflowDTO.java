package ma.xproce.workflow.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class WorkflowDTO {
    private String name;
    private String description;
    private String version;
    private boolean isActive;
    private String createdBy;
    private LocalDateTime creationDate;
    private LocalDateTime modificationDate;
    private List<InstanceDTO> instanceDTOS;


}
