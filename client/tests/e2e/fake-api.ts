import type { Page, Route } from '@playwright/test';

/** In-memory stand-in for the Spring Boot API, following the same JSON contracts and role rules. */
export async function installFakeApi(page: Page) {
  const users: Record<string, { password: string; role: 'ADMIN' | 'TEACHER'; fullName: string }> = {
    admin: { password: 'Admin#2026', role: 'ADMIN', fullName: 'Administrator' },
    teacher: { password: 'Teach#2026', role: 'TEACHER', fullName: 'Teacher' },
  };
  const tokens = new Map<string, string>(); // token -> username
  const students: Record<string, unknown>[] = [
    { id: 's1', name: 'Asha Raman', registerNumber: '23SMS001', department: 'Civil', semester: 3, email: null },
  ];

  const json = (route: Route, status: number, body: unknown) =>
    route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
  const error = (route: Route, status: number, message: string, fieldErrors = {}) =>
    json(route, status, { status, message, fieldErrors });

  // Match only real API calls. A glob like '**/api/**' would also catch the Vite module /src/api/api.ts.
  await page.route(url => url.pathname.startsWith('/api/'), async route => {
    const req = route.request();
    const path = new URL(req.url()).pathname.replace(/^\/api/, '');
    const method = req.method();

    if (path === '/auth/login' && method === 'POST') {
      const { username, password } = req.postDataJSON();
      const user = users[username];
      if (!user || user.password !== password) return error(route, 401, 'Invalid username or password.');
      const token = `fake-token-${username}`;
      tokens.set(token, username);
      return json(route, 200, {
        token, username, fullName: user.fullName, role: user.role,
        expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
      });
    }

    const username = tokens.get((req.headers()['authorization'] ?? '').replace('Bearer ', ''));
    if (!username) return error(route, 401, 'Please log in to continue.');
    const role = users[username].role;

    if (path === '/analytics/summary') {
      return json(route, 200, {
        totalStudents: students.length, totalSubjects: 2, classAverage: 64.5, passPercentage: 75,
        failPercentage: 25, belowThresholdCount: 1, lowestSubject: 'Physics',
        topPerformerName: 'Asha Raman', topPerformerScore: 88,
        subjectAverages: [
          { subjectId: 'ma', subjectName: 'Maths', averageMarks: 70, totalStudents: 4 },
          { subjectId: 'ph', subjectName: 'Physics', averageMarks: 59, totalStudents: 4 },
        ],
        topStudents: [{ studentId: 's1', studentName: 'Asha Raman', department: 'Civil', semester: 3, averageMarks: 88, percentage: 88, rank: 1 }],
        insights: ['Students perform best in Maths with an average of 70%.'],
      });
    }
    if (path === '/students' && method === 'GET') return json(route, 200, students);
    if (path === '/students/page' && method === 'GET') {
      return json(route, 200, { content: students, page: 0, size: 10, totalElements: students.length, totalPages: 1 });
    }
    if (path === '/students' && method === 'POST') {
      if (role !== 'ADMIN') return error(route, 403, 'You do not have permission to perform this action.');
      const body = req.postDataJSON();
      if (students.some(s => s.registerNumber === String(body.registerNumber).toUpperCase())) {
        return error(route, 409, `Register number ${body.registerNumber} is already in use.`);
      }
      const created = { ...body, id: `s${students.length + 1}`, email: body.email || null };
      students.push(created);
      return json(route, 201, created);
    }
    return error(route, 404, 'Endpoint not found.');
  });
}
