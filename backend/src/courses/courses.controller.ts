import { Body, Controller, Get, NotFoundException, Param, Post, Req, UseGuards } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { IsEmail, IsOptional, IsPhoneNumber, IsString, IsUUID, MinLength } from "class-validator";
import { DataSource } from "typeorm";
import { OptionalAuthGuard } from "../auth/optional-auth.guard";
import { CoursesService } from "./courses.service";
import { CourseSession, CourseSessionStatus } from "./entities/course-session.entity";
import { Course } from "./entities/course.entity";

class EnrollDto {
  @IsUUID() sessionId!: string;
  @IsString() @MinLength(2) name!: string;
  @IsPhoneNumber("VN") phone!: string;
  @IsOptional() @IsEmail() email?: string;
}

/** Courses are reserved, then staff contact the student (no online payment in v2, spec §16 Q5). */
@Controller("courses")
export class CoursesController {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly courses: CoursesService,
  ) {}

  @Get()
  async list() {
    const courses = await this.dataSource.getRepository(Course).find({ relations: { sessions: true }, order: { title: "ASC" } });
    return courses.map((course) => ({
      ...this.card(course),
      nextSessionAt: this.upcoming(course.sessions)[0]?.startsAt ?? null,
    }));
  }

  @Get(":slug")
  async detail(@Param("slug") slug: string) {
    const course = await this.dataSource.getRepository(Course).findOne({ where: { slug }, relations: { sessions: true } });
    if (!course) {
      throw new NotFoundException("Course not found");
    }
    return {
      ...this.card(course),
      descriptionMarkdown: course.descriptionMarkdown,
      sessions: this.upcoming(course.sessions).map((session) => ({
        id: session.id,
        startsAt: session.startsAt,
        capacity: session.capacity,
        seatsLeft: Math.max(0, session.capacity - session.reservedSeats),
      })),
    };
  }

  @Post(":slug/enroll")
  @UseGuards(OptionalAuthGuard)
  async enroll(@Param("slug") slug: string, @Body() input: EnrollDto, @Req() request: { user?: { sub?: string } }) {
    const session = await this.dataSource.getRepository(CourseSession).findOne({
      where: { id: input.sessionId, course: { slug } },
      relations: { course: true },
    });
    if (!session) {
      throw new NotFoundException("Course session is unavailable");
    }
    const enrollment = await this.courses.reserveEnrollment({
      sessionId: session.id,
      productVariantId: session.course.productVariantId,
      quantity: 1,
      contactName: input.name,
      contactPhone: input.phone,
      contactEmail: input.email,
      userId: request.user?.sub ?? null,
    });
    return { id: enrollment.id, status: enrollment.status };
  }

  private card(course: Course) {
    return {
      slug: course.slug,
      title: course.title,
      summary: course.summary,
      level: course.level,
      format: course.format,
      durationHours: course.durationHours,
      tuitionVnd: course.tuitionVnd,
      certificateTrack: course.certificateTrack,
    };
  }

  private upcoming(sessions: CourseSession[] = []) {
    const now = Date.now();
    return sessions
      .filter((session) => session.status === CourseSessionStatus.OPEN && new Date(session.startsAt).getTime() >= now)
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  }
}
