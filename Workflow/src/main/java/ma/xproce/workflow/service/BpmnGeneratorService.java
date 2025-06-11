package ma.xproce.workflow.service;

import ma.xproce.workflow.entities.*;
import ma.xproce.workflow.repositories.WorkflowRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class BpmnGeneratorService {
    @Autowired
    private WorkflowRepository workflowRepository;

    private Map<String, ElementPosition> elementPositions = new HashMap<>();

    public String generateBpmn(Workflow workflow) {
        if (workflow == null) {
            throw new IllegalArgumentException("Le workflow ne peut pas être null.");
        }


        elementPositions.clear();

        String processName = workflow.getName();
        String processId = "Process_" + processName.replace(" ", "_");

        // Récupération et tri des statuts
        List<Statut> statuts = workflow.getStatuts();
        if (statuts == null) {
            statuts = new ArrayList<>();
        }
        statuts.sort(Comparator.comparing(s -> s.getPosition() != null ? s.getPosition() : 0));

        // Récupération des transitions
        List<Transition> transitions = workflow.getTransitions();
        if (transitions == null) {
            transitions = new ArrayList<>();
        }

        // Calcul des positions
        calculateElementPositions(statuts);

        StringBuilder bpmn = new StringBuilder();

        // En-tête BPMN
        appendBpmnHeader(bpmn);

        // Processus principal
        bpmn.append("  <bpmn:process id=\"").append(processId).append("\" ");
        bpmn.append("name=\"").append(escapeXml(processName)).append("\" isExecutable=\"true\">\n");

        // Événement de début
        bpmn.append("    <bpmn:startEvent id=\"start\" name=\"Start\" />\n");

        // Génération des tâches pour chaque statut (sauf INITIAL et FINAL)
        generateStatutTasks(bpmn, statuts);

        // Événement de fin
        bpmn.append("    <bpmn:endEvent id=\"end\" name=\"End\" />\n");

        // Génération des flux de séquence
        bpmn.append(generateSequenceFlows(statuts, transitions));

        bpmn.append("  </bpmn:process>\n");

        // Génération du diagramme visuel
        bpmn.append(generateDiagram(processId, statuts));

        bpmn.append("</bpmn:definitions>");
        workflow.setBpmn(bpmn.toString());
        workflowRepository.save(workflow);

        return bpmn.toString();
    }

    private void appendBpmnHeader(StringBuilder bpmn) {
        bpmn.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        bpmn.append("<bpmn:definitions xmlns:bpmn=\"http://www.omg.org/spec/BPMN/20100524/MODEL\" ");
        bpmn.append("xmlns:bpmndi=\"http://www.omg.org/spec/BPMN/20100524/DI\" ");
        bpmn.append("xmlns:dc=\"http://www.omg.org/spec/DD/20100524/DC\" ");
        bpmn.append("xmlns:di=\"http://www.omg.org/spec/DD/20100524/DI\" ");
        bpmn.append("xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" ");
        bpmn.append("id=\"Definitions_1\" ");
        bpmn.append("targetNamespace=\"http://bpmn.io/schema/bpmn\">\n");
    }

    private void generateStatutTasks(StringBuilder bpmn, List<Statut> statuts) {
        for (Statut statut : statuts) {
            if (!"INITIAL".equals(statut.getStatutType()) && !"FINAL".equals(statut.getStatutType())) {
                bpmn.append("    <bpmn:task id=\"task_").append(statut.getId())
                        .append("\" name=\"").append(escapeXml(statut.getName())).append("\" />\n");
            }
        }
    }

    private String generateSequenceFlows(List<Statut> statuts, List<Transition> transitions) {
        StringBuilder flows = new StringBuilder();

        if (statuts.isEmpty()) {
            // ✅ CORRECTION: flow_0 au lieu de flow_direct
            flows.append("    <bpmn:sequenceFlow id=\"flow_0\" sourceRef=\"start\" targetRef=\"end\" />\n");
            return flows.toString();
        }

        if (!transitions.isEmpty()) {
            generateTransitionBasedFlows(flows, transitions);
        } else {
            generateDefaultSequentialFlows(flows, statuts);
        }

        return flows.toString();
    }

    private void generateTransitionBasedFlows(StringBuilder flows, List<Transition> transitions) {
        int flowIndex = 0;
        Set<String> createdConnections = new HashSet<>();

        for (Transition transition : transitions) {
            String sourceRef = determineSourceRef(transition);
            String targetRef = determineTargetRef(transition);
            String connectionKey = sourceRef + "->" + targetRef;

            if (!createdConnections.contains(connectionKey)) {
                String flowId = "flow_" + flowIndex++;

                flows.append("    <bpmn:sequenceFlow id=\"").append(flowId)
                        .append("\" sourceRef=\"").append(sourceRef)
                        .append("\" targetRef=\"").append(targetRef);

                // Ajout du nom si présent
                if (transition.getName() != null && !transition.getName().isEmpty()) {
                    flows.append("\" name=\"").append(escapeXml(transition.getName()));
                }

                // Ajout des conditions
                if (hasConditions(transition)) {
                    flows.append("\">\n");
                    generateConditionExpression(flows, transition);
                    flows.append("    </bpmn:sequenceFlow>\n");
                } else {
                    flows.append("\" />\n");
                }

                createdConnections.add(connectionKey);
            }
        }
    }

    private String determineSourceRef(Transition transition) {
        if (transition.getSourceStatut() != null) {
            if ("INITIAL".equals(transition.getSourceStatut().getStatutType())) {
                return "start";
            } else {
                return "task_" + transition.getSourceStatut().getId();
            }
        }
        return "start";
    }

    private String determineTargetRef(Transition transition) {
        if (transition.getTargetStatut() != null) {
            if ("FINAL".equals(transition.getTargetStatut().getStatutType())) {
                return "end";
            } else {
                return "task_" + transition.getTargetStatut().getId();
            }
        }
        return "end";
    }

    private boolean hasConditions(Transition transition) {
        return (transition.getConditionExpression() != null && !transition.getConditionExpression().isEmpty()) ||
                (transition.getConditions() != null && !transition.getConditions().isEmpty());
    }

    private void generateConditionExpression(StringBuilder flows, Transition transition) {
        String condition = null;

        // Priorité à conditionExpression (legacy)
        if (transition.getConditionExpression() != null && !transition.getConditionExpression().isEmpty()) {
            condition = transition.getConditionExpression();
        }
        // Sinon, utiliser les conditions liées
        else if (transition.getConditions() != null && !transition.getConditions().isEmpty()) {
            List<String> expressions = transition.getConditions().stream()
                    .filter(c -> c.isActive() && c.getExpression() != null)
                    .map(Condition::getExpression)
                    .toList();

            if (!expressions.isEmpty()) {
                condition = String.join(" AND ", expressions);
            }
        }

        if (condition != null) {
            flows.append("      <bpmn:conditionExpression xsi:type=\"bpmn:tFormalExpression\">")
                    .append(escapeXml(condition)).append("</bpmn:conditionExpression>\n");
        }
    }

    // ✅ CORRECTION PRINCIPALE: generateDefaultSequentialFlows
    private void generateDefaultSequentialFlows(StringBuilder flows, List<Statut> statuts) {
        List<Statut> normalStatuts = statuts.stream()
                .filter(s -> !"INITIAL".equals(s.getStatutType()) && !"FINAL".equals(s.getStatutType()))
                .sorted(Comparator.comparing(s -> s.getPosition() != null ? s.getPosition() : 0))
                .toList();

        if (!normalStatuts.isEmpty()) {
            // Start -> First task (flow_0)
            flows.append("    <bpmn:sequenceFlow id=\"flow_0\" sourceRef=\"start\" targetRef=\"task_")
                    .append(normalStatuts.get(0).getId()).append("\" />\n");

            // Task to task connections (flow_1, flow_2, etc.)
            for (int i = 0; i < normalStatuts.size() - 1; i++) {
                int flowIndex = i + 1; // flow_1, flow_2, etc.
                flows.append("    <bpmn:sequenceFlow id=\"flow_").append(flowIndex)
                        .append("\" sourceRef=\"task_").append(normalStatuts.get(i).getId())
                        .append("\" targetRef=\"task_").append(normalStatuts.get(i + 1).getId()).append("\" />\n");
            }

            // Last task -> End (flow_X)
            int lastFlowIndex = normalStatuts.size(); // Si 2 tâches, alors flow_2
            flows.append("    <bpmn:sequenceFlow id=\"flow_").append(lastFlowIndex)
                    .append("\" sourceRef=\"task_").append(normalStatuts.get(normalStatuts.size() - 1).getId())
                    .append("\" targetRef=\"end\" />\n");
        }
    }

    private String generateDiagram(String processId, List<Statut> statuts) {
        StringBuilder diagram = new StringBuilder();

        diagram.append("  <bpmndi:BPMNDiagram id=\"BPMNDiagram_1\">\n");
        diagram.append("    <bpmndi:BPMNPlane id=\"BPMNPlane_1\" bpmnElement=\"").append(processId).append("\">\n");

        generateShapes(diagram, statuts);
        generateEdges(diagram, statuts);

        diagram.append("    </bpmndi:BPMNPlane>\n");
        diagram.append("  </bpmndi:BPMNDiagram>\n");

        return diagram.toString();
    }

    private void generateShapes(StringBuilder diagram, List<Statut> statuts) {
        // Start event
        ElementPosition startPos = elementPositions.get("start");
        diagram.append("      <bpmndi:BPMNShape id=\"start_di\" bpmnElement=\"start\">\n");
        diagram.append("        <dc:Bounds x=\"").append(startPos.x).append("\" y=\"")
                .append(startPos.y).append("\" width=\"36\" height=\"36\" />\n");
        diagram.append("      </bpmndi:BPMNShape>\n");

        // Tasks
        for (Statut statut : statuts) {
            if (!"INITIAL".equals(statut.getStatutType()) && !"FINAL".equals(statut.getStatutType())) {
                String taskId = "task_" + statut.getId();
                ElementPosition pos = elementPositions.get(taskId);
                if (pos != null) {
                    diagram.append("      <bpmndi:BPMNShape id=\"").append(taskId).append("_di\" bpmnElement=\"").append(taskId).append("\">\n");
                    diagram.append("        <dc:Bounds x=\"").append(pos.x).append("\" y=\"")
                            .append(pos.y).append("\" width=\"100\" height=\"80\" />\n");
                    diagram.append("      </bpmndi:BPMNShape>\n");
                }
            }
        }

        // End event
        ElementPosition endPos = elementPositions.get("end");
        diagram.append("      <bpmndi:BPMNShape id=\"end_di\" bpmnElement=\"end\">\n");
        diagram.append("        <dc:Bounds x=\"").append(endPos.x).append("\" y=\"")
                .append(endPos.y).append("\" width=\"36\" height=\"36\" />\n");
        diagram.append("      </bpmndi:BPMNShape>\n");
    }

    // ✅ CORRECTION PRINCIPALE: generateEdges
    private void generateEdges(StringBuilder diagram, List<Statut> statuts) {
        List<Statut> taskStatuts = statuts.stream()
                .filter(s -> !"INITIAL".equals(s.getStatutType()) && !"FINAL".equals(s.getStatutType()))
                .sorted(Comparator.comparing(s -> s.getPosition() != null ? s.getPosition() : 0))
                .toList();

        if (taskStatuts.isEmpty()) {
            generateDirectEdge(diagram);
            return;
        }

        // Start -> First task (flow_0_di au lieu de flow_start_di)
        ElementPosition startPos = elementPositions.get("start");
        ElementPosition firstTaskPos = elementPositions.get("task_" + taskStatuts.get(0).getId());

        diagram.append("      <bpmndi:BPMNEdge id=\"flow_0_di\" bpmnElement=\"flow_0\">\n");
        diagram.append("        <di:waypoint x=\"").append(startPos.x + 36).append("\" y=\"")
                .append(startPos.y + 18).append("\" />\n");
        diagram.append("        <di:waypoint x=\"").append(firstTaskPos.x).append("\" y=\"")
                .append(firstTaskPos.y + 40).append("\" />\n");
        diagram.append("      </bpmndi:BPMNEdge>\n");

        // Task to task connections (flow_1_di, flow_2_di, etc.)
        for (int i = 0; i < taskStatuts.size() - 1; i++) {
            ElementPosition currentPos = elementPositions.get("task_" + taskStatuts.get(i).getId());
            ElementPosition nextPos = elementPositions.get("task_" + taskStatuts.get(i + 1).getId());

            int flowIndex = i + 1; // flow_1, flow_2, etc.
            diagram.append("      <bpmndi:BPMNEdge id=\"flow_").append(flowIndex).append("_di\" bpmnElement=\"flow_").append(flowIndex).append("\">\n");
            diagram.append("        <di:waypoint x=\"").append(currentPos.x + 100).append("\" y=\"")
                    .append(currentPos.y + 40).append("\" />\n");
            diagram.append("        <di:waypoint x=\"").append(nextPos.x).append("\" y=\"")
                    .append(nextPos.y + 40).append("\" />\n");
            diagram.append("      </bpmndi:BPMNEdge>\n");
        }

        // Last task -> End (flow_X_di au lieu de flow_end_di)
        ElementPosition lastTaskPos = elementPositions.get("task_" + taskStatuts.get(taskStatuts.size() - 1).getId());
        ElementPosition endPos = elementPositions.get("end");

        int lastFlowIndex = taskStatuts.size(); // Si 2 tâches, alors flow_2
        diagram.append("      <bpmndi:BPMNEdge id=\"flow_").append(lastFlowIndex).append("_di\" bpmnElement=\"flow_").append(lastFlowIndex).append("\">\n");
        diagram.append("        <di:waypoint x=\"").append(lastTaskPos.x + 100).append("\" y=\"")
                .append(lastTaskPos.y + 40).append("\" />\n");
        diagram.append("        <di:waypoint x=\"").append(endPos.x).append("\" y=\"")
                .append(endPos.y + 18).append("\" />\n");
        diagram.append("      </bpmndi:BPMNEdge>\n");
    }

    // ✅ CORRECTION: generateDirectEdge
    private void generateDirectEdge(StringBuilder diagram) {
        ElementPosition startPos = elementPositions.get("start");
        ElementPosition endPos = elementPositions.get("end");

        // flow_0_di au lieu de flow_direct_di
        diagram.append("      <bpmndi:BPMNEdge id=\"flow_0_di\" bpmnElement=\"flow_0\">\n");
        diagram.append("        <di:waypoint x=\"").append(startPos.x + 36).append("\" y=\"")
                .append(startPos.y + 18).append("\" />\n");
        diagram.append("        <di:waypoint x=\"").append(endPos.x).append("\" y=\"")
                .append(endPos.y + 18).append("\" />\n");
        diagram.append("      </bpmndi:BPMNEdge>\n");
    }

    private void calculateElementPositions(List<Statut> statuts) {
        int currentX = 150;
        int standardY = 100;
        int spacing = 150;

        // Position start
        elementPositions.put("start", new ElementPosition(currentX, standardY, 36, 36));
        currentX += spacing;

        // Positions des statuts (sauf INITIAL et FINAL)
        for (Statut statut : statuts) {
            if (!"INITIAL".equals(statut.getStatutType()) && !"FINAL".equals(statut.getStatutType())) {
                String elementId = "task_" + statut.getId();
                elementPositions.put(elementId, new ElementPosition(currentX, standardY - 20, 100, 80));
                currentX += spacing;
            }
        }

        // Position end
        elementPositions.put("end", new ElementPosition(currentX, standardY, 36, 36));
    }

    private String escapeXml(String input) {
        if (input == null) return "";
        return input.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&apos;");
    }

    private static class ElementPosition {
        int x, y, width, height;

        ElementPosition(int x, int y, int width, int height) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
        }
    }
}