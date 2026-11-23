import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AdminCoursesController } from "./admin-courses.controller";
import { CoursesController } from "./courses.controller";
import { CoursesService } from "./courses.service";

@Module({
  imports: [AuthModule],
  controllers: [CoursesController, AdminCoursesController],
  providers: [CoursesService],
  exports: [CoursesService],
})
export class CoursesModule {}
