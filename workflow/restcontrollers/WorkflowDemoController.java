package ma.xproce.workflow.restcontrollers;

import ma.xproce.workflow.entities.*;
import ma.xproce.workflow.service.InstanceService;
import ma.xproce.workflow.service.WorkflowService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/demo")
@CrossOrigin("*")
public class WorkflowDemoController {

    @Autowired
    private WorkflowService workflowService;

    @Autowired
    private InstanceService instanceService;

    /**
     * 1. CRÉER LE WORKFLOW DE DEMANDE DE CRÉDIT
     */
    @PostMapping("/setup-credit-workflow")
    public ResponseEntity<Map<String, Object>> setupCreditWorkflow() {
        Map<String, Object> response = new HashMap<>();

        try {
            // Créer le workflow
            Workflow creditWorkflow = Workflow.builder()
                    .name("Demande de Crédit")
                    .description("Processus de validation des demandes de crédit")
                    .version("1.0")
                    .isActive(true)
                    .createdBy("SYSTEM")
                    .creationDate(LocalDateTime.now())
                    .build();

            // Créer les statuts
            Statut initiation = Statut.builder()
                    .name("Initiation")
                    .description("Demande créée")
                    .statutType("INITIAL")
                    .position(1)
                    .workflow(creditWorkflow)
                    .build();

            Statut validation1 = Statut.builder()
                    .name("Validation N1")
                    .description("En cours de validation par le chef d'agence")
                    .statutType("NORMAL")
                    .position(2)
                    .workflow(creditWorkflow)
                    .build();

            Statut validation2 = Statut.builder()
                    .name("Validation N2")
                    .description("En cours de validation par la direction")
                    .statutType("NORMAL")
                    .position(3)
                    .workflow(creditWorkflow)
                    .build();

            Statut termine = Statut.builder()
                    .name("Terminé")
                    .description("Demande traitée")
                    .statutType("FINAL")
                    .position(4)
                    .workflow(creditWorkflow)
                    .build();

            // Ajouter les statuts au workflow
            creditWorkflow.getStatuts().add(initiation);
            creditWorkflow.getStatuts().add(validation1);
            creditWorkflow.getStatuts().add(validation2);
            creditWorkflow.getStatuts().add(termine);

            // Sauvegarder le workflow avec les statuts
            Workflow savedWorkflow = workflowService.saveWorkflow(creditWorkflow);

            response.put("success", true);
            response.put("message", "Workflow de demande de crédit créé avec succès");
            response.put("workflowId", savedWorkflow.getId());
            response.put("statuts", savedWorkflow.getStatuts().size());
            response.put("transitions", savedWorkflow.getTransitions().size());

        } catch (Exception e) {
            response.put("success", false);
            response.put("error", e.getMessage());
            e.printStackTrace();
        }

        return ResponseEntity.ok(response);
    }

    /**
     * 1b. AJOUTER LES TRANSITIONS AU WORKFLOW
     */
    @PostMapping("/add-transitions/{workflowId}")
    public ResponseEntity<Map<String, Object>> addTransitions(@PathVariable Long workflowId) {
        Map<String, Object> response = new HashMap<>();

        try {
            // Récupérer le workflow avec les statuts qui ont des IDs
            Workflow workflow = workflowService.getWorkflowById(workflowId);

            if (workflow == null) {
                throw new RuntimeException("Workflow non trouvé");
            }

            // Récupérer les statuts par nom (ils ont maintenant des IDs)
            Statut initiation = workflow.getStatuts().stream()
                    .filter(s -> "Initiation".equals(s.getName()))
                    .findFirst().orElseThrow(() -> new RuntimeException("Statut Initiation non trouvé"));

            Statut validation1 = workflow.getStatuts().stream()
                    .filter(s -> "Validation N1".equals(s.getName()))
                    .findFirst().orElseThrow(() -> new RuntimeException("Statut Validation N1 non trouvé"));

            Statut validation2 = workflow.getStatuts().stream()
                    .filter(s -> "Validation N2".equals(s.getName()))
                    .findFirst().orElseThrow(() -> new RuntimeException("Statut Validation N2 non trouvé"));

            Statut termine = workflow.getStatuts().stream()
                    .filter(s -> "Terminé".equals(s.getName()))
                    .findFirst().orElseThrow(() -> new RuntimeException("Statut Terminé non trouvé"));

            // Créer les transitions directement SANS les ajouter au workflow
            Transition t1 = Transition.builder()
                    .name("Soumettre")
                    .sourceStatut(initiation)
                    .targetStatut(validation1)
                    .workflow(workflow)
                    .build();

            Transition t2 = Transition.builder()
                    .name("Valider N1")
                    .sourceStatut(validation1)
                    .targetStatut(validation2)
                    .workflow(workflow)
                    .build();

            Transition t3 = Transition.builder()
                    .name("Valider N2")
                    .sourceStatut(validation2)
                    .targetStatut(termine)
                    .workflow(workflow)
                    .build();

            // Sauvegarder les transitions individuellement via TransitionService
            // (Vous devrez créer cette méthode ou utiliser directement le repository)

            // Alternative : Créer un nouveau workflow avec les transitions
            Workflow newWorkflow = Workflow.builder()
                    .id(workflow.getId())
                    .name(workflow.getName())
                    .description(workflow.getDescription())
                    .version(workflow.getVersion())
                    .isActive(workflow.isActive())
                    .createdBy(workflow.getCreatedBy())
                    .creationDate(workflow.getCreationDate())
                    .modificationDate(LocalDateTime.now())
                    .build();

            // Copier les statuts existants
            newWorkflow.getStatuts().addAll(workflow.getStatuts());

            // Ajouter les nouvelles transitions
            newWorkflow.getTransitions().add(t1);
            newWorkflow.getTransitions().add(t2);
            newWorkflow.getTransitions().add(t3);

            // Sauvegarder
            Workflow savedWorkflow = workflowService.saveWorkflow(newWorkflow);

            response.put("success", true);
            response.put("message", "Transitions ajoutées avec succès");
            response.put("workflowId", savedWorkflow.getId());
            response.put("transitions", savedWorkflow.getTransitions().size());

        } catch (Exception e) {
            response.put("success", false);
            response.put("error", e.getMessage());
            e.printStackTrace();
        }

        return ResponseEntity.ok(response);
    }

    /**
     * 2. CRÉER UNE DEMANDE DE CRÉDIT (INSTANCE)
     */
    @PostMapping("/create-credit-request")
    public ResponseEntity<Map<String, Object>> createCreditRequest(@RequestBody Map<String, Object> requestData) {
        Map<String, Object> response = new HashMap<>();

        try {
            // Récupérer le workflow avec ID = 2 (celui qui a les transitions)
            Workflow workflow = workflowService.getWorkflowById(2L);
            if (workflow == null) {
                throw new RuntimeException("Workflow ID=2 non trouvé");
            }

            // Trouver le statut initial
            Statut initialStatut = workflow.getStatuts().stream()
                    .filter(s -> "INITIAL".equals(s.getStatutType()))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Statut initial non trouvé"));

            // Créer l'instance
            Instance creditRequest = Instance.builder()
                    .workflow(workflow)
                    .businessKey("CRED-" + System.currentTimeMillis())
                    .currentStatut(initialStatut)
                    .startDate(LocalDateTime.now())
                    .status("CREATED")
                    .createdBy((String) requestData.get("createdBy"))
                    .build();

            // Créer les variables métier
            Variable clientVar = Variable.builder()
                    .instance(creditRequest)
                    .name("client")
                    .variableType("STRING")
                    .stringValue((String) requestData.get("client"))
                    .build();

            Variable compteVar = Variable.builder()
                    .instance(creditRequest)
                    .name("numeroCompte")
                    .variableType("STRING")
                    .stringValue((String) requestData.get("numeroCompte"))
                    .build();

            Variable montantVar = Variable.builder()
                    .instance(creditRequest)
                    .name("montant")
                    .variableType("NUMBER")
                    .numberValue(new java.math.BigDecimal(requestData.get("montant").toString()))
                    .build();

            Variable agenceVar = Variable.builder()
                    .instance(creditRequest)
                    .name("agence")
                    .variableType("STRING")
                    .stringValue((String) requestData.get("agence"))
                    .build();

            // Ajouter les variables à l'instance
            creditRequest.getVariables().add(clientVar);
            creditRequest.getVariables().add(compteVar);
            creditRequest.getVariables().add(montantVar);
            creditRequest.getVariables().add(agenceVar);

            // Sauvegarder l'instance
            Instance savedInstance = instanceService.saveInstance(creditRequest);

            response.put("success", true);
            response.put("message", "Demande de crédit créée");
            response.put("instanceId", savedInstance.getId());
            response.put("businessKey", savedInstance.getBusinessKey());
            response.put("currentStatut", savedInstance.getCurrentStatut().getName());
            response.put("variables", Map.of(
                    "client", requestData.get("client"),
                    "numeroCompte", requestData.get("numeroCompte"),
                    "montant", requestData.get("montant"),
                    "agence", requestData.get("agence")
            ));

        } catch (Exception e) {
            response.put("success", false);
            response.put("error", e.getMessage());
            e.printStackTrace();
        }

        return ResponseEntity.ok(response);
    }

    /**
     * 3. FAIRE AVANCER UNE DEMANDE (EXÉCUTER TRANSITION)
     */
    @PostMapping("/advance-credit-request/{instanceId}")
    public ResponseEntity<Map<String, Object>> advanceCreditRequest(
            @PathVariable Long instanceId,
            @RequestBody Map<String, String> requestData) {

        Map<String, Object> response = new HashMap<>();

        try {
            // Récupérer l'instance réelle
            Instance instance = instanceService.getInstanceById(instanceId);
            if (instance == null) {
                throw new RuntimeException("Instance non trouvée: " + instanceId);
            }

            String action = requestData.get("action"); // "soumettre", "valider_n1", "valider_n2"
            String executedBy = requestData.get("executedBy");

            // Récupérer le statut actuel
            Statut currentStatut = instance.getCurrentStatut();
            String previousStatutName = currentStatut.getName();

            // Trouver la transition correspondante
            Transition transition = currentStatut.getOutgoingTransitions().stream()
                    .filter(t -> {
                        String transitionName = t.getName();
                        return switch (action.toLowerCase()) {
                            case "soumettre" -> "Soumettre".equals(transitionName);
                            case "valider_n1" -> "Valider N1".equals(transitionName);
                            case "valider_n2" -> "Valider N2".equals(transitionName);
                            default -> false;
                        };
                    })
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Transition non trouvée pour l'action: " + action + ". Transitions disponibles: " +
                            currentStatut.getOutgoingTransitions().stream().map(Transition::getName).toList()));

            // Exécuter la transition
            Statut previousStatut = instance.getCurrentStatut();
            instance.setCurrentStatut(transition.getTargetStatut());

            // Mettre à jour le statut de l'instance
            if ("FINAL".equals(transition.getTargetStatut().getStatutType())) {
                instance.setStatus("COMPLETED");
                instance.setEndDate(LocalDateTime.now());
            } else {
                instance.setStatus("IN_PROGRESS");
            }

            // Sauvegarder l'instance
            instance = instanceService.saveInstance(instance);

            // Créer l'historique de transition
            TransitionHistory history = TransitionHistory.builder()
                    .instance(instance)
                    .transition(transition)
                    .previousStatut(previousStatut)
                    .newStatut(transition.getTargetStatut())
                    .executionDate(LocalDateTime.now())
                    .executedBy(executedBy)
                    .comments("Transition exécutée: " + action)
                    .build();

            instance.getTransitionHistory().add(history);
            instanceService.saveInstance(instance);

            response.put("success", true);
            response.put("message", "Transition exécutée avec succès");
            response.put("instanceId", instanceId);
            response.put("previousStatut", previousStatutName);
            response.put("newStatut", instance.getCurrentStatut().getName());
            response.put("executedBy", executedBy);
            response.put("executionTime", LocalDateTime.now().toString());

        } catch (Exception e) {
            response.put("success", false);
            response.put("error", e.getMessage());
            e.printStackTrace();
        }

        return ResponseEntity.ok(response);
    }

    /**
     * 4. VOIR L'ÉTAT D'UNE DEMANDE
     */
    @GetMapping("/credit-request-status/{instanceId}")
    public ResponseEntity<Map<String, Object>> getCreditRequestStatus(@PathVariable Long instanceId) {
        Map<String, Object> response = new HashMap<>();

        try {
            // Récupérer l'instance réelle
            Instance instance = instanceService.getInstanceById(instanceId);
            if (instance == null) {
                throw new RuntimeException("Instance non trouvée: " + instanceId);
            }

            // Construire les variables
            Map<String, Object> variables = new HashMap<>();
            for (Variable var : instance.getVariables()) {
                switch (var.getVariableType()) {
                    case "STRING" -> variables.put(var.getName(), var.getStringValue());
                    case "NUMBER" -> variables.put(var.getName(), var.getNumberValue());
                    case "BOOLEAN" -> variables.put(var.getName(), var.getBooleanValue());
                    case "DATE" -> variables.put(var.getName(), var.getDateValue());
                    default -> variables.put(var.getName(), var.getStringValue());
                }
            }

            // Construire l'historique
            List<Map<String, Object>> history = instance.getTransitionHistory().stream()
                    .map(h -> {
                        Map<String, Object> historyEntry = new HashMap<>();
                        historyEntry.put("step", h.getNewStatut().getName());
                        historyEntry.put("date", h.getExecutionDate().toString());
                        historyEntry.put("user", h.getExecutedBy());
                        historyEntry.put("comments", h.getComments() != null ? h.getComments() : "");
                        return historyEntry;
                    })
                    .toList();

            response.put("success", true);
            response.put("instanceId", instance.getId());
            response.put("businessKey", instance.getBusinessKey());
            response.put("currentStatut", instance.getCurrentStatut().getName());
            response.put("status", instance.getStatus());
            response.put("startDate", instance.getStartDate());
            response.put("endDate", instance.getEndDate());
            response.put("variables", variables);
            response.put("history", history);

        } catch (Exception e) {
            response.put("success", false);
            response.put("error", e.getMessage());
            e.printStackTrace();
        }

        return ResponseEntity.ok(response);
    }

    /**
     * 5. VOIR TOUTES LES DEMANDES EN COURS
     */
    @GetMapping("/active-credit-requests")
    public ResponseEntity<List<Map<String, Object>>> getActiveCreditRequests() {
        try {
            // Récupérer toutes les instances réelles
            List<Instance> instances = instanceService.getAllInstances();

            List<Map<String, Object>> requests = instances.stream()
                    .filter(instance -> !"COMPLETED".equals(instance.getStatus()))
                    .map(instance -> {
                        // Récupérer les variables importantes
                        String client = instance.getVariables().stream()
                                .filter(v -> "client".equals(v.getName()))
                                .findFirst()
                                .map(Variable::getStringValue)
                                .orElse("N/A");

                        Object montant = instance.getVariables().stream()
                                .filter(v -> "montant".equals(v.getName()))
                                .findFirst()
                                .map(Variable::getNumberValue)
                                .orElse(null);

                        Map<String, Object> requestMap = new HashMap<>();
                        requestMap.put("instanceId", instance.getId());
                        requestMap.put("businessKey", instance.getBusinessKey());
                        requestMap.put("client", client);
                        requestMap.put("montant", montant != null ? montant : 0);
                        requestMap.put("currentStatut", instance.getCurrentStatut().getName());
                        requestMap.put("createdDate", instance.getStartDate().toString());
                        return requestMap;
                    })
                    .toList();

            return ResponseEntity.ok(requests);

        } catch (Exception e) {
            // En cas d'erreur, retourner une liste vide
            return ResponseEntity.ok(List.of());
        }
    }
}