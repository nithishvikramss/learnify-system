package com.learnify.server.dto;

/** A student's attendance in one subject. */
public record AttendanceSummaryDTO(String subjectId, String subjectName, int attended, int total,
                                   double percentage, boolean belowMinimum) {}
