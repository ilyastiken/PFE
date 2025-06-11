package ma.xproce.workflow.restcontrollers;

import ma.xproce.workflow.dtos.StatutDTO;
import ma.xproce.workflow.dtos.StatutResponseDTO;
import ma.xproce.workflow.entities.Statut;
import ma.xproce.workflow.entities.Workflow;
import ma.xproce.workflow.repositories.StatutRepository;
import ma.xproce.workflow.repositories.WorkflowRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/workflows/{workflowId}/statuts")
@CrossOrigin("*")
public class StatutController {

    private static final Logger logger = LoggerFactory.getLogger(StatutController.class);

    @Autowired
    private StatutRepository statutRepository;

    @Autowired
    private WorkflowRepository workflowRepository;

    @PostMapping
    public ResponseEntity<StatutResponseDTO> createStatut(
            @PathVariable Long workflowId,
            @Validated @RequestBody StatutDTO statutDTO) {
        try {
            logger.info("Création statut {} pour workflow {}", statutDTO.getName(), workflowId);

            // Vérifier que le workflow existe
            Workflow workflow = workflowRepository.findById(workflowId)
                    .orElseThrow(() -> new RuntimeException("Workflow non trouvé avec ID: " + workflowId));

            // Créer le statut
            Statut statut = Statut.builder()
                    .name(statutDTO.getName())
                    .description(statutDTO.getDescription())
                    .statutType(statutDTO.getStatutType())
                    .position(statutDTO.getPosition())
                    .workflow(workflow)
                    .build();

            // Sauvegarder
            Statut savedStatut = statutRepository.save(statut);

            // Retourner le DTO
            StatutResponseDTO response = mapToResponseDTO(savedStatut);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (Exception e) {
            logger.error("Erreur création statut pour workflow {}", workflowId, e);
            return ResponseEntity.badRequest().build();
        }
    }

    // ✅ RÉCUPÉRER TOUS LES STATUTS D'UN WORKFLOW
    @GetMapping
    public ResponseEntity<List<StatutResponseDTO>> getStatutsByWorkflow(@PathVariable Long workflowId) {
        try {
            // Vérifier que le workflow existe
            if (!workflowRepository.existsById(workflowId)) {
                return ResponseEntity.notFound().build();
            }

            List<Statut> statuts = statutRepository.findByWorkflowIdOrderByPosition(workflowId);
            List<StatutResponseDTO> responses = statuts.stream()
                    .map(this::mapToResponseDTO)
                    .toList();

            return ResponseEntity.ok(responses);

        } catch (Exception e) {
            logger.error("Erreur récupération statuts pour workflow {}", workflowId, e);
            return ResponseEntity.badRequest().build();
        }
    }

    // ✅ RÉCUPÉRER UN STATUT SPÉCIFIQUE
    @GetMapping("/{statutId}")
    public ResponseEntity<StatutResponseDTO> getStatutById(
            @PathVariable Long workflowId,
            @PathVariable Long statutId) {
        try {
            Statut statut = statutRepository.findById(statutId).orElse(null);

            if (statut == null || !statut.getWorkflow().getId().equals(workflowId)) {
                return ResponseEntity.notFound().build();
            }

            StatutResponseDTO response = mapToResponseDTO(statut);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Erreur récupération statut {} du workflow {}", statutId, workflowId, e);
            return ResponseEntity.badRequest().build();
        }
    }

    // ✅ METTRE À JOUR UN STATUT
    @PutMapping("/{statutId}")
    public ResponseEntity<StatutResponseDTO> updateStatut(
            @PathVariable Long workflowId,
            @PathVariable Long statutId,
            @Validated @RequestBody StatutDTO statutDTO) {
        try {
            logger.info("Mise à jour statut {} du workflow {}", statutId, workflowId);

            Statut statut = statutRepository.findById(statutId).orElse(null);

            if (statut == null || !statut.getWorkflow().getId().equals(workflowId)) {
                return ResponseEntity.notFound().build();
            }

            // Mettre à jour
            statut.setName(statutDTO.getName());
            statut.setDescription(statutDTO.getDescription());
            statut.setStatutType(statutDTO.getStatutType());
            statut.setPosition(statutDTO.getPosition());

            Statut updatedStatut = statutRepository.save(statut);
            StatutResponseDTO response = mapToResponseDTO(updatedStatut);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Erreur mise à jour statut {} du workflow {}", statutId, workflowId, e);
            return ResponseEntity.badRequest().build();
        }
    }

    // ✅ SUPPRIMER UN STATUT
    @DeleteMapping("/{statutId}")
    public ResponseEntity<Void> deleteStatut(
            @PathVariable Long workflowId,
            @PathVariable Long statutId) {
        try {
            logger.info("Suppression statut {} du workflow {}", statutId, workflowId);

            Statut statut = statutRepository.findById(statutId).orElse(null);

            if (statut == null || !statut.getWorkflow().getId().equals(workflowId)) {
                return ResponseEntity.notFound().build();
            }

            // Vérifier s'il y a des instances utilisant ce statut
            if (hasActiveInstances(statutId)) {
                logger.warn("Impossible de supprimer le statut {} : instances actives", statutId);
                return ResponseEntity.status(HttpStatus.CONFLICT).build();
            }

            statutRepository.deleteById(statutId);
            return ResponseEntity.noContent().build();

        } catch (Exception e) {
            logger.error("Erreur suppression statut {} du workflow {}", statutId, workflowId, e);
            return ResponseEntity.badRequest().build();
        }
    }

    // =====================================================
    // MÉTHODES UTILITAIRES PRIVÉES
    // =====================================================

    private StatutResponseDTO mapToResponseDTO(Statut statut) {
        return StatutResponseDTO.builder()
                .id(statut.getId())
                .name(statut.getName())
                .description(statut.getDescription())
                .statutType(statut.getStatutType())
                .position(statut.getPosition())
                .workflowId(statut.getWorkflow().getId())
                .workflowName(statut.getWorkflow().getName())
                .outgoingTransitionCount(statut.getOutgoingTransitions() != null ? statut.getOutgoingTransitions().size() : 0)
                .incomingTransitionCount(statut.getIncomingTransitions() != null ? statut.getIncomingTransitions().size() : 0)
                .instanceCount(statut.getInstances() != null ? statut.getInstances().size() : 0)
                .isActive(true)
                .build();
    }

    private boolean hasActiveInstances(Long statutId) {
        // Vérifier s'il y a des instances actives utilisant ce statut
        try {
            // Vous pouvez utiliser une requête native ou votre InstanceRepository
            return statutRepository.findById(statutId)
                    .map(statut -> statut.getInstances() != null &&
                            statut.getInstances().stream()
                                    .anyMatch(instance -> !"COMPLETED".equals(instance.getStatus())))
                    .orElse(false);
        } catch (Exception e) {
            return false;
        }
    }
}