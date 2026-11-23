import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "../auth/auth.module";
import { SimResult } from "./sim-result.entity";
import { SimulatorController } from "./simulator.controller";

@Module({ imports: [AuthModule, TypeOrmModule.forFeature([SimResult])], controllers: [SimulatorController] })
export class SimulatorModule {}
