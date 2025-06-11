package ma.xproce.workflow.entities;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Role {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String description;

    @OneToMany(mappedBy = "role", cascade = CascadeType.ALL)
    private List<RolePermission> permissions = new ArrayList<>();

    @OneToMany(mappedBy = "role")
    private List<UserRole> userRoles = new ArrayList<>();
}