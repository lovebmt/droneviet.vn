import { Body, Controller, Get, Param, Patch, UseGuards } from "@nestjs/common";
import { IsOptional } from "class-validator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { UserRole } from "../auth/entities/user.entity";
import { SettingsService } from "./settings.service";

class UpdateSettingDto {
  /** Shape depends on the key; SettingsService picks only known fields. */
  @IsOptional()
  value!: unknown;
}

@Controller()
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get("settings/public")
  publicSettings() {
    return this.settings.publicSettings();
  }

  @Patch("admin/settings/:key")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  update(@Param("key") key: string, @Body() input: UpdateSettingDto) {
    return this.settings.update(key, input.value);
  }
}
