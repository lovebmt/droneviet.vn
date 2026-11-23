import { Body, Controller, Get, Post, Query, Req, UseGuards } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsInt, IsString, Matches, Max, MaxLength, Min } from "class-validator";
import { Repository } from "typeorm";
import { JwtAuthGuard, type AccessTokenPayload } from "../auth/jwt-auth.guard";
import { SimResult } from "./sim-result.entity";

class CreateSimResultDto {
  @IsString() @MaxLength(40) @Matches(/^[a-z0-9-]+$/) mission!: string;
  @IsInt() @Min(0) score!: number;
  @IsInt() @Min(0) @Max(3) stars!: number;
  @IsInt() @Min(0) timeMs!: number;
  @IsInt() @Min(0) crashes!: number;
}

type Me = { user: AccessTokenPayload };

@Controller("me/sim-results")
@UseGuards(JwtAuthGuard)
export class SimulatorController {
  constructor(@InjectRepository(SimResult) private readonly results: Repository<SimResult>) {}

  @Post()
  async create(@Req() request: Me, @Body() input: CreateSimResultDto) {
    const saved = await this.results.save(this.results.create({ ...input, userId: request.user.sub }));
    return { id: saved.id };
  }

  /** Best run per mission: highest score, then fastest time. */
  @Get()
  async best(@Req() request: Me, @Query("mission") mission?: string) {
    const rows = await this.results.find({ where: { userId: request.user.sub, ...(mission ? { mission } : {}) } });
    const best = new Map<string, SimResult>();
    for (const row of rows) {
      const current = best.get(row.mission);
      if (!current || row.score > current.score || (row.score === current.score && row.timeMs < current.timeMs)) {
        best.set(row.mission, row);
      }
    }
    return [...best.values()].map(({ mission: m, score, stars, timeMs, crashes, createdAt }) => ({ mission: m, score, stars, timeMs, crashes, createdAt }));
  }
}
