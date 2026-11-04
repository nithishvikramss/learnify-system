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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock private UserRepository userRepository;
    private final PasswordEncoder encoder = new BCryptPasswordEncoder(4);
    private UserService userService;

    @BeforeEach
    void setUp() {
        userService = new UserService(userRepository, encoder);
        lenient().when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
    }

    private User teacher(String password) {
        User u = new User("asha", encoder.encode(password), "Asha", Role.TEACHER);
        u.setId("u1");
        return u;
    }

    @Test
    void createsTeacherWithHashedPasswordAndNormalisedUsername() {
        UserResponse created = userService.createTeacher(new CreateUserRequest(" Asha.R ", " Asha R ", "Secret#2026"));

        assertThat(created.username()).isEqualTo("asha.r");
        assertThat(created.fullName()).isEqualTo("Asha R");
        assertThat(created.role()).isEqualTo("TEACHER");
        assertThat(created.disabled()).isFalse();
        verify(userRepository).save(org.mockito.ArgumentMatchers.argThat(u ->
                !u.getPasswordHash().equals("Secret#2026") && encoder.matches("Secret#2026", u.getPasswordHash())));
    }

    @Test
    void duplicateUsernameIsRejected() {
        when(userRepository.existsByUsername("asha")).thenReturn(true);

        assertThatThrownBy(() -> userService.createTeacher(new CreateUserRequest("Asha", "Asha", "Secret#2026")))
                .isInstanceOf(ConflictException.class);
        verify(userRepository, never()).save(any());
    }

    @Test
    void passwordOver72BytesIsRejectedEvenWhenUnder72Characters() {
        String multiByte = "é".repeat(40); // 40 characters, 80 bytes

        assertThatThrownBy(() -> userService.createTeacher(new CreateUserRequest("asha", "Asha", multiByte)))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void teacherCanBeDisabledAndEnabledAgain() {
        User u = teacher("Secret#2026");
        when(userRepository.findById("u1")).thenReturn(Optional.of(u));

        assertThat(userService.setDisabled("u1", true).disabled()).isTrue();
        assertThat(userService.setDisabled("u1", false).disabled()).isFalse();
    }

    @Test
    void adminCannotBeDisabled() {
        User admin = new User("admin", "hash", "Administrator", Role.ADMIN);
        when(userRepository.findById("a1")).thenReturn(Optional.of(admin));

        assertThatThrownBy(() -> userService.setDisabled("a1", true)).isInstanceOf(BadRequestException.class);
        assertThat(admin.isDisabled()).isFalse();
    }

    @Test
    void disablingUnknownUserReturnsNotFound() {
        when(userRepository.findById("nope")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.setDisabled("nope", true)).isInstanceOf(NotFoundException.class);
    }

    @Test
    void teacherCanBeDeletedButAdminCannot() {
        User t = teacher("Secret#2026");
        User admin = new User("admin", "hash", "Administrator", Role.ADMIN);
        when(userRepository.findById("u1")).thenReturn(Optional.of(t));
        when(userRepository.findById("a1")).thenReturn(Optional.of(admin));

        userService.deleteTeacher("u1");

        verify(userRepository).delete(t);
        assertThatThrownBy(() -> userService.deleteTeacher("a1")).isInstanceOf(BadRequestException.class);
        verify(userRepository, never()).delete(admin);
    }

    @Test
    void changePasswordRequiresCorrectCurrentPassword() {
        when(userRepository.findByUsername("asha")).thenReturn(Optional.of(teacher("Secret#2026")));

        assertThatThrownBy(() -> userService.changeOwnPassword("asha", new ChangePasswordRequest("wrong", "NewSecret#1")))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Current password is incorrect.");
        verify(userRepository, never()).save(any());
    }

    @Test
    void changePasswordStoresNewHash() {
        User u = teacher("Secret#2026");
        when(userRepository.findByUsername("asha")).thenReturn(Optional.of(u));

        userService.changeOwnPassword("asha", new ChangePasswordRequest("Secret#2026", "NewSecret#1"));

        assertThat(encoder.matches("NewSecret#1", u.getPasswordHash())).isTrue();
    }

    @Test
    void newPasswordMustDiffer() {
        when(userRepository.findByUsername("asha")).thenReturn(Optional.of(teacher("Secret#2026")));

        assertThatThrownBy(() -> userService.changeOwnPassword("asha", new ChangePasswordRequest("Secret#2026", "Secret#2026")))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void listIsSortedAndNeverExposesHashes() {
        User b = new User("zoe", "hash", "Zoe", Role.TEACHER);
        User a = new User("admin", "hash", "Admin", Role.ADMIN);
        when(userRepository.findAll()).thenReturn(List.of(b, a));

        assertThat(userService.listUsers()).extracting(UserResponse::username).containsExactly("admin", "zoe");
        assertThat(UserResponse.class.getRecordComponents()).noneMatch(c -> c.getName().toLowerCase().contains("password"));
    }
}
