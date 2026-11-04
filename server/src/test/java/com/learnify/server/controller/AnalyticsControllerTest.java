package com.learnify.server.controller;

import com.learnify.server.config.SecurityConfig;
import com.learnify.server.entity.Role;
import com.learnify.server.security.AllUsersActive;
import com.learnify.server.security.JwtService;
import com.learnify.server.security.TestTokens;
import com.learnify.server.service.AnalyticsService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Analytics endpoints, including invalid query parameters (TEST_CASES.md: ANA-N-*). */
@WebMvcTest(AnalyticsController.class)
@Import({SecurityConfig.class, JwtService.class, AllUsersActive.class})
class AnalyticsControllerTest {

    @Autowired private MockMvc mvc;
    @Autowired private JwtService jwtService;
    @MockitoBean private AnalyticsService analyticsService;

    private String teacher() {
        return TestTokens.bearer(jwtService, Role.TEACHER);
    }

    @Test
    void topStudentsDefaultsToFive() throws Exception {
        when(analyticsService.getTopStudents(5)).thenReturn(List.of());
        mvc.perform(get("/api/analytics/top-students").header(HttpHeaders.AUTHORIZATION, teacher()))
                .andExpect(status().isOk());
    }

    @Test
    void negativeLimitIsABadRequestNotAServerError() throws Exception {
        // Use the real stream behaviour: Stream.limit(-1) throws IllegalArgumentException
        when(analyticsService.getTopStudents(anyInt())).thenAnswer(inv ->
                List.of().stream().limit(inv.<Integer>getArgument(0)).toList());

        mvc.perform(get("/api/analytics/top-students").param("limit", "-1")
                        .header(HttpHeaders.AUTHORIZATION, teacher()))
                .andExpect(status().isBadRequest());
    }

    @Test
    void nonNumericLimitIsABadRequest() throws Exception {
        mvc.perform(get("/api/analytics/top-students").param("limit", "abc")
                        .header(HttpHeaders.AUTHORIZATION, teacher()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid value for parameter 'limit'."));
    }

    @Test
    void classAverageEndpointWrapsValue() throws Exception {
        when(analyticsService.getClassAverage()).thenReturn(61.5);
        mvc.perform(get("/api/analytics/class-average").header(HttpHeaders.AUTHORIZATION, teacher()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.classAverage").value(61.5));
    }

    @Test
    void analyticsRequireLogin() throws Exception {
        mvc.perform(get("/api/analytics/summary")).andExpect(status().isUnauthorized());
    }
}
