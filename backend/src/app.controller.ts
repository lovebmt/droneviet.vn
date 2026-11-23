import { Controller, Get, Header } from "@nestjs/common";
import { AppService } from "./app.service";

// Zalo Platform domain verification for api.droneviet.vn: the meta tag must sit at the top of <head>.
const API_HOME_HTML = `<!doctype html>
<html lang="vi"><head>
<meta name="zalo-platform-site-verification" content="PzQUCUMW91XYhF8xX8af0KEYinklr6XDDJCo" />
<meta charset="utf-8" />
<title>Drone Việt API</title>
</head><body><p>Drone Việt commerce API. Website: <a href="https://www.droneviet.vn">https://www.droneviet.vn</a></p></body></html>
`;

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Header("content-type", "text/html; charset=utf-8")
  home(): string {
    return API_HOME_HTML;
  }

  @Get("health")
  health() {
    return this.appService.health();
  }
}
