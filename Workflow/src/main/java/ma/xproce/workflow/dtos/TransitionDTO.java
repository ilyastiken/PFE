package ma.xproce.workflow.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransitionDTO {
    private String name;
    private Long sourceStatutId;
    private String sourceStatutName;
    private Long targetStatutId;
    private String targetStatutName;
    private String conditionExpression;
}