package com.learnify.server.controller;

import com.learnify.server.dto.AnalyticsSummaryDTO;
import com.learnify.server.dto.PassFailStatsDTO;
import com.learnify.server.dto.SubjectAverageDTO;
import com.learnify.server.dto.TopStudentDTO;
import com.learnify.server.service.AnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/summary")
    public ResponseEntity<AnalyticsSummaryDTO> getSummary() {
        return ResponseEntity.ok(analyticsService.getAnalyticsSummary());
    }

    @GetMapping("/subject-averages")
    public ResponseEntity<List<SubjectAverageDTO>> getSubjectAverages() {
        return ResponseEntity.ok(analyticsService.getAverageMarksPerSubject());
    }

    @GetMapping("/top-students")
    public ResponseEntity<List<TopStudentDTO>> getTopStudents(
            @RequestParam(defaultValue = "5") int limit) {
        return ResponseEntity.ok(analyticsService.getTopStudents(limit));
    }

    @GetMapping("/pass-fail")
    public ResponseEntity<PassFailStatsDTO> getPassFailStats() {
        return ResponseEntity.ok(analyticsService.getPassFailStats());
    }

    @GetMapping("/class-average")
    public ResponseEntity<Map<String, Double>> getClassAverage() {
        return ResponseEntity.ok(Map.of("classAverage", analyticsService.getClassAverage()));
    }

    @GetMapping("/below-threshold")
    public ResponseEntity<List<TopStudentDTO>> getBelowThreshold(
            @RequestParam(defaultValue = "40") double threshold) {
        return ResponseEntity.ok(analyticsService.getStudentsBelowThreshold(threshold));
    }
}
