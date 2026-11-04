package com.learnify.server.controller;

import com.learnify.server.config.SecurityConfig;
import com.learnify.server.dto.UserResponse;
import com.learnify.server.entity.Role;
import com.learnify.server.security.AllUsersActive;
import com.learnify.server.security.JwtService;
import com.learnify.server.security.TestTokens;
import com.learnify.server.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UserController.class)
@Import({SecurityConfig.class, JwtService.class, AllUsersActive.class})
class UserControllerTest {

    @Autowired private MockMvc mvc;
    @Autowired private JwtService jwtService;
    @MockitoBean private UserService userService;

    private String token(Role role) {
        return TestTokens.bearer(jwtService, role);
    }

    private static final String NEW_USER = "{\"username\":\"asha\",\"fullName\":\"Asha\",\"password\":\"Secret#2026\"}";

    @Test
    void adminCanListUsers() throws Exception {
        when(userService.listUsers()).thenReturn(List.of(new UserResponse("u1", "asha", "Asha", "TEACHER", false)));

        mvc.perform(get("/api/users").header(HttpHeaders.AUTHORIZATION, token(Role.ADMIN)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].username").value("asha"))
                .andExpect(jsonPath("$[0].passwordHash").doesNotExist());
    }

    @Test
    void teacherCannotListOrCreateUsers() throws Exception {
        mvc.perform(get("/api/users").header(HttpHeaders.AUTHORIZATION, token(Role.TEACHER)))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/users").header(HttpHeaders.AUTHORIZATION, token(Role.TEACHER))
                        .contentType(MediaType.APPLICATION_JSON).content(NEW_USER))
                .andExpect(status().isForbidden());
    }

    @Test
    void teacherCannotDisableAccounts() throws Exception {
        mvc.perform(put("/api/users/u1/status").header(HttpHeaders.AUTHORIZATION, token(Role.TEACHER))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"disabled\":true}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void anonymousIsRejected() throws Exception {
        mvc.perform(get("/api/users")).andExpect(status().isUnauthorized());
        mvc.perform(put("/api/users/me/password").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentPassword\":\"a\",\"newPassword\":\"NewSecret#1\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void adminCreatesTeacher() throws Exception {
        when(userService.createTeacher(any())).thenReturn(new UserResponse("u1", "asha", "Asha", "TEACHER", false));

        mvc.perform(post("/api/users").header(HttpHeaders.AUTHORIZATION, token(Role.ADMIN))
                        .contentType(MediaType.APPLICATION_JSON).content(NEW_USER))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.role").value("TEACHER"));
    }

    @Test
    void invalidNewUserGivesFieldErrors() throws Exception {
        mvc.perform(post("/api/users").header(HttpHeaders.AUTHORIZATION, token(Role.ADMIN))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"a\",\"fullName\":\"\",\"password\":\"short\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.username").exists())
                .andExpect(jsonPath("$.fieldErrors.fullName").exists())
                .andExpect(jsonPath("$.fieldErrors.password").value("Password must be 8-72 characters"));
    }

    @Test
    void teacherCanChangeOwnPassword() throws Exception {
        mvc.perform(put("/api/users/me/password").header(HttpHeaders.AUTHORIZATION, token(Role.TEACHER))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentPassword\":\"OldSecret#1\",\"newPassword\":\"NewSecret#1\"}"))
                .andExpect(status().isOk());
        verify(userService).changeOwnPassword(eq("teacher"), any());
    }
}
