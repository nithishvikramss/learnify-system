package com.learnify.server.service;

import com.learnify.server.dto.ChangePasswordRequest;
import com.learnify.server.dto.CreateUserRequest;
import com.learnify.server.dto.UserResponse;
import com.learnify.server.entity.Role;
import com.learnify.server.entity.User;
import com.learnify.server.exception.BadRequestException;
import com.learnify.server.exception.ConflictException;
import com.learnify.server.exception.NotFoundException;
import com.learnify.server.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@Service
public class UserService {

    /** BCrypt only uses the first 72 bytes, and non-ASCII characters take more than one byte. */
    private static final int MAX_PASSWORD_BYTES = 72;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<UserResponse> listUsers() {
        return userRepository.findAll().stream()
                .sorted(Comparator.comparing(User::getUsername))
                .map(UserResponse::from)
                .toList();
    }

    /** New accounts are always teachers; admin accounts come only from the server configuration. */
    public UserResponse createTeacher(CreateUserRequest request) {
        String username = request.username().trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByUsername(username)) {
            throw new ConflictException("Username " + username + " is already in use.");
        }
        checkPasswordBytes(request.password());
        User user = new User(username, passwordEncoder.encode(request.password()),
                request.fullName().trim(), Role.TEACHER);
        return UserResponse.from(userRepository.save(user));
    }

    public UserResponse setDisabled(String id, boolean disabled) {
        User user = userRepository.findById(id).orElseThrow(() -> new NotFoundException("User not found"));
        if (user.getRole() != Role.TEACHER) {
            throw new BadRequestException("Only teacher accounts can be disabled.");
        }
        user.setDisabled(disabled);
        return UserResponse.from(userRepository.save(user));
    }

    public void deleteTeacher(String id) {
        User user = userRepository.findById(id).orElseThrow(() -> new NotFoundException("User not found"));
        if (user.getRole() != Role.TEACHER) {
            throw new BadRequestException("Only teacher accounts can be deleted.");
        }
        userRepository.delete(user);
    }

    public void changeOwnPassword(String username, ChangePasswordRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("User not found"));
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Current password is incorrect.");
        }
        if (request.currentPassword().equals(request.newPassword())) {
            throw new BadRequestException("New password must be different from the current password.");
        }
        checkPasswordBytes(request.newPassword());
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    private static void checkPasswordBytes(String password) {
        if (password.getBytes(StandardCharsets.UTF_8).length > MAX_PASSWORD_BYTES) {
            throw new BadRequestException("Password is too long.");
        }
    }
}
