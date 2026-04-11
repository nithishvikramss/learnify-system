package com.learnify.server.controller;

import com.learnify.server.dto.MarksDetailDTO;
import com.learnify.server.entity.Marks;
import com.learnify.server.service.MarksService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/marks")
public class MarksController {

    private final MarksService marksService;

    public MarksController(MarksService marksService) {
        this.marksService = marksService;
    }

    @PostMapping
    public ResponseEntity<Marks> addMarks(@RequestBody Marks marks) {
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

    @GetMapping("/raw")
    public ResponseEntity<List<Marks>> getAllMarksRaw() {
        return ResponseEntity.ok(marksService.getAllMarks());
    }
}
