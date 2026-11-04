package com.learnify.server.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

/** Attendance for one subject on one date. */
public record AttendanceSheetRequest(
        @NotBlank(message = "Subject is required")
        String subjectId,

        @NotNull(message = "Date is required")
        LocalDate date,

        @NotEmpty(message = "At least one student is required")
        @Valid
        List<Entry> entries
) {
    public record Entry(
            @NotBlank(message = "Student is required") String studentId,
            @NotNull(message = "Present or absent is required") Boolean present
    ) {}
}
