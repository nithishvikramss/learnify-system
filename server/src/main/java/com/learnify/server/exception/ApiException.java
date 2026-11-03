package com.learnify.server.exception;

import org.springframework.http.HttpStatus;

/**
 * Base class for errors that should be returned to the client with a specific HTTP status
 * and a user-friendly message.
 */
public class ApiException extends RuntimeException {

    private final HttpStatus status;

    public ApiException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() { return status; }
}
