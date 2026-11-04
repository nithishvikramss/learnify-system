package com.learnify.server.controller;

import com.learnify.server.config.SecurityConfig;
import com.learnify.server.entity.Role;
import com.learnify.server.security.AllUsersActive;
import com.learnify.server.security.JwtService;
import com.learnify.server.security.TestTokens;
import com.learnify.server.service.AttendanceService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AttendanceController.class)
@Import({SecurityConfig.class, JwtService.class, AllUsersActive.class})
class AttendanceControllerTest {

    @Autowired private MockMvc mvc;
    @Autowired private JwtService jwtService;
    @MockitoBean private AttendanceService attendanceService;

    private String teacher() {
        return TestTokens.bearer(jwtService, Role.TEACHER);
    }

    private static final String SHEET = "{\"subjectId\":\"sub1\",\"date\":\"2026-11-04\",\"entries\":[{\"studentId\":\"s1\",\"present\":true}]}";

    @Test
    void teacherCanSaveAttendance() throws Exception {
        mvc.perform(put("/api/attendance").header(HttpHeaders.AUTHORIZATION, teacher())
                        .contentType(MediaType.APPLICATION_JSON).content(SHEET))
                .andExpect(status().isOk());
    }

    @Test
    void anonymousCannotSaveOrRead() throws Exception {
        mvc.perform(put("/api/attendance").contentType(MediaType.APPLICATION_JSON).content(SHEET))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/attendance/student/s1")).andExpect(status().isUnauthorized());
    }

    @Test
    void missingFieldsGiveFieldErrors() throws Exception {
        mvc.perform(put("/api/attendance").header(HttpHeaders.AUTHORIZATION, teacher())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"subjectId\":\"\",\"entries\":[]}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.subjectId").exists())
                .andExpect(jsonPath("$.fieldErrors.date").exists())
                .andExpect(jsonPath("$.fieldErrors.entries").exists());
    }

    @Test
    void invalidDateIsABadRequest() throws Exception {
        mvc.perform(get("/api/attendance").param("subjectId", "sub1").param("date", "not-a-date")
                        .header(HttpHeaders.AUTHORIZATION, teacher()))
                .andExpect(status().isBadRequest());
    }
}
