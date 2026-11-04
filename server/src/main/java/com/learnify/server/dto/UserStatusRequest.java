package com.learnify.server.dto;

import jakarta.validation.constraints.NotNull;

public record UserStatusRequest(@NotNull(message = "disabled is required") Boolean disabled) {}
