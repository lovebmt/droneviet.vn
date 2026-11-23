import { Controller, Get, NotFoundException, Param, Req, UseGuards } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { JwtAuthGuard, type AccessTokenPayload } from "../auth/jwt-auth.guard";
import { CourseEnrollment } from "../courses/entities/course-enrollment.entity";
import { Order } from "../orders/entities/order.entity";

type Me = { user: AccessTokenPayload };

/** The signed-in customer's own orders and course seats (spec §8.8, §9.2). */
@Controller("me")
@UseGuards(JwtAuthGuard)
export class MeController {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  @Get("orders")
  async orders(@Req() request: Me) {
    const orders = await this.dataSource.getRepository(Order).find({
      where: { userId: request.user.sub },
      relations: { lines: true },
      order: { createdAt: "DESC" },
    });
    return orders.map((order) => this.summary(order));
  }

  @Get("orders/:orderNumber")
  async order(@Req() request: Me, @Param("orderNumber") orderNumber: string) {
    const order = await this.dataSource.getRepository(Order).findOne({
      where: { orderNumber, userId: request.user.sub },
      relations: { lines: true },
    });
    if (!order) {
      throw new NotFoundException("Order not found");
    }
    return {
      ...this.summary(order),
      paymentMethod: order.paymentMethod,
      subtotalVnd: order.subtotalVnd,
      discountVnd: order.discountVnd,
      shippingAddress: order.shippingAddress,
      contactName: order.contactName,
      contactPhone: order.contactPhone,
    };
  }

  @Get("courses")
  async courses(@Req() request: Me) {
    const enrollments = await this.dataSource
      .getRepository(CourseEnrollment)
      .createQueryBuilder("enrollment")
      .leftJoinAndSelect("enrollment.session", "session")
      .leftJoinAndSelect("session.course", "course")
      .leftJoin(Order, "o", 'o.id::text = enrollment."orderId"')
      .where('enrollment."userId" = :user OR o."userId" = :user', { user: request.user.sub })
      .orderBy("session.startsAt", "ASC")
      .getMany();
    return enrollments.map((enrollment) => ({
      id: enrollment.id,
      status: enrollment.status,
      quantity: enrollment.quantity,
      session: { id: enrollment.session.id, startsAt: enrollment.session.startsAt },
      course: { slug: enrollment.session.course.slug, title: enrollment.session.course.title },
    }));
  }

  private summary(order: Order) {
    return {
      orderNumber: order.orderNumber,
      status: order.status,
      totalVnd: order.totalVnd,
      createdAt: order.createdAt,
      lines: (order.lines ?? []).map((line) => ({ title: line.title, quantity: line.quantity, subtotalVnd: line.subtotalVnd })),
    };
  }
}
