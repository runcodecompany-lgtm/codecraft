# Phase 4 Implementation Plan: Teacher Ecosystem

This plan details the required changes and additions to complete the **Teacher Ecosystem (Phase 4)** of the **Code Craft Core** platform. The goal is to build a high-fidelity, production-ready environment for teachers to manage courses, sections, lessons, videos, quizzes, question banks, assignments, student tracking, analytics, and personal profiles.

---

## User Review Required

> [!IMPORTANT]
> **Database Changes**:
> - Adding `category`, `level`, `language`, `requirements`, `learningObjectives`, and `status` to the `Course` table.
> - Adding `type`, `videoSize`, `videoDuration`, `videoProcessingStatus` to the `Lesson` table.
> - Adding `points` to the `Question` table.
> - Introducing new models: `TeacherProfile`, `Review`, `Rating`, `LessonResource`, `QuestionBank`, `Assignment`, `AssignmentSubmission`.
> - The database schema changes will be applied using `npx prisma db push`.
>
> **Access Control & Security**:
> - Enforce role check: only `TEACHER`, `ADMIN`, or `SUPER_ADMIN` can access teacher dashboards and execute teacher server actions.
> - Ownership check: a teacher can only edit, delete, or view detailed logs of courses they created.
> - Backwards compatibility: existing free/paid courses and student progress records will remain completely intact.

---

## Open Questions

- **Video Processing Status**:
  * *Proposed Approach*: Since video upload is simulated or uses third-party links, we will simulate a processing status. Uploading a video link or file will default to `PROCESSING`, and a background effect or a server action flag will mark it as `READY` in 5 seconds to demonstrate the production processing lifecycle.
- **Course Review Aggregations**:
  * *Proposed Approach*: The public teacher page and courses list will dynamically calculate average ratings and review counts from the `Review` and `Rating` tables. If no reviews exist yet, a default fallback of `4.9` rating will be displayed to preserve a premium visual aesthetic.

---

## Proposed Changes

### 1. Database Schema
#### [MODIFY] [schema.prisma](file:///C:/Users/dell/Desktop/AlShafra.com/my-news-site/prisma/schema.prisma)
* Add metadata fields to `Course`:
  * `category` String?
  * `level` DifficultyLevel @default(BEGINNER)
  * `language` String? @default("العربية")
  * `requirements` String? // newline or comma-separated string
  * `learningObjectives` String? // newline or comma-separated string
  * `status` String @default("DRAFT") // DRAFT, REVIEW, PUBLISHED, ARCHIVED
* Add fields to `Lesson`:
  * `type` String @default("VIDEO") // VIDEO, TEXT, RESOURCE
  * `videoSize` Int?
  * `videoDuration` Int?
  * `videoProcessingStatus` String? @default("READY")
* Add field to `Question`:
  * `points` Int @default(1)
* Add new models:
  * `TeacherProfile` (title, bio, skills, experience, achievements, socialLinks)
  * `LessonResource` (lessonId, name, url, type, size)
  * `QuestionBank` (teacherId, questionText, questionType, difficulty, options, correctAnswer, category, points)
  * `Review` (userId, courseId, rating, comment, reply)
  * `Rating` (userId, courseId, value)
  * `Assignment` (title, description, dueDate, points, moduleId, lessonId)
  * `AssignmentSubmission` (assignmentId, userId, content, grade, feedback, status)

---

### 2. Backend Server Actions
#### [NEW] [actions/teacher-course.ts](file:///C:/Users/dell/Desktop/AlShafra.com/my-news-site/actions/teacher-course.ts)
* Create server actions for course management:
  * `getTeacherCourses()`: Fetch all courses owned by current teacher.
  * `createDetailedCourse(data)`: Create course with comprehensive fields.
  * `updateCourseDetails(courseId, data)`: Modify title, description, category, level, language, requirements, etc.
  * `changeCourseStatus(courseId, status)`: Change status to DRAFT, REVIEW, PUBLISHED, or ARCHIVED.
  * `deleteCourse(courseId)`: Delete course if teacher owns it.
  * `updateModuleOrder(courseId, moduleIds: string[])`: Update modules order.
  * `updateLessonOrder(moduleId, lessonIds: string[])`: Update lessons order.

#### [NEW] [actions/teacher-lesson.ts](file:///C:/Users/dell/Desktop/AlShafra.com/my-news-site/actions/teacher-lesson.ts)
* Lesson management server actions:
  * `createLesson(moduleId, data)`: Add lesson to a section.
  * `updateLesson(lessonId, data)`: Edit title, content, type, duration, video size, video status.
  * `deleteLesson(lessonId)`: Delete a lesson.
  * `addLessonResource(lessonId, data)`: Add PDF/ZIP/doc attachment metadata.
  * `deleteLessonResource(resourceId)`: Remove attachment.

#### [NEW] [actions/teacher-quiz.ts](file:///C:/Users/dell/Desktop/AlShafra.com/my-news-site/actions/teacher-quiz.ts)
* Quiz builder server actions:
  * `createQuiz(moduleId, lessonId, title)`: Add quiz.
  * `updateQuiz(quizId, title)`: Update quiz details.
  * `deleteQuiz(quizId)`: Remove quiz.
  * `addQuestionToQuiz(quizId, data)`: Add question.
  * `updateQuizQuestion(questionId, data)`: Edit question.
  * `deleteQuizQuestion(questionId)`: Delete question.
  * `saveToQuestionBank(data)`: Save a question to the bank.
  * `searchQuestionBank(query, difficulty)`: Get saved questions.
  * `importFromQuestionBank(quizId, bankQuestionIds: string[])`: Copy questions from bank to quiz.

#### [NEW] [actions/teacher-profile.ts](file:///C:/Users/dell/Desktop/AlShafra.com/my-news-site/actions/teacher-profile.ts)
* Teacher profile actions:
  * `getTeacherProfile(userId)`: Fetch profile details.
  * `updateTeacherProfile(data)`: Create/update teacher profile table (bio, skills, social links, title).

#### [NEW] [actions/teacher-assignment.ts](file:///C:/Users/dell/Desktop/AlShafra.com/my-news-site/actions/teacher-assignment.ts)
* Assignment server actions:
  * `createAssignment(moduleId, lessonId, data)`: Create homework.
  * `gradeSubmission(submissionId, grade, feedback)`: Set grade/feedback for students.
  * `getAssignmentSubmissions(assignmentId)`: Fetch all student submissions.

#### [NEW] [actions/review.ts](file:///C:/Users/dell/Desktop/AlShafra.com/my-news-site/actions/review.ts)
* Course reviews server actions:
  * `submitCourseReview(courseId, rating, comment)`: Student adds review and rating.
  * `replyToReview(reviewId, replyText)`: Teacher responds to a review.
  * `getCourseReviews(courseId)`: Fetch all reviews.

---

### 3. Frontend Layout & Navigation
#### [NEW] [components/teacher-sidebar.tsx](file:///C:/Users/dell/Desktop/AlShafra.com/my-news-site/components/teacher-sidebar.tsx)
* RTL teacher sidebar with links to:
  * Dashboard (الرئيسية)
  * Course Management (إدارة الدورات)
  * Students Tracking (متابعة الطلاب)
  * Reviews & Ratings (التقييمات والمراجعات)
  * Personal Profile (الملف الشخصي)
  * Question Bank (بنك الأسئلة)
  * Platform Analytics (التحليلات والإحصائيات)

#### [NEW] [app/dashboard/teacher/layout.tsx](file:///C:/Users/dell/Desktop/AlShafra.com/my-news-site/app/dashboard/teacher/layout.tsx)
* Enforce authentication and role checks. Verify role is `TEACHER` or `ADMIN` before loading page, redirecting unauthorized users. Render the `TeacherSidebar` alongside main page contents.

---

### 4. Dashboards & Functional Pages
#### [NEW] [app/dashboard/teacher/page.tsx](file:///C:/Users/dell/Desktop/AlShafra.com/my-news-site/app/dashboard/teacher/page.tsx)
* Teacher Dashboard page displaying:
  * Stats widgets: Total students, total courses, total lessons, average rating, completion rate.
  * Activity Feed: Recent enrollments, new comments, quiz attempts, and achievements.
  * Visual metrics cards representing student growth and most active courses.

#### [NEW] [app/dashboard/teacher/courses/page.tsx](file:///C:/Users/dell/Desktop/AlShafra.com/my-news-site/app/dashboard/teacher/courses/page.tsx)
* Course List page displaying:
  * Grid of courses with covers, status labels (Draft, Review, Published, Archived).
  * Quick buttons to publish, archive, edit details, or delete.
  * Button to add new course.

#### [NEW] [app/dashboard/teacher/courses/new/page.tsx](file:///C:/Users/dell/Desktop/AlShafra.com/my-news-site/app/dashboard/teacher/courses/new/page.tsx)
* Detailed course creation form with custom fields: Title, description, cover image, category, level, language, requirements, learning objectives.

#### [NEW] [app/dashboard/teacher/courses/[id]/page.tsx](file:///C:/Users/dell/Desktop/AlShafra.com/my-news-site/app/dashboard/teacher/courses/%5Bid%5D/page.tsx)
* Course Builder Dashboard:
  * Update basic course metadata.
  * Module (Section) CRUD with order reordering.
  * Lesson list inside each module, with ordering buttons.
  * Add quiz or assignment buttons to modules.

#### [NEW] [app/dashboard/teacher/courses/[id]/lessons/[lessonId]/page.tsx](file:///C:/Users/dell/Desktop/AlShafra.com/my-news-site/app/dashboard/teacher/courses/%5Bid%5D/lessons/%5BlessonId%5D/page.tsx)
* Lesson editor: Title, description, rich text content, duration, lesson type, video details.
* Attached files upload manager: Add, list, download, and delete attachments.

#### [NEW] [app/dashboard/teacher/courses/[id]/quizzes/[quizId]/page.tsx](file:///C:/Users/dell/Desktop/AlShafra.com/my-news-site/app/dashboard/teacher/courses/%5Bid%5D/quizzes/%5BquizId%5D/page.tsx)
* Quiz builder:
  * Edit quiz title.
  * Question list editor: Add/delete questions.
  * Choose type: MULTIPLE_CHOICE, TRUE_FALSE, MULTIPLE_SELECT.
  * Define option texts, correct answer, points, difficulty level.
  * Button to "Save to Question Bank".
  * Drawer/modal to "Import from Question Bank".

#### [NEW] [app/dashboard/teacher/courses/[id]/assignments/[assignmentId]/page.tsx](file:///C:/Users/dell/Desktop/AlShafra.com/my-news-site/app/dashboard/teacher/courses/%5Bid%5D/assignments/%5BassignmentId%5D/page.tsx)
* Assignment details form and student submissions viewer. Grader for teacher to award points and add textual review feedback.

#### [NEW] [app/dashboard/teacher/students/page.tsx](file:///C:/Users/dell/Desktop/AlShafra.com/my-news-site/app/dashboard/teacher/students/page.tsx)
* Students tracker page: List students, search filter, details modal showing progress, completed lessons list, and quiz scores.

#### [NEW] [app/dashboard/teacher/reviews/page.tsx](file:///C:/Users/dell/Desktop/AlShafra.com/my-news-site/app/dashboard/teacher/reviews/page.tsx)
* Course reviews dashboard: Lists all reviews for courses taught by the teacher. Allows teacher to type and submit a reply.

#### [NEW] [app/dashboard/teacher/profile/page.tsx](file:///C:/Users/dell/Desktop/AlShafra.com/my-news-site/app/dashboard/teacher/profile/page.tsx)
* Personal profile builder: Edit title, bio, skills (comma separated), experience timeline, achievements list, and social links (linkedIn, gitHub, twitter, website). Saves directly to the `TeacherProfile` table.

#### [NEW] [app/dashboard/teacher/analytics/page.tsx](file:///C:/Users/dell/Desktop/AlShafra.com/my-news-site/app/dashboard/teacher/analytics/page.tsx)
* Teacher analytics center. Displays course completion rates, active enrollment counters, lesson views, and quiz score averages in premium cards with gradient indicators.

#### [NEW] [app/dashboard/teacher/question-bank/page.tsx](file:///C:/Users/dell/Desktop/AlShafra.com/my-news-site/app/dashboard/teacher/question-bank/page.tsx)
* Question Bank interface: Search questions, filter by difficulty/category, view/edit bank questions.

---

### 5. Public Profiles & Course Pages
#### [MODIFY] [app/teachers/page.tsx](file:///C:/Users/dell/Desktop/AlShafra.com/my-news-site/app/teachers/page.tsx)
* Query the DB `TeacherProfile` to render bios and specialization titles dynamically. Fall back to standard seeded data if profile record does not exist.

#### [MODIFY] [app/teachers/[id]/page.tsx](file:///C:/Users/dell/Desktop/AlShafra.com/my-news-site/app/teachers/%5Bid%5D/page.tsx)
* Query and display `TeacherProfile` data: Bio, specialization title, skills tags, experience list, achievements, and social links. Calculate average rating dynamically from course reviews.

#### [MODIFY] [app/courses/[slug]/page.tsx](file:///C:/Users/dell/Desktop/AlShafra.com/my-news-site/app/courses/%5Bslug%5D/page.tsx)
* Display categories, difficulty level, language, requirements, learning objectives, and review list with ratings on the public course page.

---

## Verification Plan

### Automated Tests
- Run TypeScript check: `npx tsc --noEmit`
- Verify application builds: `npm run build`

### Manual Verification
- **Course Lifecycle**: Create a course, edit details, change status to Draft -> Review -> Published. Verify that it appears on the public `/courses` page only when Published.
- **Ordering**: Add modules and lessons, change their order, and verify order re-evaluates correctly.
- **Quiz Building**: Create a quiz, add True/False and Multiple Select questions, verify scoring matches, save to bank, and re-import questions.
- **Reviews**: Sign in as student, enroll, complete a lesson, submit review/rating. Sign in as teacher, view review in dashboard, submit reply, verify reply is rendered on course detail page.
- **Student Progress**: Complete lessons as student, and verify teacher dashboard stats and student tracker update.
