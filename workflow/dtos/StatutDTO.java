package ma.xproce.workflow.dtos;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StatutDTO {
    private Long id;
    private String name;
    private String description;
    private String statutType;
    private Integer position;
}
