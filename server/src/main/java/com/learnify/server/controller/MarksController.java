package com.learnify.server.controller;

import com.learnify.server.dto.MarksDetailDTO;
import com.learnify.server.dto.MarksUpdateRequest;
import com.learnify.server.entity.Marks;
import com.learnify.server.service.MarksService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/marks")
public class MarksController {

    private final MarksService marksService;

    public MarksController(MarksService marksService) {
        this.marksService = marksService;
    }

    @PostMapping
    public ResponseEntity<Marks> addMarks(@Valid @RequestBody Marks marks) {
        return ResponseEntity.status(HttpStatus.CREATED).body(marksService.addOrUpdateMarks(marks));
    }

    @GetMapping
    public ResponseEntity<List<MarksDetailDTO>> getAllMarks() {
        return ResponseEntity.ok(marksService.getAllMarksWithDetails());
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<MarksDetailDTO>> getMarksByStudent(@PathVariable String studentId) {
        return ResponseEntity.ok(marksService.getMarksByStudentWithDetails(studentId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Marks> updateMarks(@PathVariable String id,
                                             @Valid @RequestBody MarksUpdateRequest request) {
        return ResponseEntity.ok(marksService.updateMarks(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteMarks(@PathVariable String id) {
        marksService.deleteMarks(id);
        return ResponseEntity.ok(Map.of("message", "Marks deleted successfully"));
    }

    @GetMapping("/raw")
    public ResponseEntity<List<Marks>> getAllMarksRaw() {
        return ResponseEntity.ok(marksService.getAllMarks());
    }
}
