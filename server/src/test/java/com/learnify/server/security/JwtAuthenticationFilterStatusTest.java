package com.learnify.server.security;

import com.learnify.server.entity.Role;
import com.learnify.server.entity.User;
import com.learnify.server.repository.UserRepository;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/** A token stops working as soon as its account is disabled or removed. */
class JwtAuthenticationFilterStatusTest {

    private final JwtService jwt = new JwtService("test-secret-that-is-definitely-longer-than-32-bytes", 60);
    private final UserRepository users = mock(UserRepository.class);
    private final JwtAuthenticationFilter filter =
            new JwtAuthenticationFilter(jwt, new DatabaseUserStatusChecker(users));

    @AfterEach
    void clear() {
        SecurityContextHolder.clearContext();
    }

    private boolean authenticated(User tokenFor) throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + jwt.generateToken(tokenFor));
        filter.doFilter(request, new MockHttpServletResponse(), mock(FilterChain.class));
        return SecurityContextHolder.getContext().getAuthentication() != null;
    }

    @Test
    void activeUserIsAuthenticated() throws Exception {
        User u = new User("asha", "hash", "Asha", Role.TEACHER);
        when(users.findByUsername("asha")).thenReturn(Optional.of(u));

        assertThat(authenticated(u)).isTrue();
    }

    @Test
    void disabledUsersExistingTokenIsRejected() throws Exception {
        User u = new User("asha", "hash", "Asha", Role.TEACHER);
        u.setDisabled(true);
        when(users.findByUsername("asha")).thenReturn(Optional.of(u));

        assertThat(authenticated(u)).isFalse();
    }

    @Test
    void removedUsersTokenIsRejected() throws Exception {
        User u = new User("asha", "hash", "Asha", Role.TEACHER);
        when(users.findByUsername("asha")).thenReturn(Optional.empty());

        assertThat(authenticated(u)).isFalse();
    }
}
