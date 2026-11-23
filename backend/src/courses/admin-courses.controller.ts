import { Body, Controller, Get, NotFoundException, Optional, Param, ParseUUIDPipe, Patch, Post, UseGuards } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { Type } from "class-transformer";
import { IsDateString, IsEnum, IsIn, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength, ValidateIf } from "class-validator";
import { DataSource } from "typeorm";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { UserRole } from "../auth/entities/user.entity";
import { WebRevalidator } from "../common/web-revalidator";
import { CourseEnrollment } from "./entities/course-enrollment.entity";
import { CourseSession, CourseSessionStatus } from "./entities/course-session.entity";
import { Course } from "./entities/course.entity";

class CreateSessionDto {
  @IsDateString() startsAt!: string;
  @Type(() => Number) @IsInt() @Min(1) @Max(500) capacity!: number;
}

class UpdateSessionDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(500) capacity?: number;
  @IsOptional() @IsEnum(CourseSessionStatus) status?: CourseSessionStatus;
}

class UpdateCourseDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(300) summary?: string;
  @IsOptional() @IsString() @MaxLength(20000) descriptionMarkdown?: string;
  /** Only Zalo group links; null removes it. */
  @IsOptional() @ValidateIf((_, v) => v !== null) @Matches(/^https:\/\/zalo\.me\/[\w\-/]+$/) zaloGroupUrl?: string | null;
}

class UpdateEnrollmentDto {
  @IsIn(["reserved", "confirmed", "cancelled"]) status!: "reserved" | "confirmed" | "cancelled";
}

/** Sessions and enrollments for instructors (spec §10). Seat counts stay consistent on cancel. */
@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.INSTRUCTOR)
export class AdminCoursesController {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @Optional() private readonly revalidator?: WebRevalidator,
  ) {}

  @Get("courses")
  async list() {
    const courses = await this.dataSource.getRepository(Course).find({ relations: { sessions: { enrollments: true } }, order: { title: "ASC" } });
    return courses.map((c) => ({
      id: c.id,
      slug: c.slug,
      title: c.title,
      level: c.level,
      summary: c.summary,
      descriptionMarkdown: c.descriptionMarkdown,
      zaloGroupUrl: c.zaloGroupUrl,
      sessions: (c.sessions ?? [])
        .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
        .map((s) => ({
          id: s.id,
          startsAt: s.startsAt,
          capacity: s.capacity,
          reservedSeats: s.reservedSeats,
          status: s.status,
          enrollments: (s.enrollments ?? []).filter((e) => e.status !== "cancelled").length,
        })),
    }));
  }

  @Patch("courses/:slug")
  async updateCourse(@Param("slug") slug: string, @Body() input: UpdateCourseDto) {
    const repo = this.dataSource.getRepository(Course);
    const course = await repo.findOneBy({ slug });
    if (!course) throw new NotFoundException("Course not found");
    if (input.summary !== undefined) course.summary = input.summary;
    if (input.descriptionMarkdown !== undefined) course.descriptionMarkdown = input.descriptionMarkdown;
    if (input.zaloGroupUrl !== undefined) course.zaloGroupUrl = input.zaloGroupUrl;
    const saved = await repo.save(course);
    await this.revalidator?.revalidate(["courses", `course:${slug}`]);
    return { slug: saved.slug, summary: saved.summary, descriptionMarkdown: saved.descriptionMarkdown, zaloGroupUrl: saved.zaloGroupUrl };
  }

  @Post("courses/:slug/sessions")
  async createSession(@Param("slug") slug: string, @Body() input: CreateSessionDto) {
    const course = await this.dataSource.getRepository(Course).findOneBy({ slug });
    if (!course) throw new NotFoundException("Course not found");
    const repo = this.dataSource.getRepository(CourseSession);
    const session = await repo.save(repo.create({ courseId: course.id, startsAt: new Date(input.startsAt), capacity: input.capacity, reservedSeats: 0, status: CourseSessionStatus.OPEN }));
    await this.revalidator?.revalidate(["courses", `course:${slug}`]);
    return { id: session.id, startsAt: session.startsAt, capacity: session.capacity, reservedSeats: 0, status: session.status };
  }

  @Patch("course-sessions/:id")
  async updateSession(@Param("id", ParseUUIDPipe) id: string, @Body() input: UpdateSessionDto) {
    const repo = this.dataSource.getRepository(CourseSession);
    const session = await repo.findOne({ where: { id }, relations: { course: true } });
    if (!session) throw new NotFoundException("Session not found");
    if (input.capacity !== undefined) session.capacity = input.capacity;
    if (input.status) session.status = input.status;
    const saved = await repo.save(session);
    await this.revalidator?.revalidate(["courses", `course:${session.course.slug}`]);
    return { id: saved.id, startsAt: saved.startsAt, capacity: saved.capacity, reservedSeats: saved.reservedSeats, status: saved.status };
  }

  @Get("course-sessions/:id/enrollments")
  enrollments(@Param("id", ParseUUIDPipe) id: string) {
    return this.dataSource.getRepository(CourseEnrollment).find({ where: { sessionId: id }, order: { createdAt: "ASC" } });
  }

  @Patch("enrollments/:id")
  async updateEnrollment(@Param("id", ParseUUIDPipe) id: string, @Body() input: UpdateEnrollmentDto) {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(CourseEnrollment);
      const enrollment = await repo.findOne({ where: { id }, lock: { mode: "pessimistic_write" } });
      if (!enrollment) throw new NotFoundException("Enrollment not found");
      const wasCancelled = enrollment.status === "cancelled";
      const willCancel = input.status === "cancelled";
      if (wasCancelled !== willCancel) {
        // Cancelling frees the seats; re-opening a cancelled booking takes them again.
        const delta = willCancel ? -enrollment.quantity : enrollment.quantity;
        await manager.query(`UPDATE course_sessions SET "reservedSeats" = GREATEST(0, "reservedSeats" + $1) WHERE id = $2`, [delta, enrollment.sessionId]);
      }
      enrollment.status = input.status;
      return repo.save(enrollment);
    });
  }
}
