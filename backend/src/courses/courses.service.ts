import { BadRequestException, Injectable, NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource, EntityManager } from "typeorm";
import { CourseEnrollment } from "./entities/course-enrollment.entity";
import {
  CourseSession,
  CourseSessionStatus,
} from "./entities/course-session.entity";
import { nextWeekendMornings, WORKSHOP_CAPACITY } from "./workshop-schedule";

export interface ReserveEnrollmentInput {
  contactEmail?: string;
  contactName: string;
  contactPhone: string;
  orderId?: string;
  organization?: string | null;
  note?: string | null;
  productVariantId: string;
  quantity: number;
  sessionId: string;
  /** Signed-in account reserving the seat. */
  userId?: string | null;
}

@Injectable()
export class CoursesService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Makes sure a workshop has its coming Saturday and Sunday 9:00 sessions (30 seats, open) and
   * returns those two times. Sessions an admin already has (even closed ones) are left as they are.
   */
  async ensureWorkshopSessions(courseId: string, now = new Date()): Promise<Date[]> {
    const mornings = nextWeekendMornings(now);
    await this.dataSource.transaction(async (manager) => {
      // One request at a time per course, so concurrent page views cannot create duplicates.
      await manager.query("SELECT pg_advisory_xact_lock(hashtext($1))", [courseId]);
      const repo = manager.getRepository(CourseSession);
      for (const startsAt of mornings) {
        if (await repo.findOne({ where: { courseId, startsAt } })) continue;
        await repo.save(repo.create({ courseId, startsAt, capacity: WORKSHOP_CAPACITY, reservedSeats: 0, status: CourseSessionStatus.OPEN }));
      }
    });
    return mornings;
  }

  async reserveEnrollment(
    input: ReserveEnrollmentInput,
  ): Promise<CourseEnrollment> {
    return this.dataSource.transaction(async (manager) => {
      return this.reserveEnrollmentWithManager(manager, input);
    });
  }

  async reserveEnrollmentWithManager(
    manager: EntityManager,
    input: ReserveEnrollmentInput,
  ): Promise<CourseEnrollment> {
    if (!Number.isInteger(input.quantity) || input.quantity < 1) {
      throw new BadRequestException("Quantity must be a positive integer");
    }

    const sessionRepository = manager.getRepository(CourseSession);
    const session = await sessionRepository
      .createQueryBuilder("session")
      .leftJoinAndSelect("session.course", "course")
      .where("session.id = :id", { id: input.sessionId })
      .setLock("pessimistic_write", undefined, ['"session"'])
      .getOne();

    if (!session || session.status !== CourseSessionStatus.OPEN) {
      throw new NotFoundException("Course session is unavailable");
    }

    if (session.course.productVariantId !== input.productVariantId) {
      throw new NotFoundException("Course session is unavailable");
    }

    if (session.capacity - session.reservedSeats < input.quantity) {
      throw new ConflictException("Course session no longer has enough seats");
    }

    session.reservedSeats += input.quantity;
    await sessionRepository.save(session);
    const enrollmentRepository = manager.getRepository(CourseEnrollment);

    return enrollmentRepository.save(
      enrollmentRepository.create({
        contactEmail: input.contactEmail ?? null,
        contactName: input.contactName,
        contactPhone: input.contactPhone,
        orderId: input.orderId ?? null,
        organization: input.organization ?? null,
        note: input.note ?? null,
        userId: input.userId ?? null,
        quantity: input.quantity,
        sessionId: session.id,
        status: "reserved",
      }),
    );
  }

  async confirmEnrollmentsForOrder(
    manager: EntityManager,
    orderId: string,
  ): Promise<void> {
    await manager.getRepository(CourseEnrollment).update(
      { orderId, status: "reserved" },
      { status: "confirmed" },
    );
  }

  async releaseEnrollmentsForOrder(
    manager: EntityManager,
    orderId: string,
  ): Promise<void> {
    const enrollmentRepository = manager.getRepository(CourseEnrollment);
    const enrollments = await enrollmentRepository
      .createQueryBuilder("enrollment")
      .leftJoinAndSelect("enrollment.session", "session")
      .where("enrollment.orderId = :orderId", { orderId })
      .andWhere("enrollment.status IN (:...statuses)", {
        statuses: ["reserved", "confirmed"],
      })
      .setLock("pessimistic_write", undefined, ['"enrollment"'])
      .getMany();
    const sessionRepository = manager.getRepository(CourseSession);

    for (const enrollment of enrollments) {
      enrollment.session.reservedSeats = Math.max(
        0,
        enrollment.session.reservedSeats - enrollment.quantity,
      );
      enrollment.status = "cancelled";
      await sessionRepository.save(enrollment.session);
      await enrollmentRepository.save(enrollment);
    }
  }
}
