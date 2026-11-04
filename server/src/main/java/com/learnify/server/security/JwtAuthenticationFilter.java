package com.learnify.server.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Reads "Authorization: Bearer &lt;token&gt;" and, if the token is valid, marks the request as
 * authenticated with the user's role. Invalid or missing tokens leave the request anonymous,
 * so protected endpoints answer 401.
 * <p>
 * Created inside {@code SecurityConfig} (not a @Component) so it is only registered once.
 */
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtService jwtService;
    private final UserStatusChecker userStatusChecker;

    public JwtAuthenticationFilter(JwtService jwtService, UserStatusChecker userStatusChecker) {
        this.jwtService = jwtService;
        this.userStatusChecker = userStatusChecker;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header != null && header.startsWith(BEARER_PREFIX)) {
            jwtService.verify(header.substring(BEARER_PREFIX.length()))
                    .filter(user -> userStatusChecker.isActive(user.username()))
                    .ifPresent(user -> {
                        var authority = new SimpleGrantedAuthority("ROLE_" + user.role().name());
                        var auth = new UsernamePasswordAuthenticationToken(user.username(), null, List.of(authority));
                        SecurityContextHolder.getContext().setAuthentication(auth);
                    });
        }
        chain.doFilter(request, response);
    }
}
