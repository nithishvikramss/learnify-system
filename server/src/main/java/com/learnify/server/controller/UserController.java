package com.learnify.server.controller;

import com.learnify.server.dto.ChangePasswordRequest;
import com.learnify.server.dto.CreateUserRequest;
import com.learnify.server.dto.UserResponse;
import com.learnify.server.dto.UserStatusRequest;
import com.learnify.server.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<List<UserResponse>> listUsers() {
        return ResponseEntity.ok(userService.listUsers());
    }

    @PostMapping
    public ResponseEntity<UserResponse> createTeacher(@Valid @RequestBody CreateUserRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.createTeacher(request));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<UserResponse> setStatus(@PathVariable String id,
                                                  @Valid @RequestBody UserStatusRequest request) {
        return ResponseEntity.ok(userService.setDisabled(id, request.disabled()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteTeacher(@PathVariable String id) {
        userService.deleteTeacher(id);
        return ResponseEntity.ok(Map.of("message", "Account deleted successfully"));
    }

    @PutMapping("/me/password")
    public ResponseEntity<Map<String, String>> changeOwnPassword(Authentication authentication,
                                                                 @Valid @RequestBody ChangePasswordRequest request) {
        userService.changeOwnPassword(authentication.getName(), request);
        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }
}
