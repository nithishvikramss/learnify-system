package com.learnify.server.security;

import com.learnify.server.config.SecurityConfig;
import com.learnify.server.controller.MarksController;
import com.learnify.server.controller.StudentController;
import com.learnify.server.controller.SubjectController;
import com.learnify.server.entity.Role;
import com.learnify.server.service.MarksService;
import com.learnify.server.service.StudentService;
import com.learnify.server.service.SubjectService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Verifies who may call what (bug B2: the API previously had no authentication at all). */
@WebMvcTest({StudentController.class, SubjectController.class, MarksController.class})
@Import({SecurityConfig.class, JwtService.class, AllUsersActive.class})
class SecurityRulesTest {

    @Autowired private MockMvc mvc;
    @Autowired private JwtService jwtService;

    @MockitoBean private StudentService studentService;
    @MockitoBean private SubjectService subjectService;
    @MockitoBean private MarksService marksService;

    private String token(Role role) {
        return TestTokens.bearer(jwtService, role);
    }

    private static final String STUDENT_JSON = """
            {"name":"Arun","registerNumber":"21CS001","department":"Civil","semester":3}
            """;

    @Test
    void requestWithoutTokenIsRejectedWith401() throws Exception {
        mvc.perform(get("/api/students"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Please log in to continue."));
    }

    @Test
    void tamperedTokenIsRejectedWith401() throws Exception {
        String forged = token(Role.TEACHER) + "x";
        mvc.perform(get("/api/students").header(HttpHeaders.AUTHORIZATION, forged))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void teacherCanReadStudents() throws Exception {
        when(studentService.getAllStudents()).thenReturn(List.of());
        mvc.perform(get("/api/students").header(HttpHeaders.AUTHORIZATION, token(Role.TEACHER)))
                .andExpect(status().isOk());
    }

    @Test
    void teacherCannotCreateStudent() throws Exception {
        mvc.perform(post("/api/students").header(HttpHeaders.AUTHORIZATION, token(Role.TEACHER))
                        .contentType(MediaType.APPLICATION_JSON).content(STUDENT_JSON))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("You do not have permission to perform this action."));
    }

    @Test
    void teacherCannotDeleteSubject() throws Exception {
        mvc.perform(delete("/api/subjects/sub1").header(HttpHeaders.AUTHORIZATION, token(Role.TEACHER)))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminCanDeleteSubject() throws Exception {
        mvc.perform(delete("/api/subjects/sub1").header(HttpHeaders.AUTHORIZATION, token(Role.ADMIN)))
                .andExpect(status().isOk());
    }

    @Test
    void teacherCanDeleteMarks() throws Exception {
        mvc.perform(delete("/api/marks/m1").header(HttpHeaders.AUTHORIZATION, token(Role.TEACHER)))
                .andExpect(status().isOk());
    }

    @Test
    void anonymousCannotWriteMarks() throws Exception {
        mvc.perform(delete("/api/marks/m1"))
                .andExpect(status().isUnauthorized());
    }
}
