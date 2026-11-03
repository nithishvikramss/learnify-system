package com.learnify.server.controller;

import com.learnify.server.entity.Subject;
import com.learnify.server.exception.NotFoundException;
import com.learnify.server.service.SubjectService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/subjects")
public class SubjectController {

    private final SubjectService subjectService;

    public SubjectController(SubjectService subjectService) {
        this.subjectService = subjectService;
    }

    @PostMapping
    public ResponseEntity<Subject> addSubject(@Valid @RequestBody Subject subject) {
        return ResponseEntity.status(HttpStatus.CREATED).body(subjectService.addSubject(subject));
    }

    @GetMapping
    public ResponseEntity<List<Subject>> getAllSubjects() {
        return ResponseEntity.ok(subjectService.getAllSubjects());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Subject> getSubjectById(@PathVariable String id) {
        return subjectService.getSubjectById(id)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new NotFoundException("Subject not found"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Subject> updateSubject(@PathVariable String id,
                                                 @Valid @RequestBody Subject subject) {
        return ResponseEntity.ok(subjectService.updateSubject(id, subject));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteSubject(@PathVariable String id,
                                                             @RequestParam(defaultValue = "false") boolean cascade) {
        subjectService.deleteSubject(id, cascade);
        return ResponseEntity.ok(Map.of("message", "Subject deleted successfully"));
    }
}
