package com.learnify.server.exception;

import java.time.Instant;
import java.util.Map;

/** Uniform JSON error body returned by every failed API call. */
public record ErrorResponse(
        Instant timestamp,
        int status,
        String error,
        String message,
        String path,
        Map<String, String> fieldErrors
) {
    public static ErrorResponse of(int status, String error, String message, String path) {
        return new ErrorResponse(Instant.now(), status, error, message, path, Map.of());
    }
}
