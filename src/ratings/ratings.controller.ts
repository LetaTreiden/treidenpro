import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RatingsService } from './ratings.service';

@Controller('ratings')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Get('leaderboard')
  leaderboard(@Query('limit') limit?: string) {
    const parsed = limit ? Number(limit) : 100;
    return this.ratingsService.getLeaderboard(Number.isNaN(parsed) ? 100 : parsed);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  myRating(@CurrentUser() user: { sub: string }) {
    return this.ratingsService.getUserRating(user.sub);
  }
}
