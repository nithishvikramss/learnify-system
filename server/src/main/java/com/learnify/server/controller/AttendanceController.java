package com.learnify.server.controller;

import com.learnify.server.dto.AttendanceSheetRequest;
import com.learnify.server.dto.AttendanceSummaryDTO;
import com.learnify.server.entity.Attendance;
import com.learnify.server.service.AttendanceService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    private final AttendanceService attendanceService;

    public AttendanceController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    @GetMapping
    public ResponseEntity<List<Attendance>> getSheet(
            @RequestParam String subjectId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(attendanceService.getSheet(subjectId, date));
    }

    @PutMapping
    public ResponseEntity<List<Attendance>> saveSheet(@Valid @RequestBody AttendanceSheetRequest request) {
        return ResponseEntity.ok(attendanceService.saveSheet(request));
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<AttendanceSummaryDTO>> getStudentSummary(@PathVariable String studentId) {
        return ResponseEntity.ok(attendanceService.getStudentSummary(studentId));
    }
}
