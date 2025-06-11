package ma.xproce.workflow.service;

import jakarta.transaction.Transactional;
import ma.xproce.workflow.dtos.ConditionDTO;
import ma.xproce.workflow.dtos.ConditionResponseDTO;
import ma.xproce.workflow.entities.Condition;
import ma.xproce.workflow.entities.Statut;
import ma.xproce.workflow.entities.Transition;
import ma.xproce.workflow.repositories.ConditionRepository;
import ma.xproce.workflow.repositories.StatutRepository;
import ma.xproce.workflow.repositories.TransitionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class ConditionService {
    @Autowired
    private TransitionRepository transitionRepository;

    @Autowired
    private ConditionRepository conditionRepository;

    @Autowired
    private StatutRepository statutRepository;
    @Transactional
    public List<Condition> addConditions(List<ConditionDTO> conditionDTOs) {
        List<Condition> createdConditions = new ArrayList<>();

        for (ConditionDTO dto : conditionDTOs) {
            Condition condition = new Condition();
            condition.setName(dto.getName());
            condition.setExpression(dto.getExpression());
            condition.setDescription(dto.getDescription());
            condition.setConditionType(dto.getConditionType());
            condition.setActive(dto.isActive());
            condition.setCreationDate(LocalDateTime.now());
            condition.setModificationDate(LocalDateTime.now());

            if (dto.getStatutId() != null) {
                Statut statut = statutRepository.findById(dto.getStatutId())
                        .orElseThrow(() -> new RuntimeException("Statut introuvable avec l'ID : " + dto.getStatutId()));
                condition.setStatut(statut);
            }


            Condition saved = conditionRepository.save(condition);
            createdConditions.add(saved);
        }

        return createdConditions;
    }
    @Transactional
    public List<Condition> addConditionsToTransition(Long transitionId, List<ConditionDTO> conditionDTOs) {
        Transition transition = transitionRepository.findById(transitionId)
                .orElseThrow(() -> new RuntimeException("Transition introuvable avec l'ID : " + transitionId));

        List<Condition> savedConditions = new ArrayList<>();

        for (ConditionDTO dto : conditionDTOs) {
            Condition condition = new Condition();
            condition.setName(dto.getName());
            condition.setExpression(dto.getExpression());
            condition.setDescription(dto.getDescription());
            condition.setConditionType(dto.getConditionType());
            condition.setCreationDate(LocalDateTime.now());
            condition.setModificationDate(LocalDateTime.now());
            condition.setActive(true);
            condition.setTransition(transition);

            savedConditions.add(conditionRepository.save(condition));
        }

        return savedConditions;
    }
    @Transactional
    public List<ConditionResponseDTO> addConditionsToTransitionDTO(Long transitionId, List<ConditionDTO> conditionDTOs) {
        // Utiliser votre méthode existante puis mapper
        List<Condition> conditions = addConditionsToTransition(transitionId, conditionDTOs);
        return conditions.stream()
                .map(this::mapToResponseDTO)
                .toList();
    }
    private ConditionResponseDTO mapToResponseDTO(Condition condition) {
        ConditionResponseDTO.ConditionResponseDTOBuilder builder = ConditionResponseDTO.builder()
                .id(condition.getId())
                .name(condition.getName())
                .expression(condition.getExpression())
                .description(condition.getDescription())
                .conditionType(condition.getConditionType())
                .isActive(condition.isActive())
                .creationDate(condition.getCreationDate())
                .modificationDate(condition.getModificationDate());

        if (condition.getStatut() != null) {
            builder.statutId(condition.getStatut().getId())
                    .statutName(condition.getStatut().getName())
                    .attachedTo("STATUT");
        } else if (condition.getTransition() != null) {
            builder.transitionId(condition.getTransition().getId())
                    .transitionName(condition.getTransition().getName())
                    .attachedTo("TRANSITION");
        }

        return builder.build();
    }
}
