import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Query,
} from "@nestjs/common";
import { OrderPaymentMethod } from "./entities/order.entity";
import { PaymentsService } from "../payments/payments.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import { OrdersService } from "./orders.service";

@Controller("orders")
export class OrdersController {
  private readonly logger = new Logger(OrdersController.name);

  constructor(
    private readonly ordersService: OrdersService,
    private readonly paymentsService: PaymentsService,
  ) {}

  @Post()
  async createOrder(@Body() input: CreateOrderDto) {
    // Serverless has no background timer; free stock held by expired orders before reserving more.
    await this.ordersService.releaseExpiredReservations().catch((error: unknown) => {
      this.logger.error(
        error instanceof Error ? error.message : "Reservation cleanup failed",
      );
    });

    const order = await this.ordersService.createOrder(input);

    if (order.paymentMethod === OrderPaymentMethod.PAYOS) {
      const payment = await this.paymentsService.createPayosCheckout(order);
      return { order, checkoutUrl: payment.checkoutUrl };
    }

    return { order };
  }

  @Get(":orderNumber")
  findOrder(
    @Param("orderNumber") orderNumber: string,
    @Query("phone") phone: string,
  ) {
    return this.ordersService.findOrderForContact(orderNumber, phone);
  }
}
