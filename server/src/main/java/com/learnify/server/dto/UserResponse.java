package com.learnify.server.dto;

import com.learnify.server.entity.User;

/** A staff account as returned by the API. The password hash is deliberately not included. */
public record UserResponse(String id, String username, String fullName, String role, boolean disabled) {
    public static UserResponse from(User u) {
        return new UserResponse(u.getId(), u.getUsername(), u.getFullName(), u.getRole().name(), u.isDisabled());
    }
}
