package ma.xproce.workflow.dtos;

import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ConditionDTO {
    private String name;
    private String expression;
    private String description;
    private String conditionType;
    private boolean isActive;
    private Long statutId;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getExpression() {
        return expression;
    }

    public void setExpression(String expression) {
        this.expression = expression;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getConditionType() {
        return conditionType;
    }

    public void setConditionType(String conditionType) {
        this.conditionType = conditionType;
    }

    public boolean isActive() {
        return isActive;
    }

    public void setActive(boolean active) {
        isActive = active;
    }

    public Long getStatutId() {
        return statutId;
    }

    public void setStatutId(Long statutId) {
        this.statutId = statutId;
    }

}
