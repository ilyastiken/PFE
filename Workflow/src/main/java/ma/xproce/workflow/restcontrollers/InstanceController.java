package ma.xproce.workflow.restcontrollers;

import ma.xproce.workflow.dtos.InstanceDTO;
import ma.xproce.workflow.dtos.InstanceResponseDTO;
import ma.xproce.workflow.entities.Instance;
import ma.xproce.workflow.service.InstanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/instances")
@CrossOrigin("*")
public class InstanceController {

    @Autowired
    private InstanceService instanceService;

    @PostMapping
    public ResponseEntity<InstanceResponseDTO> createInstance(@RequestBody InstanceDTO dto) {
        InstanceResponseDTO response = instanceService.createInstanceAndReturnDTO(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    @PostMapping("/{id}/advance")
    public ResponseEntity<InstanceResponseDTO> advanceInstance(
            @PathVariable Long id,
            @RequestParam String performedBy
    ) {
        InstanceResponseDTO response = instanceService.advanceInstance(id, performedBy);
        return ResponseEntity.ok(response);
    }


    @GetMapping("/{id}")
    public ResponseEntity<InstanceResponseDTO> getInstanceById(@PathVariable Long id) {
        try {
            InstanceResponseDTO instance = instanceService.getInstanceDTOById(id);
            return instance != null ? ResponseEntity.ok(instance) : ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping
    public ResponseEntity<List<InstanceResponseDTO>> getAllInstances() {
        List<InstanceResponseDTO> responses = instanceService.getAllInstancesDTO();
        return ResponseEntity.ok(responses);
    }

}