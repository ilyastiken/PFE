package ma.xproce.workflow.service;

import jakarta.transaction.Transactional;
import ma.xproce.workflow.entities.Passerelle;
import ma.xproce.workflow.entities.Workflow;
import ma.xproce.workflow.repositories.PasserelleRepository;
import ma.xproce.workflow.repositories.WorkflowRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class PasserelleService {

    @Autowired
    private PasserelleRepository passerelleRepository;

    @Autowired
    private WorkflowRepository workflowRepository;

    /**
     * Créer une passerelle simple
     */
    @Transactional
    public Passerelle createPasserelle(Long workflowId, String name, String type, Integer position) {
        // Vérifier que le workflow existe
        Workflow workflow = workflowRepository.findById(workflowId)
                .orElseThrow(() -> new RuntimeException("Workflow non trouvé: " + workflowId));

        // Vérifier l'unicité du nom
        if (passerelleRepository.existsByWorkflowIdAndName(workflowId, name)) {
            throw new RuntimeException("Une passerelle avec ce nom existe déjà: " + name);
        }

        // Créer la passerelle
        Passerelle passerelle = new Passerelle();
        passerelle.setName(name);
        passerelle.setGatewayType(type);
        passerelle.setPosition(position);
        passerelle.setWorkflow(workflow);


        return passerelleRepository.save(passerelle);
    }

    /**
     * Récupérer les passerelles d'un workflow
     */
    public List<Passerelle> getPasserellesByWorkflow(Long workflowId) {
        return passerelleRepository.findByWorkflowIdOrderByPosition(workflowId);
    }

    /**
     * Récupérer une passerelle par ID
     */
    public Passerelle getPasserelleById(Long id) {
        return passerelleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Passerelle non trouvée: " + id));
    }

    /**
     * Mettre à jour une passerelle
     */
    @Transactional
    public Passerelle updatePasserelle(Long id, String name, String type, Integer position) {
        Passerelle passerelle = getPasserelleById(id);

        passerelle.setName(name);
        passerelle.setGatewayType(type);
        passerelle.setPosition(position);

        return passerelleRepository.save(passerelle);
    }

    /**
     * Supprimer une passerelle
     */
    @Transactional
    public void deletePasserelle(Long id) {
        if (!passerelleRepository.existsById(id)) {
            throw new RuntimeException("Passerelle non trouvée: " + id);
        }
        passerelleRepository.deleteById(id);
    }

    /**
     * Supprimer toutes les passerelles d'un workflow
     */
    @Transactional
    public void deletePasserellesByWorkflow(Long workflowId) {
        passerelleRepository.deleteByWorkflowId(workflowId);
    }
}
