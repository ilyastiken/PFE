package ma.xproce.workflow.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Document {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "instance_id")
    private Instance instance;

    private String typeDocument;
    private String nomFichier;
    private String cheminStockage;
    private LocalDateTime dateUpload;
    private String uploadedBy;
}