package com.learnify.server.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;

/** Body for PUT /api/marks/{id}: only the scores can change, not the student or subject. */
public record MarksUpdateRequest(
        @DecimalMin(value = "0", message = "Internal marks cannot be negative")
        @DecimalMax(value = "200", message = "Internal marks are too large")
        double internalMarks,

        @DecimalMin(value = "0", message = "External marks cannot be negative")
        @DecimalMax(value = "200", message = "External marks are too large")
        double externalMarks
) {}
