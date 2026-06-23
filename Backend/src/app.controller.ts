import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  root() {
    return {
      service: 'OphthoCare API',
      version: '0.1.0',
      documentation: '/api',
      uploads: '/uploads/',
      message:
        "Ceci est l'API backend. Pour l'interface web, lancez le frontend Next.js (souvent http://localhost:3000).",
    };
  }

  @Get('health')
  health() {
    return { status: 'ok', ts: new Date().toISOString() };
  }
}
